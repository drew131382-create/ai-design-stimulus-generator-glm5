import { z } from "zod";
import { HttpError } from "./httpError.js";

const GROUP_KEYS = ["near", "medium", "far"];
const GROUP_SIZE = 10;

const rawItemSchema = z.object({
  word: z.string(),
  explanation: z.string().optional(),
  inspiration: z.string().optional(),
  direction: z.string().optional()
});

const rawResponseSchema = z.object({
  near: z.array(rawItemSchema).min(GROUP_SIZE),
  medium: z.array(rawItemSchema).min(GROUP_SIZE),
  far: z.array(rawItemSchema).min(GROUP_SIZE)
});

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function collectUniqueItems(items, label, limit = GROUP_SIZE) {
  const uniqueItems = [];
  const seen = new Set();

  for (const item of items) {
    const explanation = normalizeText(item.explanation || item.inspiration);
    const direction = normalizeText(item.direction);

    const normalizedItem = {
      word: normalizeText(item.word),
      explanation,
      inspiration: normalizeText(item.inspiration) || explanation,
      direction
    };

    if (
      !normalizedItem.word ||
      !normalizedItem.explanation ||
      !normalizedItem.direction
    ) {
      continue;
    }

    const token = normalizedItem.word.toLocaleLowerCase();

    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    uniqueItems.push(normalizedItem);

    if (uniqueItems.length === limit) {
      return uniqueItems;
    }
  }

  throw new HttpError(502, `AI returned insufficient unique ${label} items`);
}

export function normalizeStimulusGroups(payload) {
  const parsed = rawResponseSchema.parse(payload);
  const normalized = {};

  for (const groupKey of GROUP_KEYS) {
    normalized[groupKey] = collectUniqueItems(parsed[groupKey], groupKey);
  }

  return normalized;
}
