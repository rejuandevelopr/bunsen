import { z } from 'zod';

const ZoneIdSchema = z.enum(['study', 'chemistry', 'greenhouse', 'instrument', 'discovery']);

export const QuestTriggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('talked-to-npc'),
    npcId: z.string().min(2),
    interaction: z.enum(['opened', 'question']).default('opened'),
  }),
  z.object({ type: z.literal('station-opened'), stationId: z.string().min(2) }),
  z.object({
    type: z.literal('experiment-outcome'),
    experimentId: z.string().min(2),
    outcomeType: z.enum(['success', 'failure', 'surprise']),
  }),
  z.object({ type: z.literal('reached-zone'), zoneId: ZoneIdSchema }),
  z.object({ type: z.literal('read-material'), materialId: z.string().min(2) }),
  z.object({ type: z.literal('experiment-generated') }),
]);

export const QuestSubTaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(8).max(140),
  targetZone: ZoneIdSchema,
  trigger: QuestTriggerSchema,
});

export const QuestDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  chapter: z.number().int().min(1).max(5),
  title: z.string().min(3).max(72),
  zone: ZoneIdSchema,
  objectiveText: z.string().min(8).max(160),
  subTasks: z.array(QuestSubTaskSchema).min(1).max(8),
  unlocks: z.array(z.string()).max(1),
  achievementId: z.string().min(2),
  completionMessage: z.string().min(4).max(100).optional(),
});

export const QuestChainSchema = z.array(QuestDefinitionSchema).length(5);

export type QuestTrigger = z.infer<typeof QuestTriggerSchema>;
export type QuestSubTask = z.infer<typeof QuestSubTaskSchema>;
export type QuestDefinition = z.infer<typeof QuestDefinitionSchema>;

export type QuestEvent =
  | { type: 'talked-to-npc'; npcId: string; interaction: 'opened' | 'question' }
  | { type: 'station-opened'; stationId: string }
  | {
      type: 'experiment-outcome';
      experimentId: string;
      outcomeType: 'success' | 'failure' | 'surprise';
      generated?: boolean;
    }
  | { type: 'reached-zone'; zoneId: z.infer<typeof ZoneIdSchema> }
  | { type: 'read-material'; materialId: string }
  | { type: 'experiment-generated'; experimentId: string };
