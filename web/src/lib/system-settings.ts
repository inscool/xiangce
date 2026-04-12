import { prisma } from "@/lib/prisma";

type SettingKey = "smtp" | "storage";

export async function getSystemSetting<T>(key: SettingKey) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
    select: { value: true },
  });

  return (setting?.value as T | undefined) ?? null;
}

export async function saveSystemSetting<T>(key: SettingKey, value: T) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}
