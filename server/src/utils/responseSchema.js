import { z } from "zod";
import { HttpError } from "./httpError.js";

const rawItemSchema = z.object({
  word: z.string(),
  inspiration: z.string(),
  direction: z.string()
});

const rawResponseSchema = z.object({
  near: z.array(rawItemSchema).min(10),
  medium: z.array(rawItemSchema).min(10),
  far: z.array(rawItemSchema).min(10)
});

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function collectUniqueItems(items, label, globalSeen) {
  const uniqueItems = [];

  for (const item of items) {
    const normalizedItem = {
      word: normalizeText(item.word),
      inspiration: normalizeText(item.inspiration),
      direction: normalizeText(item.direction)
    };

    if (
      !normalizedItem.word ||
      !normalizedItem.inspiration ||
      !normalizedItem.direction
    ) {
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

