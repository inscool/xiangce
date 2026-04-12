import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveLocalUpload } from "@/lib/storage/local";
import { assertAlbumOwnership } from "@/lib/storage/quota";
import { buildPublicUrl, getStorageConfig } from "@/lib/storage/s3";
import { completeUploadSchema } from "@/lib/validators/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = completeUploadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload completion payload." }, { status: 400 });
    }

    const { key, fileSize, albumId } = parsed.data;

    const storage = await getStorageConfig();
    await assertAlbumOwnership(userId, albumId);

    if (storage.mode === "local") {
      const formData = await request.formData().catch(() => null);
      const file = formData?.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Local storage mode requires file upload payload. Please configure storage information first or switch uploader." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      await saveLocalUpload(key, buffer);
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          usedStorage: true,
          storageLimit: true,
        },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      const nextUsed = user.usedStorage + BigInt(fileSize);
      if (nextUsed > user.storageLimit) {
        throw new Error("Storage quota exceeded.");
      }

      const image = await tx.image.create({
        data: {
          storageKey: key,
          cdnUrl: await buildPublicUrl(key),
          fileSize: BigInt(fileSize),
          userId,
          albumId: albumId ?? null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          usedStorage: {
            increment: BigInt(fileSize),
          },
        },
      });

      return {
        image,
        usedStorage: nextUsed,
        storageLimit: user.storageLimit,
      };
    });

    return NextResponse.json({
      image: {
        id: result.image.id,
        storageKey: result.image.storageKey,
        cdnUrl: result.image.cdnUrl,
        fileSize: result.image.fileSize.toString(),
        albumId: result.image.albumId,
      },
      quota: {
        usedStorage: result.usedStorage.toString(),
        storageLimit: result.storageLimit.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finalize upload.";
    const status =
      message === "Storage quota exceeded." ? 409 : message.includes("Please configure") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
