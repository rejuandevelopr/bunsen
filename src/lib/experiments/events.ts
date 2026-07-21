import type { Experiment, ExperimentOutcome } from './schema';
import type { ExperimentRunnerState } from './runner';

export type OutcomeReachedEvent = {
  experiment: Experiment;
  outcome: ExperimentOutcome;
  state: ExperimentRunnerState;
};

type OutcomeListener = (event: OutcomeReachedEvent) => void;
const outcomeListeners = new Set<OutcomeListener>();

export function emitOutcomeReached(event: OutcomeReachedEvent) {
  if (process.env.NODE_ENV === 'development') {
    console.info('[Bunsen:outcome]', event.outcome.type, event.outcome.id);
  }
  outcomeListeners.forEach((listener) => listener(event));
}

export function onOutcomeReached(listener: OutcomeListener) {
  outcomeListeners.add(listener);
  return () => {
    outcomeListeners.delete(listener);
  };
}
