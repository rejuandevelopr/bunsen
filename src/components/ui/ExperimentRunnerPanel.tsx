'use client';

import { useEffect } from 'react';
import { PALETTE } from '@/lib/palette';
import {
  FLAME_TEST_EXPERIMENT,
  MOON_GRAVITY_EXPERIMENT,
  TITRATION_EXPERIMENT,
  useExperimentStore,
} from '@/store/experiment-store';
import { useLabStore } from '@/store/lab-store';

type ExperimentStationId = 'titration' | 'experiment' | 'instrument' | 'discovery';

const FIXED_EXPERIMENTS = {
  titration: TITRATION_EXPERIMENT,
  instrument: FLAME_TEST_EXPERIMENT,
  discovery: MOON_GRAVITY_EXPERIMENT,
} as const;

export function ExperimentRunnerPanel({ stationId }: { stationId: ExperimentStationId }) {
  const experiment = useExperimentStore((state) => state.currentExperiment);
  const generated = useExperimentStore((state) => state.lastGeneratedExperiment);
  const stepIndex = useExperimentStore((state) => state.stepIndex);
  const status = useExperimentStore((state) => state.status);
  const lastOutcome = useExperimentStore((state) => state.lastOutcome);
  const observations = useExperimentStore((state) => state.observations);
  const runAction = useExperimentStore((state) => state.runAction);
  const loadExperiment = useExperimentStore((state) => state.loadExperiment);
  const resetExperiment = useExperimentStore((state) => state.resetExperiment);
  const setObjective = useLabStore((state) => state.setObjective);
  const setSubtask = useLabStore((state) => state.setSubtask);

  useEffect(() => {
    const fixedExperiment = stationId === 'experiment' ? null : FIXED_EXPERIMENTS[stationId];
    if (fixedExperiment && experiment.id !== fixedExperiment.id) {
      loadExperiment(fixedExperiment);
      setObjective(fixedExperiment.objective);
    }
  }, [experiment.id, loadExperiment, setObjective, stationId]);

  useEffect(() => {
    if (status === 'complete') {
      setSubtask('Experiment complete — discuss your evidence');
      return;
    }
    const step = experiment.steps[stepIndex];
    if (step) setSubtask(`Step ${stepIndex + 1}: ${step.title}`);
  }, [experiment, setSubtask, status, stepIndex]);

  if (stationId === 'experiment' && !generated) {
    return (
      <div className="mt-5 border p-4 text-xs leading-relaxed" style={{ borderColor: PALETTE.furniture, color: PALETTE.paper }}>
        This flexible bench is ready for a generated investigation. Visit the Research Desk in the Study Hall and ask a science question first.
      </div>
    );
  }

  if (stationId === 'experiment' && generated && experiment.id !== generated.id) {
    return (
      <div className="mt-5 border p-4" style={{ borderColor: PALETTE.furniture }}>
        <p className="text-sm" style={{ color: PALETTE.paper }}>Your latest investigation is ready: {generated.title}.</p>
        <button
          type="button"
          onClick={() => {
            loadExperiment(generated);
            setObjective(generated.objective);
          }}
          className="mt-3 border px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
          style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
        >
          Load experiment
        </button>
      </div>
    );
  }

  const step = experiment.steps[stepIndex];
  if (!step) return null;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between text-[0.58rem] uppercase tracking-[0.16em]" style={{ color: PALETTE.paper }}>
        <span>{experiment.title}</span>
        <span>{status === 'complete' ? 'Complete' : `${stepIndex + 1} / ${experiment.steps.length}`}</span>
      </div>

      {status === 'complete' ? (
        <div className="border p-4" style={{ borderColor: PALETTE.accent1, color: PALETTE.paper }}>
          <p className="font-serif text-lg">Evidence collected</p>
          <p className="mt-2 text-xs leading-relaxed">{experiment.summary}</p>
          <button
            type="button"
            onClick={resetExperiment}
            className="mt-3 border px-3 py-2 text-[0.58rem] uppercase tracking-[0.14em]"
            style={{ borderColor: PALETTE.trim }}
          >
            Run again
          </button>
        </div>
      ) : (
        <div className="border p-4" style={{ borderColor: PALETTE.furniture }}>
          <p className="font-serif text-lg" style={{ color: PALETTE.paper }}>{step.title}</p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: PALETTE.paper }}>{step.prompt}</p>
          <div className="mt-4 grid gap-2">
            {step.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => runAction(action.id)}
                className="group border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:brightness-110"
                style={{ borderColor: PALETTE.trim, background: PALETTE.wood, color: PALETTE.paper }}
              >
                <span className="block text-xs font-semibold">{action.label}</span>
                <span className="mt-1 block text-[0.62rem] leading-relaxed opacity-80">{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {lastOutcome ? (
        <div
          aria-live="polite"
          className="border p-3 text-xs leading-relaxed"
          style={{
            borderColor: lastOutcome.type === 'failure' ? PALETTE.accent2 : PALETTE.accent1,
            color: PALETTE.paper,
          }}
        >
          <span className="font-semibold uppercase tracking-[0.12em]">{lastOutcome.title}</span>
          <span className="mt-1 block">{lastOutcome.message}</span>
        </div>
      ) : null}

      {observations.length ? (
        <details className="text-[0.62rem]" style={{ color: PALETTE.paper }}>
          <summary className="cursor-pointer uppercase tracking-[0.12em]">Observation log</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-4 opacity-80">
            {observations.map((observation, index) => <li key={`${index}-${observation}`}>{observation}</li>)}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
