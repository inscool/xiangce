"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = images.find((image) => image.id === selectedId) ?? null;

  async function copyDirect(url: string) {
    await navigator.clipboard.writeText(url);
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

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {images.slice(0, 9).map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedId(image.id)}
            className="relative aspect-square overflow-hidden rounded-md bg-zinc-100"
          >
            <Image src={image.cdnUrl} alt="Preview" fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent>
          {selected ? (
            <div className="space-y-3">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{selected.storageKey}</DialogDescription>
              <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100">
                <Image src={selected.cdnUrl} alt="Preview" fill className="object-contain" unoptimized />
              </div>
              <Button type="button" onClick={() => copyDirect(selected.cdnUrl)}>
                Copy Direct Link
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
