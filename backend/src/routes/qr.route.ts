import { Router } from "express";
import { getQR } from "../controllers/stats.controller";

const router = Router();
router.get("/", getQR);

export default router;
