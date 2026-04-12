import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { userExistsByUsernameOrEmail } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import {
  clearVerificationTokens,
  generateVerificationToken,
  getVerificationExpiry,
} from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const { username, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const exists = await userExistsByUsernameOrEmail(username, normalizedEmail);
    if (exists) {
      return NextResponse.json({ error: "Username or email already registered." }, { status: 409 });
    }

    await clearVerificationTokens(username, normalizedEmail);

    const passwordHash = await bcrypt.hash(password, 12);
    const token = generateVerificationToken();
    const expiresAt = getVerificationExpiry();

    await prisma.emailVerificationToken.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const verificationLink = `${baseUrl}/api/verify-email?token=${token}`;

    await sendVerificationEmail({
      email: normalizedEmail,
      username,
      verificationLink,
    });

    return NextResponse.json({ message: "Registration successful. Check your email to verify your account." });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
