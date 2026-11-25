import { Request, Response, NextFunction } from "express";
import { Role } from "../constants/roles";
import { AppError } from "../utils/appError";

/**
 * requireRole
 * Factory that returns a middleware checking req.staff.role against an
 * allowed list. Must be used AFTER requireAuth (which sets req.staff).
 *
 * Usage:  router.get("/stats", requireAuth, requireRole("admin"), controller)
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.staff) {
      // Guard: requireAuth should have already rejected the request
      return next(new AppError(401, "Not authenticated"));
    }

    if (!allowed.includes(req.staff.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }

    next();
  };
}
