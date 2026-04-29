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

const DESIGN_DIMENSIONS = [
  "功能方向",
  "结构方向",
  "交互方向",
  "材料工艺方向",
  "造型语言方向",
  "使用场景方向",
  "用户情绪方向",
  "人机工程方向",
  "服务流程方向",
  "可持续方向"
];

function formatExcludeWords(words) {
  if (!Array.isArray(words)) {
    return "";
  }

  const normalizedWords = Array.from(
    new Set(
      words
        .map((word) => (typeof word === "string" ? word.trim() : ""))
        .filter(Boolean)
    )
  ).slice(0, 200);

  if (normalizedWords.length === 0) {
    return "";
  }

  return normalizedWords.join(", ");
}

export function buildStimulusMessages(task) {
  const promptText = typeof task.prompt === "string" ? task.prompt.trim() : "";
  const enforceChinese = containsChinese(promptText);
  const excludeWordsText = formatExcludeWords(task.excludeWords);
  const designDimensionsText = DESIGN_DIMENSIONS.join(", ");
  const systemPrompt = `
You are a design stimulus generator.

Return only JSON.
Do not return markdown.
Do not add explanation text outside JSON.
Do not wrap the response in code fences.

The JSON schema must be:
{
  "near": [{"word":"","semanticDistance":"near","designDimension":"","reason":""}],
  "medium": [{"word":"","semanticDistance":"medium","designDimension":"","reason":""}],
  "far": [{"word":"","semanticDistance":"far","designDimension":"","reason":""}]
}

Rules:
- near must contain exactly 10 items.
- medium must contain exactly 10 items.
- far must contain exactly 10 items.
- The 30 words across near, medium, and far must be globally unique.
- Before outputting JSON, self-check all 30 words and replace any duplicate word.
- word must be short, concrete, and no longer than 4 characters.
- semanticDistance must match the group key: near, medium, or far.
- designDimension must be exactly one of: ${designDimensionsText}.
- reason must explain in one concise sentence how this stimulus can help creative divergence for the current design task.
- Output language must follow the user's input language.
- If the user's input is Chinese, every word and reason must be written in natural Chinese.
- If the user's input is Chinese, do not output English words, English labels, or transliterated English terms.
- near = close-range stimuli related to product function, technical solution, performance, structure, and product usability.
- medium = mid-range stimuli related to user scenario, usage context, user experience, interaction behavior, and service touchpoints.
- far = long-range stimuli from completely different domains, using metaphor or analogy to encourage cross-domain innovation.
- Across all 30 items, cover as many of the 10 design dimensions as possible. Do not concentrate on only one or two dimensions.
- Avoid words that already appeared in previous generations. Also avoid highly similar variants of those words.
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

Previously generated words to avoid:
${excludeWordsText || "None"}

${enforceChinese ? "Important: The input is Chinese. Every candidate word and reason must be in Chinese only." : ""}
Classification target:
- near: 近距离刺激，和产品功能、技术方案、性能、结构、产品可用性直接相关。
- medium: 中距离刺激，和用户场景、使用情境、用户体验、交互行为、服务触点相关。
- far: 远距离刺激，来自完全不同领域，采用隐喻或类比，鼓励跨领域创新。

When writing each item:
- word = at most 4 characters.
- semanticDistance = near, medium, or far, matching the JSON group where the item is placed.
- designDimension = choose exactly one from: ${designDimensionsText}.
- reason = explain why this word can stimulate design thinking for this task.
- Do not output any word from the avoid list above.
- Do not output exact duplicates inside the same batch.

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
      "Return valid JSON only. Ensure near, medium, and far each contain exactly 10 items, and all 30 words are globally unique across all groups. Do not reuse any previously generated word from the avoid list. Every item must include word, semanticDistance, designDimension, and reason. semanticDistance must match its group key. designDimension must be one of the allowed design dimensions. Keep every word within 4 characters. If the original input is Chinese, output Chinese only except the near/medium/far JSON keys. Follow the near/medium/far classification strictly."
  };
}
