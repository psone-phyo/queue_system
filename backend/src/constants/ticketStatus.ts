// "removed" added for skip/remove action (backlog 4.3.5)
export const TICKET_STATUSES = ["waiting", "serving", "completed", "missed", "removed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
