function formatOptionalField(label, value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return `${label}: ${value.trim()}`;
}

function formatOptionalTags(label, tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return "";
  }

  const normalizedTags = tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);

  if (normalizedTags.length === 0) {
    return "";
  }

  return `${label}: ${normalizedTags.join(", ")}`;
}

export function buildStimulusMessages(task) {
  const systemPrompt = `
You are a design stimulus generator.

Return only JSON.
Do not return markdown.
Do not add explanation text.
Do not wrap the response in code fences.

The JSON schema must be:
{
  "candidates": [{"word":"","explanation":"","inspiration":"","direction":""}]
}

Rules:
- candidates must contain exactly 30 items.
- word must be short and concrete.
- explanation must be one concise sentence.
- inspiration must be concise.
- direction must be concise.
- Output language must follow the user's input language.
- Do not classify candidates into near, medium, or far.
- Avoid repeated words across all candidates.
- Do not use templates or canned lists.
- Generate dynamically from the user's request.
`.trim();

  const userPrompt = `
Design request:
${[
  `product: ${task.product}`,
  `user: ${task.user}`,
  `scenario: ${task.scenario}`,
  `goal: ${task.goal}`,
  `constraints: ${task.constraints}`,
  formatOptionalTags("styleTags", task.styleTags),
  formatOptionalTags("emotionTags", task.emotionTags),
  formatOptionalField("existingIdeas", task.existingIdeas),
  formatOptionalField("avoidDirections", task.avoidDirections),
  formatOptionalField("notes", task.notes)
]
  .filter(Boolean)
  .join("\n")}

Generate structured design stimuli that strictly follow the schema.
`.trim();

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
}

export function buildRetryMessage() {
  return {
    role: "user",
    content:
      "Return valid JSON only. Ensure exactly 30 unique items in candidates. Do not classify them. Every item must include word and explanation."
  };
}
