import { prisma } from "@/lib/prisma";

export async function assertAlbumOwnership(userId: string, albumId?: string) {
  if (!albumId) {
    return;
  }

  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!album) {
    throw new Error("Album not found or does not belong to the current user.");
  }
}

export async function assertStorageQuota(userId: string, incomingFileSize: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      usedStorage: true,
      storageLimit: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const nextUsed = user.usedStorage + BigInt(incomingFileSize);
  if (nextUsed > user.storageLimit) {
    throw new Error("Storage quota exceeded.");
  }

  return {
    usedStorage: user.usedStorage,
    storageLimit: user.storageLimit,
    nextUsed,
  };
}
