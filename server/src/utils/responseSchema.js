import { z } from "zod";
import { HttpError } from "./httpError.js";

const rawItemSchema = z.object({
  word: z.string(),
  explanation: z.string().optional(),
  inspiration: z.string().optional(),
  direction: z.string().optional()
});

const rawResponseSchema = z.object({
  candidates: z.array(rawItemSchema).min(30)
});

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function collectUniqueItems(items, label, limit = 30) {
  const uniqueItems = [];
  const seen = new Set();

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

export function normalizeStimulusCandidates(payload) {
  const parsed = rawResponseSchema.parse(payload);

  return collectUniqueItems(parsed.candidates, "candidate", 30);
}
