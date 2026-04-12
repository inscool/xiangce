import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, reason: "unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    return { ok: false as const, reason: "forbidden" };
  }

  return { ok: true as const, session };
}
