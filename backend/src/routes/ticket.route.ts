import { Router } from "express";
import { validate } from "../middlewares/validate";
import { joinQueueSchema } from "../validators/ticket.validator";
import { patientSession } from "../middlewares/patientSession";
import { optionalAuth } from "../middlewares/optionalAuth";
import * as ticketController from "../controllers/ticket.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import * as queueController from "../controllers/queue.controller";
import { assignRoomSchema, ticketParamsSchema } from "../validators/queue.validator";

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

const staffOnly = [requireAuth, requireRole("admin", "receptionist")];
router.patch("/:id/room", ...staffOnly, validate(ticketParamsSchema, "params"), validate(assignRoomSchema), queueController.assignRoom);
router.patch("/:id/missed", ...staffOnly, validate(ticketParamsSchema, "params"), queueController.markMissed);
router.patch("/:id/completed", ...staffOnly, validate(ticketParamsSchema, "params"), queueController.markCompleted);
router.patch("/:id/remove", ...staffOnly, validate(ticketParamsSchema, "params"), queueController.removeTicket);

export default router;
