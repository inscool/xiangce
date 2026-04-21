import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createImageCommentSchema } from "@/lib/validators/image-comment";

const COMMENT_EMAIL_COOKIE = "xc_comment_email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "imageId is required." }, { status: 400 });
  }

  try {
    const comments = await prisma.imageComment.findMany({
      where: { imageId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        content: true,
        createdAt: true,
      },
    });

    const cookieStore = await cookies();
    const rememberedEmail = cookieStore.get(COMMENT_EMAIL_COOKIE)?.value ?? "";

    return NextResponse.json({
      rememberedEmail,
      comments: comments.map((item) => ({
        id: item.id,
        email: item.email,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("list image comments error", error);
    return NextResponse.json({ error: "Failed to load comments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = createImageCommentSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const image = await prisma.image.findUnique({
      where: { id: parsed.data.imageId },
      select: { id: true },
    });
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const comment = await prisma.imageComment.create({
      data: {
        imageId: parsed.data.imageId,
        email: parsed.data.email.trim().toLowerCase(),
        content: parsed.data.content.trim(),
      },
      select: {
        id: true,
        email: true,
        content: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({
      comment: {
        id: comment.id,
        email: comment.email,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      },
    });

    response.cookies.set(COMMENT_EMAIL_COOKIE, comment.email, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("create image comment error", error);
    return NextResponse.json({ error: "Failed to submit comment." }, { status: 500 });
  }
}
