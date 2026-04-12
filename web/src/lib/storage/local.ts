import fs from "fs/promises";
import path from "path";

import { getStorageConfig } from "@/lib/storage/s3";

async function getLocalUploadRoot() {
  const config = await getStorageConfig();
  if (config.mode !== "local") {
    throw new Error("Local storage is only available in local mode.");
  }

  return path.resolve(process.cwd(), config.uploadDir);
}

export async function saveLocalUpload(key: string, fileBuffer: Buffer) {
  const root = await getLocalUploadRoot();
  const outputPath = path.join(root, key);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, fileBuffer);
}

export async function deleteLocalUpload(key: string) {
  const root = await getLocalUploadRoot();
  const outputPath = path.join(root, key);

  try {
    await fs.unlink(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
