import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { assertAlbumOwnership, assertStorageQuota } from "@/lib/storage/quota";
import { buildObjectKey, buildPublicUrl, createPresignedUploadUrl, getStorageConfig } from "@/lib/storage/s3";
import { presignUploadSchema } from "@/lib/validators/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = presignUploadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload input." }, { status: 400 });
    }

    const { fileName, fileSize, contentType, albumId } = parsed.data;

    const storage = await getStorageConfig();
    await assertAlbumOwnership(userId, albumId);
    const quota = await assertStorageQuota(userId, fileSize);

    const key = buildObjectKey(userId, fileName);
    const uploadUrl = await createPresignedUploadUrl({
      key,
      contentType,
    });

    return NextResponse.json({
      storageMode: storage.mode,
      uploadUrl,
      key,
      cdnUrl: await buildPublicUrl(key),
      fileSize,
      contentType,
      quota: {
        usedStorage: quota.usedStorage.toString(),
        storageLimit: quota.storageLimit.toString(),
        projectedUsedStorage: quota.nextUsed.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload URL.";
    const status =
      message === "Storage quota exceeded." ? 409 : message.includes("Please configure") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
