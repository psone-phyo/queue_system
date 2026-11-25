import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service";
import { JoinQueueBody } from "../validators/ticket.validator";
import { PATIENT_COOKIE } from "../middlewares/patientSession";

/**
 * POST /api/tickets
 * Public (QR patient) or authenticated staff (walk-in).
 * patientSession runs before this — if the patient already has an active ticket
 * it's in res.locals.ticket so we return it without creating a new one.
 */
export async function join(req: Request, res: Response, next: NextFunction) {
  try {
    // Restore existing active ticket (cookie path — Q17)
    if (!req.staff && res.locals.ticket) {
      const result = await ticketService.getMyTicket(res.locals.ticket.token);
      return res.json(result);
    }

    const { name } = res.locals.body as JoinQueueBody;
    // If req.staff exists, the request came from an authenticated receptionist → walk-in
    const source: "qr" | "walk-in" = req.staff ? "walk-in" : "qr";
    const { ticket, token } = await ticketService.joinQueue(name, source);

    // Set the restore cookie only for QR patients (staff-added walk-ins don't need it)
    if (!req.staff) {
      res.cookie(PATIENT_COOKIE, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      });
    }

    // Walk-in: return the token so staff can share it with the patient if needed
    res.status(201).json({ ticket, ...(req.staff ? { token } : {}) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tickets/my
 * Patient reads their own ticket using the restore cookie (Q17).
 */
export async function myTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[PATIENT_COOKIE];
    if (!token) return res.status(404).json({ message: "No active ticket" });
    const result = await ticketService.getMyTicket(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
