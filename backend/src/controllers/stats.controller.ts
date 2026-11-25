import { Request, Response, NextFunction } from "express";
import * as statsService from "../services/stats.service";
import { env } from "../config/env";

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await statsService.getTodayStats();
    res.json(stats);
  } catch (err) { next(err); }
}

/** Returns the patient join URL — the frontend renders a QR code from this (Q30) */
export function getQR(_req: Request, res: Response) {
  res.json({ url: `${env.CLIENT_URL}/join` });
}
