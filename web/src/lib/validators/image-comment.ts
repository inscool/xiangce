import { z } from "zod";

export const createImageCommentSchema = z.object({
  imageId: z.string().cuid(),
  email: z.string().trim().email("Please enter a valid email address."),
  content: z.string().trim().min(1, "Comment is required.").max(500),
});
