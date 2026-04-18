import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageGridLightbox } from "@/components/profile/image-grid-lightbox";
import { ContactMeForm } from "@/components/profile/contact-me-form";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { parseSocialLinks } from "@/lib/social-links";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      socialLinks: true,
      images: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          cdnUrl: true,
          storageKey: true,
          fileSize: true,
        },
      },
      albums: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          shortId: true,
          title: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const links = parseSocialLinks(user.socialLinks);
  const canDelete = session?.user?.id === user.id;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-amber-50 pb-10">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 grid gap-6 sm:grid-cols-[128px,minmax(0,1fr)] sm:items-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-zinc-200 text-4xl font-semibold text-zinc-600 sm:mx-0 sm:h-32 sm:w-32">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">@{user.username}</h1>
            {user.bio ? <p className="text-zinc-600">{user.bio}</p> : <p className="text-zinc-500">No bio yet.</p>}
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {links.whatsapp ? (
                <Button asChild size="sm" variant="secondary">
                  <a href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
                </Button>
              ) : null}
              {links.website ? (
                <Button asChild size="sm" variant="outline">
                  <a href={links.website} target="_blank" rel="noreferrer">Website</a>
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Albums</h2>
          </div>
          {user.albums.length ? (
            <div className="flex flex-wrap gap-2">
              {user.albums.map((album) => (
                <Button asChild key={album.id} size="sm" variant="outline">
                  <Link href={`/albums/${album.shortId ?? album.id}`}>{album.title}</Link>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No albums created.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Posts</h2>
          {user.images.length ? (
            <ImageGridLightbox
              images={user.images.map((image) => ({
                id: image.id,
                cdnUrl: image.cdnUrl,
                storageKey: image.storageKey,
                fileSize: image.fileSize.toString(),
              }))}
              canDelete={canDelete}
            />
          ) : (
            <p className="text-sm text-zinc-500">No images uploaded yet.</p>
          )}
        </section>

        <section className="mt-8">
          <ContactMeForm username={user.username} />
        </section>
      </section>
    </main>
  );
}
