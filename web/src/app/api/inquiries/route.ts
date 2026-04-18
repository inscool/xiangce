import { NextResponse } from "next/server";

import { sendInquiryNotificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { createInquirySchema } from "@/lib/validators/inquiry";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = createInquirySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const username = parsed.data.username.trim();
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user.id,
        name: parsed.data.name?.trim() || null,
        email: parsed.data.email.trim().toLowerCase(),
        whatsapp: parsed.data.whatsapp?.trim() || null,
        message: parsed.data.message.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        message: true,
        createdAt: true,
      },
    });

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });

    const adminEmails = Array.from(
      new Set(
        adminUsers
          .map((item) => item.email?.trim().toLowerCase())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    try {
      await sendInquiryNotificationEmail({
        ownerUsername: user.username,
        inquiry,
        adminEmails,
      });
    } catch (mailError) {
      console.error("inquiry notify error", mailError);
    }

    return NextResponse.json({ message: "Inquiry sent successfully." });
  } catch (error) {
    console.error("create inquiry error", error);
    return NextResponse.json({ error: "Failed to send inquiry." }, { status: 500 });
  }
}
