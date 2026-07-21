'use client';

import { useEffect } from 'react';
import { requestTutorMessage } from '@/lib/ai/tutor-client';
import { gameAudio } from '@/lib/audio';
import { onOutcomeReached } from '@/lib/experiments/events';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';

export function TutorSystem() {
  const isOpen = useTutorStore((state) => state.isOpen);
  const isStreaming = useTutorStore((state) => state.isStreaming);
  const queuedContext = useTutorStore((state) => state.queuedContext);
  const activePersonaId = useTutorStore((state) => state.activePersonaId);

  useEffect(() => {
    gameAudio.setDialogueStreaming(isStreaming);
    return () => gameAudio.setDialogueStreaming(false);
  }, [isStreaming]);

  useEffect(
    () =>
      onOutcomeReached(({ outcome, experiment, state }) => {
        if (outcome.type !== 'failure' && outcome.type !== 'surprise') return;

        const lab = useLabStore.getState();
        const atExperimentStation = isExperimentStation(lab.activeStation?.id);
        const message = `${outcome.type.toUpperCase()} outcome in ${experiment.title}: ${outcome.message} Scientific explanation: ${outcome.explanation} Current runner state: ${JSON.stringify({ stepIndex: state.stepIndex, observations: state.observations })}`;
        if (process.env.NODE_ENV === 'development') {
          console.info('[Bunsen:tutor-proactive]', outcome.type, lab.currentZone, lab.activeStation?.id);
        }

        if (
          lab.currentZone === 'chemistry' &&
          atExperimentStation &&
          !useTutorStore.getState().isStreaming
        ) {
          void requestTutorMessage(message, {
            contextType: outcome.type,
            speechBubble: true,
            echoPlayer: false,
            personaId: 'professor-quill',
          });
        } else {
          useTutorStore.getState().queueContext({
            contextType: outcome.type,
            message,
          });
        }
      }),
    [],
  );

  useEffect(() => {
    if (!queuedContext || isStreaming) return;

    const lab = useLabStore.getState();
    const atExperimentStation = isExperimentStation(lab.activeStation?.id);
    const canSpeakNow = lab.currentZone === 'chemistry' && atExperimentStation;
    if (!canSpeakNow && (!isOpen || activePersonaId !== 'professor-quill')) return;

    useTutorStore.getState().queueContext(null);
    void requestTutorMessage(queuedContext.message, {
      contextType: queuedContext.contextType === 'queued' ? 'queued' : queuedContext.contextType,
      speechBubble: canSpeakNow,
      echoPlayer: false,
      personaId: 'professor-quill',
    });
  }, [activePersonaId, isOpen, isStreaming, queuedContext]);

  return null;
}

function isExperimentStation(stationId?: string) {
  return stationId === 'titration' || stationId === 'experiment' || stationId === 'instrument' || stationId === 'discovery';
}
