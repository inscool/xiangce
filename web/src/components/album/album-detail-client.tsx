"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [preloadedPreviewIds, setPreloadedPreviewIds] = useState<Record<string, true>>({});

  const selectedCount = Object.keys(selected).length;
  const previewImage = images.find((image) => image.id === previewImageId) ?? null;
  const preloadedPreviewList = useMemo(
    () => images.filter((image) => preloadedPreviewIds[image.id]),
    [images, preloadedPreviewIds],
  );
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

  function openPreview(imageId: string) {
    setPreloadedPreviewIds((prev) => ({ ...prev, [imageId]: true }));
    setPreviewImageId(imageId);
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
        toast.error(data.error ?? "移动图片失败。");
        return;
      }
      toast.success(`已移动 ${data.updated ?? imageIds.length} 张图片。`);
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
    toast.success("直链已复制。");
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
        toast.error(`${failed.length} 张图片删除失败。`);
      } else {
        toast.success(`已删除 ${imageIds.length} 张图片。`);
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
                toast.success("分享链接已复制。");
              }}
            >
              复制分享链接
            </Button>
            {isOwner && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => enterSelectMode(images[0]?.id ?? "")}
              >
                <CheckSquare className="mr-1.5 h-4 w-4" />
                多选模式
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
                  onDoubleClick={() => openPreview(image.id)}
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
          <p className="text-sm text-zinc-500">当前相册还没有图片。</p>
        )}

        <div className="sr-only">
          {preloadedPreviewList.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.id} src={image.cdnUrl} alt="preload" loading="eager" decoding="async" />
          ))}
        </div>
      </section>

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImageId(null)}>
        <DialogContent className="max-w-4xl">
          {previewImage ? (
            <div className="space-y-4">
              <DialogTitle>图片预览</DialogTitle>
              <DialogDescription>{previewImage.storageKey}</DialogDescription>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage.cdnUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
                已选 {selectedCount} 张
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" disabled={moving}>
                    移动到相册
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => moveSelectedTo(null)}>
                    不放入相册
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
                复制链接
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    删除
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>确认删除 {selectedCount} 张图片？</DialogTitle>
                  <DialogDescription>
                    删除后无法恢复，请确认是否继续。
                  </DialogDescription>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => cancelSelect()}>
                      取消
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={deleteSelected}
                    >
                      {deleting ? "删除中..." : "删除图片"}
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
          <p className="mb-2 text-sm font-medium text-zinc-900">直链列表</p>
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
            关闭
          </button>
        </div>
      ) : null}
    </div>
  );
}
