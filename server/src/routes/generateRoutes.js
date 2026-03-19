import { Router } from "express";
import { generateStimuliController } from "../controllers/generateController.js";
import { healthController } from "../controllers/healthController.js";

const router = Router();

router.get("/health", healthController);
router.post("/api/generate", generateStimuliController);

export default router;

