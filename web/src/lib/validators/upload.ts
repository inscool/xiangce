import { z } from "zod";

const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export const presignUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required.").max(255),
  fileSize: z.number().int().positive(),
  contentType: z
    .string()
    .refine((type) => allowedImageMimeTypes.includes(type), "Only image files are allowed."),
  albumId: z.string().cuid(),
});

export const completeUploadSchema = z.object({
  key: z.string().min(1),
  fileSize: z.number().int().positive(),
  albumId: z.string().cuid(),
});
