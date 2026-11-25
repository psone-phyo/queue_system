import { Router } from "express";
import { validate } from "../middlewares/validate";
import { joinQueueSchema } from "../validators/ticket.validator";
import { patientSession } from "../middlewares/patientSession";
import { optionalAuth } from "../middlewares/optionalAuth";
import * as ticketController from "../controllers/ticket.controller";

const router = Router();

// POST /api/tickets — public (QR) or authenticated staff (walk-in)
// patientSession checks for an existing cookie first
router.post(
  "/",
  optionalAuth,
  (req, _res, next) => req.staff ? requireRole("admin", "receptionist")(req, _res, next) : next(),
  patientSession,
  validate(joinQueueSchema),
  ticketController.join
);

// GET /api/tickets/my — patient reads their own ticket via cookie
router.get("/my", ticketController.myTicket);

export default router;
