import { z } from "zod";

// Used by both QR patients and walk-in (same body, source is inferred from auth context)
export const joinQueueSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").trim(),
});

export type JoinQueueBody = z.infer<typeof joinQueueSchema>;
