import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import * as queueController from "../controllers/queue.controller";
import { validate } from "../middlewares/validate";
import { queueQuerySchema } from "../validators/queue.validator";

const router = Router();

// GET /api/queue/display — public, used by the display screen (backlog 3.x)
router.get("/display", queueController.getDisplay);

// GET /api/queue — today's full ticket list for staff (Q23)
router.get("/", requireAuth, validate(queueQuerySchema, "query"), queueController.getQueue);

// POST /api/queue/next — call next patient (Q24)
router.post("/next", requireAuth, requireRole("admin", "receptionist"), queueController.callNext);

export default router;
