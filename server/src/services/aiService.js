import { env } from "../utils/env.js";
import { HttpError } from "../utils/httpError.js";
import { parseModelJson } from "../utils/extractJson.js";
import { normalizeStimulusCandidates } from "../utils/responseSchema.js";
import {
  buildRetryMessage,
  buildStimulusMessages
} from "../prompts/stimulusPrompt.js";

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function buildZhipuChatCompletionsUrl() {
  return new URL(
    "chat/completions",
    env.ZHIPU_BASE_URL.replace(/\/?$/, "/")
  ).toString();
}

function extractContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  const outputText = payload?.output_text;

  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  return "";
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error("LLM request timeout"));
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function resolveZhipuConfig() {
  if (!env.ZHIPU_API_KEY) {
    throw new HttpError(500, "ZHIPU_API_KEY is missing");
  }

  return {
    provider: "zhipu",
    url: buildZhipuChatCompletionsUrl(),
    apiKey: env.ZHIPU_API_KEY,
    model: "glm-5"
  };
}

async function requestChatCompletion(messages) {
  const providerConfig = resolveZhipuConfig();
  let response;

  try {
    response = await fetchWithTimeout(
      providerConfig.url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerConfig.apiKey}`
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages,
          temperature: 0.9,
          top_p: 0.9
        })
      },
      env.LLM_REQUEST_TIMEOUT_MS
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new HttpError(504, "zhipu request timed out");
    }

    throw new HttpError(502, "zhipu request failed", {
      reason: error?.message || "Unknown request error"
    });
  }

  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      payload?.error?.message || "zhipu request failed",
      payload || rawText
    );
  }

  const content = extractContent(payload);

  if (!content) {
    throw new HttpError(502, "zhipu response missing message content", payload);
  }

  return content;
}

function shouldRetry(error) {
  if (!(error instanceof HttpError)) {
    return true;
  }

  if (RETRYABLE_STATUS.has(error.statusCode)) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("1302") ||
    message.includes("missing message content")
  );
}

export async function generateStimuli(task) {
  const baseMessages = buildStimulusMessages(task);
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const messages =
      attempt === 0 ? baseMessages : [...baseMessages, buildRetryMessage()];

    try {
      const rawContent = await requestChatCompletion(messages);
      const parsedJson = parseModelJson(rawContent);
      return normalizeStimulusCandidates(parsedJson);
    } catch (error) {
      lastError = error;
      console.error("[aiService] zhipu request failed", {
        attempt: attempt + 1,
        statusCode: error?.statusCode || null,
        message: error?.message || "Unknown AI error"
      });

      if (!shouldRetry(error) || attempt === 1) {
        break;
      }
    }
  }

  if (lastError instanceof HttpError) {
    throw lastError;
  }

  throw new HttpError(502, "Failed to generate valid AI response", {
    reason: lastError?.message || "Unknown AI error"
  });
}
