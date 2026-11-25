import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { createStaffSchema } from "../validators/staff.validator";
import * as staffController from "../controllers/staff.controller";

const router = Router();

// All staff-management routes require admin role
router.use(requireAuth, requireRole("admin"));

router.get("/",  staffController.list);                              // list all staff
router.post("/", validate(createStaffSchema), staffController.create); // Q31

export default router;
