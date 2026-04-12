import { asyncHandler } from "../utils/asyncHandler.js";
import { parseGenerateTaskPayload } from "../utils/taskPayload.js";
import {
  createGenerationJob,
  getGenerationJob
} from "../services/jobQueueService.js";

export const createGenerateJobController = asyncHandler(async (req, res) => {
  const task = parseGenerateTaskPayload(req.body);
  const job = await createGenerationJob(task);

  res.status(202).json(job);
});

export const getGenerateJobController = asyncHandler(async (req, res) => {
  const job = await getGenerationJob(req.params.jobId);
  res.status(200).json(job);
});
