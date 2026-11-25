import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../constants/roles";

/** Accept a valid staff token when present while keeping patient requests public. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!header.startsWith("Bearer ")) return next();

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as {
      sub: string;
      role: Role;
      name: string;
    };
    req.staff = { id: payload.sub, role: payload.role, name: payload.name };
  } catch {
    // An invalid optional token must not prevent public patient access.
  }
  next();
}
