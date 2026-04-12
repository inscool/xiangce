"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Record<string, true>>({});
  const [message, setMessage] = useState<string | null>(null);

  const visibleImages = useMemo(
    () => images.filter((image) => !deletedIds[image.id]),
    [deletedIds, images],
  );

  const selectedImage = visibleImages.find((image) => image.id === selectedImageId) ?? null;

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
      setSelectedImageId(null);
      setMessage("Image deleted.");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <>
      {message ? <p className="mb-4 text-sm text-zinc-600">{message}</p> : null}
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2">
        {visibleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedImageId(image.id)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-zinc-200"
          >
            <Image
              src={image.cdnUrl}
              alt="Photo"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
              unoptimized
            />
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImageId(null)}>
        <DialogContent className="p-3 sm:p-4">
          {selectedImage ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),220px]">
              <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100">
                <Image src={selectedImage.cdnUrl} alt="Preview" fill className="object-contain" unoptimized />
              </div>
              <div className="space-y-3">
                <DialogTitle className="text-base font-semibold text-zinc-900">Image Preview</DialogTitle>
                <DialogDescription className="text-sm text-zinc-600">{selectedImage.storageKey}</DialogDescription>
                <div className="space-y-2">
                  <Button type="button" className="w-full" onClick={() => copyLink(selectedImage.cdnUrl)}>
                    Copy Direct Link
                  </Button>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      disabled={pendingDeleteId === selectedImage.id}
                      onClick={() => deleteImage(selectedImage.id)}
                    >
                      {pendingDeleteId === selectedImage.id ? "Deleting..." : "Delete Image"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
