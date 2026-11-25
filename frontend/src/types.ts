export type TicketStatus = "waiting" | "serving" | "completed" | "missed" | "removed";

export interface Room {
  _id: string;
  name: string;
  isActive: boolean;
  currentTicketId?: string | null;
}

export interface Ticket {
  _id: string;
  number: number;
  displayNumber: string;
  name: string;
  source: "qr" | "walk-in";
  status: TicketStatus;
  token?: string;
  queueDate: string;
  joinedAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
  roomId?: string | Room | null;
}

export interface PatientTicket {
  ticket: Ticket;
  ahead: number;
  estimatedWaitMinutes: number;
}

export interface DisplayData {
  serving: Ticket[];
  upcoming: Ticket[];
  missed: Ticket[];
}

export interface Staff {
  id: string;
  name: string;
  role: "admin" | "receptionist";
}

export interface Stats {
  date: string;
  total: number;
  waiting: number;
  serving: number;
  completed: number;
  missed: number;
  removed: number;
  avgWaitMinutes: number;
}
