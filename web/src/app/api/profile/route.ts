import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators/profile";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const bio = parsed.data.bio?.trim() || null;
    const avatarUrl = parsed.data.avatarUrl?.trim() || null;
    const website = parsed.data.website?.trim() || null;
    const whatsapp = parsed.data.whatsapp?.trim() || null;
    const email = parsed.data.email?.trim().toLowerCase() || null;

    const socialLinks = {
      website,
      whatsapp,
      email,
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        avatarUrl,
        socialLinks,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("update profile error", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
