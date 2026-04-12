import crypto from "crypto";

const ACCESS_COOKIE_TTL_SECONDS = 60 * 60 * 24;

function accessSecret() {
  return process.env.NEXTAUTH_SECRET ?? "change-me-in-production";
}

export function getAlbumAccessCookieName(albumId: string) {
  return `album_access_${albumId}`;
}

export function createAlbumAccessToken(albumId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_COOKIE_TTL_SECONDS;
  const payload = `${albumId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", accessSecret()).update(payload).digest("hex");

  return {
    token: `${expiresAt}.${signature}`,
    maxAge: ACCESS_COOKIE_TTL_SECONDS,
  };
}

export function verifyAlbumAccessToken(albumId: string, token?: string) {
  if (!token) {
    return false;
  }

  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${albumId}.${expiresAt}`;
  const expected = crypto.createHmac("sha256", accessSecret()).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
