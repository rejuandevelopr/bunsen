'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import demoIceData from '@/lib/experiments/demo-ice-density.json';
import { emitOutcomeReached } from '@/lib/experiments/events';
import {
  INITIAL_RUNNER_STATE,
  runExperimentAction,
  type ExperimentRunnerState,
} from '@/lib/experiments/runner';
import { ExperimentSchema, type Experiment } from '@/lib/experiments/schema';
import titrationData from '@/lib/experiments/titration.json';
import flameTestData from '@/lib/experiments/flame-test.json';
import moonGravityData from '@/lib/experiments/moon-gravity.json';
import type { NpcPersonaId } from '@/lib/ai/personas';
import { useQuestStore } from '@/store/quest-store';

export const TITRATION_EXPERIMENT = ExperimentSchema.parse(titrationData);
export const DEMO_ICE_EXPERIMENT = ExperimentSchema.parse(demoIceData);
export const FLAME_TEST_EXPERIMENT = ExperimentSchema.parse(flameTestData);
export const MOON_GRAVITY_EXPERIMENT = ExperimentSchema.parse(moonGravityData);

type ExperimentStore = ExperimentRunnerState & {
  currentExperiment: Experiment;
  completedExperiments: CompletedExperimentSummary[];
  lastGeneratedExperiment: Experiment | null;
  lastGenerationUsage: AiUsage | null;
  loadExperiment: (experiment: Experiment, generated?: boolean, usage?: AiUsage | null) => void;
  runAction: (actionId: string) => void;
  resetExperiment: () => void;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  demo: boolean;
  personaId?: NpcPersonaId;
  model?: string;
};

export type CompletedExperimentSummary = {
  id: string;
  title: string;
  completedAt: number;
};

export const useExperimentStore = create<ExperimentStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_RUNNER_STATE,
      currentExperiment: TITRATION_EXPERIMENT,
      completedExperiments: [],
      lastGeneratedExperiment: null,
      lastGenerationUsage: null,
      loadExperiment: (experiment, generated = false, usage = null) =>
        set({
          ...INITIAL_RUNNER_STATE,
          currentExperiment: experiment,
          lastGeneratedExperiment: generated ? experiment : get().lastGeneratedExperiment,
          lastGenerationUsage: generated ? usage : get().lastGenerationUsage,
        }),
      runAction: (actionId) => {
        const current = get();
        const result = runExperimentAction(current.currentExperiment, current, actionId);
        const completedExperiments =
          result.state.status === 'complete' && current.status !== 'complete'
            ? [
                ...current.completedExperiments.filter(
                  (experiment) => experiment.id !== current.currentExperiment.id,
                ),
                {
                  id: current.currentExperiment.id,
                  title: current.currentExperiment.title,
                  completedAt: Date.now(),
                },
              ].slice(-12)
            : current.completedExperiments;
        set({ ...result.state, completedExperiments });
        if (result.outcome) {
          if (result.outcome.type !== 'success' || result.state.status === 'complete') {
            useQuestStore.getState().dispatchQuestEvent({
              type: 'experiment-outcome',
              experimentId: current.currentExperiment.id,
              outcomeType: result.outcome.type,
              generated: current.lastGeneratedExperiment?.id === current.currentExperiment.id,
            });
          }
          emitOutcomeReached({
            experiment: current.currentExperiment,
            outcome: result.outcome,
            state: result.state,
          });
        }
      },
      resetExperiment: () => set(INITIAL_RUNNER_STATE),
    }),
    {
      name: 'bunsen-generated-experiment',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastGeneratedExperiment: state.lastGeneratedExperiment,
        lastGenerationUsage: state.lastGenerationUsage,
        completedExperiments: state.completedExperiments,
      }),
    },
  ),
);
