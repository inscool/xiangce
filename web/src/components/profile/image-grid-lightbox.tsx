"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProLightbox } from "@/components/ui/pro-lightbox";

export type GalleryImage = {
  id: string;
  cdnUrl: string;
  storageKey: string;
  fileSize: string;
};

type Props = {
  images: GalleryImage[];
  canDelete?: boolean;
};

export function ImageGridLightbox({ images, canDelete = false }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Record<string, true>>({});
  const [message, setMessage] = useState<string | null>(null);

  const visibleImages = useMemo(() => images.filter((image) => !deletedIds[image.id]), [deletedIds, images]);

  const slides = useMemo(
    () =>
      visibleImages.map((image) => ({
        id: image.id,
        src: image.cdnUrl,
        alt: image.storageKey,
        storageKey: image.storageKey,
      })),
    [visibleImages],
  );

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setMessage("Direct link copied.");
    setTimeout(() => setMessage(null), 2000);
  }

  async function deleteImage(imageId: string) {
    try {
      setPendingDeleteId(imageId);
      const response = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Delete failed.");
        return;
      }

      setDeletedIds((prev) => ({ ...prev, [imageId]: true }));
      setMessage("Image deleted.");
      setTimeout(() => setMessage(null), 2000);

      if (activeIndex >= visibleImages.length - 1) {
        setActiveIndex(Math.max(0, visibleImages.length - 2));
      }
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <>
      {message ? <p className="mb-4 text-sm text-zinc-600">{message}</p> : null}

      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2">
        {visibleImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => {
              setActiveIndex(index);
              setOpen(true);
            }}
            className="relative aspect-square overflow-hidden rounded-sm bg-zinc-200"
          >
            <Image
              src={image.cdnUrl}
              alt="Photo"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>

      <ProLightbox
        open={open}
        index={activeIndex}
        slides={slides}
        onClose={() => setOpen(false)}
        onView={setActiveIndex}
        renderFooter={(slide) => (
          <div className="mx-auto w-full max-w-5xl rounded-lg bg-black/65 px-4 py-3 text-white backdrop-blur">
            <p className="truncate text-xs text-zinc-200">{slide.storageKey}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" className="h-8 bg-white text-zinc-900 hover:bg-zinc-200" onClick={() => copyLink(slide.src)}>
                Copy Direct Link
              </Button>
              {canDelete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  disabled={pendingDeleteId === slide.id}
                  onClick={() => deleteImage(slide.id)}
                >
                  {pendingDeleteId === slide.id ? "Deleting..." : "Delete Image"}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      />
    </>
  );
}
