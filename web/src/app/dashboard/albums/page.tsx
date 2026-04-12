import { DashboardConsole } from "@/components/dashboard/dashboard-console";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardAlbums, getDashboardImages, getDashboardSessionUser } from "@/lib/dashboard-data";

type Props = {
  searchParams?: Promise<{ focus?: string }>;
};

export default async function DashboardAlbumsPage({ searchParams }: Props) {
  const user = await getDashboardSessionUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [albums, images] = await Promise.all([
    getDashboardAlbums(user.id),
    getDashboardImages(user.id),
  ]);

  return (
    <DashboardShell activeSection="albums" user={user}>
      <DashboardConsole
        activeSection="albums"
        focusAlbumId={resolvedSearchParams?.focus ?? null}
        albums={albums.map((album) => ({
          id: album.id,
          shortId: album.shortId ?? album.id,
          title: album.title,
          description: album.description,
          category: album.category,
          visibility: album.visibility,
          images: album.images.map((image) => ({
            id: image.id,
            cdnUrl: image.cdnUrl,
            storageKey: image.storageKey,
            fileSize: image.fileSize.toString(),
            albumId: image.albumId,
          })),
        }))}
        images={images.map((image) => ({
          id: image.id,
          cdnUrl: image.cdnUrl,
          storageKey: image.storageKey,
          fileSize: image.fileSize.toString(),
          albumId: image.albumId,
        }))}
      />
    </DashboardShell>
  );
}
