import type { TicketStatus } from "../types";

export function formatMinutes(minutes: number) {
  if (minutes <= 0) return "Less than a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function statusLabel(status: TicketStatus) {
  const labels: Record<TicketStatus, string> = {
    waiting: "Waiting",
    serving: "Now serving",
    completed: "Completed",
    missed: "Missed",
    removed: "Removed",
  };
  return labels[status];
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(date);
}
