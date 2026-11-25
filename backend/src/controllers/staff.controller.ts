import { Request, Response, NextFunction } from "express";
import * as staffService from "../services/staff.service";
import { CreateStaffBody } from "../validators/staff.validator";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = res.locals.body as CreateStaffBody;
    const staff = await staffService.createReceptionist(body);
    res.status(201).json(staff);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.listStaff();
    res.json(staff);
  } catch (err) { next(err); }
}
