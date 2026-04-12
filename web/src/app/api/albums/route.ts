import bcrypt from "bcryptjs";
import { AlbumVisibility } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueAlbumShortId } from "@/lib/short-id";

const createAlbumSchema = z
  .object({
    title: z.string().trim().min(1, "Album name is required.").max(60, "Album name is too long."),
    description: z.string().trim().max(300).optional(),
    category: z.string().trim().max(60).optional(),
    visibility: z.nativeEnum(AlbumVisibility),
    password: z.string().min(6).max(128).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.visibility === AlbumVisibility.PROTECTED && !value.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for protected albums.",
        path: ["password"],
      });
    }
  });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = createAlbumSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : null;
    const shortId = await generateUniqueAlbumShortId();

    const album = await prisma.album.create({
      data: {
        shortId,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        visibility: parsed.data.visibility,
        passwordHash,
        userId,
      },
      select: {
        id: true,
        shortId: true,
        title: true,
        description: true,
        category: true,
        visibility: true,
      },
    });

    return NextResponse.json({ album });
  } catch (error) {
    console.error("create album error", error);
    return NextResponse.json({ error: "Failed to create album." }, { status: 500 });
  }
}
