import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

function randomShortId(length = 8) {
  const bytes = crypto.randomBytes(length);
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return value;
}

async function generateUniqueShortId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const shortId = randomShortId(8);
    const exists = await prisma.album.findUnique({ where: { shortId }, select: { id: true } });
    if (!exists) {
      return shortId;
    }
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  const albumsWithoutShortId = await prisma.album.findMany({
    where: { shortId: null },
    select: { id: true, title: true },
  });

  if (albumsWithoutShortId.length === 0) {
    console.log("All existing albums already have shortIds.");
    return;
  }

  console.log(`Backfilling shortIds for ${albumsWithoutShortId.length} album(s)...`);

  for (const album of albumsWithoutShortId) {
    const shortId = await generateUniqueShortId();
    await prisma.album.update({
      where: { id: album.id },
      data: { shortId },
    });
    console.log(`  [${album.id}] "${album.title}" -> /albums/${shortId}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
