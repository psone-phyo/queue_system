import { Router } from "express";
import { createRoomBodySchema, deleteRoomParamsSchema, listRoomQuerySchema, updateRoomBodySchema, updateRoomParamsSchema, } from "../validators/room.validator";
import * as roomController from "../controllers/room.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
const router = Router();

router.use(requireAuth);

// Staff (admin + receptionist) can list rooms; only admins manage them
router.get("/", requireRole("admin", "receptionist"), validate(listRoomQuerySchema, "query"), roomController.list);
router.post("/", requireRole("admin"), validate(createRoomBodySchema, "body"), roomController.create);
router.put("/:id", requireRole("admin"), validate(updateRoomBodySchema, "body"), validate(updateRoomParamsSchema, "params"), roomController.update);
router.delete("/:id", requireRole("admin"), validate(deleteRoomParamsSchema, "params"), roomController.remove);

export default router;