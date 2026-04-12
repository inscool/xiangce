import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required.").max(60),
  storageLimitMb: z.number().int().positive().max(1024 * 1024),
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
      },
      select: {
        id: true,
        name: true,
        storageLimit: true,
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        storageLimit: group.storageLimit.toString(),
      },
    });
  } catch (error) {
    console.error("create group error", error);
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }
}
