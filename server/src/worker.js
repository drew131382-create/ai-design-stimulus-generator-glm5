import { Worker } from "bullmq";
import { env } from "./utils/env.js";
import { executeGenerationTask } from "./services/generationPipelineService.js";
import { serializeQueueError } from "./utils/jobError.js";
import {
  closeQueueConnection,
  getQueueConnection,
  isRedisQueueEnabled
} from "./queue/redisConnection.js";

if (!isRedisQueueEnabled()) {
  throw new Error("REDIS_URL is required to start the queue worker");
}

const worker = new Worker(
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

worker.on("ready", () => {
  console.log(
    `[worker] ready queue=${env.JOB_QUEUE_NAME} concurrency=${env.JOB_WORKER_CONCURRENCY}`
  );
});

worker.on("completed", (job) => {
  console.log(`[worker] completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error("[worker] failed", {
    jobId: job?.id || null,
    message: error?.message || "Unknown worker error"
  });
});

async function shutdown() {
  console.log("[worker] shutting down");
  await worker.close();
  await closeQueueConnection();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
