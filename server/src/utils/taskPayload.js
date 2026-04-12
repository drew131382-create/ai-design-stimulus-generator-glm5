import { z } from "zod";
import { HttpError } from "./httpError.js";

const promptSchema = z
  .string({ required_error: "???????" })
  .trim()
  .min(2, "????? 2 ??")
  .max(4000, "???????? 4000 ??");

function requiredTextField(label, min, max) {
  return z
    .string({ required_error: `${label} ????` })
    .trim()
    .min(min, `${label} ? ${min}-${max} ?`)
    .max(max, `${label} ? ${min}-${max} ?`);
}

function optionalTextField(max) {
  let schema = z.string().trim();

  if (typeof max === "number") {
    schema = schema.max(max, `???????? ${max} ?`);
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
    task.product ? `???${task.product}` : "",
    task.user ? `???${task.user}` : "",
    task.scenario ? `???${task.scenario}` : "",
    task.goal ? `???${task.goal}` : "",
    task.constraints ? `?????${task.constraints}` : ""
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
    constraints: "?????",
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
      parsed.error.issues[0]?.message || "???????",
      parsed.error.flatten()
    );
  }

  const normalized = {
    ...parsed.data,
    goal: parsed.data.goal || parsed.data.scenario || parsed.data.product,
    constraints: parsed.data.constraints || "?????"
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
        parsedPrompt.error.issues[0]?.message || "???????",
        parsedPrompt.error.flatten()
      );
    }

    return buildTaskFromPrompt(parsedPrompt.data);
  }

  return buildTaskFromStructuredPayload(taskPayload);
}
