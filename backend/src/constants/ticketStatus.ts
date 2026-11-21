export const TICKET_STATUSES = ["waiting", "serving", "completed", "missed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];