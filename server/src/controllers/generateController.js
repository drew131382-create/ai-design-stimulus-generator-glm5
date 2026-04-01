import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { generateStimuli } from "../services/aiService.js";
import { attachSemanticDistance } from "../services/semanticDistanceService.js";

const promptSchema = z
  .string({ required_error: "prompt 为必填项" })
  .trim()
  .min(2, "请输入至少 2 个字")
  .max(4000, "输入内容不能超过 4000 字");

function requiredTextField(label, min, max) {
  return z
    .string({ required_error: `${label} 为必填项` })
    .trim()
    .min(min, `${label} 需 ${min}-${max} 字`)
    .max(max, `${label} 需 ${min}-${max} 字`);
}

function optionalTextNoMaxField() {
  return z.string().trim().optional().default("");
}

function optionalTextField(max = 500) {
  return z
    .string()
    .trim()
    .max(max, `字段长度不能超过 ${max} 字`)
    .optional()
    .default("");
}

const tagsField = z
  .preprocess((value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value
        .split(/[,，、\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }, z.array(z.string().trim().min(1).max(30)).max(20))
  .optional()
  .default([]);

const legacyTaskSchema = z
  .object({
    product: requiredTextField("product", 2, 30),
    user: optionalTextField(50),
    scenario: optionalTextNoMaxField(),
    goal: optionalTextField(150),
    constraints: optionalTextField(150),
    styleTags: tagsField,
    emotionTags: tagsField,
    existingIdeas: optionalTextField(),
    avoidDirections: optionalTextField(),
    notes: optionalTextField()
  })
  .strict();

function buildTaskFromPrompt(prompt) {
  const text = prompt.trim();

  return {
    prompt: text,
    product: text.slice(0, 30),
    user: "",
    scenario: text,
    goal: text,
    constraints: "无硬性限制",
    styleTags: [],
    emotionTags: [],
    existingIdeas: "",
    avoidDirections: "",
    notes: ""
  };
}

function buildTaskFromLegacyPayload(taskPayload) {
  const parsed = legacyTaskSchema.safeParse(taskPayload);

  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message || "请求参数不合法",
      parsed.error.flatten()
    );
  }

  const normalized = {
    ...parsed.data,
    goal: parsed.data.goal || parsed.data.scenario || parsed.data.product,
    constraints: parsed.data.constraints || "无硬性限制"
  };

  return {
    ...normalized,
    prompt: [
      normalized.product,
      normalized.user,
      normalized.scenario,
      normalized.goal,
      normalized.constraints
    ]
      .filter(Boolean)
      .join("\n")
  };
}

export const generateStimuliController = asyncHandler(async (req, res) => {
  const promptPayload = req.body?.prompt;
  const taskPayload = req.body?.task ?? req.body;

  let task;

  if (typeof promptPayload === "string") {
    const parsedPrompt = promptSchema.safeParse(promptPayload);

    if (!parsedPrompt.success) {
      throw new HttpError(
        400,
        parsedPrompt.error.issues[0]?.message || "请求参数不合法",
        parsedPrompt.error.flatten()
      );
    }

    task = buildTaskFromPrompt(parsedPrompt.data);
  } else {
    task = buildTaskFromLegacyPayload(taskPayload);
  }

  const groupedStimuli = await generateStimuli(task);
  const result = await attachSemanticDistance(task, groupedStimuli);

  res.status(200).json({
    task,
    ...result
  });
});
