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

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(typeof text === "string" ? text : "");
}

export function buildStimulusMessages(task) {
  const promptText = typeof task.prompt === "string" ? task.prompt.trim() : "";
  const enforceChinese = containsChinese(promptText);
  const systemPrompt = `
You are a design stimulus generator.

Return only JSON.
Do not return markdown.
Do not add explanation text outside JSON.
Do not wrap the response in code fences.

The JSON schema must be:
{
  "near": [{"word":"","explanation":"","direction":""}],
  "medium": [{"word":"","explanation":"","direction":""}],
  "far": [{"word":"","explanation":"","direction":""}]
}

Rules:
- near must contain exactly 10 items.
- medium must contain exactly 10 items.
- far must contain exactly 10 items.
- The 30 words across near, medium, and far must be globally unique.
- Before outputting JSON, self-check all 30 words and replace any duplicate word.
- word must be short, concrete, and no longer than 4 characters.
- explanation must explain what the stimulus word means or refers to.
- direction must explain how this stimulus can inspire the current design task.
- direction must be specific to the current task, not a generic definition.
- direction must not repeat explanation with slightly different wording.
- explanation and direction must each be one concise sentence.
- Output language must follow the user's input language.
- If the user's input is Chinese, every word, explanation, and direction must be written in natural Chinese.
- If the user's input is Chinese, do not output English words, English labels, or transliterated English terms.
- near = close-range stimuli related to product function, technical solution, performance, structure, and product usability.
- medium = mid-range stimuli related to user scenario, usage context, user experience, interaction behavior, and service touchpoints.
- far = long-range stimuli from completely different domains, using metaphor or analogy to encourage cross-domain innovation.
- Do not use templates or canned lists.
- Generate dynamically from the user's request.
`.trim();

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

${enforceChinese ? "Important: The input is Chinese. Every candidate word, explanation, and direction must be in Chinese only." : ""}
Classification target:
- near: 近距离刺激，和产品功能、技术方案、性能、结构、产品可用性直接相关。
- medium: 中距离刺激，和用户场景、使用情境、用户体验、交互行为、服务触点相关。
- far: 远距离刺激，来自完全不同领域，采用隐喻或类比，鼓励跨领域创新。

When writing each item:
- word = at most 4 characters.
- explanation = explain the word itself.
- direction = explain how to use this stimulus in the current design task.
- explanation and direction must be clearly different.

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
      "Return valid JSON only. Ensure near, medium, and far each contain exactly 10 items, and all 30 words are globally unique across all groups. Before outputting JSON, self-check and replace any duplicated word. Every item must include word, explanation, and direction. Keep every word within 4 characters. Explanation must define the stimulus itself. Direction must explain how it can inspire the current task. They must not repeat each other. If the original input is Chinese, output Chinese only. Follow the near/medium/far classification strictly."
  };
}
