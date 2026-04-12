import { HttpError } from "../utils/httpError.js";
import { deserializeQueueError } from "../utils/jobError.js";
import { env } from "../utils/env.js";
import { getGenerateQueue } from "../queue/generateQueue.js";

const REDIS_JOB_NAME = "generate-stimuli";
const QUEUED_STATES = new Set(["waiting", "prioritized", "delayed"]);

function mapQueueState(state) {
  if (state === "active") {
    return "processing";
  }

  if (state === "completed") {
    return "completed";
  }

  if (state === "failed") {
    return "failed";
  }

  return "queued";
}

function toIsoString(timestamp) {
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

async function getQueuePosition(queue, jobId, state) {
  if (!QUEUED_STATES.has(state)) {
    return 0;
  }

  const jobs = await queue.getJobs(
    ["waiting", "prioritized", "delayed"],
    0,
    Math.max(env.JOB_QUEUE_MAX_SIZE, 50)
  );
  const index = jobs.findIndex((job) => String(job.id) === String(jobId));
  return index === -1 ? 0 : index + 1;
}

function getEstimatedWaitSeconds(status, queuePosition, processingCount) {
  if (status === "processing") {
    return env.JOB_ESTIMATED_DURATION_SECONDS;
  }

  if (status !== "queued" || queuePosition <= 0) {
    return 0;
  }

  return Math.ceil(
    ((Math.max(queuePosition - 1, 0) + processingCount) /
      Math.max(env.JOB_WORKER_CONCURRENCY, 1)) *
      env.JOB_ESTIMATED_DURATION_SECONDS
  );
}

async function buildJobSnapshot(job) {
  const queue = getGenerateQueue();
  const rawState = await job.getState();
  const status = mapQueueState(rawState);
  const counts = await queue.getJobCounts("active");
  const queuePosition = await getQueuePosition(queue, job.id, rawState);

  return {
    jobId: String(job.id),
    status,
    queuePosition,
    estimatedWaitSeconds: getEstimatedWaitSeconds(
      status,
      queuePosition,
      counts.active || 0
    ),
    createdAt: toIsoString(job.timestamp),
    startedAt: toIsoString(job.processedOn),
    completedAt: toIsoString(job.finishedOn),
    error: status === "failed" ? deserializeQueueError(job.failedReason) : null,
    result: status === "completed" ? job.returnvalue || null : null
  };
}

export async function createGenerationJob(task) {
  const queue = getGenerateQueue();
  const counts = await queue.getJobCounts(
    "waiting",
    "prioritized",
    "delayed",
    "active"
  );
  const pendingCount =
    (counts.waiting || 0) +
    (counts.prioritized || 0) +
    (counts.delayed || 0) +
    (counts.active || 0);

  if (pendingCount >= env.JOB_QUEUE_MAX_SIZE) {
    throw new HttpError(503, "当前生成任务较多，请稍后再试。");
  }

  const job = await queue.add(REDIS_JOB_NAME, { task });
  return buildJobSnapshot(job);
}

export async function getGenerationJob(jobId) {
  const queue = getGenerateQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    throw new HttpError(404, "任务不存在或已过期。");
  }

  return buildJobSnapshot(job);
}

export async function getGenerationQueueStats() {
  const queue = getGenerateQueue();
  const counts = await queue.getJobCounts(
    "waiting",
    "prioritized",
    "delayed",
    "active"
  );

  return {
    mode: "redis",
    queuedCount:
      (counts.waiting || 0) +
      (counts.prioritized || 0) +
      (counts.delayed || 0),
    processingCount: counts.active || 0,
    concurrency: env.JOB_WORKER_CONCURRENCY,
    maxQueueSize: env.JOB_QUEUE_MAX_SIZE
  };
}
