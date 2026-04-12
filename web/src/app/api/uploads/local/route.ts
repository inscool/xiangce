import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveLocalUpload } from "@/lib/storage/local";
import { assertAlbumOwnership } from "@/lib/storage/quota";
import { buildObjectKey, buildPublicUrl, getStorageConfig } from "@/lib/storage/s3";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const storage = await getStorageConfig();
    if (storage.mode !== "local") {
      return NextResponse.json({ error: "Local upload endpoint only works in local storage mode." }, { status: 400 });
    }

    const formData = await request.formData();
    const albumId = String(formData.get("albumId") ?? "");
    const file = formData.get("file");

    if (!albumId) {
      return NextResponse.json({ error: "Album is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    await assertAlbumOwnership(userId, albumId);

    const key = buildObjectKey(userId, file.name);
    await saveLocalUpload(key, Buffer.from(await file.arrayBuffer()));

    const image = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { usedStorage: true, storageLimit: true },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      const nextUsed = user.usedStorage + BigInt(file.size);
      if (nextUsed > user.storageLimit) {
        throw new Error("Storage quota exceeded.");
      }

      const created = await tx.image.create({
        data: {
          storageKey: key,
          cdnUrl: await buildPublicUrl(key),
          fileSize: BigInt(file.size),
          userId,
          albumId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          usedStorage: { increment: BigInt(file.size) },
        },
      });

      return created;
    });

    return NextResponse.json({
      image: {
        id: image.id,
        cdnUrl: image.cdnUrl,
        storageKey: image.storageKey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file.";
    const status = message === "Storage quota exceeded." ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
