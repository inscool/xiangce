import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}

function normalizePublicPath(uploadDir) {
  const normalized = uploadDir.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.startsWith("public/")) {
    return `/${normalized.slice("public/".length)}`.replace(/\/+$/, "");
  }
  if (normalized === "public") {
    return "";
  }
  return `/${normalized}`.replace(/\/+$/, "");
}

async function main() {
  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL;
  const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? "public/uploads";

  if (!appBaseUrl) {
    throw new Error("Please configure APP_BASE_URL or NEXTAUTH_URL before repairing local image URLs.");
  }

  const baseUrl = normalizeBaseUrl(appBaseUrl);
  const publicPath = normalizePublicPath(uploadDir);

  const images = await prisma.image.findMany({
    where: {
      storageKey: { not: "" },
    },
    select: {
      id: true,
      storageKey: true,
      cdnUrl: true,
    },
  });

  let updated = 0;
  for (const image of images) {
    const expected = `${baseUrl}${publicPath}/${image.storageKey}`;
    if (image.cdnUrl !== expected) {
      await prisma.image.update({
        where: { id: image.id },
        data: { cdnUrl: expected },
      });
      updated += 1;
      console.log(`updated ${image.id}`);
    }
  }

  console.log(`Repaired ${updated} image URL(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
