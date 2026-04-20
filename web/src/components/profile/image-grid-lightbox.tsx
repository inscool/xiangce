"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, MoreHorizontal, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type GalleryImage = {
  id: string;
  cdnUrl: string;
  storageKey: string;
  fileSize: string;
};

type Props = {
  images: GalleryImage[];
  username: string;
  canDelete?: boolean;
};

type CommentItem = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export function ImageGridLightbox({ images, username, canDelete = false }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Record<string, true>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [commentsByImage, setCommentsByImage] = useState<Record<string, CommentItem[]>>({});

  const visibleImages = useMemo(() => images.filter((image) => !deletedIds[image.id]), [deletedIds, images]);
  const activeImage = visibleImages[activeIndex] ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % visibleImages.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, visibleImages.length]);

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setMessage("Link copied.");
    setTimeout(() => setMessage(null), 2000);
  }

  async function shareCurrent(link: string) {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `@${username} image`, url: link });
        setMessage("Share opened.");
        setTimeout(() => setMessage(null), 2000);
        return;
      } catch {
        // no-op
      }
    }

    await copyLink(link);
  }

  function addComment() {
    const text = draft.trim();
    if (!text || !activeImage) {
      return;
    }

    const next: CommentItem = {
      id: `${Date.now()}`,
      author: "visitor",
      text,
      createdAt: new Date().toLocaleString(),
    };

    setCommentsByImage((prev) => ({
      ...prev,
      [activeImage.id]: [next, ...(prev[activeImage.id] ?? [])],
    }));
    setDraft("");
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

      {open && activeImage ? (
        <div className="fixed inset-0 z-[90] bg-black/75 p-3 sm:p-5" onClick={() => setOpen(false)}>
          <div
            className="mx-auto flex h-full w-full max-w-[1400px] overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex-1 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImage.cdnUrl} alt="Post" className="h-full w-full object-contain" />

              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                onClick={() => setActiveIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                onClick={() => setActiveIndex((prev) => (prev + 1) % visibleImages.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <aside className="hidden w-[420px] flex-col border-l border-zinc-200 lg:flex">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-200" />
                  <Link href={`/${username}`} className="text-sm font-medium text-zinc-900">@{username}</Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setMessage("举报功能即将上线")}>举报</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareCurrent(activeImage.cdnUrl)}>分享</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyLink(activeImage.cdnUrl)}>复制链接</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${username}`}>查看账户</Link>
                    </DropdownMenuItem>
                    {canDelete ? (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        disabled={pendingDeleteId === activeImage.id}
                        onClick={() => deleteImage(activeImage.id)}
                      >
                        {pendingDeleteId === activeImage.id ? "删除中..." : "删除图片"}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <p className="mb-2 text-xs text-zinc-500">留言区</p>
                {(commentsByImage[activeImage.id] ?? []).length ? (
                  <div className="space-y-3">
                    {(commentsByImage[activeImage.id] ?? []).map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-zinc-50 p-3">
                        <p className="text-xs text-zinc-500">{comment.author} · {comment.createdAt}</p>
                        <p className="mt-1 text-sm text-zinc-800">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">还没有留言，成为第一条留言吧。</p>
                )}
              </div>

              <div className="border-t border-zinc-200 px-4 py-3">
                <div className="mb-3 flex items-center gap-4 text-zinc-800">
                  <Heart className="h-5 w-5" />
                  <MessageCircle className="h-5 w-5" />
                  <Send className="h-5 w-5" />
                  <Bookmark className="ml-auto h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="h-10 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                    placeholder="添加留言..."
                  />
                  <Button type="button" size="sm" onClick={addComment}>发布</Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
