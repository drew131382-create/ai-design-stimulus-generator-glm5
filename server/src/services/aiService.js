import { env } from "../utils/env.js";
import { HttpError } from "../utils/httpError.js";
import { parseModelJson } from "../utils/extractJson.js";
import { normalizeStimulusCandidates } from "../utils/responseSchema.js";
import {
  buildRetryMessage,
  buildStimulusMessages
} from "../prompts/stimulusPrompt.js";

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function buildModelscopeChatCompletionsUrl() {
  return new URL(
    "chat/completions",
    env.MODELSCOPE_BASE_URL.replace(/\/?$/, "/")
  ).toString();
}

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

function resolveProviderConfig(provider) {
  if (provider === "zhipu") {
    if (!env.ZHIPU_API_KEY) {
      throw new HttpError(500, "ZHIPU_API_KEY is missing");
    }

    return {
      provider,
      url: buildZhipuChatCompletionsUrl(),
      apiKey: env.ZHIPU_API_KEY,
      model: env.ZHIPU_CHAT_MODEL
    };
  }

  return {
    provider: "modelscope",
    url: buildModelscopeChatCompletionsUrl(),
    apiKey: env.MODELSCOPE_API_KEY,
    model: env.MODELSCOPE_MODEL
  };
}

async function requestChatCompletion(messages, provider = "modelscope") {
  const providerConfig = resolveProviderConfig(provider);
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
      throw new HttpError(504, `${providerConfig.provider} request timed out`);
    }

    throw new HttpError(502, `${providerConfig.provider} request failed`, {
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
      payload?.error?.message || `${providerConfig.provider} request failed`,
      payload || rawText
    );
  }

  const content = extractContent(payload);

  if (!content) {
    throw new HttpError(
      502,
      `${providerConfig.provider} response missing message content`,
      payload
    );
  }

  return content;
}

function shouldFallback(error) {
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

function logProviderError(provider, attempt, error) {
  console.error("[aiService] provider request failed", {
    provider,
    attempt,
    statusCode: error?.statusCode || null,
    message: error?.message || "Unknown AI error"
  });
}

function buildProviderOrder() {
  const order = ["modelscope"];

  if (env.ZHIPU_API_KEY) {
    order.push("zhipu");
  }

  return order;
}

export async function generateStimuli(task) {
  const baseMessages = buildStimulusMessages(task);
  let lastError = null;
  const providers = buildProviderOrder();

  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const messages =
        attempt === 0 ? baseMessages : [...baseMessages, buildRetryMessage()];

      try {
        const rawContent = await requestChatCompletion(messages, provider);
        const parsedJson = parseModelJson(rawContent);
        return normalizeStimulusCandidates(parsedJson);
      } catch (error) {
        lastError = error;
        logProviderError(provider, attempt + 1, error);
      }
    }

    if (!shouldFallback(lastError)) {
      break;
    }
  }

  if (lastError instanceof HttpError) {
    throw lastError;
  }

  throw new HttpError(502, "Failed to generate valid AI response", {
    reason: lastError?.message || "Unknown AI error"
  });
}

