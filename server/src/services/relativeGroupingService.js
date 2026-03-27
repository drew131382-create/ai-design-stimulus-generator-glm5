import { attachSemanticDistance } from "./semanticDistanceService.js";

const GROUP_SIZE = 10;
const TOTAL_SIZE = GROUP_SIZE * 3;

function normalizeScore(item) {
  const score = Number(item?.semantic_distance_score);
  return Number.isFinite(score) ? score : null;
}

function splitIntoGroups(items) {
  return {
    near: items.slice(0, GROUP_SIZE),
    medium: items.slice(GROUP_SIZE, GROUP_SIZE * 2),
    far: items.slice(GROUP_SIZE * 2, TOTAL_SIZE)
  };
}

export async function regroupStimuliByTaskSemantics(task, candidates) {
  const pool = Array.isArray(candidates) ? candidates.slice(0, TOTAL_SIZE) : [];
  const seededPayload = {
    near: pool,
    medium: [],
    far: []
  };

  const enriched = await attachSemanticDistance(task, seededPayload);
  const scoredItems = Array.isArray(enriched.near) ? enriched.near : [];
  const ranked = scoredItems
    .map((item, index) => ({
      item,
      index,
      score: normalizeScore(item)
    }))
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return a.index - b.index;
      }

      if (a.score === null) {
        return 1;
      }

      if (b.score === null) {
        return -1;
      }

      if (a.score !== b.score) {
        return a.score - b.score;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.item);

  return splitIntoGroups(ranked);
}
