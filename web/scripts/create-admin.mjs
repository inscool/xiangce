import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "admin@local.dev";
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();
  const username = process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  const usingDefaults =
    !process.env.ADMIN_EMAIL || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;
  if (usingDefaults) {
    console.warn("[admin:create] ADMIN_* env vars not fully set, using built-in default admin credentials.");
    console.warn(`[admin:create] Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.warn(`[admin:create] Username: ${DEFAULT_ADMIN_USERNAME}`);
    console.warn(`[admin:create] Password: ${DEFAULT_ADMIN_PASSWORD}`);
    console.warn("[admin:create] Please log in and change the password immediately.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const forceReset = process.env.ADMIN_FORCE_RESET === "true";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: UserRole.ADMIN,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        ...(forceReset
          ? {
              username,
              password: passwordHash,
              mustChangePassword: true,
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (forceReset) {
      console.log("Updated existing admin with forced password reset:", updated);
      console.log("[admin:create] ADMIN_FORCE_RESET=true, password has been reset.");
    } else {
      console.log("Admin already exists. Kept existing password:", updated);
      console.log("[admin:create] To reset password intentionally, run with ADMIN_FORCE_RESET=true.");
    }
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      username,
      password: passwordHash,
      role: UserRole.ADMIN,
      mustChangePassword: true,
      storageLimit: 536870912n,
      usedStorage: 0n,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  console.log("Created admin:", created);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
