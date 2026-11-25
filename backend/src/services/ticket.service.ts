import crypto from "crypto";
import { TicketModel } from "../models/ticket.model";
import { redis } from "../config/redis";
import { AppError } from "../utils/appError";

const AVG_SERVICE_MINUTES = 5; // placeholder average per patient

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  // "2026-11-25" in local time — consistent key for the daily counter
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(num: number): string {
  return "A" + String(num).padStart(3, "0"); // A001 … A999
}

/** Atomic Redis counter — INCR is single-threaded so no race condition (Q12) */
async function nextNumber(date: string): Promise<number> {
  const key = `queue:counter:${date}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 2 * 24 * 60 * 60); // auto-expire after 2 days
  return n;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * joinQueue — creates a new ticket for a patient (QR or walk-in).
 * Returns the saved ticket plus the raw token (used to set the restore cookie).
 */
export async function joinQueue(name: string, source: "qr" | "walk-in") {
  const queueDate = getTodayDate();
  const number = await nextNumber(queueDate);
  const displayNumber = formatDisplay(number);
  const token = crypto.randomUUID();

  const ticket = await TicketModel.create({
    queueDate,
    number,
    displayNumber,
    name,
    source,
    token,
    status: "waiting",
    joinedAt: new Date(),
  });

  return { ticket, token };
}

/**
 * getMyTicket — returns a patient's ticket + position info.
 * Used by GET /api/tickets/my and the join restore flow.
 */
export async function getMyTicket(token: string) {
  const ticket = await TicketModel.findOne({ token })
    .populate("roomId", "name")
    .lean();

  if (!ticket) throw new AppError(404, "Ticket not found");

  // Count tickets still waiting with a lower number = people ahead (Q13)
  const ahead = await TicketModel.countDocuments({
    queueDate: ticket.queueDate,
    status: "waiting",
    number: { $lt: ticket.number },
  });

  const estimatedWaitMinutes = ahead * AVG_SERVICE_MINUTES; // Q14

  return { ticket, ahead, estimatedWaitMinutes };
}
