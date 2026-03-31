import { Router } from "express";
import { generateStimuliController } from "../controllers/generateController.js";
import { healthController } from "../controllers/healthController.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/health", healthController);
router.post("/api/generate", apiRateLimiter, generateStimuliController);

export default router;
