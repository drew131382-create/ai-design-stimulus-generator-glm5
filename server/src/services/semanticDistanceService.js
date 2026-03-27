import { env } from "../utils/env.js";
import { HttpError } from "../utils/httpError.js";

const STIMULUS_GROUPS = ["near", "medium", "far"];

function buildEmbeddingsUrl() {
  return new URL(
    "embeddings",
    env.ZHIPU_BASE_URL.replace(/\/?$/, "/")
  ).toString();
}

function toFiniteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDistanceLevel(score) {
  if (score <= 25) {
    return "\u5f88\u8fd1";
  }

  if (score <= 50) {
    return "\u4e2d\u7b49";
  }

  if (score <= 75) {
    return "\u8f83\u8fdc";
  }

  return "\u5f88\u8fdc";
}

function normalizeNullDistance(item) {
  return {
    ...item,
    semantic_similarity: null,
    semantic_distance: null,
    semantic_distance_score: null,
    semantic_distance_level: null
  };
}

export function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    return null;
  }

  if (vectorA.length === 0 || vectorA.length !== vectorB.length) {
    return null;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    const a = Number(vectorA[i]);
    const b = Number(vectorB[i]);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return null;
    }

    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return null;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function requestEmbeddings(input) {
  const embeddingApiKey = env.ZHIPU_EMBEDDING_API_KEY || env.ZHIPU_API_KEY;

  if (!embeddingApiKey) {
    throw new HttpError(
      500,
      "ZHIPU_EMBEDDING_API_KEY or ZHIPU_API_KEY is missing"
    );
  }

  const response = await fetch(buildEmbeddingsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${embeddingApiKey}`
    },
    body: JSON.stringify({
      model: env.ZHIPU_EMBEDDING_MODEL,
      input
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
      payload?.error?.message || "Zhipu embeddings request failed",
      payload || rawText
    );
  }

  const vectors = payload?.data
    ?.slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => item.embedding);

  if (!Array.isArray(vectors) || vectors.length !== input.length) {
    throw new HttpError(502, "Zhipu embeddings response is invalid", payload);
  }

  return vectors;
}

function normalizeOptionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => normalizeOptionalText(tag))
    .filter(Boolean);
}

export function buildGoalText(task) {
  const styleTags = normalizeOptionalTags(task.styleTags);
  const emotionTags = normalizeOptionalTags(task.emotionTags);
  const lines = [
    `product: ${task.product}`,
    `user: ${task.user}`,
    `scenario: ${task.scenario}`,
    `goal: ${task.goal}`,
    `constraints: ${task.constraints}`,
    styleTags.length > 0 ? `styleTags: ${styleTags.join(", ")}` : "",
    emotionTags.length > 0 ? `emotionTags: ${emotionTags.join(", ")}` : ""
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildStimulusText(item) {
  const word = normalizeOptionalText(item.word);
  const explanation = normalizeOptionalText(item.explanation);
  return [word, explanation].filter(Boolean).join(" - ");
}

export async function attachSemanticDistance(task, stimuliPayload) {
  const entries = [];

  for (const group of STIMULUS_GROUPS) {
    const items = Array.isArray(stimuliPayload[group]) ? stimuliPayload[group] : [];

    for (let i = 0; i < items.length; i += 1) {
      entries.push({
        group,
        index: i,
        item: items[i]
      });
    }
  }

  if (entries.length === 0) {
    return stimuliPayload;
  }

  const goalText = buildGoalText(task);
  const input = [goalText, ...entries.map(({ item }) => buildStimulusText(item))];

  try {
    const vectors = await requestEmbeddings(input);
    const goalVector = vectors[0];

    for (let i = 0; i < entries.length; i += 1) {
      const itemVector = vectors[i + 1];
      const semanticSimilarity = cosineSimilarity(goalVector, itemVector);

      if (semanticSimilarity === null) {
        entries[i].item = normalizeNullDistance(entries[i].item);
        continue;
      }

      const boundedSimilarity = clamp(semanticSimilarity, -1, 1);
      const semanticDistance = 1 - boundedSimilarity;
      const semanticDistanceScore = clamp(
        Math.round(semanticDistance * 100),
        0,
        100
      );

      entries[i].item = {
        ...entries[i].item,
        semantic_similarity: toFiniteNumber(boundedSimilarity),
        semantic_distance: toFiniteNumber(semanticDistance),
        semantic_distance_score: semanticDistanceScore,
        semantic_distance_level: toDistanceLevel(semanticDistanceScore)
      };
    }
  } catch (error) {
    console.error("[semanticDistance] failed to compute distances", {
      message: error?.message || "Unknown semantic distance error",
      details: error?.details || null
    });

    for (let i = 0; i < entries.length; i += 1) {
      entries[i].item = normalizeNullDistance(entries[i].item);
    }
  }

  const merged = {
    ...stimuliPayload
  };

  for (const group of STIMULUS_GROUPS) {
    merged[group] = Array.isArray(stimuliPayload[group])
      ? [...stimuliPayload[group]]
      : [];
  }

  for (const entry of entries) {
    merged[entry.group][entry.index] = entry.item;
  }

  return merged;
}
