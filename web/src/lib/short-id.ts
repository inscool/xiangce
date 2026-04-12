import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

function randomShortId(length = 8) {
  const bytes = crypto.randomBytes(length);
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return value;
}

export async function generateUniqueAlbumShortId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const shortId = randomShortId(8);
    const exists = await prisma.album.findUnique({ where: { shortId }, select: { id: true } });
    if (!exists) {
      return shortId;
    }
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
