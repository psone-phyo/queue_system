import * as roomService from "../services/room.service";
import { Request, Response, NextFunction } from "express";
import {ListRoomQuery, CreateRoomBody, UpdateRoomParams, UpdateRoomBody, DeleteRoomParams} from "../validators/room.validator";

export async function list(req: Request, res: Response) {
    const filteredQuery = res.locals.query as ListRoomQuery;
    const rooms = await roomService.listRooms(filteredQuery);
    res.json(rooms);
}

export async function create(req: Request, res: Response) {
    const body = res.locals.body as CreateRoomBody;
    const room = await roomService.createRoom(body);
    res.status(201).json(room);
}

export async function update(req: Request, res: Response) {
    const {id} = res.locals.params as UpdateRoomParams;
    const body = res.locals.body as UpdateRoomBody;
    const room = await roomService.updateRoom(id, body);
    res.json(room);
}

export async function remove(req: Request, res: Response) {
    const {id} = res.locals.params as DeleteRoomParams;
    await roomService.deleteRoom(id);
    res.status(204).send();
}