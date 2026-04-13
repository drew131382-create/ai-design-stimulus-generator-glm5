import { z } from "zod";
import { HttpError } from "./httpError.js";

const promptSchema = z
  .string({ required_error: "请输入设计任务" })
  .trim()
  .min(2, "请输入至少 2 个字")
  .max(4000, "输入内容不能超过 4000 个字");

function requiredTextField(label, min, max) {
  return z
    .string({ required_error: `${label} 为必填项` })
    .trim()
    .min(min, `${label} 需 ${min}-${max} 字`)
    .max(max, `${label} 需 ${min}-${max} 字`);
}

function optionalTextField(max) {
  let schema = z.string().trim();

  if (typeof max === "number") {
    schema = schema.max(max, `字段长度不能超过 ${max} 字`);
  }

  return schema.optional().default("");
}

const structuredTaskSchema = z
  .object({
    product: requiredTextField("product", 2, 30),
    user: optionalTextField(50),
    scenario: optionalTextField(),
    goal: optionalTextField(150),
    constraints: optionalTextField(150)
  })
  .strict();

function buildPrompt(task) {
  return [
    task.product ? `产品：${task.product}` : "",
    task.user ? `用户：${task.user}` : "",
    task.scenario ? `场景：${task.scenario}` : "",
    task.goal ? `目标：${task.goal}` : "",
    task.constraints ? `约束条件：${task.constraints}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

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

function buildTaskFromStructuredPayload(taskPayload) {
  const parsed = structuredTaskSchema.safeParse(taskPayload);

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
    prompt: buildPrompt(normalized),
    styleTags: [],
    emotionTags: [],
    existingIdeas: "",
    avoidDirections: "",
    notes: ""
  };
}

export function parseGenerateTaskPayload(body) {
  const promptPayload = body?.prompt;
  const taskPayload = body?.task ?? body;

  if (typeof promptPayload === "string") {
    const parsedPrompt = promptSchema.safeParse(promptPayload);

    if (!parsedPrompt.success) {
      throw new HttpError(
        400,
        parsedPrompt.error.issues[0]?.message || "请求参数不合法",
        parsedPrompt.error.flatten()
      );
    }

    return buildTaskFromPrompt(parsedPrompt.data);
  }

  return buildTaskFromStructuredPayload(taskPayload);
}
