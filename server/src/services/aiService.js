import { env } from "../utils/env.js";
import { HttpError } from "../utils/httpError.js";
import { parseModelJson } from "../utils/extractJson.js";
import { normalizeStimulusPayload } from "../utils/responseSchema.js";
import {
  buildRetryMessage,
  buildStimulusMessages
} from "../prompts/stimulusPrompt.js";

function buildChatCompletionsUrl() {
  return new URL(
    "chat/completions",
    env.MODELSCOPE_BASE_URL.replace(/\/?$/, "/")
  ).toString();
}

async function requestChatCompletion(messages) {
  const response = await fetch(buildChatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MODELSCOPE_API_KEY}`
    },
    body: JSON.stringify({
      model: env.MODELSCOPE_MODEL,
      messages,
      temperature: 0.9,
      top_p: 0.9
    })
  });

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
      payload?.error?.message || "ModelScope request failed",
      payload || rawText
    );
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new HttpError(502, "Model response missing message content", payload);
  }

  return content;
}

export async function generateStimuli(input) {
  const baseMessages = buildStimulusMessages(input);
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const messages =
      attempt === 0 ? baseMessages : [...baseMessages, buildRetryMessage()];

    try {
      const rawContent = await requestChatCompletion(messages);
      const parsedJson = parseModelJson(rawContent);
      return normalizeStimulusPayload(parsedJson);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof HttpError) {
    throw lastError;
  }

  throw new HttpError(502, "Failed to generate valid AI response", {
    reason: lastError?.message || "Unknown AI error"
  });
}
