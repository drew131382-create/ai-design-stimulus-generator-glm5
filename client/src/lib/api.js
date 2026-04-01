const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 180000;

/**
 * @typedef {"很近" | "中等" | "较远" | "很远" | null} SemanticDistanceLevel
 */

/**
 * @typedef {Object} StimulusItem
 * @property {string} word
 * @property {string} explanation
 * @property {string} inspiration
 * @property {string} direction
 * @property {number | null} semantic_similarity
 * @property {number | null} semantic_distance
 * @property {number | null} semantic_distance_score
 * @property {SemanticDistanceLevel} semantic_distance_level
 */

/**
 * @typedef {Object} DesignTask
 * @property {string} prompt
 * @property {string} product
 * @property {string} user
 * @property {string} scenario
 * @property {string} goal
 * @property {string} constraints
 */

/**
 * @typedef {Object} GenerateResponse
 * @property {DesignTask} task
 * @property {StimulusItem[]} near
 * @property {StimulusItem[]} medium
 * @property {StimulusItem[]} far
 */

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function normalizeStimulusItem(item) {
  const explanation =
    normalizeText(item?.explanation) ||
    normalizeText(item?.inspiration) ||
    normalizeText(item?.direction);
  const score = normalizeDistanceScore(item?.semantic_distance_score);

  return {
    word: normalizeText(item?.word),
    explanation,
    inspiration: normalizeText(item?.inspiration) || explanation,
    direction: normalizeText(item?.direction) || explanation,
    semantic_similarity: normalizeNumber(item?.semantic_similarity),
    semantic_distance: normalizeNumber(item?.semantic_distance),
    semantic_distance_score: score,
    semantic_distance_level:
      typeof item?.semantic_distance_level === "string"
        ? item.semantic_distance_level
        : score === null
          ? null
          : toDistanceLevel(score)
  };
}

function normalizeStimulusGroup(group) {
  if (!Array.isArray(group)) {
    return [];
  }

  return group
    .map((item) => normalizeStimulusItem(item))
    .filter((item) => item.word && item.explanation);
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

/**
 * @param {unknown} payload
 * @returns {GenerateResponse}
 */
function normalizeGeneratePayload(payload) {
  return {
    task: normalizeTask(payload?.task),
    near: normalizeStimulusGroup(payload?.near),
    medium: normalizeStimulusGroup(payload?.medium),
    far: normalizeStimulusGroup(payload?.far)
  };
}

async function requestGenerate(prompt, signal) {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
    signal,
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt }),
      signal: timeoutSignal
    });

    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const requestError = new Error(payload?.error?.message || "生成失败，请稍后重试。");
      requestError.status = response.status;
      throw requestError;
    }

    return normalizeGeneratePayload(payload);
  } finally {
    cleanup();
  }
}

export async function generateStimuli(prompt, signal) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await requestGenerate(prompt, signal);
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

      await delay(700 * (attempt + 1));
    }
  }

  throw lastError || new Error("生成失败，请稍后重试。");
}

export { API_BASE_URL };
