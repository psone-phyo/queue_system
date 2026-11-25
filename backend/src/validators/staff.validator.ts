import { z } from "zod";

export const createStaffSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100).trim(),
  email:    z.string().trim().email("Invalid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateStaffBody = z.infer<typeof createStaffSchema>;
