import { Router } from "express";
import {
  createGenerateJobController,
  getGenerateJobController
} from "../controllers/generateController.js";
import { healthController } from "../controllers/healthController.js";
import {
  generateStatusRateLimiter,
  generateSubmitRateLimiter
} from "../middleware/rateLimiter.js";

const router = Router();

router.get("/health", healthController);
router.post("/api/generate", generateSubmitRateLimiter, createGenerateJobController);
router.get(
  "/api/generate/:jobId",
  generateStatusRateLimiter,
  getGenerateJobController
);

export default router;
