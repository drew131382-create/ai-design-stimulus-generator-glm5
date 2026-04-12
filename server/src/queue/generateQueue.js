import { Queue } from "bullmq";
import { env } from "../utils/env.js";
import { getQueueConnection } from "./redisConnection.js";

let generateQueue = null;

export function getGenerateQueue() {
  if (!generateQueue) {
    generateQueue = new Queue(env.JOB_QUEUE_NAME, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        removeOnComplete: {
          age: Math.ceil(env.JOB_RESULT_TTL_MS / 1000),
          count: 500
        },
        removeOnFail: {
          age: Math.ceil(env.JOB_RESULT_TTL_MS / 1000),
          count: 500
        }
      }
    });
  }

  return generateQueue;
}

export async function closeGenerateQueue() {
  if (!generateQueue) {
    return;
  }

  const currentQueue = generateQueue;
  generateQueue = null;
  await currentQueue.close();
}
