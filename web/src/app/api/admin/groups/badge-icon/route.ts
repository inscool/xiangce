import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { saveLocalUpload } from "@/lib/storage/local";
import { buildObjectKey, buildPublicUrl, createPresignedUploadUrl, getStorageConfig } from "@/lib/storage/s3";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择徽章图标文件。" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "徽章图标必须为图片格式。" }, { status: 400 });
    }

    const key = buildObjectKey(session.user.id, `group-badge-${file.name}`);
    const storage = await getStorageConfig();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (storage.mode === "local") {
      await saveLocalUpload(key, buffer);
    } else {
      const uploadUrl = await createPresignedUploadUrl({ key, contentType: file.type || "image/png" });
      if (!uploadUrl) {
        return NextResponse.json({ error: "无法生成徽章图标上传地址。" }, { status: 500 });
      }
      const uploaded = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/png" },
        body: buffer,
      });
      if (!uploaded.ok) {
        return NextResponse.json({ error: "上传到对象存储失败。" }, { status: 500 });
      }
    }

    const iconUrl = await buildPublicUrl(key);
    return NextResponse.json({ iconUrl });
  } catch (error) {
    console.error("upload group badge icon error", error);
    return NextResponse.json({ error: "上传徽章图标失败。" }, { status: 500 });
  }
}
