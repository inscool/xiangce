import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required.").max(60),
  storageLimitMb: z.number().int().positive().max(1024 * 1024),
  badgeLabel: z.string().trim().max(20).optional().or(z.literal("")),
  badgeColor: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color").optional().or(z.literal("")),
  badgeIconUrl: z.string().trim().url("Invalid icon url").optional().or(z.literal("")),
});

const MB = 1024n * 1024n;

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  try {
    const payload = await request.json();
    const parsed = createGroupSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const group = await prisma.userGroup.create({
      data: {
        name: parsed.data.name,
        storageLimit: BigInt(parsed.data.storageLimitMb) * MB,
        badgeLabel: parsed.data.badgeLabel?.trim() || null,
        badgeColor: parsed.data.badgeColor?.trim() || null,
        badgeIconUrl: parsed.data.badgeIconUrl?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        storageLimit: true,
        badgeLabel: true,
        badgeColor: true,
        badgeIconUrl: true,
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        storageLimit: group.storageLimit.toString(),
        badgeLabel: group.badgeLabel,
        badgeColor: group.badgeColor,
        badgeIconUrl: group.badgeIconUrl,
      },
    });
  } catch (error) {
    console.error("create group error", error);
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }
}
