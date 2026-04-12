import IORedis from "ioredis";
import { env } from "../utils/env.js";

let queueConnection = null;

export function isRedisQueueEnabled() {
  return Boolean(env.REDIS_URL);
}

export function getQueueConnection() {
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required for Redis queue mode");
  }

  if (!queueConnection) {
    queueConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null
    });
  }

  return queueConnection;
}

export async function closeQueueConnection() {
  if (!queueConnection) {
    return;
  }

  const currentConnection = queueConnection;
  queueConnection = null;
  await currentConnection.quit();
}
