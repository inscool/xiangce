import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const updateAdminUserSchema = z.union([
  z.object({
    role: z.nativeEnum(UserRole),
    storageLimitMb: z.number().int().positive().max(1024 * 1024),
    usedStorageMb: z.number().int().nonnegative().max(1024 * 1024).optional(),
  }),
  z.object({
    resetPasswordToDefault: z.literal(true),
  }),
]);

const MB = 1024n * 1024n;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  const { id } = await context.params;

  try {
    const payload = await request.json();
    const parsed = updateAdminUserSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    if ("resetPasswordToDefault" in parsed.data) {
      const target = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!target) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      if (target.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Only admin account can use this reset." }, { status: 400 });
      }

      const hash = await bcrypt.hash("Admin@123456", 12);
      await prisma.user.update({
        where: { id },
        data: { password: hash },
      });

      return NextResponse.json({ message: "Password reset to default." });
    }

    const { role, storageLimitMb, usedStorageMb } = parsed.data;
    const storageLimit = BigInt(storageLimitMb) * MB;
    const usedStorage = usedStorageMb === undefined ? undefined : BigInt(usedStorageMb) * MB;

    if (usedStorage !== undefined && usedStorage > storageLimit) {
      return NextResponse.json({ error: "Used storage cannot exceed storage limit." }, { status: 400 });
    }

    const current = await prisma.user.findUnique({
      where: { id },
      select: { usedStorage: true },
    });

    if (!current) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (usedStorage === undefined && current.usedStorage > storageLimit) {
      return NextResponse.json(
        { error: "Current used storage is larger than target limit. Set usedStorageMb too." },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        storageLimit,
        ...(role === UserRole.ADMIN ? { mustChangePassword: false } : {}),
        ...(usedStorage !== undefined ? { usedStorage } : {}),
      },
      select: {
        id: true,
        role: true,
        storageLimit: true,
        usedStorage: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        storageLimit: user.storageLimit.toString(),
        usedStorage: user.usedStorage.toString(),
      },
    });
  } catch (error) {
    console.error("admin update user error", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
