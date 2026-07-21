'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { gameAudio } from '@/lib/audio';
import {
  ACHIEVEMENT_BY_ID,
  type AchievementId,
} from '@/lib/quests/achievements';
import { FIRST_QUEST_ID } from '@/lib/quests';
import { LEARNING_MATERIAL_IDS, type LearningMaterialId } from '@/lib/quests/materials';
import { advanceQuest } from '@/lib/quests/runner';
import type { QuestEvent } from '@/lib/quests/schema';
import type { NpcPersonaId } from '@/lib/ai/personas';

export type QuestToast = {
  id: string;
  kind: 'chapter' | 'achievement' | 'story';
  message: string;
};

type QuestStore = {
  activeQuestId: string | null;
  currentSubTaskIndex: number;
  completedQuestIds: string[];
  unlockedAchievementIds: AchievementId[];
  readMaterialIds: LearningMaterialId[];
  askedNpcIds: NpcPersonaId[];
  objectivePulse: number;
  toasts: QuestToast[];
  dispatchQuestEvent: (event: QuestEvent) => void;
  recordNpcQuestion: (personaId: NpcPersonaId) => void;
  markMaterialRead: (materialId: LearningMaterialId) => void;
  dismissToast: (toastId: string) => void;
  restartStory: () => void;
};

const INITIAL_PROGRESS = {
  activeQuestId: FIRST_QUEST_ID,
  currentSubTaskIndex: 0,
  completedQuestIds: [] as string[],
  unlockedAchievementIds: [] as AchievementId[],
  readMaterialIds: [] as LearningMaterialId[],
  askedNpcIds: [] as NpcPersonaId[],
};

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_PROGRESS,
      objectivePulse: 0,
      toasts: [],
      dispatchQuestEvent: (event) => {
        const state = get();
        const result = advanceQuest(
          {
            activeQuestId: state.activeQuestId,
            currentSubTaskIndex: state.currentSubTaskIndex,
            completedQuestIds: state.completedQuestIds,
          },
          event,
        );
        if (!result.advanced) return;

        gameAudio.objectiveDing();
        const unlockedAchievementIds = [...state.unlockedAchievementIds];
        const toasts = [...state.toasts];
        if (result.completedQuest) {
          const achievementId = result.completedQuest.achievementId as AchievementId;
          if (!unlockedAchievementIds.includes(achievementId)) {
            unlockedAchievementIds.push(achievementId);
          }
          toasts.push({
            id: `chapter-${result.completedQuest.id}-${Date.now()}`,
            kind: result.completedQuest.unlocks.length ? 'chapter' : 'story',
            message: result.completedQuest.completionMessage
              ?? `Chapter complete: ${result.completedQuest.title}`,
          });
          toasts.push({
            id: `achievement-${achievementId}-${Date.now()}`,
            kind: 'achievement',
            message: `Achievement unlocked: ${ACHIEVEMENT_BY_ID[achievementId].label}`,
          });
        }

        set({
          activeQuestId: result.activeQuestId,
          currentSubTaskIndex: result.currentSubTaskIndex,
          completedQuestIds: result.completedQuestIds,
          unlockedAchievementIds,
          objectivePulse: state.objectivePulse + 1,
          toasts: toasts.slice(-5),
        });
      },
      recordNpcQuestion: (personaId) => {
        get().dispatchQuestEvent({ type: 'talked-to-npc', npcId: personaId, interaction: 'question' });
        const state = get();
        if (state.askedNpcIds.includes(personaId)) return;
        const askedNpcIds = [...state.askedNpcIds, personaId];
        const unlockCuriousMind = askedNpcIds.length >= 3
          && !state.unlockedAchievementIds.includes('curious-mind');
        set({
          askedNpcIds,
          unlockedAchievementIds: unlockCuriousMind
            ? [...state.unlockedAchievementIds, 'curious-mind']
            : state.unlockedAchievementIds,
          toasts: unlockCuriousMind
            ? [...state.toasts, {
                id: `achievement-curious-mind-${Date.now()}`,
                kind: 'achievement' as const,
                message: `Achievement unlocked: ${ACHIEVEMENT_BY_ID['curious-mind'].label}`,
              }].slice(-5)
            : state.toasts,
        });
        if (unlockCuriousMind) gameAudio.objectiveDing();
      },
      markMaterialRead: (materialId) => {
        const state = get();
        if (state.readMaterialIds.includes(materialId)) {
          state.dispatchQuestEvent({ type: 'read-material', materialId });
          return;
        }
        const readMaterialIds = [...state.readMaterialIds, materialId];
        const unlockFieldResearcher = LEARNING_MATERIAL_IDS.every((id) => readMaterialIds.includes(id))
          && !state.unlockedAchievementIds.includes('field-researcher');
        set({
          readMaterialIds,
          unlockedAchievementIds: unlockFieldResearcher
            ? [...state.unlockedAchievementIds, 'field-researcher']
            : state.unlockedAchievementIds,
          toasts: unlockFieldResearcher
            ? [...state.toasts, {
                id: `achievement-field-researcher-${Date.now()}`,
                kind: 'achievement' as const,
                message: `Achievement unlocked: ${ACHIEVEMENT_BY_ID['field-researcher'].label}`,
              }].slice(-5)
            : state.toasts,
        });
        get().dispatchQuestEvent({ type: 'read-material', materialId });
        if (unlockFieldResearcher) gameAudio.objectiveDing();
      },
      dismissToast: (toastId) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== toastId) })),
      restartStory: () => {
        gameAudio.objectiveDing();
        set({
          ...INITIAL_PROGRESS,
          objectivePulse: get().objectivePulse + 1,
          toasts: [{
            id: `story-restarted-${Date.now()}`,
            kind: 'chapter',
            message: 'Story restarted: Welcome to Bunsen',
          }],
        });
      },
    }),
    {
      name: 'bunsen-story-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeQuestId: state.activeQuestId,
        currentSubTaskIndex: state.currentSubTaskIndex,
        completedQuestIds: state.completedQuestIds,
        unlockedAchievementIds: state.unlockedAchievementIds,
        readMaterialIds: state.readMaterialIds,
        askedNpcIds: state.askedNpcIds,
      }),
    },
  ),
);
