import storyData from './story.json';
import { QuestChainSchema } from './schema';

export const QUESTS = QuestChainSchema.parse(storyData);
export const FIRST_QUEST_ID = QUESTS[0].id;

export const QUEST_BY_ID = Object.fromEntries(
  QUESTS.map((quest) => [quest.id, quest]),
) as Record<(typeof QUESTS)[number]['id'], (typeof QUESTS)[number]>;

export function questById(id: string | null) {
  return id ? QUESTS.find((quest) => quest.id === id) ?? null : null;
}
