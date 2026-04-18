import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { updateInquiryStatusSchema } from "@/lib/validators/inquiry";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  const { id } = await context.params;

  try {
    const payload = await request.json();
    const parsed = updateInquiryStatusSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: parsed.data.status,
        processedAt: parsed.data.status === "PROCESSED" ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
        processedAt: true,
      },
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("update inquiry status error", error);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  const { id } = await context.params;

  try {
    await prisma.inquiry.delete({ where: { id } });
    return NextResponse.json({ message: "Inquiry deleted." });
  } catch (error) {
    console.error("delete inquiry error", error);
    return NextResponse.json({ error: "Failed to delete inquiry." }, { status: 500 });
  }
}
