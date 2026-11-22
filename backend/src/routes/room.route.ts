import { Router } from "express";
import { createRoomBodySchema, deleteRoomParamsSchema, listRoomQuerySchema, updateRoomBodySchema, updateRoomParamsSchema, } from "../validators/room.validator";
import * as roomController from "../controllers/room.controller";
import { validate } from "../middlewares/validate";
const router = Router();

router.get("/", validate(listRoomQuerySchema, "query"), roomController.list);
router.post("/", validate(createRoomBodySchema, "body"), roomController.create);
router.put("/:id", validate(updateRoomBodySchema, "body"), validate(updateRoomParamsSchema, "params"), roomController.update);
router.delete("/:id", validate(deleteRoomParamsSchema, "params"), roomController.remove);

export default router;