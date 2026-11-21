import * as roomService from "../services/room.service";
import { Request, Response, NextFunction } from "express";

export async function list(req: Request, res: Response) {
    const rooms = await roomService.listRooms(res.locals.query);
    res.json(rooms);
}