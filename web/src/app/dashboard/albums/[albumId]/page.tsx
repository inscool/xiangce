import { notFound } from "next/navigation";

import { AlbumDetailClient } from "@/components/album/album-detail-client";
import { AlbumUploadDialog } from "@/components/dashboard/album-upload-dialog";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getDashboardSessionUser } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ albumId: string }>;
};

export default async function DashboardAlbumDetailPage({ params }: Props) {
  const user = await getDashboardSessionUser();
  const { albumId } = await params;

  const album = await prisma.album.findFirst({
    where: {
      userId: user.id,
      OR: [{ id: albumId }, { shortId: albumId }],
    },
    select: {
      id: true,
      shortId: true,
      title: true,
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

  const userAlbums = await prisma.album.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, shortId: true, title: true },
  });

  return (
    <DashboardShell activeSection="albums" user={user}>
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Album Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{album.title}</h1>
            <p className="mt-1 text-zinc-600">Upload, select, move and manage images inside this album.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/albums/${album.shortId ?? album.id}`} target="_blank" rel="noreferrer">
                Public View
              </a>
            </Button>
            <AlbumUploadDialog
              albums={userAlbums.map((item) => ({ id: item.id, title: item.title }))}
              defaultAlbumId={album.id}
              triggerLabel="Upload Images"
            />
          </div>
        </div>
      </div>

      <AlbumDetailClient
        albumId={album.id}
        shortId={album.shortId}
        title={album.title}
        ownerUsername={user.username}
        images={album.images.map((image) => ({
          id: image.id,
          cdnUrl: image.cdnUrl,
          storageKey: image.storageKey,
          fileSize: image.fileSize.toString(),
        }))}
        isOwner
        userAlbums={userAlbums.map((item) => ({
          id: item.id,
          shortId: item.shortId,
          title: item.title,
        }))}
      />
    </DashboardShell>
  );
}
