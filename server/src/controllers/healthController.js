import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../utils/env.js";
import { getGenerationQueueStats } from "../services/jobQueueService.js";

export const healthController = asyncHandler(async (_req, res) => {
  const queueStats = await getGenerationQueueStats();

  res.status(200).json({
    status: "ok",
    provider: "zhipu",
    model: env.ZHIPU_CHAT_MODEL,
    queue: queueStats,
    timestamp: new Date().toISOString()
  });
});
