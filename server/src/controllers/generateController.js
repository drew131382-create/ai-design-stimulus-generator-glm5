import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { generateStimuli } from "../services/aiService.js";

const generateSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(8, "请输入至少 8 个字符的设计需求。")
    .max(1600, "输入内容过长，请控制在 1600 个字符以内。")
});

export const generateStimuliController = asyncHandler(async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message || "请求参数不合法。",
      parsed.error.flatten()
    );
  }

  const result = await generateStimuli(parsed.data.prompt);

  res.status(200).json(result);
});

