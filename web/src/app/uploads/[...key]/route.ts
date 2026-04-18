import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { getStorageConfig } from "@/lib/storage/s3";

function guessContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function resolveLocalFilePath(keySegments: string[]) {
  const config = await getStorageConfig();
  if (config.mode !== "local") {
    return null;
  }

  const root = path.resolve(process.cwd(), config.uploadDir);
  const safeSegments = keySegments.map((segment) => segment.replace(/\\/g, "")).filter(Boolean);
  const filePath = path.resolve(root, ...safeSegments);

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

export async function GET(_: Request, context: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await context.params;
    const filePath = await resolveLocalFilePath(key);
    if (!filePath) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": guessContentType(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}

export async function HEAD(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const response = await GET(request, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
