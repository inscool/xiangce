import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const batchAssignSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1, "Select at least one user."),
  groupId: z.string().cuid().nullable(),
});

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  try {
    const payload = await request.json();
    const parsed = batchAssignSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const { userIds, groupId } = parsed.data;

    let groupStorageLimit: bigint | null = null;
    if (groupId) {
      const group = await prisma.userGroup.findUnique({
        where: { id: groupId },
        select: { storageLimit: true },
      });
      if (!group) {
        return NextResponse.json({ error: "Group not found." }, { status: 404 });
      }
      groupStorageLimit = group.storageLimit;
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, usedStorage: true },
    });
    if (users.length !== userIds.length) {
      return NextResponse.json({ error: "Some users were not found." }, { status: 404 });
    }

    if (groupStorageLimit !== null) {
      const invalid = users.find((user) => user.usedStorage > groupStorageLimit);
      if (invalid) {
        return NextResponse.json({ error: "Some selected users exceed the target group storage limit." }, { status: 400 });
      }
    }

    await prisma.$transaction(
      users.map((user) =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            groupId,
            ...(groupStorageLimit !== null ? { storageLimit: groupStorageLimit } : {}),
          },
        }),
      ),
    );

    return NextResponse.json({ updated: users.length });
  } catch (error) {
    console.error("batch assign group error", error);
    return NextResponse.json({ error: "Failed to assign users to group." }, { status: 500 });
  }
}
