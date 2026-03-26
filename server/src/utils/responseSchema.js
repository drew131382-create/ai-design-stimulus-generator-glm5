import { z } from "zod";
import { HttpError } from "./httpError.js";

const rawItemSchema = z.object({
  word: z.string(),
  explanation: z.string().optional(),
  inspiration: z.string().optional(),
  direction: z.string().optional()
});

const rawResponseSchema = z.object({
  near: z.array(rawItemSchema).min(10),
  medium: z.array(rawItemSchema).min(10),
  far: z.array(rawItemSchema).min(10)
});

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function collectUniqueItems(items, label, globalSeen) {
  const uniqueItems = [];

  for (const item of items) {
    const explanation = normalizeText(
      item.explanation ||
        [item.inspiration, item.direction].filter(Boolean).join(" ")
    );

    const normalizedItem = {
      word: normalizeText(item.word),
      explanation,
      inspiration: normalizeText(item.inspiration) || explanation,
      direction: normalizeText(item.direction) || explanation
    };

    if (!normalizedItem.word || !normalizedItem.explanation) {
      continue;
    }

    const token = normalizedItem.word.toLocaleLowerCase();

    if (globalSeen.has(token)) {
      continue;
    }

    globalSeen.add(token);
    uniqueItems.push(normalizedItem);

    if (uniqueItems.length === 10) {
      return uniqueItems;
    }
  }

  throw new HttpError(502, `AI returned insufficient unique ${label} items`);
}

export function normalizeStimulusPayload(payload) {
  const parsed = rawResponseSchema.parse(payload);
  const globalSeen = new Set();

  return {
    near: collectUniqueItems(parsed.near, "near", globalSeen),
    medium: collectUniqueItems(parsed.medium, "medium", globalSeen),
    far: collectUniqueItems(parsed.far, "far", globalSeen)
  };
}
