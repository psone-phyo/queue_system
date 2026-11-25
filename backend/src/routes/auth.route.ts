import { Router } from "express";
import { validate } from "../middlewares/validate";
import { loginSchema, refreshSchema } from "../validators/auth.validator";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// POST /api/auth/login — validate body, then login
router.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/refresh — no body to validate (token is in cookie)
router.post("/refresh", validate(refreshSchema), authController.refresh);

// POST /api/auth/logout — must be authenticated (we need req.staff to know who's logging out)
// Note: requireAuth is optional here but it prevents random unauthenticated calls to logout
router.post("/logout", requireAuth, authController.logout);

export default router;
