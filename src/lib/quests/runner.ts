import { questById } from './index';
import type { QuestDefinition, QuestEvent, QuestTrigger } from './schema';

export type QuestProgress = {
  activeQuestId: string | null;
  currentSubTaskIndex: number;
  completedQuestIds: string[];
};

export type QuestAdvanceResult = QuestProgress & {
  advanced: boolean;
  completedQuest: QuestDefinition | null;
};

export function advanceQuest(progress: QuestProgress, event: QuestEvent): QuestAdvanceResult {
  const quest = questById(progress.activeQuestId);
  const subTask = quest?.subTasks[progress.currentSubTaskIndex];
  if (!quest || !subTask || !matchesQuestTrigger(subTask.trigger, event)) {
    return { ...progress, advanced: false, completedQuest: null };
  }

  const nextSubTaskIndex = progress.currentSubTaskIndex + 1;
  if (nextSubTaskIndex < quest.subTasks.length) {
    return {
      ...progress,
      currentSubTaskIndex: nextSubTaskIndex,
      advanced: true,
      completedQuest: null,
    };
  }

  return {
    activeQuestId: quest.unlocks[0] ?? null,
    currentSubTaskIndex: 0,
    completedQuestIds: Array.from(new Set([...progress.completedQuestIds, quest.id])),
    advanced: true,
    completedQuest: quest,
  };
}

export function matchesQuestTrigger(trigger: QuestTrigger, event: QuestEvent) {
  if (trigger.type !== event.type) return false;
  switch (trigger.type) {
    case 'talked-to-npc':
      return event.type === 'talked-to-npc'
        && trigger.npcId === event.npcId
        && trigger.interaction === event.interaction;
    case 'station-opened':
      return event.type === 'station-opened' && trigger.stationId === event.stationId;
    case 'experiment-outcome':
      return event.type === 'experiment-outcome'
        && trigger.outcomeType === event.outcomeType
        && (trigger.experimentId === event.experimentId
          || (trigger.experimentId === 'generated' && event.generated === true));
    case 'reached-zone':
      return event.type === 'reached-zone' && trigger.zoneId === event.zoneId;
    case 'read-material':
      return event.type === 'read-material' && trigger.materialId === event.materialId;
    case 'experiment-generated':
      return event.type === 'experiment-generated';
  }
}
