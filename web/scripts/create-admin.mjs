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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        username,
        password: passwordHash,
        role: UserRole.ADMIN,
        mustChangePassword: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    console.log("Updated existing admin:", updated);
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
