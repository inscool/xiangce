import { z } from "zod";

export const createInquirySchema = z.object({
  username: z.string().trim().min(1),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email address."),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required.").max(2000),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["NEW", "PROCESSED"]),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
