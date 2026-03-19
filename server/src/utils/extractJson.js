import { HttpError } from "./httpError.js";

function stripCodeFence(content) {
  return content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJSONObject(content) {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new HttpError(502, "AI returned no JSON object");
  }

  return content.slice(firstBrace, lastBrace + 1);
}

export function parseModelJson(rawContent) {
  const cleaned = stripCodeFence(rawContent);
  const candidate = cleaned.startsWith("{")
    ? cleaned
    : extractJSONObject(cleaned);

  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw new HttpError(502, "Failed to parse AI JSON response", {
      reason: error.message
    });
  }
}

