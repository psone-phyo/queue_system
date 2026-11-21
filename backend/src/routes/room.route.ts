import { Router } from "express";
import { listRoomQuerySchema } from "../validators/room.validator";
import * as roomController from "../controllers/room.controller";
import { validate } from "../middlewares/validate";
const router = Router();

router.get("/", validate(listRoomQuerySchema, "query"), roomController.list);

export default router;