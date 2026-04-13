import { Worker } from "bullmq";
import { env } from "../utils/env.js";
import { executeGenerationTask } from "./generationPipelineService.js";
import { serializeQueueError } from "../utils/jobError.js";
import { getQueueConnection, isRedisQueueEnabled } from "../queue/redisConnection.js";

let embeddedWorker = null;

export function startEmbeddedWorker() {
  if (!env.START_EMBEDDED_WORKER || !isRedisQueueEnabled()) {
    return null;
  }

  if (embeddedWorker) {
    return embeddedWorker;
  }

  embeddedWorker = new Worker(
    env.JOB_QUEUE_NAME,
    async (job) => {
      try {
        return await executeGenerationTask(job.data?.task);
      } catch (error) {
        throw new Error(JSON.stringify(serializeQueueError(error)));
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: env.JOB_WORKER_CONCURRENCY
    }
  );

  embeddedWorker.on("ready", () => {
    console.log(
      `[embeddedWorker] ready queue=${env.JOB_QUEUE_NAME} concurrency=${env.JOB_WORKER_CONCURRENCY}`
    );
  });

  embeddedWorker.on("failed", (job, error) => {
    console.error("[embeddedWorker] failed", {
      jobId: job?.id || null,
      message: error?.message || "Unknown embedded worker error"
    });
  });

  return embeddedWorker;
}
