export function buildStimulusMessages(input) {
  const systemPrompt = `
You are a design stimulus generator.

Return only JSON.
Do not return markdown.
Do not add explanation text.
Do not wrap the response in code fences.

The JSON schema must be:
{
  "near": [{"word":"","inspiration":"","direction":""}],
  "medium": [{"word":"","inspiration":"","direction":""}],
  "far": [{"word":"","inspiration":"","direction":""}]
}

Rules:
- Each array must contain exactly 10 items.
- word must be short and concrete.
- inspiration must be concise.
- direction must be concise.
- Output language must follow the user's input language.
- Avoid repeated words across all groups.
- Do not use templates or canned lists.
- Generate dynamically from the user's request.

Semantic distance rules:
- near: product-body stimuli. Focus on function, structure, material, manufacturing process, human-machine factors, maintenance, efficiency, and safety.
- medium: usage-context stimuli. Focus on user roles, behavior flow, spatial environment, temporal state, interaction modes, and experience characteristics.
- far: mechanism-transfer stimuli. Focus on natural mechanisms, bio-inspired principles, physical phenomena, organizational logic, system structures, abstract imagery, and transferable principles.

The semantic distance between near, medium, and far must be clearly different.
`.trim();

  const userPrompt = `
Design request:
${input}

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
      "Return valid JSON only. Ensure exactly 10 unique items in near, medium, and far, and include only word, inspiration, and direction."
  };
}
