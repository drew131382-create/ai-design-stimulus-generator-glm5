import { z } from "zod";
import { HttpError } from "./httpError.js";

const GROUP_KEYS = ["near", "medium", "far"];
const GROUP_SIZE = 10;
const MAX_WORD_LENGTH = 4;
const DESIGN_DIMENSIONS = [
  "功能方向",
  "结构方向",
  "交互方向",
  "材料工艺方向",
  "造型语言方向",
  "使用场景方向",
  "用户情绪方向",
  "人机工程方向",
  "服务流程方向",
  "可持续方向"
];

const DEFAULT_DIMENSION_BY_GROUP = {
  near: "功能方向",
  medium: "使用场景方向",
  far: "造型语言方向"
};

const rawItemSchema = z.object({
  word: z.string(),
  semanticDistance: z.string().optional(),
  reason: z.string().optional(),
  designDimension: z.string().optional(),
  design_dimension: z.string().optional(),
  explanation: z.string().optional(),
  inspiration: z.string().optional(),
  direction: z.string().optional()
});

const rawResponseSchema = z.object({
  near: z.array(rawItemSchema).default([]),
  medium: z.array(rawItemSchema).default([]),
  far: z.array(rawItemSchema).default([])
});

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function countWordLength(value) {
  return [...normalizeText(value).replace(/\s+/g, "")].length;
}

function normalizeWordKey(value) {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

function normalizeDimension(value, groupKey) {
  const dimension = normalizeText(value);

  if (DESIGN_DIMENSIONS.includes(dimension)) {
    return dimension;
  }

  const matched = DESIGN_DIMENSIONS.find(
    (item) => dimension && (item.includes(dimension) || dimension.includes(item))
  );

  return matched || DEFAULT_DIMENSION_BY_GROUP[groupKey] || "功能方向";
}

function collectValidItems({
  items,
  groupKey,
  seenWords,
  excludedWords,
  limit = GROUP_SIZE
}) {
  const validItems = [];

  for (const item of items) {
    const word = normalizeText(item.word);
    const wordKey = normalizeWordKey(word);
    const reason = normalizeText(
      item.reason || item.direction || item.explanation || item.inspiration
    );
    const designDimension = normalizeDimension(
      item.designDimension || item.design_dimension,
      groupKey
    );

    if (
      !word ||
      !wordKey ||
      seenWords.has(wordKey) ||
      excludedWords.has(wordKey) ||
      countWordLength(word) > MAX_WORD_LENGTH ||
      !reason
    ) {
      continue;
    }

    const normalizedItem = {
      word,
      semanticDistance: groupKey,
      designDimension,
      reason,
      explanation: normalizeText(item.explanation) || reason,
      inspiration: normalizeText(item.inspiration) || reason,
      direction: normalizeText(item.direction) || reason
    };

    seenWords.add(wordKey);
    validItems.push(normalizedItem);

    if (validItems.length === limit) {
      return validItems;
    }
  }

  if (validItems.length < limit) {
    throw new HttpError(
      502,
      `AI returned insufficient valid ${groupKey} items after de-duplication`,
      {
        groupKey,
        collectedCount: validItems.length,
        requiredCount: limit
      }
    );
  }

  return validItems;
}

export function normalizeStimulusGroups(payload, { excludeWords = [] } = {}) {
  const parsed = rawResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(
      502,
      "AI returned invalid stimulus JSON",
      parsed.error.flatten()
    );
  }

  const normalized = {};
  const seenWords = new Set();
  const excludedWords = new Set(
    (Array.isArray(excludeWords) ? excludeWords : [])
      .map((word) => normalizeWordKey(word))
      .filter(Boolean)
  );

  for (const groupKey of GROUP_KEYS) {
    normalized[groupKey] = collectValidItems({
      items: parsed.data[groupKey],
      groupKey,
      seenWords,
      excludedWords
    });
  }

  return normalized;
}
