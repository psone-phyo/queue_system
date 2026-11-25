import { z } from "zod";
import { TICKET_STATUSES } from "../constants/ticketStatus";

export const queueQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
});

export const assignRoomSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
});

export const ticketParamsSchema = z.object({
  id: z.string().min(1),
});

export type AssignRoomBody = z.infer<typeof assignRoomSchema>;
export type TicketParams = z.infer<typeof ticketParamsSchema>;
