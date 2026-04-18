"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProLightbox } from "@/components/ui/pro-lightbox";

type AlbumImage = {
  id: string;
  cdnUrl: string;
  storageKey: string;
};

type Props = {
  title: string;
  shortId: string;
  images: AlbumImage[];
};

export function AlbumInlinePreview({ title, shortId, images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const slides = useMemo(
    () => images.map((image) => ({ id: image.id, src: image.cdnUrl, alt: image.storageKey, storageKey: image.storageKey })),
    [images],
  );

  async function copyDirect(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("Direct link copied.");
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Share Preview</p>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-500">/albums/{shortId}</p>
        </div>
      </div>

      {message ? <p className="mb-3 text-sm text-zinc-600">{message}</p> : null}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {images.slice(0, 9).map((image) => {
          const index = slides.findIndex((slide) => slide.id === image.id);
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => {
                setActiveIndex(index < 0 ? 0 : index);
                setOpen(true);
              }}
              className="relative aspect-square overflow-hidden rounded-md bg-zinc-100"
            >
              <Image src={image.cdnUrl} alt="Preview" fill className="object-cover" unoptimized />
            </button>
          );
        })}
      </div>

      <ProLightbox
        open={open}
        index={activeIndex}
        slides={slides}
        onClose={() => setOpen(false)}
        onView={setActiveIndex}
        renderFooter={(slide) => (
          <div className="mx-auto w-full max-w-4xl rounded-lg bg-black/65 px-4 py-3 text-white backdrop-blur">
            <p className="truncate text-xs text-zinc-200">{slide.storageKey}</p>
            <div className="mt-2">
              <Button type="button" size="sm" className="h-8 bg-white text-zinc-900 hover:bg-zinc-200" onClick={() => copyDirect(slide.src)}>
                Copy Direct Link
              </Button>
            </div>
          </div>
        )}
      />
    </section>
  );
}
