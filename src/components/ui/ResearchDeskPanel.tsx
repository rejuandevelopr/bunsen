'use client';

import { FormEvent, useState } from 'react';
import { ExperimentSchema } from '@/lib/experiments/schema';
import { PALETTE } from '@/lib/palette';
import { useExperimentStore, type AiUsage } from '@/store/experiment-store';
import { useLabStore } from '@/store/lab-store';
import { useQuestStore } from '@/store/quest-store';

const EXAMPLES = [
  'Why does ice float?',
  'Why do leaves change color?',
  'What makes soda fizz?',
] as const;

export function ResearchDeskPanel() {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const lastGenerated = useExperimentStore((state) => state.lastGeneratedExperiment);
  const lastUsage = useExperimentStore((state) => state.lastGenerationUsage);
  const loadExperiment = useExperimentStore((state) => state.loadExperiment);
  const setObjective = useLabStore((state) => state.setObjective);
  const setSubtask = useLabStore((state) => state.setSubtask);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (question.trim().length < 6 || status === 'loading') return;
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/generate-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });
      const payload = (await response.json()) as {
        experiment?: unknown;
        usage?: AiUsage;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? 'The design did not finish.');
      const experiment = ExperimentSchema.parse(payload.experiment);
      loadExperiment(experiment, true, payload.usage ?? null);
      useQuestStore.getState().dispatchQuestEvent({
        type: 'experiment-generated',
        experimentId: experiment.id,
      });
      setObjective(experiment.objective);
      setSubtask('Take the new investigation to the Experiment Bench');
      setStatus('success');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The professor lost his notes. Please try that question again.',
      );
      setStatus('error');
    }
  };

  return (
    <div className="mt-5 border p-4" style={{ borderColor: PALETTE.furniture }}>
      <p className="font-serif text-lg" style={{ color: PALETTE.paper }}>What do you wonder about?</p>
      <p className="mt-1 text-[0.66rem] leading-relaxed" style={{ color: PALETTE.paper }}>
        Professor Quill can turn one focused science question into a playable investigation.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuestion(example)}
            className="border px-2.5 py-1.5 text-[0.58rem] transition hover:brightness-110"
            style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
          >
            {example}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="research-question">Science question</label>
        <input
          id="research-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Why does…?"
          disabled={status === 'loading'}
          className="min-w-0 flex-1 border bg-transparent px-3 py-2 text-xs outline-none placeholder:opacity-50 focus:ring-1"
          style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
        />
        <button
          type="submit"
          disabled={question.trim().length < 6 || status === 'loading'}
          className="border px-3 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: PALETTE.trim, background: PALETTE.wood, color: PALETTE.paper }}
        >
          Design
        </button>
      </form>

      {status === 'loading' ? (
        <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: PALETTE.paper }} aria-live="polite">
          <span className="loading-flask" aria-hidden="true">⚗</span>
          <span>The professor is designing your experiment…</span>
        </div>
      ) : null}

      {status === 'error' ? (
        <p className="mt-4 border p-3 text-xs leading-relaxed" style={{ borderColor: PALETTE.accent2, color: PALETTE.paper }} aria-live="polite">
          {error} Your question is still a good one—please retry.
        </p>
      ) : null}

      {(status === 'success' || (status === 'idle' && lastGenerated)) && lastGenerated ? (
        <div className="mt-4 border p-3" style={{ borderColor: PALETTE.accent1, color: PALETTE.paper }} aria-live="polite">
          <p className="font-serif text-base">{lastGenerated.title}</p>
          <p className="mt-1 text-[0.64rem] leading-relaxed">{lastGenerated.steps.length} steps are ready at the Experiment Bench in the Chemistry Lab.</p>
          {lastUsage ? (
            <p className="mt-2 text-[0.5rem] uppercase tracking-[0.12em] opacity-60">
              {lastUsage.demo ? 'Demo response' : `${lastUsage.totalTokens.toLocaleString()} tokens`}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
