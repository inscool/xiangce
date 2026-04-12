import bcrypt from "bcryptjs";
import { AlbumVisibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAlbumAccessToken, getAlbumAccessCookieName } from "@/lib/album-access";
import { prisma } from "@/lib/prisma";

const unlockSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const payload = await request.json();
    const parsed = unlockSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const album = await prisma.album.findUnique({
      where: { id },
      select: {
        visibility: true,
        passwordHash: true,
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found." }, { status: 404 });
    }

    if (album.visibility !== AlbumVisibility.PROTECTED || !album.passwordHash) {
      return NextResponse.json({ error: "This album does not require password unlock." }, { status: 400 });
    }

    const valid = await bcrypt.compare(parsed.data.password, album.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect album password." }, { status: 401 });
    }

    const { token, maxAge } = createAlbumAccessToken(id);
    const response = NextResponse.json({ message: "Album unlocked." });
    response.cookies.set({
      name: getAlbumAccessCookieName(id),
      value: token,
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("unlock album error", error);
    return NextResponse.json({ error: "Failed to unlock album." }, { status: 500 });
  }
}
