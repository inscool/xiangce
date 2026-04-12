import { NextResponse } from "next/server";

import { createVerifiedUser, isUniqueConstraintError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
  }

  try {
    const verification = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verification) {
      return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
      return NextResponse.redirect(new URL("/login?verified=expired", request.url));
    }

    await createVerifiedUser({
      username: verification.username,
      email: verification.email,
      passwordHash: verification.passwordHash,
    });

    await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
    return NextResponse.redirect(new URL("/login?verified=success", request.url));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      await prisma.emailVerificationToken.deleteMany({ where: { token } });
      return NextResponse.redirect(new URL("/login?verified=duplicate", request.url));
    }

    console.error("verify email error", error);
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }
}
