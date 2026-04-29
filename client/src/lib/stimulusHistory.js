import { STIMULUS_GROUPS } from "./categories";

export const STIMULUS_HISTORY_KEY = "aidsg:stimulus-history:v1";

const MAX_HISTORY_RECORDS = 20;
const HISTORY_VERSION = 1;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createRecordId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeTask(task) {
  return {
    prompt: normalizeText(task?.prompt),
    product: normalizeText(task?.product),
    user: normalizeText(task?.user),
    scenario: normalizeText(task?.scenario),
    goal: normalizeText(task?.goal),
    constraints: normalizeText(task?.constraints)
  };
}

function normalizeStimulusItem(item, groupKey) {
  const reason =
    normalizeText(item?.reason) ||
    normalizeText(item?.direction) ||
    normalizeText(item?.explanation) ||
    normalizeText(item?.inspiration);
  const designDimension =
    normalizeText(item?.designDimension) ||
    normalizeText(item?.design_dimension) ||
    "未标注";

  return {
    ...item,
    word: normalizeText(item?.word),
    semanticDistance: normalizeText(item?.semanticDistance) || groupKey,
    designDimension,
    reason
  };
}

function normalizeResult(result) {
  const normalized = {};

  for (const group of STIMULUS_GROUPS) {
    normalized[group.key] = Array.isArray(result?.[group.key])
      ? result[group.key]
          .map((item) => normalizeStimulusItem(item, group.key))
          .filter((item) => item.word)
      : [];
  }

  return normalized;
}

function normalizeRecord(record) {
  const id = normalizeText(record?.id);
  const createdAt = normalizeText(record?.createdAt);

  if (!id || !createdAt || !record?.result) {
    return null;
  }

  return {
    id,
    createdAt,
    version: Number(record?.version) || HISTORY_VERSION,
    task: normalizeTask(record?.task),
    result: normalizeResult(record?.result)
  };
}

function sortByNewest(records) {
  return records.slice().sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();

    if (!Number.isFinite(timeA) && !Number.isFinite(timeB)) {
      return 0;
    }

    if (!Number.isFinite(timeA)) {
      return 1;
    }

    if (!Number.isFinite(timeB)) {
      return -1;
    }

    return timeB - timeA;
  });
}

export function loadStimulusHistory() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STIMULUS_HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortByNewest(parsed.map((record) => normalizeRecord(record)).filter(Boolean)).slice(
      0,
      MAX_HISTORY_RECORDS
    );
  } catch (error) {
    console.warn("[stimulusHistory] failed to read history", error);
    return [];
  }
}

export function persistStimulusHistory(records) {
  if (!canUseStorage()) {
    return false;
  }

  try {
    const normalized = sortByNewest(
      (Array.isArray(records) ? records : [])
        .map((record) => normalizeRecord(record))
        .filter(Boolean)
    ).slice(0, MAX_HISTORY_RECORDS);

    window.localStorage.setItem(
      STIMULUS_HISTORY_KEY,
      JSON.stringify(normalized)
    );
    return true;
  } catch (error) {
    console.warn("[stimulusHistory] failed to persist history", error);
    return false;
  }
}

export function createStimulusHistoryRecord(task, result) {
  return {
    id: createRecordId(),
    createdAt: new Date().toISOString(),
    version: HISTORY_VERSION,
    task: normalizeTask(task),
    result: normalizeResult(result)
  };
}

export function saveStimulusHistoryRecord(record, currentRecords = loadStimulusHistory()) {
  const normalizedRecord = normalizeRecord(record);

  if (!normalizedRecord) {
    return currentRecords;
  }

  const nextRecords = sortByNewest([
    normalizedRecord,
    ...(Array.isArray(currentRecords) ? currentRecords : []).filter(
      (item) => item?.id !== normalizedRecord.id
    )
  ]).slice(0, MAX_HISTORY_RECORDS);

  persistStimulusHistory(nextRecords);
  return nextRecords;
}

export function getHistoryWords(records) {
  const words = new Set();

  for (const record of Array.isArray(records) ? records : []) {
    for (const group of STIMULUS_GROUPS) {
      const items = Array.isArray(record?.result?.[group.key])
        ? record.result[group.key]
        : [];

      for (const item of items) {
        const word = normalizeText(item?.word);

        if (word) {
          words.add(word);
        }
      }
    }
  }

  return Array.from(words);
}
