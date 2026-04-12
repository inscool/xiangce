import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moveImagesSchema = z.object({
  imageIds: z.array(z.string().cuid()).min(1, "Select at least one image."),
  albumId: z.string().cuid().nullable(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = moveImagesSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const { imageIds, albumId } = parsed.data;

    const ownedImagesCount = await prisma.image.count({
      where: {
        id: { in: imageIds },
        userId,
      },
    });

    if (ownedImagesCount !== imageIds.length) {
      return NextResponse.json({ error: "Some images are not accessible." }, { status: 403 });
    }

    if (albumId) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          userId,
        },
        select: { id: true },
      });

      if (!album) {
        return NextResponse.json({ error: "Target album not found." }, { status: 404 });
      }
    }

    const result = await prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        userId,
      },
      data: {
        albumId,
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("move images error", error);
    return NextResponse.json({ error: "Failed to move images." }, { status: 500 });
  }
}
