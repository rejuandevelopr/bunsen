import { z } from 'zod';

export const VISUAL_EFFECT_KEYS = [
  'bubbles',
  'color-shift',
  'glow',
  'precipitate',
  'steam',
  'float',
  'sink',
  'sparkle',
  'flash',
] as const;

export const EQUIPMENT_PROP_REFS = [
  'flask',
  'labEquipment',
  'microscope',
  'workbench',
  'table',
  'bookcase',
  'cabinet',
  'stool',
  'sink',
  'plant',
  'rug',
  'astronaut',
  'armature',
  'lavaLamp',
  'testTube',
  'scienceTubes',
  'extinguisher',
  'gauge',
  'bunsenBurner',
  'moonBall',
] as const;

const IdentifierSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case identifiers.');

export const ExperimentActionSchema = z
  .object({
    id: IdentifierSchema,
    label: z.string().min(2).max(72),
    description: z.string().min(4).max(180),
    equipmentRef: z.enum(EQUIPMENT_PROP_REFS),
    effectKey: z.enum(VISUAL_EFFECT_KEYS).nullable(),
  })
  .strict();

export const ExperimentStepSchema = z
  .object({
    id: IdentifierSchema,
    title: z.string().min(2).max(72),
    prompt: z.string().min(8).max(240),
    actions: z.array(ExperimentActionSchema).min(2).max(4),
    correctActionId: IdentifierSchema,
    correctActionIds: z.array(IdentifierSchema).min(1).max(4).optional(),
  })
  .strict();

export const ExperimentOutcomeSchema = z
  .object({
    id: IdentifierSchema,
    type: z.enum(['success', 'failure', 'surprise']),
    atStepId: IdentifierSchema,
    firedByActionId: IdentifierSchema,
    title: z.string().min(2).max(72),
    message: z.string().min(8).max(220),
    explanation: z.string().min(12).max(420),
    effectKey: z.enum(VISUAL_EFFECT_KEYS),
  })
  .strict();

export const ExperimentWireSchema = z
  .object({
    id: IdentifierSchema,
    title: z.string().min(3).max(80),
    question: z.string().min(6).max(160),
    objective: z.string().min(8).max(160),
    summary: z.string().min(12).max(320),
    station: z.literal('experiment-bench'),
    ageRange: z.string().min(3).max(24),
    estimatedMinutes: z.number().int().min(4).max(30),
    equipment: z.array(z.enum(EQUIPMENT_PROP_REFS)).min(1).max(8),
    steps: z.array(ExperimentStepSchema).min(3).max(5),
    outcomes: z.array(ExperimentOutcomeSchema).min(3).max(10),
  })
  .strict();

export const ExperimentSchema = ExperimentWireSchema.superRefine((experiment, context) => {
  const stepIds = new Set<string>();
  const actionIds = new Set<string>();

  experiment.steps.forEach((step, stepIndex) => {
    if (stepIds.has(step.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['steps', stepIndex, 'id'],
        message: 'Step IDs must be unique.',
      });
    }
    stepIds.add(step.id);

    const localActionIds = new Set(step.actions.map((action) => action.id));
    if (!localActionIds.has(step.correctActionId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['steps', stepIndex, 'correctActionId'],
        message: 'correctActionId must reference an action in the same step.',
      });
    }
    step.correctActionIds?.forEach((actionId, actionIndex) => {
      if (!localActionIds.has(actionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['steps', stepIndex, 'correctActionIds', actionIndex],
          message: 'Every correctActionIds entry must reference an action in the same step.',
        });
      }
    });

    step.actions.forEach((action, actionIndex) => {
      if (actionIds.has(action.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['steps', stepIndex, 'actions', actionIndex, 'id'],
          message: 'Action IDs must be unique across the experiment.',
        });
      }
      actionIds.add(action.id);
    });
  });

  experiment.outcomes.forEach((outcome, outcomeIndex) => {
    const step = experiment.steps.find((candidate) => candidate.id === outcome.atStepId);
    if (!step) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcomes', outcomeIndex, 'atStepId'],
        message: 'Outcome must reference an existing step.',
      });
      return;
    }
    if (!step.actions.some((action) => action.id === outcome.firedByActionId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcomes', outcomeIndex, 'firedByActionId'],
        message: 'Outcome must reference an action in its referenced step.',
      });
    }
  });

  for (const requiredType of ['failure', 'surprise'] as const) {
    if (!experiment.outcomes.some((outcome) => outcome.type === requiredType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcomes'],
        message: `At least one ${requiredType} outcome is required.`,
      });
    }
  }
});

export type Experiment = z.infer<typeof ExperimentSchema>;
export type ExperimentAction = z.infer<typeof ExperimentActionSchema>;
export type ExperimentOutcome = z.infer<typeof ExperimentOutcomeSchema>;

export const EXPERIMENT_SCHEMA_DESCRIPTION = `
Experiment is a strict JSON object. No additional fields are allowed.
- id: 2-48 character lowercase kebab-case identifier.
- title: 3-80 characters.
- question: the learner's science question, 6-160 characters.
- objective: a concrete learner-facing objective, 8-160 characters.
- summary: factual overview, 12-320 characters.
- station: exactly "experiment-bench".
- ageRange: short classroom age or grade range, 3-24 characters.
- estimatedMinutes: integer from 4 to 30.
- equipment: 1-8 unique values from the supplied equipment prop reference list.
- steps: 3-5 ordered steps. Every step has a unique kebab-case id, title, 8-240 character prompt, 2-4 actions, and correctActionId matching one action in that step. An optional correctActionIds array may identify multiple valid actions in the same step.
- actions: globally unique kebab-case id, learner-facing label, 4-180 character description, one allowed equipmentRef, and effectKey set to an allowed key or null.
- outcomes: 3-10 outcomes. Each has a unique kebab-case id, type success|failure|surprise, atStepId and firedByActionId that reference the same step, title, learner-facing message, factual explanation, and allowed effectKey.
- The complete experiment must contain at least one failure outcome and one surprise outcome.
`.trim();
