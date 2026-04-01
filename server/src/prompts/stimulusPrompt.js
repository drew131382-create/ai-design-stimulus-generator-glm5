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
  "candidates": [{"word":"","explanation":""}]
}

Rules:
- candidates must contain at least 40 items.
- word must be short and concrete.
- explanation must be one concise sentence.
- Output language must follow the user's input language.
- Do not classify candidates into near, medium, or far.
- Avoid repeated words across all candidates.
- Do not use templates or canned lists.
- Generate dynamically from the user's request.
`.trim();

  const promptText = typeof task.prompt === "string" ? task.prompt.trim() : "";
  const detailLines = [
    task.product ? `product: ${task.product}` : "",
    task.user ? `user: ${task.user}` : "",
    task.scenario ? `scenario: ${task.scenario}` : "",
    task.goal ? `goal: ${task.goal}` : "",
    task.constraints ? `constraints: ${task.constraints}` : "",
    formatOptionalTags("styleTags", task.styleTags),
    formatOptionalTags("emotionTags", task.emotionTags),
    formatOptionalField("existingIdeas", task.existingIdeas),
    formatOptionalField("avoidDirections", task.avoidDirections),
    formatOptionalField("notes", task.notes)
  ].filter(Boolean);

  const userPrompt = `
Design request:
${promptText ? `prompt: ${promptText}\n` : ""}${detailLines.join("\n")}

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
      "Return valid JSON only. Ensure at least 40 unique items in candidates. Do not classify them. Every item must include only word and explanation."
  };
}
