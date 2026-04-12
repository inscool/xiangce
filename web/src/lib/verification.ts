import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRES_HOURS = 24;

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getVerificationExpiry() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRES_HOURS);
  return expiresAt;
}

export async function clearVerificationTokens(username: string, email: string) {
  await prisma.emailVerificationToken.deleteMany({
    where: {
      OR: [{ email: email.toLowerCase() }, { username }],
    },
  });
}
