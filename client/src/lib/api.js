const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 70000;

/**
 * @typedef {"\u5f88\u8fd1" | "\u4e2d\u7b49" | "\u8f83\u8fdc" | "\u5f88\u8fdc" | null} SemanticDistanceLevel
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
 * @property {string} product
 * @property {string} user
 * @property {string} scenario
 * @property {string} goal
 * @property {string} constraints
 * @property {string[]} styleTags
 * @property {string[]} emotionTags
 * @property {string} existingIdeas
 * @property {string} avoidDirections
 * @property {string} notes
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
    controller.abort(new Error("Request timeout"));
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

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toDistanceLevel(score) {
  if (score <= 25) {
    return "\u5f88\u8fd1";
  }

  if (score <= 50) {
    return "\u4e2d\u7b49";
  }

  if (score <= 75) {
    return "\u8f83\u8fdc";
  }

  return "\u5f88\u8fdc";
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
    product: normalizeText(task?.product),
    user: normalizeText(task?.user),
    scenario: normalizeText(task?.scenario),
    goal: normalizeText(task?.goal),
    constraints: normalizeText(task?.constraints),
    styleTags: normalizeTags(task?.styleTags),
    emotionTags: normalizeTags(task?.emotionTags),
    existingIdeas: normalizeText(task?.existingIdeas),
    avoidDirections: normalizeText(task?.avoidDirections),
    notes: normalizeText(task?.notes)
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

async function requestGenerate(task, signal) {
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
      body: JSON.stringify({ task }),
      signal: timeoutSignal
    });

    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const error = new Error(payload?.error?.message || "生成失败，请稍后重试。");
      error.status = response.status;
      throw error;
    }

    return normalizeGeneratePayload(payload);
  } finally {
    cleanup();
  }
}

export async function generateStimuli(task, signal) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await requestGenerate(task, signal);
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
