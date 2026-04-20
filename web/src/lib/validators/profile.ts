import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("请输入有效链接")
  .max(300)
  .optional()
  .or(z.literal(""));

export const updateProfileSchema = z.object({
  bio: z.string().trim().max(240).optional().or(z.literal("")),
  avatarUrl: optionalUrl,
  website: optionalUrl,
  whatsapp: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("请输入有效邮箱").optional().or(z.literal("")),
});
