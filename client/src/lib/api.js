const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20000;
const JOB_POLL_INTERVAL_MS = 2500;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const handleAbort = () => {
      cleanup();
      reject(signal?.reason || new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", handleAbort);
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener?.("abort", handleAbort, { once: true });
  });
}

function createTimeoutSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error("请求超时"));
  }, timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener(
        "abort",
        () => controller.abort(externalSignal.reason),
        { once: true }
      );
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer)
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDistanceLevel(score) {
  if (score <= 25) {
    return "很近";
  }

  if (score <= 50) {
    return "中等";
  }

  if (score <= 75) {
    return "较远";
  }

  return "很远";
}

function normalizeDistanceScore(value) {
  const num = normalizeNumber(value);

  if (num === null) {
    return null;
  }

  return clamp(Math.round(num), 0, 100);
}

function normalizeSemanticDistanceScore(item) {
  const camelScore = normalizeDistanceScore(item?.semanticDistanceScore);

  if (camelScore !== null) {
    return camelScore;
  }

  return normalizeDistanceScore(item?.semantic_distance_score);
}

function normalizeStimulusItem(item, groupKey) {
  const reason =
    normalizeText(item?.reason) ||
    normalizeText(item?.direction) ||
    normalizeText(item?.explanation) ||
    normalizeText(item?.inspiration);
  const score = normalizeSemanticDistanceScore(item);
  const designDimension =
    normalizeText(item?.designDimension) ||
    normalizeText(item?.design_dimension) ||
    "未标注";
  const semanticDistance = normalizeText(item?.semanticDistance) || groupKey;

  return {
    word: normalizeText(item?.word),
    reason,
    designDimension,
    explanation: normalizeText(item?.explanation) || reason,
    inspiration: normalizeText(item?.inspiration) || reason,
    direction: normalizeText(item?.direction) || reason,
    semantic_similarity: normalizeNumber(item?.semantic_similarity),
    semantic_distance: normalizeNumber(item?.semantic_distance),
    semantic_distance_score: score,
    semantic_distance_level:
      typeof item?.semantic_distance_level === "string"
        ? item.semantic_distance_level
        : score === null
          ? null
          : toDistanceLevel(score),
    semanticDistance,
    semanticDistanceScore: score,
    semanticDistanceLevel:
      typeof item?.semanticDistanceLevel === "string"
        ? item.semanticDistanceLevel
        : typeof item?.semantic_distance_level === "string"
          ? item.semantic_distance_level
          : score === null
            ? null
            : toDistanceLevel(score)
  };
}

function normalizeStimulusGroup(group, groupKey) {
  if (!Array.isArray(group)) {
    return [];
  }

  return group
    .map((item) => normalizeStimulusItem(item, groupKey))
    .filter((item) => item.word && item.reason);
}

function normalizeTask(task) {
  return {
    prompt: normalizeText(task?.prompt),
    product: normalizeText(task?.product),
    user: normalizeText(task?.user),
    scenario: normalizeText(task?.scenario),
    goal: normalizeText(task?.goal),
    constraints: normalizeText(task?.constraints)
  };
}

function normalizeGeneratePayload(payload) {
  return {
    task: normalizeTask(payload?.task),
    near: normalizeStimulusGroup(payload?.near, "near"),
    medium: normalizeStimulusGroup(payload?.medium, "medium"),
    far: normalizeStimulusGroup(payload?.far, "far")
  };
}

function normalizeJobPayload(payload) {
  return {
    jobId: normalizeText(payload?.jobId),
    status: normalizeText(payload?.status),
    queuePosition: normalizeNumber(payload?.queuePosition) || 0,
    estimatedWaitSeconds: normalizeNumber(payload?.estimatedWaitSeconds) || 0,
    createdAt: normalizeText(payload?.createdAt),
    startedAt: normalizeText(payload?.startedAt),
    completedAt: normalizeText(payload?.completedAt),
    error: payload?.error
      ? {
          message: normalizeText(payload.error.message) || "生成失败，请稍后重试。",
          statusCode: normalizeNumber(payload.error.statusCode),
          details: payload.error.details ?? null
        }
      : null,
    result: payload?.result ? normalizeGeneratePayload(payload.result) : null
  };
}

async function requestJson(path, { method = "GET", body, signal } = {}) {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
    signal,
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeoutSignal
    });

    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const requestError = new Error(
        payload?.error?.message || "生成失败，请稍后重试。"
      );
      requestError.status = response.status;
      requestError.details = payload?.error?.details || null;
      throw requestError;
    }

    return payload;
  } finally {
    cleanup();
  }
}

export async function createGenerateJob(task, signal) {
  const payload = await requestJson("/api/generate", {
    method: "POST",
    body: { task },
    signal
  });

  return normalizeJobPayload(payload);
}

export async function getGenerateJob(jobId, signal) {
  const payload = await requestJson(`/api/generate/${jobId}`, {
    method: "GET",
    signal
  });

  return normalizeJobPayload(payload);
}

export async function waitForGenerateJob(jobId, { signal, onStatus } = {}) {
  let lastError = null;

  while (true) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const job = await getGenerateJob(jobId, signal);
        onStatus?.(job);

        if (job.status === "completed" || job.status === "failed") {
          return job;
        }

        await delay(JOB_POLL_INTERVAL_MS, signal);
        lastError = null;
        break;
      } catch (error) {
        if (signal?.aborted || error.name === "AbortError") {
          throw error;
        }

        lastError = error;
        const retryable =
          typeof error.status === "number"
            ? RETRYABLE_STATUS.has(error.status)
            : true;

        if (!retryable || attempt === MAX_RETRIES - 1) {
          throw error;
        }

        await delay(700 * (attempt + 1), signal);
      }
    }

    if (lastError) {
      throw lastError;
    }
  }
}

export { API_BASE_URL };
