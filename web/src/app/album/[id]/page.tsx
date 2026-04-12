import { AlbumVisibility } from "@prisma/client";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { AlbumDetailClient } from "@/components/album/album-detail-client";
import { AlbumProtectedGate } from "@/components/album/album-protected-gate";
import { getAlbumAccessCookieName, verifyAlbumAccessToken } from "@/lib/album-access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const album = await prisma.album.findUnique({
    where: { id },
    select: {
      id: true,
      shortId: true,
      title: true,
      visibility: true,
      userId: true,
      user: {
        select: {
          username: true,
        },
      },
      images: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          cdnUrl: true,
          storageKey: true,
          fileSize: true,
        },
      },
    },
  });

  if (!album) {
    notFound();
  }

  const isOwner = session?.user?.id === album.userId;

  if (album.visibility === AlbumVisibility.PRIVATE && !isOwner) {
    notFound();
  }

  if (album.visibility === AlbumVisibility.PROTECTED && !isOwner) {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAlbumAccessCookieName(album.id))?.value;
    const allowed = verifyAlbumAccessToken(album.id, token);
    if (!allowed) {
      return <AlbumProtectedGate albumId={album.id} albumTitle={album.title} />;
    }
  }

  const userAlbums = isOwner
    ? await prisma.album.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, shortId: true, title: true },
      })
    : [];

  return (
    <AlbumDetailClient
      albumId={album.id}
      shortId={album.shortId}
      title={album.title}
      ownerUsername={album.user.username}
      images={album.images.map((image) => ({
        id: image.id,
        cdnUrl: image.cdnUrl,
        storageKey: image.storageKey,
        fileSize: image.fileSize.toString(),
      }))}
      isOwner={isOwner}
      userAlbums={userAlbums.map((a) => ({
        id: a.id,
        shortId: a.shortId,
        title: a.title,
      }))}
    />
  );
}
