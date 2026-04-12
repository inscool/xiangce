import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/authz";
import { getSystemSetting, saveSystemSetting } from "@/lib/system-settings";

const settingsSchema = z.object({
  smtp: z.object({
    host: z.string().optional(),
    port: z.string().optional(),
    secure: z.boolean().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().optional(),
  }),
  storage: z.object({
    driver: z.enum(["local", "s3"]),
    localUploadDir: z.string().optional(),
    s3Region: z.string().optional(),
    s3Bucket: z.string().optional(),
    s3Endpoint: z.string().optional(),
    s3AccessKeyId: z.string().optional(),
    s3SecretAccessKey: z.string().optional(),
    s3ForcePathStyle: z.boolean().optional(),
    cdnBaseUrl: z.string().optional(),
  }),
});

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  const [smtp, storage] = await Promise.all([getSystemSetting("smtp"), getSystemSetting("storage")]);
  return NextResponse.json({ smtp, storage });
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  try {
    const payload = await request.json();
    const parsed = settingsSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    await Promise.all([
      saveSystemSetting("smtp", parsed.data.smtp),
      saveSystemSetting("storage", parsed.data.storage),
    ]);

    return NextResponse.json({ message: "Settings saved." });
  } catch (error) {
    console.error("save settings error", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
