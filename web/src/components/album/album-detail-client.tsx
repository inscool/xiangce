"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, ChevronLeft, ChevronRight, Copy, MoreHorizontal, Trash2, X } from "lucide-react";
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

type CommentItem = {
  id: string;
  email: string;
  text: string;
  createdAt: string;
};

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
  defaultLanguage?: "zh" | "en";
  enableLanguageToggle?: boolean;
};

const copyTextMap = {
  zh: {
    breadcrumbAlbums: "相册",
    imageUnit: "张图片",
    copyShareLink: "复制分享链接",
    copiedShareLink: "分享链接已复制。",
    multiSelect: "多选模式",
    emptyAlbum: "当前相册还没有图片。",
    previewTitle: "图片预览",
    selectedCount: "已选",
    selectedUnit: "张",
    moveToAlbum: "移动到相册",
    ungrouped: "不放入相册",
    copyLinks: "复制链接",
    copiedLinks: "直链已复制。",
    delete: "删除",
    confirmDeletePrefix: "确认删除",
    confirmDeleteSuffix: "张图片？",
    deleteHint: "删除后无法恢复，请确认是否继续。",
    cancel: "取消",
    deleting: "删除中...",
    deleteImages: "删除图片",
    linksPanelTitle: "直链列表",
    close: "关闭",
    moveFailed: "移动图片失败。",
    movedPrefix: "已移动",
    movedSuffix: "张图片。",
    deleteFailedSuffix: "张图片删除失败。",
    deletedPrefix: "已删除",
    deletedSuffix: "张图片。",
    langZh: "中文",
    langEn: "English",
  },
  en: {
    breadcrumbAlbums: "Albums",
    imageUnit: "image(s)",
    copyShareLink: "Copy Share Link",
    copiedShareLink: "Share link copied.",
    multiSelect: "Multi Select",
    emptyAlbum: "No images yet in this album.",
    previewTitle: "Image Preview",
    selectedCount: "Selected",
    selectedUnit: "images",
    moveToAlbum: "Move to Album",
    ungrouped: "No Album",
    copyLinks: "Copy Links",
    copiedLinks: "Direct links copied.",
    delete: "Delete",
    confirmDeletePrefix: "Delete",
    confirmDeleteSuffix: "images?",
    deleteHint: "This action cannot be undone.",
    cancel: "Cancel",
    deleting: "Deleting...",
    deleteImages: "Delete Images",
    linksPanelTitle: "Direct Links",
    close: "Close",
    moveFailed: "Failed to move images.",
    movedPrefix: "Moved",
    movedSuffix: "images.",
    deleteFailedSuffix: "images failed to delete.",
    deletedPrefix: "Deleted",
    deletedSuffix: "images.",
    langZh: "中文",
    langEn: "English",
  },
} as const;

