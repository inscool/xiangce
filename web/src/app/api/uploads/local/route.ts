import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveLocalUpload } from "@/lib/storage/local";
import { assertAlbumOwnership } from "@/lib/storage/quota";
import { buildObjectKey, buildPublicUrl, getStorageConfig } from "@/lib/storage/s3";
import { getSystemSetting } from "@/lib/system-settings";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const storage = await getStorageConfig();
    if (storage.mode !== "local") {
      return NextResponse.json({ error: "Local upload endpoint only works in local storage mode." }, { status: 400 });
    }

    const savedStorage = await getSystemSetting<{ driver?: string; localUploadDir?: string }>("storage");
    const uploadDir = savedStorage?.localUploadDir ?? process.env.LOCAL_UPLOAD_DIR ?? "public/uploads";
    if (!uploadDir.startsWith("public/")) {
      return NextResponse.json(
        { error: "本地存储目录必须设置为 public/ 开头，例如 public/uploads。" },
        { status: 400 },
      );
    }

    const appBaseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL;
    if (!appBaseUrl) {
      return NextResponse.json({ error: "请先配置 APP_BASE_URL 或 NEXTAUTH_URL。" }, { status: 400 });
    }

    const formData = await request.formData();
    const albumId = String(formData.get("albumId") ?? "");
    const file = formData.get("file");

    if (!albumId) {
      return NextResponse.json({ error: "请选择目标相册。" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择图片文件。" }, { status: 400 });
    }

    await assertAlbumOwnership(userId, albumId);

    const key = buildObjectKey(userId, file.name);
    await saveLocalUpload(key, Buffer.from(await file.arrayBuffer()));

    const image = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { usedStorage: true, storageLimit: true },
      });

      if (!user) {
        throw new Error("用户不存在。");
      }

      const nextUsed = user.usedStorage + BigInt(file.size);
      if (nextUsed > user.storageLimit) {
        throw new Error("存储空间不足。");
      }

      const created = await tx.image.create({
        data: {
          storageKey: key,
          cdnUrl: await buildPublicUrl(key),
          fileSize: BigInt(file.size),
          userId,
          albumId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          usedStorage: { increment: BigInt(file.size) },
        },
      });

      return created;
    });

    return NextResponse.json({
      image: {
        id: image.id,
        cdnUrl: image.cdnUrl,
        storageKey: image.storageKey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传文件失败。";
    const status = message === "存储空间不足。" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
