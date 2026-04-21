import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveLocalUpload } from "@/lib/storage/local";
import { buildObjectKey, buildPublicUrl, createPresignedUploadUrl, getStorageConfig } from "@/lib/storage/s3";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择头像文件。" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "头像必须是图片格式。" }, { status: 400 });
    }

    const key = buildObjectKey(userId, `avatar-${file.name}`);
    const storage = await getStorageConfig();

    if (storage.mode === "local") {
      await saveLocalUpload(key, Buffer.from(await file.arrayBuffer()));
    } else {
      const uploadUrl = await createPresignedUploadUrl({
        key,
        contentType: file.type || "image/jpeg",
      });

      if (!uploadUrl) {
        return NextResponse.json({ error: "无法生成头像上传地址。" }, { status: 500 });
      }

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: Buffer.from(await file.arrayBuffer()),
      });
    }

    const avatarUrl = await buildPublicUrl(key);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("upload avatar error", error);
    return NextResponse.json({ error: "头像上传失败。" }, { status: 500 });
  }
}
