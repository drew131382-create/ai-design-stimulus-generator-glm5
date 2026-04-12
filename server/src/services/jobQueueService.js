import { isRedisQueueEnabled } from "../queue/redisConnection.js";
import * as localJobQueueService from "./localJobQueueService.js";
import * as redisJobQueueService from "./redisJobQueueService.js";

function getJobQueueService() {
  return isRedisQueueEnabled()
    ? redisJobQueueService
    : localJobQueueService;
}

export function createGenerationJob(task) {
  return getJobQueueService().createGenerationJob(task);
}

export function getGenerationJob(jobId) {
  return getJobQueueService().getGenerationJob(jobId);
}

export function getGenerationQueueStats() {
  return getJobQueueService().getGenerationQueueStats();
}
