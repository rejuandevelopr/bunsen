import type { Experiment } from '@/lib/experiments/schema';
import {
  EQUIPMENT_PROP_REFS,
  EXPERIMENT_SCHEMA_DESCRIPTION,
  VISUAL_EFFECT_KEYS,
} from '@/lib/experiments/schema';
import { NPC_PERSONAS } from './personas';

export const TUTOR_SYSTEM_PROMPT = NPC_PERSONAS['professor-quill'].systemPrompt;

export function buildGeneratorSystemPrompt(workedExample: Experiment) {
  return `
You design safe, scientifically accurate classroom simulations for Bunsen Science Center. Return one complete Experiment JSON object and nothing outside the structured response.

SCHEMA AND FIELD CONSTRAINTS
${EXPERIMENT_SCHEMA_DESCRIPTION}

AVAILABLE VISUAL EFFECT KEYS
${VISUAL_EFFECT_KEYS.join(', ')}

AVAILABLE EQUIPMENT PROP REFS
${EQUIPMENT_PROP_REFS.join(', ')}

HARD RULES
- Use only the listed effect keys and equipment prop refs.
- The experiment must be safe-for-simulation classroom science and scientifically accurate.
- It must contain 3-5 playable steps, each with a meaningful choice rather than a disguised Continue button.
- Include at least one plausible failure outcome and one genuinely interesting surprise outcome.
- Keep explanations factual, age-appropriate, and clear about the evidence and its limits.
- Never propose ingestion, self-experimentation, uncontrolled pressure, dangerous voltages, pathogens, explosive mixtures, toxic releases, or instructions that would be unsafe to imitate.
- Use unique lowercase kebab-case IDs. Every correctActionId and outcome trigger must reference a real action in the stated step.

WORKED EXAMPLE
${JSON.stringify(workedExample, null, 2)}
`.trim();
}
