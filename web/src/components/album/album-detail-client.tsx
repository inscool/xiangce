"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AlbumImage = {
  id: string;
  cdnUrl: string;
  storageKey: string;
  fileSize: string;
};

type AlbumItem = {
  id: string;
  shortId: string | null;
  title: string;
};

type Props = {
  albumId: string;
  shortId: string | null;
  title: string;
  ownerUsername: string;
  images: AlbumImage[];
  isOwner: boolean;
  userAlbums: AlbumItem[];
};

export function AlbumDetailClient({
  albumId,
  shortId,
  title,
  ownerUsername,
  images,
  isOwner,
  userAlbums,
}: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<Record<string, true>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [moving, setMoving] = useState(false);
  const [outputLinks, setOutputLinks] = useState("");
  const [deleting, setDeleting] = useState(false);

  const selectedCount = Object.keys(selected).length;
  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/albums/${shortId ?? albumId}`
    : `/albums/${shortId ?? albumId}`;

  function toggleSelect(imageId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[imageId]) {
        delete next[imageId];
      } else {
        next[imageId] = true;
      }
      return next;
    });
  }

  function enterSelectMode(imageId: string) {
    setSelectMode(true);
    setSelected({ [imageId]: true });
  }

  function cancelSelect() {
    setSelectMode(false);
    setSelected({});
  }

  async function moveSelectedTo(targetAlbumId: string | null) {
    const imageIds = Object.keys(selected);
    if (!imageIds.length) return;

    setMoving(true);
    try {
      const res = await fetch("/api/images/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds, albumId: targetAlbumId }),
      });
      const data = (await res.json()) as { error?: string; updated?: number };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to move images.");
        return;
      }
      toast.success(`Moved ${data.updated ?? imageIds.length} image(s).`);
      setSelectMode(false);
      setSelected({});
      router.refresh();
    } finally {
      setMoving(false);
    }
  }

  async function copySelectedLinks() {
    const targets = images.filter((img) => selected[img.id]);
    if (!targets.length) return;

    const links = targets.map((img) => img.cdnUrl).join("\n");
    setOutputLinks(links);
    await navigator.clipboard.writeText(links);
    toast.success("Direct links copied.");
  }

  async function deleteSelected() {
    const imageIds = Object.keys(selected);
    if (!imageIds.length) return;

    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        imageIds.map((id) =>
          fetch(`/api/images/${id}`, { method: "DELETE" })
        )
      );

      const failed = results.filter((r) => r.status === "rejected" || !((r as PromiseFulfilledResult<Response>).value.ok));
      if (failed.length) {
        toast.error(`${failed.length} image(s) failed to delete.`);
      } else {
        toast.success(`${imageIds.length} image(s) deleted.`);
      }

      setSelectMode(false);
      setSelected({});
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-amber-50 pb-24">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">
              <Link href={`/${ownerUsername}`} className="underline-offset-4 hover:underline">
                @{ownerUsername}
              </Link>
              <span> / Albums</span>
            </p>
            <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
            <p className="text-zinc-600">{images.length} image(s)</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(shareLink);
                toast.success("Share link copied.");
              }}
            >
              Copy Share Link
            </Button>
            {isOwner && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => enterSelectMode(images[0]?.id ?? "")}
              >
                <CheckSquare className="mr-1.5 h-4 w-4" />
                Select
              </Button>
            )}
          </div>
        </div>

        {images.length ? (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((image) => {
              const isChecked = Boolean(selected[image.id]);
              return (
                <div
                  key={image.id}
                  className={`group relative overflow-hidden rounded-sm bg-zinc-200 ${isOwner ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelect(image.id);
                    } else if (isOwner) {
                      enterSelectMode(image.id);
                    }
                  }}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={image.cdnUrl}
                      alt="Photo"
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition duration-300 hover:scale-105"
                      unoptimized
                    />
                  </div>

                  {selectMode && (
                    <div className={`absolute inset-0 flex items-center justify-center transition ${isChecked ? "bg-black/30" : ""}`}>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${
                          isChecked ? "bg-white" : "bg-transparent"
                        }`}
                      >
                        {isChecked && (
                          <CheckSquare className="h-4 w-4 text-zinc-900" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No images in this album yet.</p>
        )}
      </section>

      {selectMode && selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelSelect}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-zinc-900">
                {selectedCount} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" disabled={moving}>
                    Move To Album
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => moveSelectedTo(null)}>
                    No Album
                  </DropdownMenuItem>
                  {userAlbums
                    .filter((a) => a.id !== albumId)
                    .map((album) => (
                      <DropdownMenuItem key={album.id} onClick={() => moveSelectedTo(album.id)}>
                        {album.title}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button type="button" size="sm" variant="outline" onClick={copySelectedLinks} disabled={!selectedCount}>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Links
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Delete {selectedCount} Image(s)?</DialogTitle>
                  <DialogDescription>
                    This will permanently remove {selectedCount} selected image(s). This action cannot be undone.
                  </DialogDescription>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => cancelSelect()}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={deleteSelected}
                    >
                      {deleting ? "Deleting..." : "Delete Images"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      {outputLinks ? (
        <div className="fixed right-4 bottom-24 z-50 max-w-sm rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
          <p className="mb-2 text-sm font-medium text-zinc-900">Direct Link List</p>
          <textarea
            readOnly
            value={outputLinks}
            className="min-h-32 w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700"
          />
          <button
            type="button"
            className="mt-2 text-xs text-zinc-500 underline"
            onClick={() => setOutputLinks("")}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
