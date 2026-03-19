const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 70000;

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
      const error = new Error(
        payload?.error?.message || "生成失败，请稍后重试。"
      );
      error.status = response.status;
      throw error;
    }

    return payload;
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
