import type { Experiment, ExperimentOutcome } from './schema';

export type ExperimentStatus = 'ready' | 'running' | 'complete';

export type ExperimentActionRecord = {
  experimentId: string;
  stepId: string;
  actionId: string;
  actionLabel: string;
  timestamp: number;
  outcomeType: ExperimentOutcome['type'] | null;
};

export type ExperimentRunnerState = {
  status: ExperimentStatus;
  stepIndex: number;
  completedStepIds: string[];
  observations: string[];
  actionHistory: ExperimentActionRecord[];
  lastOutcome: ExperimentOutcome | null;
};

export const INITIAL_RUNNER_STATE: ExperimentRunnerState = {
  status: 'ready',
  stepIndex: 0,
  completedStepIds: [],
  observations: [],
  actionHistory: [],
  lastOutcome: null,
};

export function runExperimentAction(
  experiment: Experiment,
  state: ExperimentRunnerState,
  actionId: string,
  timestamp = Date.now(),
) {
  if (state.status === 'complete') return { state, outcome: null };

  const step = experiment.steps[state.stepIndex];
  const action = step?.actions.find((candidate) => candidate.id === actionId);
  if (!step || !action) return { state, outcome: null };

  const outcome =
    experiment.outcomes.find(
      (candidate) =>
        candidate.atStepId === step.id && candidate.firedByActionId === action.id,
    ) ?? null;
  const correct = step.correctActionIds?.includes(action.id) ?? action.id === step.correctActionId;
  const completedStepIds = correct
    ? Array.from(new Set([...state.completedStepIds, step.id]))
    : state.completedStepIds;
  const nextStepIndex = correct
    ? Math.min(state.stepIndex + 1, experiment.steps.length)
    : state.stepIndex;
  const complete = nextStepIndex >= experiment.steps.length;
  const observation = outcome?.message ??
    (correct
      ? `${action.label}: evidence recorded.`
      : `${action.label}: the result does not yet answer the step's question.`);

  const nextState: ExperimentRunnerState = {
    status: complete ? 'complete' : 'running',
    stepIndex: complete ? experiment.steps.length - 1 : nextStepIndex,
    completedStepIds,
    observations: [...state.observations, observation].slice(-8),
    actionHistory: [
      ...state.actionHistory,
      {
        experimentId: experiment.id,
        stepId: step.id,
        actionId: action.id,
        actionLabel: action.label,
        timestamp,
        outcomeType: outcome?.type ?? null,
      },
    ].slice(-30),
    lastOutcome: outcome,
  };

  return { state: nextState, outcome };
}
