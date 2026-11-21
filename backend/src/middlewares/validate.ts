import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/appError";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodType, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new AppError(400, "Validation failed", details));
    }
    if (source === "body") req.body = result.data;
    else res.locals[source] = result.data;
    next();
  };