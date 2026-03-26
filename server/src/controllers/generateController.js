import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { generateStimuli } from "../services/aiService.js";
import { attachSemanticDistance } from "../services/semanticDistanceService.js";

function requiredTextField(label, min, max) {
  return z
    .string({ required_error: `${label} 为必填项` })
    .trim()
    .min(min, `${label} 需 ${min}-${max} 字`)
    .max(max, `${label} 需 ${min}-${max} 字`);
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

const taskSchema = z
  .object({
    product: requiredTextField("product", 2, 30),
    user: requiredTextField("user", 2, 50),
    goal: requiredTextField("goal", 10, 150),
    scenario: optionalTextField(150),
    constraints: optionalTextField(150),
    styleTags: tagsField,
    emotionTags: tagsField,
    existingIdeas: optionalTextField(),
    avoidDirections: optionalTextField(),
    notes: optionalTextField()
  })
  .strict();

export const generateStimuliController = asyncHandler(async (req, res) => {
  const taskPayload = req.body?.task ?? req.body;
  const parsed = taskSchema.safeParse(taskPayload);

  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message || "请求参数不合法",
      parsed.error.flatten()
    );
  }

  const task = {
    ...parsed.data,
    scenario: parsed.data.scenario || parsed.data.goal,
    constraints: parsed.data.constraints || "无硬性限制"
  };
  const generated = await generateStimuli(task);
  const result = await attachSemanticDistance(task, generated);

  res.status(200).json({
    task,
    ...result
  });
});
