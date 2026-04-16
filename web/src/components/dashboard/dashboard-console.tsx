"use client";

import type { AlbumVisibility } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, MoreHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";

import { AlbumInlinePreview } from "@/components/album/album-inline-preview";
import { AlbumUploadDialog } from "@/components/dashboard/album-upload-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type DashboardImage = {
  id: string;
  cdnUrl: string;
  storageKey: string;
  fileSize: string;
  albumId: string | null;
};

type DashboardAlbum = {
  id: string;
  shortId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  visibility: AlbumVisibility;
  images: DashboardImage[];
};

function putFileWithProgress(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error("Upload to object storage failed."));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

const visibilityLabel: Record<AlbumVisibility, string> = {
  PUBLIC: "公开",
  PROTECTED: "加密",
  PRIVATE: "私有",
};

type DashboardSection = "albums" | "upload" | "links";

type ConsoleProps = {
  albums: DashboardAlbum[];
  images: DashboardImage[];
  activeSection?: DashboardSection;
  focusAlbumId?: string | null;
};

export function DashboardConsole({ albums, images, activeSection = "albums", focusAlbumId = null }: ConsoleProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createAlbumLoading, setCreateAlbumLoading] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "PUBLIC" as AlbumVisibility,
    password: "",
  });

  const [uploadAlbumId, setUploadAlbumId] = useState<string>(albums[0]?.id ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [selectedLibrary, setSelectedLibrary] = useState<Record<string, true>>({});
  const [moveAlbumId, setMoveAlbumId] = useState<string>(albums[0]?.id ?? "");
  const [moving, setMoving] = useState(false);

  const [selectedAlbumImages, setSelectedAlbumImages] = useState<Record<string, true>>({});
  const [outputLinks, setOutputLinks] = useState("");
  const [inlinePreviewAlbumId] = useState<string | null>(null);
  const [albumSearch, setAlbumSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVisibilities, setSelectedVisibilities] = useState<AlbumVisibility[]>([]);
  const [albumSort, setAlbumSort] = useState<"latest" | "name" | "imageCount">("latest");

  const selectedAlbum = useMemo(
    () => (focusAlbumId ? albums.find((album) => album.id === focusAlbumId) ?? albums[0] ?? null : albums[0] ?? null),
    [albums, focusAlbumId],
  );

  const inlinePreviewAlbum = useMemo(
    () => (inlinePreviewAlbumId ? albums.find((album) => album.id === inlinePreviewAlbumId) ?? null : null),
    [albums, inlinePreviewAlbumId],
  );

  const selectedCurrentAlbumImageIds = useMemo(
    () => Object.keys(selectedAlbumImages).filter((imageId) => selectedAlbumImages[imageId]),
    [selectedAlbumImages],
  );

  const categories = useMemo(
    () => Array.from(new Set(albums.map((album) => album.category).filter((value): value is string => Boolean(value)))).sort(),
    [albums],
  );

  const filteredAlbums = useMemo(() => {
    const filtered = albums.filter((album) => {
      const matchesSearch =
        album.title.toLowerCase().includes(albumSearch.toLowerCase()) ||
        album.description?.toLowerCase().includes(albumSearch.toLowerCase()) ||
        album.category?.toLowerCase().includes(albumSearch.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || (album.category ? selectedCategories.includes(album.category) : false);

      const matchesVisibility =
        selectedVisibilities.length === 0 || selectedVisibilities.includes(album.visibility);

      return Boolean(matchesSearch) && matchesCategory && matchesVisibility;
    });

    if (albumSort === "name") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (albumSort === "imageCount") {
      return [...filtered].sort((a, b) => b.images.length - a.images.length);
    }

    return filtered;
  }, [albums, albumSearch, selectedCategories, selectedVisibilities, albumSort]);

  async function createAlbum() {
    if (!newAlbum.title.trim()) {
      toast.error("相册名称不能为空。");
      return;
    }
    if (newAlbum.visibility === "PROTECTED" && !newAlbum.password) {
      toast.error("加密相册必须填写访问密码。");
      return;
    }

    setCreateAlbumLoading(true);
    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAlbum.title,
          description: newAlbum.description || undefined,
          category: newAlbum.category || undefined,
          visibility: newAlbum.visibility,
          password: newAlbum.visibility === "PROTECTED" ? newAlbum.password : undefined,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "创建相册失败。");
        return;
      }

      setCreateOpen(false);
      setNewAlbum({ title: "", description: "", category: "", visibility: "PUBLIC", password: "" });
      toast.success("相册已创建。");
      router.refresh();
    } finally {
      setCreateAlbumLoading(false);
    }
  }

  async function startUpload() {
    if (!uploadAlbumId) {
      toast.error("请先选择目标相册再上传。");
      return;
    }
    if (!pendingFiles.length) {
      toast.error("请先选择图片文件。");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const total = pendingFiles.length;
      for (let i = 0; i < total; i += 1) {
        const file = pendingFiles[i];

        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            albumId: uploadAlbumId,
          }),
        });
        const presign = (await presignRes.json()) as { uploadUrl?: string; key?: string; error?: string };
        if (!presignRes.ok || !presign.uploadUrl || !presign.key) {
          if (presign.error) {
            setStorageWarning(presign.error);
          }
          throw new Error(presign.error ?? "准备上传失败。");
        }

        await putFileWithProgress(presign.uploadUrl, file, (fileProgress) => {
          const base = (i / total) * 100;
          const perFile = (fileProgress / total) * 1;
          setUploadProgress(Math.min(99, Math.round(base + perFile * 100)));
        });

        const completeRes = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: presign.key,
            fileSize: file.size,
            albumId: uploadAlbumId,
          }),
        });
        if (!completeRes.ok) {
          const completeData = (await completeRes.json()) as { error?: string };
          throw new Error(completeData.error ?? "保存上传信息失败。");
        }

        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }

      toast.success("上传完成。");
      setPendingFiles([]);
      setStorageWarning(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }

  async function moveSelectedImages() {
    const imageIds = Object.keys(selectedLibrary);
    if (!imageIds.length) {
      toast.error("请先至少选择一张图片。");
      return;
    }

    setMoving(true);
    try {
      const response = await fetch("/api/images/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds, albumId: moveAlbumId || null }),
      });
      const data = (await response.json()) as { error?: string; updated?: number };

      if (!response.ok) {
        toast.error(data.error ?? "批量移动图片失败。");
        return;
      }

      setSelectedLibrary({});
      toast.success(`已移动 ${data.updated ?? imageIds.length} 张图片。`);
      router.refresh();
    } finally {
      setMoving(false);
    }
  }

  async function copyShareLink(shortId: string | null, fallbackAlbumId: string) {
    const pathId = shortId ?? fallbackAlbumId;
    const link = `${window.location.origin}/albums/${pathId}`;
    await navigator.clipboard.writeText(link);
    toast.success("相册分享链接已复制。");
  }

  async function moveSingleImage(imageId: string, toAlbumId: string | null) {
    const response = await fetch("/api/images/move", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds: [imageId], albumId: toAlbumId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast.error(data.error ?? "移动图片失败。");
      return;
    }

    toast.success("图片已移动。");
    router.refresh();
  }

  async function copyOriginal(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success("原始链接已复制。");
  }

  async function copyHtml(url: string) {
    await navigator.clipboard.writeText(`<img src="${url}" alt="image" />`);
    toast.success("HTML 代码已复制。");
  }

  async function copyMarkdown(url: string) {
    await navigator.clipboard.writeText(`![image](${url})`);
    toast.success("Markdown 代码已复制。");
  }

  async function copyAlbumLinks() {
    if (!selectedAlbum) {
      toast.error("当前未选择相册。");
      return;
    }

    const selectedIds = Object.keys(selectedAlbumImages);
    const targets = selectedAlbum.images.filter((image) => selectedIds.includes(image.id));
    if (!targets.length) {
      toast.error("请先在该相册中选择图片。");
      return;
    }

    const links = targets.map((image) => image.cdnUrl).join("\n");
    setOutputLinks(links);
    await navigator.clipboard.writeText(links);
    toast.success("直链已复制。");
  }

  async function copyCurrentAlbumSelectedLinks() {
    if (!selectedAlbum) {
      return;
    }

    const targets = selectedAlbum.images.filter((image) => selectedCurrentAlbumImageIds.includes(image.id));
    if (!targets.length) {
      toast.error("请先选择图片。");
      return;
    }

    const links = targets.map((image) => image.cdnUrl).join("\n");
    await navigator.clipboard.writeText(links);
    setOutputLinks(links);
    toast.success("已复制选中图片直链。");
  }

  async function copyCurrentAlbumSelectedHtml() {
    if (!selectedAlbum) {
      return;
    }

    const targets = selectedAlbum.images.filter((image) => selectedCurrentAlbumImageIds.includes(image.id));
    if (!targets.length) {
      toast.error("请先选择图片。");
      return;
    }

    const html = targets.map((image) => `<img src="${image.cdnUrl}" alt="image" />`).join("\n");
    await navigator.clipboard.writeText(html);
    setOutputLinks(html);
    toast.success("已复制选中图片 HTML 代码。");
  }

  async function copyCurrentAlbumSelectedMarkdown() {
    if (!selectedAlbum) {
      return;
    }

    const targets = selectedAlbum.images.filter((image) => selectedCurrentAlbumImageIds.includes(image.id));
    if (!targets.length) {
      toast.error("请先选择图片。");
      return;
    }

    const markdown = targets.map((image) => `![image](${image.cdnUrl})`).join("\n");
    await navigator.clipboard.writeText(markdown);
    setOutputLinks(markdown);
    toast.success("已复制选中图片 Markdown 代码。");
  }

  async function moveCurrentAlbumSelected(toAlbumId: string | null) {
    if (!selectedCurrentAlbumImageIds.length) {
      toast.error("请先选择图片。");
      return;
    }

    const response = await fetch("/api/images/move", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds: selectedCurrentAlbumImageIds, albumId: toAlbumId }),
    });
    const data = (await response.json()) as { error?: string; updated?: number };
    if (!response.ok) {
      toast.error(data.error ?? "移动选中图片失败。");
      return;
    }

    setSelectedAlbumImages({});
    toast.success(`已移动 ${data.updated ?? selectedCurrentAlbumImageIds.length} 张图片。`);
    router.refresh();
  }

  async function deleteCurrentAlbumSelected() {
    if (!selectedCurrentAlbumImageIds.length) {
      toast.error("请先选择图片。");
      return;
    }

    const results = await Promise.allSettled(
      selectedCurrentAlbumImageIds.map((imageId) => fetch(`/api/images/${imageId}`, { method: "DELETE" })),
    );
    const failed = results.filter((item) => item.status === "rejected" || !((item as PromiseFulfilledResult<Response>).value.ok));

    if (failed.length) {
      toast.error(`${failed.length} 张图片删除失败。`);
    } else {
      toast.success(`已删除 ${selectedCurrentAlbumImageIds.length} 张图片。`);
    }

    setSelectedAlbumImages({});
    router.refresh();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!selectedAlbum) {
        return;
      }

      if (event.key === "Escape") {
        setSelectedAlbumImages({});
        return;
      }

      const isTyping =
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.isContentEditable);

      if (!isTyping && event.key.toLowerCase() === "a") {
        event.preventDefault();
        const next = Object.fromEntries(selectedAlbum.images.map((image) => [image.id, true])) as Record<string, true>;
        setSelectedAlbumImages(next);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAlbum]);

  return (
    <div className="space-y-6">
      {activeSection === "albums" ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">相册管理</p>
                <CardTitle className="mt-2 text-2xl">当前相册：{selectedAlbum?.title ?? "未选择相册"}</CardTitle>
                <CardDescription className="mt-1">
                  切换相册、管理封面卡片，并在宽屏工作区中浏览大图预览。
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                  <AlbumUploadDialog
                    albums={albums.map((album) => ({ id: album.id, title: album.title }))}
                    defaultAlbumId={focusAlbumId ?? selectedAlbum?.id}
                    triggerLabel="上传图片"
                  />
                {selectedAlbum ? (
                  <Button type="button" variant="outline" onClick={() => copyShareLink(selectedAlbum.shortId, selectedAlbum.id)}>
                    复制分享链接
                  </Button>
                ) : null}
                <Button asChild type="button" variant="secondary">
                  <Link href="/dashboard?section=links">批量操作</Link>
                </Button>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button>新建相册</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>新建相册</DialogTitle>
                    <DialogDescription>设置基础信息和可见性后再创建相册。</DialogDescription>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="album-name">名称</Label>
                        <Input
                          id="album-name"
                          value={newAlbum.title}
                          onChange={(event) => setNewAlbum((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="例如：Nike Campaign"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="album-description">描述</Label>
                        <Input
                          id="album-description"
                          value={newAlbum.description}
                          onChange={(event) => setNewAlbum((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="可选描述"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="album-category">分类</Label>
                        <Input
                          id="album-category"
                          value={newAlbum.category}
                          onChange={(event) => setNewAlbum((prev) => ({ ...prev, category: event.target.value }))}
                          placeholder="例如：球鞋 / 产品 / 人像"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>可见性</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {visibilityLabel[newAlbum.visibility]}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56" align="start">
                            <DropdownMenuItem onClick={() => setNewAlbum((prev) => ({ ...prev, visibility: "PUBLIC" }))}>
                              公开
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNewAlbum((prev) => ({ ...prev, visibility: "PROTECTED" }))}>
                              加密（密码）
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNewAlbum((prev) => ({ ...prev, visibility: "PRIVATE" }))}>
                              私有（仅自己）
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {newAlbum.visibility === "PROTECTED" ? (
                        <div className="space-y-2">
                          <Label htmlFor="album-password">访问密码</Label>
                          <Input
                            id="album-password"
                            type="password"
                            value={newAlbum.password}
                            onChange={(event) => setNewAlbum((prev) => ({ ...prev, password: event.target.value }))}
                            placeholder="至少 6 位"
                          />
                        </div>
                      ) : null}

                      <Button onClick={createAlbum} disabled={createAlbumLoading} className="w-full">
                        {createAlbumLoading ? "创建中..." : "创建相册"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex-1">
                    <Label htmlFor="album-search">搜索</Label>
                  <Input
                    id="album-search"
                    value={albumSearch}
                    onChange={(event) => setAlbumSearch(event.target.value)}
                    placeholder="按相册名、描述、分类搜索"
                    className="mt-2 bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline">
                        分类筛选
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>分类</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {categories.length ? (
                        categories.map((category) => (
                          <DropdownMenuCheckboxItem
                            key={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              setSelectedCategories((prev) =>
                                checked ? [...prev, category] : prev.filter((item) => item !== category),
                              );
                            }}
                          >
                            {category}
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>暂无分类</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline">
                        权限筛选
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>可见性</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(["PUBLIC", "PROTECTED", "PRIVATE"] as AlbumVisibility[]).map((visibility) => (
                        <DropdownMenuCheckboxItem
                          key={visibility}
                          checked={selectedVisibilities.includes(visibility)}
                          onCheckedChange={(checked) => {
                            setSelectedVisibilities((prev) =>
                              checked ? [...prev, visibility] : prev.filter((item) => item !== visibility),
                            );
                          }}
                        >
                          {visibilityLabel[visibility]}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline">
                        <ArrowDownAZ className="mr-2 h-4 w-4" />
                        排序
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>相册排序</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={albumSort === "latest"}
                        onCheckedChange={() => setAlbumSort("latest")}
                      >
                        最新创建
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={albumSort === "name"} onCheckedChange={() => setAlbumSort("name")}>
                        名称排序
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={albumSort === "imageCount"}
                        onCheckedChange={() => setAlbumSort("imageCount")}
                      >
                        图片数量
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAlbumSearch("");
                      setSelectedCategories([]);
                      setSelectedVisibilities([]);
                      setAlbumSort("latest");
                    }}
                  >
                    重置筛选
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
                {filteredAlbums.map((album) => {
                  const cover = album.images[0];
                  const isActive = selectedAlbum?.id === album.id;
                  return (
                    <Link
                      key={album.id}
                      href={`/dashboard/albums/${album.shortId ?? album.id}`}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        isActive
                          ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-xl shadow-zinc-900/5"
                          : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/10"
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-zinc-100">
                        {cover ? (
                          <Image src={cover.cdnUrl} alt={album.title} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-zinc-500">暂无封面</div>
                        )}
                      </div>
                      <div className="space-y-2 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-zinc-900">{album.title}</p>
                            <p className="text-xs text-zinc-500">{album.images.length} 张图片</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyShareLink(album.shortId, album.id)}>
                                复制分享链接
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/albums/${album.shortId ?? album.id}`}>打开相册页面</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                          <span className="rounded-full border border-zinc-200 px-2 py-1">{visibilityLabel[album.visibility]}</span>
                          {album.category ? <span className="rounded-full border border-zinc-200 px-2 py-1">{album.category}</span> : null}
                        </div>
                        {album.description ? <p className="line-clamp-2 text-sm text-zinc-600">{album.description}</p> : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {!filteredAlbums.length ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                  当前筛选条件下没有匹配的相册。
                </div>
              ) : null}

              {inlinePreviewAlbum ? (
                <AlbumInlinePreview
                  title={inlinePreviewAlbum.title}
                  shortId={inlinePreviewAlbum.shortId ?? inlinePreviewAlbum.id}
                  images={inlinePreviewAlbum.images.map((image) => ({
                    id: image.id,
                    cdnUrl: image.cdnUrl,
                    storageKey: image.storageKey,
                  }))}
                />
              ) : null}
            </div>

            {selectedCurrentAlbumImageIds.length ? (
              <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
                <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
                    <div className="text-sm font-medium text-zinc-900">已选 {selectedCurrentAlbumImageIds.length} 张</div>
                    <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          移动到...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => moveCurrentAlbumSelected(null)}>不放入相册</DropdownMenuItem>
                        {albums.map((album) => (
                          <DropdownMenuItem key={album.id} onClick={() => moveCurrentAlbumSelected(album.id)}>
                            {album.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button type="button" variant="outline" size="sm" onClick={copyCurrentAlbumSelectedLinks}>
                      批量复制链接
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={copyCurrentAlbumSelectedHtml}>
                      复制 HTML
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={copyCurrentAlbumSelectedMarkdown}>
                      复制 Markdown
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={deleteCurrentAlbumSelected}>
                      批量删除
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedAlbumImages({})}>
                      清空选择
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

      {activeSection === "upload" ? (
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload Workspace</CardTitle>
              <CardDescription>Choose target album first, then upload in a dedicated wide-screen workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-album">Target Album (required)</Label>
                  <select
                    id="upload-album"
                    value={uploadAlbumId}
                    onChange={(event) => setUploadAlbumId(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  >
                    <option value="">选择相册</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading || !uploadAlbumId}
                    onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))}
                  />

                  <Button
                    type="button"
                    className="w-full"
                    disabled={uploading || !uploadAlbumId || pendingFiles.length === 0}
                    onClick={startUpload}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "上传中..." : "开始上传"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="move-album">Move Selected To</Label>
                  <select
                    id="move-album"
                    value={moveAlbumId}
                    onChange={(event) => setMoveAlbumId(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  >
                    <option value="">不放入相册</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={moveSelectedImages} disabled={moving} className="w-full" variant="outline">
                    {moving ? "移动中..." : "移动选中图片"}
                  </Button>
                </div>
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-zinc-600">Upload progress: {uploadProgress}%</p>
                </div>
              ) : null}

              {storageWarning ? <p className="text-sm text-amber-700">{storageWarning}</p> : null}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {images.map((image) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-md border border-zinc-200">
                    <input
                      type="checkbox"
                      className="absolute left-2 top-2 z-20 h-4 w-4"
                      checked={Boolean(selectedLibrary[image.id])}
                      onChange={(event) => {
                        setSelectedLibrary((prev) => {
                          const next = { ...prev };
                          if (event.target.checked) {
                            next[image.id] = true;
                          } else {
                            delete next[image.id];
                          }
                          return next;
                        });
                      }}
                    />
                    <div className="relative aspect-square bg-zinc-100">
                      <Image src={image.cdnUrl} alt="Library image" fill className="object-cover" unoptimized />
                    </div>

                    <div className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition group-hover:bg-black/45" />
                    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                      <div className="pointer-events-auto grid grid-cols-2 gap-1">
                        <Button type="button" size="sm" variant="secondary" onClick={() => copyOriginal(image.cdnUrl)}>
                          Copy Link
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => copyHtml(image.cdnUrl)}>
                          Copy HTML
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="col-span-2"
                          onClick={() => copyMarkdown(image.cdnUrl)}
                        >
                          Copy Markdown
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="sm" variant="outline" className="pointer-events-auto bg-white/90">
                            Move To Album
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => moveSingleImage(image.id, null)}>不放入相册</DropdownMenuItem>
                          {albums.map((album) => (
                            <DropdownMenuItem key={album.id} onClick={() => moveSingleImage(image.id, album.id)}>
                              {album.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      ) : null}

      {activeSection === "links" ? (
          <Card>
            <CardHeader>
              <CardTitle>Batch Direct Link Workspace</CardTitle>
              <CardDescription>Pick an album, multi-select images, and export URLs without mixing settings into the same view.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedAlbumId}
                  onChange={(event) => {
                    setSelectedAlbumId(event.target.value);
                    setSelectedAlbumImages({});
                  }}
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm sm:max-w-xs"
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" onClick={copyAlbumLinks} disabled={!selectedAlbum}>
                      复制选中链接
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>直链列表</DialogTitle>
                    <DialogDescription>可直接复制这些链接用于独立站、论坛或其他分发场景。</DialogDescription>
                    <textarea
                      readOnly
                      value={outputLinks}
                      className="min-h-48 w-full rounded-md border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-700"
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {selectedAlbum ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {selectedAlbum.images.map((image) => (
                    <label key={image.id} className="relative block cursor-pointer overflow-hidden rounded-md border border-zinc-200">
                      <input
                        type="checkbox"
                        className="absolute left-2 top-2 z-10 h-4 w-4"
                        checked={Boolean(selectedAlbumImages[image.id])}
                        onChange={(event) => {
                          setSelectedAlbumImages((prev) => {
                            const next = { ...prev };
                            if (event.target.checked) {
                              next[image.id] = true;
                            } else {
                              delete next[image.id];
                            }
                            return next;
                          });
                        }}
                      />
                      <div className="relative aspect-square bg-zinc-100">
                        <Image src={image.cdnUrl} alt="Album image" fill className="object-cover" unoptimized />
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Create an album to use batch link export.</p>
              )}
            </CardContent>
          </Card>
      ) : null}
    </div>
  );
}
