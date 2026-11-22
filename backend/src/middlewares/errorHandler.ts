import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { logger } from "../config/logger";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate value" });
  }
  logger.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || "Internal server error" });
}