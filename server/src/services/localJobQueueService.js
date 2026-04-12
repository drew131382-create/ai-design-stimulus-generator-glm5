import { randomUUID } from "crypto";
import { env } from "../utils/env.js";
import { HttpError } from "../utils/httpError.js";
import { serializeQueueError } from "../utils/jobError.js";
import { executeGenerationTask } from "./generationPipelineService.js";

const JOB_STATUS = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed"
};

const jobs = new Map();
const waitingJobIds = [];
const terminalStatuses = new Set([JOB_STATUS.completed, JOB_STATUS.failed]);
let activeCount = 0;
let dispatchScheduled = false;

function getQueuePosition(jobId) {
  const index = waitingJobIds.indexOf(jobId);
  return index === -1 ? 0 : index + 1;
}

function getEstimatedWaitSeconds(status, queuePosition) {
  if (status === JOB_STATUS.processing) {
    return env.JOB_ESTIMATED_DURATION_SECONDS;
  }

  if (status !== JOB_STATUS.queued || queuePosition <= 0) {
    return 0;
  }

  return Math.ceil(
    ((Math.max(queuePosition - 1, 0) + activeCount) /
      Math.max(env.JOB_WORKER_CONCURRENCY, 1)) *
      env.JOB_ESTIMATED_DURATION_SECONDS
  );
}

function buildJobSnapshot(job) {
  const queuePosition = getQueuePosition(job.id);

  return {
    jobId: job.id,
    status: job.status,
    queuePosition,
    estimatedWaitSeconds: getEstimatedWaitSeconds(job.status, queuePosition),
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
    result: job.status === JOB_STATUS.completed ? job.result : null
  };
}

function scheduleDispatch() {
  if (dispatchScheduled) {
    return;
  }

  dispatchScheduled = true;
  queueMicrotask(() => {
    dispatchScheduled = false;
    processQueue();
  });
}

function finalizeJob(job, nextStatus, payload) {
  job.status = nextStatus;
  job.updatedAt = new Date().toISOString();
  job.completedAt = job.updatedAt;

  if (nextStatus === JOB_STATUS.completed) {
    job.result = payload;
    job.error = null;
    return;
  }

  job.result = null;
  job.error = serializeQueueError(payload);
}

async function runJob(job) {
  try {
    const result = await executeGenerationTask(job.task);
    finalizeJob(job, JOB_STATUS.completed, result);
  } catch (error) {
    console.error("[localJobQueue] generation job failed", {
      jobId: job.id,
      message: error?.message || "Unknown job error"
    });
    finalizeJob(job, JOB_STATUS.failed, error);
  } finally {
    activeCount = Math.max(activeCount - 1, 0);
    scheduleDispatch();
  }
}

function processQueue() {
  while (
    activeCount < env.JOB_WORKER_CONCURRENCY &&
    waitingJobIds.length > 0
  ) {
    const jobId = waitingJobIds.shift();
    const job = jobs.get(jobId);

    if (!job || job.status !== JOB_STATUS.queued) {
      continue;
    }

    job.status = JOB_STATUS.processing;
    job.startedAt = new Date().toISOString();
    job.updatedAt = job.startedAt;
    activeCount += 1;
    void runJob(job);
  }
}

function cleanupExpiredJobs() {
  const now = Date.now();

  for (const [jobId, job] of jobs.entries()) {
    if (!terminalStatuses.has(job.status) || !job.completedAt) {
      continue;
    }

    const completedAt = new Date(job.completedAt).getTime();

    if (now - completedAt > env.JOB_RESULT_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}

setInterval(cleanupExpiredJobs, 60 * 1000).unref?.();

export function createGenerationJob(task) {
  if (activeCount + waitingJobIds.length >= env.JOB_QUEUE_MAX_SIZE) {
    throw new HttpError(503, "当前生成任务较多，请稍后再试。");
  }

  const now = new Date().toISOString();
  const job = {
    id: randomUUID(),
    task,
    status: JOB_STATUS.queued,
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null
  };

  jobs.set(job.id, job);
  waitingJobIds.push(job.id);
  scheduleDispatch();

  return buildJobSnapshot(job);
}

export function getGenerationJob(jobId) {
  const job = jobs.get(jobId);

  if (!job) {
    throw new HttpError(404, "任务不存在或已过期。");
  }

  return buildJobSnapshot(job);
}

export function getGenerationQueueStats() {
  return {
    mode: "memory",
    queuedCount: waitingJobIds.length,
    processingCount: activeCount,
    concurrency: env.JOB_WORKER_CONCURRENCY,
    maxQueueSize: env.JOB_QUEUE_MAX_SIZE
  };
}
