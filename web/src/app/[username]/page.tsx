import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Layers } from "lucide-react";

import { ContactMeForm } from "@/components/profile/contact-me-form";
import { Button } from "@/components/ui/button";
import { parseSocialLinks } from "@/lib/social-links";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      socialLinks: true,
      group: {
        select: {
          badgeLabel: true,
          badgeColor: true,
        },
      },
      albums: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          shortId: true,
          title: true,
          _count: {
            select: {
              images: true,
            },
          },
          images: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              cdnUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const links = parseSocialLinks(user.socialLinks);
  const domainText = links.website ? links.website.replace(/^https?:\/\//, "") : "not-set";

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-amber-50 pb-10">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 grid gap-6 sm:grid-cols-[128px,minmax(0,1fr)] sm:items-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-zinc-200 sm:mx-0 sm:h-32 sm:w-32">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={`${user.username} avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-zinc-600">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">@{user.username}</h1>
              {user.group?.badgeLabel ? <BadgeCheck className="h-5 w-5 text-sky-500" /> : null}
            </div>
            {user.group?.badgeLabel ? (
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: user.group.badgeColor || "#0ea5e9" }}
              >
                {user.group.badgeLabel}
              </span>
            ) : null}
            {user.bio ? <p className="text-zinc-600">{user.bio}</p> : <p className="text-zinc-500">No bio yet.</p>}
            <div className="space-y-1 text-sm text-zinc-700">
              <p>Domain: {domainText}</p>
              <p>Email: {links.email ?? "not-set"}</p>
              <p>Website: {links.website ?? "not-set"}</p>
              <p>WhatsApp: {links.whatsapp ?? "not-set"}</p>
            </div>
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
              {links.email ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${links.email}`}>Email</a>
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
            <div className="grid grid-cols-3 gap-1 md:grid-cols-6">
              {user.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/albums/${album.shortId ?? album.id}`}
                  className="group relative overflow-hidden bg-zinc-200"
                >
                  <div className="relative aspect-square">
                    {album.images[0]?.cdnUrl ? (
                      <Image src={album.images[0].cdnUrl} alt={album.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500">No Cover</div>
                    )}

                    {album._count.images > 1 ? (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                        <Layers className="h-3 w-3" />
                        {album._count.images}
                      </span>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="truncate text-xs font-medium text-white">{album.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No albums created.</p>
          )}
        </section>

        <section className="mt-8">
          <ContactMeForm username={user.username} />
        </section>
      </section>
    </main>
  );
}
