import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import { Role } from "../constants/roles";

// Shape of the payload we sign into every access token
interface AccessTokenPayload {
  sub: string; // staff MongoDB _id
  role: Role;
  name: string;
}

/**
 * requireAuth
 * Reads the Authorization: Bearer <token> header, verifies it with the
 * access-token secret, and attaches the decoded payload to req.staff.
 * Routes protected by this middleware MUST have a valid, unexpired token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Header must look like "Bearer <token>"
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "No access token provided"));
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    // Attach to req so downstream controllers can read req.staff without DB hits
    req.staff = {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
    };

    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError
    return next(new AppError(401, "Invalid or expired access token"));
  }
}
