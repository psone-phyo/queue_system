import { z } from "zod";

/**
 * loginSchema
 * Validates the POST /auth/login request body.
 * Both fields are required; email is normalised to lowercase.
 */
export const loginSchema = z.object({
  // Zod v4: custom messages go in .min()/.email() — required_error no longer exists
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginBody = z.infer<typeof loginSchema>;

/**
 * refreshSchema
 * POST /auth/refresh has no body — the refresh token comes from the httpOnly cookie.
 * This schema is a placeholder so the validate middleware pattern stays consistent
 * and so we have a place to add body fields later if the design changes.
 */
export const refreshSchema = z.object({});

export type RefreshBody = z.infer<typeof refreshSchema>;