export function AlbumDetailClient({
  albumId,
  shortId,
  title,
  ownerUsername,
  images,
  isOwner,
  userAlbums,
  defaultLanguage = "zh",
  enableLanguageToggle = false,
}: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<Record<string, true>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [moving, setMoving] = useState(false);
  const [outputLinks, setOutputLinks] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [language, setLanguage] = useState<"zh" | "en">(defaultLanguage);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [commentEmail, setCommentEmail] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsByImage, setCommentsByImage] = useState<Record<string, CommentItem[]>>({});

  const selectedCount = Object.keys(selected).length;
  const activePreviewImage = images[previewIndex] ?? null;
  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/albums/${shortId ?? albumId}`
    : `/albums/${shortId ?? albumId}`;
  const copyText = copyTextMap[language];

  useEffect(() => {
    if (!previewOpen || !activePreviewImage) {
      return;
    }

    if (commentsByImage[activePreviewImage.id]) {
      return;
    }

    setLoadingComments(true);
    void fetch(`/api/image-comments?imageId=${activePreviewImage.id}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          rememberedEmail?: string;
          comments?: Array<{ id: string; email: string; content: string; createdAt: string }>;
        };

        if (!response.ok) {
          toast.error(data.error ?? "加载留言失败。");
          return;
        }

        setCommentEmail((prev) => prev || data.rememberedEmail || "");
        setCommentsByImage((prev) => ({
          ...prev,
          [activePreviewImage.id]: (data.comments ?? []).map((item) => ({
            id: item.id,
            email: item.email,
            text: item.content,
            createdAt: new Date(item.createdAt).toLocaleString(),
          })),
        }));
      })
      .finally(() => setLoadingComments(false));
  }, [previewOpen, activePreviewImage, commentsByImage]);

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
    const index = images.findIndex((item) => item.id === imageId);
    setPreviewIndex(index < 0 ? 0 : index);
    setPreviewOpen(true);
  }

  async function submitComment() {
    const email = commentEmail.trim().toLowerCase();
    const content = commentDraft.trim();
    if (!activePreviewImage || !email || !email.includes("@") || !content) {
      toast.error("请输入有效邮箱和留言内容。");
      return;
    }

    const response = await fetch("/api/image-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: activePreviewImage.id, email, content }),
    });
    const data = (await response.json()) as {
      error?: string;
      comment?: { id: string; email: string; content: string; createdAt: string };
    };
    const createdComment = data.comment;

    if (!response.ok || !createdComment) {
      toast.error(data.error ?? "留言失败。");
      return;
    }

    setCommentsByImage((prev) => ({
      ...prev,
      [activePreviewImage.id]: [
        {
          id: createdComment.id,
          email: createdComment.email,
          text: createdComment.content,
          createdAt: new Date(createdComment.createdAt).toLocaleString(),
        },
        ...(prev[activePreviewImage.id] ?? []),
      ],
    }));
    setCommentDraft("");
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
        toast.error(data.error ?? copyText.moveFailed);
        return;
      }
      toast.success(`${copyText.movedPrefix} ${data.updated ?? imageIds.length} ${copyText.movedSuffix}`);
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
    toast.success(copyText.copiedLinks);
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
        toast.error(`${failed.length} ${copyText.deleteFailedSuffix}`);
      } else {
        toast.success(`${copyText.deletedPrefix} ${imageIds.length} ${copyText.deletedSuffix}`);
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
              <span> / {copyText.breadcrumbAlbums}</span>
            </p>
            <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
            <p className="text-zinc-600">{images.length} {copyText.imageUnit}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {enableLanguageToggle ? (
              <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 bg-white">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-medium ${language === "en" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                  onClick={() => setLanguage("en")}
                >
                  {copyText.langEn}
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-medium ${language === "zh" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                  onClick={() => setLanguage("zh")}
                >
                  {copyText.langZh}
                </button>
              </div>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(shareLink);
                toast.success(copyText.copiedShareLink);
              }}
            >
              {copyText.copyShareLink}
            </Button>
            {isOwner && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => enterSelectMode(images[0]?.id ?? "")}
              >
                <CheckSquare className="mr-1.5 h-4 w-4" />
                {copyText.multiSelect}
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
                  className="group relative overflow-hidden rounded-sm bg-zinc-200 cursor-pointer"
                  onClick={() => {
                    if (selectMode) {
                      toggleSelect(image.id);
                    } else {
                      openPreview(image.id);
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
          <p className="text-sm text-zinc-500">{copyText.emptyAlbum}</p>
        )}
      </section>

      {previewOpen && activePreviewImage ? (
        <div className="fixed inset-0 z-[90] bg-black/75 p-3 sm:p-5" onClick={() => setPreviewOpen(false)}>
          <div
            className="mx-auto flex h-full w-full max-w-[1400px] overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex-1 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activePreviewImage.cdnUrl} alt="Post" className="h-full w-full object-contain" />

              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                onClick={() => setPreviewIndex((prev) => (prev - 1 + images.length) % images.length)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                onClick={() => setPreviewIndex((prev) => (prev + 1) % images.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <aside className="hidden w-[420px] flex-col border-l border-zinc-200 lg:flex">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-200" />
                  <Link href={`/${ownerUsername}`} className="text-sm font-medium text-zinc-900">@{ownerUsername}</Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.success("举报功能即将上线")}>举报</DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
                        await navigator.share({ url: activePreviewImage.cdnUrl });
                      }
                    }}>分享</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${ownerUsername}`}>查看账户</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <p className="mb-2 text-xs text-zinc-500">留言区</p>
                {loadingComments ? <p className="mb-2 text-sm text-zinc-500">加载中...</p> : null}
                {(commentsByImage[activePreviewImage.id] ?? []).length ? (
                  <div className="space-y-3">
                    {(commentsByImage[activePreviewImage.id] ?? []).map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-zinc-50 p-3">
                        <p className="text-xs text-zinc-500">{comment.email} · {comment.createdAt}</p>
                        <p className="mt-1 text-sm text-zinc-800">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">还没有留言，成为第一条留言吧。</p>
                )}
              </div>

              <div className="border-t border-zinc-200 px-4 py-3">
                <div className="mb-2">
                  <input
                    value={commentEmail}
                    onChange={(event) => setCommentEmail(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                    placeholder="留言邮箱（会记住）"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    className="h-10 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                    placeholder="添加留言..."
                  />
                  <Button type="button" size="sm" onClick={submitComment}>发布</Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

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
                {copyText.selectedCount} {selectedCount} {copyText.selectedUnit}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" disabled={moving}>
                    {copyText.moveToAlbum}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => moveSelectedTo(null)}>
                    {copyText.ungrouped}
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
                {copyText.copyLinks}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {copyText.delete}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>{copyText.confirmDeletePrefix} {selectedCount} {copyText.confirmDeleteSuffix}</DialogTitle>
                  <DialogDescription>
                    {copyText.deleteHint}
                  </DialogDescription>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => cancelSelect()}>
                      {copyText.cancel}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={deleteSelected}
                    >
                      {deleting ? copyText.deleting : copyText.deleteImages}
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
          <p className="mb-2 text-sm font-medium text-zinc-900">{copyText.linksPanelTitle}</p>
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
            {copyText.close}
          </button>
        </div>
      ) : null}
    </div>
  );
}
