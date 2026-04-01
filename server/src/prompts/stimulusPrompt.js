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
Do not add explanation text.
Do not wrap the response in code fences.

The JSON schema must be:
{
  "near": [{"word":"","explanation":""}],
  "medium": [{"word":"","explanation":""}],
  "far": [{"word":"","explanation":""}]
}

Rules:
- near must contain exactly 10 items.
- medium must contain exactly 10 items.
- far must contain exactly 10 items.
- word must be short and concrete.
- explanation must be one concise sentence.
- Output language must follow the user's input language.
- If the user's input is Chinese, every word and every explanation must be written in natural Chinese.
- If the user's input is Chinese, do not output English words, English labels, or transliterated English terms.
- near = Product-Core Stimuli: for function optimization, structural innovation, and material/process improvement.
- medium = Usage-Context Stimuli: for scenario reframing, interaction reframing, and experience innovation.
- far = Mechanism-Transfer Stimuli: for cross-domain analogy, principle borrowing, and system transfer.
- Avoid repeated words across all groups.
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

${enforceChinese ? "Important: The input is Chinese. Every candidate word and explanation must be in Chinese only." : ""}
Classification target:
- near: 产品本体刺激（Product-Core Stimuli），用于功能优化、结构创新、材料工艺改进。
- medium: 使用情境刺激（Usage-Context Stimuli），用于场景重构、交互重构、体验创新。
- far: 机制迁移刺激（Mechanism-Transfer Stimuli），用于跨领域类比、原理借鉴、系统迁移。

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
      "Return valid JSON only. Ensure near, medium, and far each contain exactly 10 unique items. Every item must include only word and explanation. Follow the Product-Core / Usage-Context / Mechanism-Transfer classification strictly. If the original input is Chinese, output Chinese only."
  };
}
