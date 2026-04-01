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
- near = product ontology layer: function, structure, material, manufacturing, ergonomics, safety, efficiency.
- medium = usage scenario layer: user role, behavior flow, spatial environment, temporal state, interaction mode, experience trait.
- far = mechanism transfer layer: natural mechanism, bionic principle, physical phenomenon, organizational logic, system structure, abstract imagery, transferable principle.
- Avoid repeated words across all candidates.
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
- near: 产品本体层，围绕功能、结构、材料、制造、人机、安全、效率等直接生成。
- medium: 使用情境层，围绕用户角色、行为流程、空间环境、时间状态、交互方式、体验特征等生成。
- far: 机制迁移层，围绕自然机制、仿生原理、物理现象、组织逻辑、系统结构、抽象意象、可迁移原则等生成。

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
      "Return valid JSON only. Ensure near, medium, and far each contain exactly 10 unique items. Every item must include only word and explanation. Follow the three-layer classification strictly. If the original input is Chinese, output Chinese only."
  };
}
