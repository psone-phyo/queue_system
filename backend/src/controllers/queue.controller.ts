import { Request, Response, NextFunction } from "express";
import * as queueService from "../services/queue.service";
import { AssignRoomBody } from "../validators/queue.validator";

export async function getQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const tickets = await queueService.getQueue(req.query.status as string | undefined);
    res.json(tickets);
  } catch (err) { next(err); }
}

export async function callNext(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await queueService.callNext(req.staff!.id);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function getDisplay(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await queueService.getDisplay();
    res.json(data);
  } catch (err) { next(err); }
}

export async function assignRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomId } = res.locals.body as AssignRoomBody;
    const ticket = await queueService.assignRoom(String(req.params.id), roomId, req.staff!.id);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function markMissed(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await queueService.markMissed(String(req.params.id), req.staff!.id);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function markCompleted(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await queueService.markCompleted(String(req.params.id), req.staff!.id);
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function removeTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await queueService.removeTicket(String(req.params.id), req.staff!.id);
    res.json(ticket);
  } catch (err) { next(err); }
}
