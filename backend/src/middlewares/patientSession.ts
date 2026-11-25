import { Request, Response, NextFunction } from "express";
import { TicketModel } from "../models/ticket.model";

// Cookie name used for the patient restore key
export const PATIENT_COOKIE = "queue_ticket";

/**
 * patientSession
 * Reads the httpOnly cookie set when a patient first gets a ticket.
 * If a matching active ticket is found it is attached to res.locals.ticket
 * so the ticket controller can skip re-creation.
 *
 * This middleware is NON-blocking: a missing or invalid cookie just means
 * the patient hasn't joined yet — the request continues normally.
 */
export async function patientSession(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[PATIENT_COOKIE];

  if (!token) return next(); // brand-new visitor — no cookie yet

  try {
    // Look for a ticket that is still in an active state.
    // "completed", "missed" and "removed" are terminal states;
    // a patient with one of those may start fresh.
    const ticket = await TicketModel.findOne({
      token,
      status: { $in: ["waiting", "serving"] },
    }).lean();

    if (ticket) {
      res.locals.ticket = ticket; // downstream can read this without another DB query
    }
  } catch {
    // DB error shouldn't block a patient from reaching the page; just log silently
  }

  next();
}
