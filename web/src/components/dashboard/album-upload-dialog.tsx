"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Album = {
  id: string;
  title: string;
};

type Props = {
  albums: Album[];
  defaultAlbumId?: string;
  triggerLabel?: string;
};

export function AlbumUploadDialog({ albums, defaultAlbumId = "", triggerLabel = "上传图片" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [albumId, setAlbumId] = useState(defaultAlbumId || albums[0]?.id || "");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedAlbum = useMemo(() => albums.find((album) => album.id === albumId) ?? null, [albums, albumId]);

  async function handleUpload() {
    if (!albumId) {
      toast.error("请选择相册。");
      return;
    }

    if (!files.length) {
      toast.error("请选择图片文件。");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];

        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            albumId,
          }),
        });

        const presign = (await presignRes.json()) as {
          storageMode?: "local" | "s3";
          uploadUrl?: string | null;
          key?: string;
          error?: string;
        };

        if (!presignRes.ok || !presign.key || !presign.storageMode) {
          throw new Error(presign.error ?? "准备上传失败。");
        }

        if (presign.storageMode === "local") {
          const formData = new FormData();
          formData.append("albumId", albumId);
          formData.append("file", file);

          const localRes = await fetch("/api/uploads/local", {
            method: "POST",
            body: formData,
          });

          const localData = (await localRes.json()) as { error?: string };
          if (!localRes.ok) {
            throw new Error(localData.error ?? "本地上传失败。");
          }
        } else {
          if (!presign.uploadUrl) {
            throw new Error("S3 上传地址缺失。");
          }

          await fetch(presign.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          const completeRes = await fetch("/api/uploads/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: presign.key,
              fileSize: file.size,
              albumId,
            }),
          });

          const completeData = (await completeRes.json()) as { error?: string };
          if (!completeRes.ok) {
            throw new Error(completeData.error ?? "上传完成写入失败。");
          }
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      toast.success("上传完成。");
      setFiles([]);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-6">
        <DialogTitle>上传图片</DialogTitle>
        <DialogDescription>选择相册与图片文件后开始上传。</DialogDescription>

        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-[300px,minmax(0,1fr)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">选择相册</label>
              <select
                value={albumId}
                onChange={(event) => setAlbumId(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              >
                <option value="">选择相册</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              {selectedAlbum ? `当前相册：${selectedAlbum.title}` : "请先选择目标相册后再上传。"}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={!albumId || uploading}
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <div className="mt-6 flex min-h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-zinc-500">
              {files.length ? `已选择 ${files.length} 个文件` : "点击选择图片"}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-zinc-500">
            <span>支持 jpg/jpeg/png/webp/avif/gif 格式。</span>
            <span>{files.length} 个文件</span>
          </div>

          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-zinc-600">上传进度：{progress}%</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={!albumId || files.length === 0 || uploading} onClick={handleUpload}>
              {uploading ? "上传中..." : "开始上传"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
