import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import * as statsController from "../controllers/stats.controller";

const router = Router();

// GET /api/stats — today's queue statistics, admin only (Q32)
router.get("/", requireAuth, requireRole("admin"), statsController.getStats);

export default router;
