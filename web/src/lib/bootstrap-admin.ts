import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DEFAULT_ADMIN_EMAIL = "admin@local.dev";
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

const globalBootstrap = globalThis as unknown as {
  adminBootstrapPromise?: Promise<void>;
};

async function bootstrapDefaultAdmin() {
  if (process.env.DISABLE_ADMIN_BOOTSTRAP === "true") {
    return;
  }

  const count = await prisma.user.count();
  if (count > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: DEFAULT_ADMIN_EMAIL,
      username: DEFAULT_ADMIN_USERNAME,
      password: passwordHash,
      role: UserRole.ADMIN,
      mustChangePassword: true,
      storageLimit: 536870912n,
      usedStorage: 0n,
      emailVerifiedAt: new Date(),
    },
  });

  console.warn("[bootstrap] default admin created: username=admin password=admin123");
}

export async function ensureDefaultAdminBootstrap() {
  if (!globalBootstrap.adminBootstrapPromise) {
    globalBootstrap.adminBootstrapPromise = bootstrapDefaultAdmin().catch((error) => {
      console.error("[bootstrap] default admin setup failed", error);
    });
  }

  await globalBootstrap.adminBootstrapPromise;
}
