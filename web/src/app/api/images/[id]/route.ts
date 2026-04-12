import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObjectByKey } from "@/lib/storage/s3";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const image = await prisma.image.findUnique({
    where: { id },
    select: {
      id: true,
      storageKey: true,
      fileSize: true,
      userId: true,
    },
  });

  if (!image || image.userId !== userId) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    await deleteObjectByKey(image.storageKey);

    await prisma.$transaction([
      prisma.image.delete({ where: { id: image.id } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          usedStorage: {
            decrement: image.fileSize,
          },
        },
      }),
    ]);

    return NextResponse.json({ message: "Image deleted." });
  } catch (error) {
    console.error("delete image error", error);
    return NextResponse.json({ error: "Failed to delete image." }, { status: 500 });
  }
}
