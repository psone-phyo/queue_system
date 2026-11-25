import { TicketModel } from "../models/ticket.model";

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's queue statistics for the admin dashboard (Q32) */
export async function getTodayStats() {
  const date = getTodayDate();

  const [total, waiting, serving, completed, missed, removed] = await Promise.all([
    TicketModel.countDocuments({ queueDate: date }),
    TicketModel.countDocuments({ queueDate: date, status: "waiting" }),
    TicketModel.countDocuments({ queueDate: date, status: "serving" }),
    TicketModel.countDocuments({ queueDate: date, status: "completed" }),
    TicketModel.countDocuments({ queueDate: date, status: "missed" }),
    TicketModel.countDocuments({ queueDate: date, status: "removed" }),
  ]);

  // Average wait time = time from joinedAt to calledAt for completed tickets
  const done = await TicketModel.find({
    queueDate: date,
    status: "completed",
    calledAt: { $ne: null },
    joinedAt:  { $ne: null },
  }).lean();

  let avgWaitMinutes = 0;
  if (done.length > 0) {
    const total = done.reduce((sum, t) => {
      const wait = (t.calledAt!.getTime() - (t.joinedAt as Date).getTime()) / 60_000;
      return sum + wait;
    }, 0);
    avgWaitMinutes = Math.round(total / done.length);
  }

  return { date, total, waiting, serving, completed, missed, removed, avgWaitMinutes };
}
