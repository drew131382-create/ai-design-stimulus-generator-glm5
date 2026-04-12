import { generateStimuli } from "./aiService.js";
import { attachSemanticDistance } from "./semanticDistanceService.js";

export async function executeGenerationTask(task) {
  const groupedStimuli = await generateStimuli(task);
  const result = await attachSemanticDistance(task, groupedStimuli);

  return {
    task,
    ...result
  };
}
