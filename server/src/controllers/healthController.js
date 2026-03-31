import { asyncHandler } from "../utils/asyncHandler.js";

export const healthController = asyncHandler(async (_req, res) => {
  res.status(200).json({
    status: "ok",
    provider: "zhipu",
    model: "glm-5",
    timestamp: new Date().toISOString()
  });
});
