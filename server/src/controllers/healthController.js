import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../utils/env.js";

export const healthController = asyncHandler(async (_req, res) => {
  res.status(200).json({
    status: "ok",
    model: env.MODELSCOPE_MODEL,
    timestamp: new Date().toISOString()
  });
});

