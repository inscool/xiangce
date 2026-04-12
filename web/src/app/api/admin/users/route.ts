import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(24),
  email: z.string().trim().email(),
  password: z.string().min(8),
  groupId: z.string().cuid().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  try {
    const payload = await request.json();
    const parsed = createUserSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const { username, email, password, groupId } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: email.toLowerCase() }],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Username or email already exists." }, { status: 409 });
    }

    const group = groupId
      ? await prisma.userGroup.findUnique({
          where: { id: groupId },
          select: { storageLimit: true },
        })
      : null;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        password: passwordHash,
        role: UserRole.USER,
        mustChangePassword: true,
        groupId,
        storageLimit: group?.storageLimit ?? 536870912n,
        usedStorage: 0n,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("admin create user error", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
