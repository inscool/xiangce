import crypto from "crypto";
import path from "path";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getSystemSetting } from "@/lib/system-settings";

type SignedUploadInput = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

type StorageMode = "local" | "s3";

type StorageConfig =
  | {
      mode: "local";
      publicBaseUrl: string;
      uploadDir: string;
      publicPath: string;
    }
  | {
      mode: "s3";
      bucket: string;
      endpoint: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
      publicBaseUrl: string;
    };

const defaultExpiresIn = Number(process.env.S3_PRESIGNED_EXPIRES ?? "300");

function getStorageMode(): StorageMode {
  const mode = process.env.STORAGE_DRIVER?.toLowerCase();
  if (mode === "s3") {
    return "s3";
  }

  return "local";
}

function ensureAbsoluteUrl(value: string, name: string) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

function normalizeLocalPublicPath(uploadDir: string) {
  const normalized = uploadDir.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("public/")) {
    return `/${normalized.slice("public/".length)}`.replace(/\/+$/, "");
  }

  if (normalized === "public") {
    return "";
  }

  return `/${normalized}`.replace(/\/+$/, "");
}

export async function getStorageConfig(): Promise<StorageConfig> {
  const savedStorage = await getSystemSetting<{
    driver?: string;
    localUploadDir?: string;
    s3Region?: string;
    s3Bucket?: string;
    s3Endpoint?: string;
    s3AccessKeyId?: string;
    s3SecretAccessKey?: string;
    s3ForcePathStyle?: boolean;
    cdnBaseUrl?: string;
  }>("storage");

  const mode = savedStorage?.driver === "s3" ? "s3" : getStorageMode();

  if (mode === "local") {
    const appBaseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL;
    if (!appBaseUrl) {
      throw new Error("Please configure APP_BASE_URL or NEXTAUTH_URL before using local storage.");
    }

    const uploadDir = savedStorage?.localUploadDir ?? process.env.LOCAL_UPLOAD_DIR ?? "public/uploads";

    return {
      mode: "local",
      publicBaseUrl: ensureAbsoluteUrl(appBaseUrl, "APP_BASE_URL"),
      uploadDir,
      publicPath: normalizeLocalPublicPath(uploadDir),
    };
  }

  const endpoint = savedStorage?.s3Endpoint ?? process.env.S3_ENDPOINT;
  const bucket = savedStorage?.s3Bucket ?? process.env.S3_BUCKET;
  const accessKeyId = savedStorage?.s3AccessKeyId ?? process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = savedStorage?.s3SecretAccessKey ?? process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Please configure S3 storage information in system settings before uploading.");
  }

  const normalizedEndpoint = ensureAbsoluteUrl(endpoint, "S3_ENDPOINT");
  const cdnBaseUrl = savedStorage?.cdnBaseUrl?.trim() ?? process.env.CDN_BASE_URL?.trim();

  return {
    mode: "s3",
    bucket,
    endpoint: normalizedEndpoint,
    region: savedStorage?.s3Region ?? process.env.S3_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
    forcePathStyle: savedStorage?.s3ForcePathStyle ?? process.env.S3_FORCE_PATH_STYLE === "true",
    publicBaseUrl: cdnBaseUrl ? ensureAbsoluteUrl(cdnBaseUrl, "CDN_BASE_URL") : normalizedEndpoint,
  };
}

export async function getBucketName() {
  const config = await getStorageConfig();
  if (config.mode !== "s3") {
    throw new Error("Bucket name is only available in S3 mode.");
  }

  return config.bucket;
}

export async function getS3Client() {
  const config = await getStorageConfig();
  if (config.mode !== "s3") {
    throw new Error("S3 client is only available in S3 mode.");
  }

  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });
}

function sanitizeFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path
    .basename(fileName, ext)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

  return `${base || "image"}${ext}`;
}

export function buildObjectKey(userId: string, fileName: string) {
  const date = new Date();
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const random = crypto.randomBytes(8).toString("hex");

  return `${userId}/${y}/${m}/${d}/${random}-${sanitizeFileName(fileName)}`;
}

export async function buildPublicUrl(key: string) {
  const config = await getStorageConfig();

  if (config.mode === "local") {
    return `${config.publicBaseUrl}${config.publicPath}/${key}`;
  }

  return `${config.publicBaseUrl}/${key}`;
}

export async function createPresignedUploadUrl(input: SignedUploadInput) {
  const config = await getStorageConfig();

  if (config.mode === "local") {
    return null;
  }

  const s3 = await getS3Client();
  const bucket = await getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: input.expiresIn ?? defaultExpiresIn,
  });

  return uploadUrl;
}

export async function deleteObjectByKey(key: string) {
  const config = await getStorageConfig();

  if (config.mode === "local") {
    return;
  }

  const s3 = await getS3Client();
  const bucket = await getBucketName();

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
