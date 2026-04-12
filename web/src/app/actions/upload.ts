"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { assertAlbumOwnership, assertStorageQuota } from "@/lib/storage/quota";
import { buildObjectKey, buildPublicUrl, createPresignedUploadUrl, getStorageConfig } from "@/lib/storage/s3";
import { presignUploadSchema } from "@/lib/validators/upload";

type CreateUploadActionInput = {
  fileName: string;
  fileSize: number;
  contentType: string;
  albumId: string;
};

export async function createUploadAction(input: CreateUploadActionInput) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized.");
  }

  const parsed = presignUploadSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid upload input.");
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

  return {
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
  };
}
