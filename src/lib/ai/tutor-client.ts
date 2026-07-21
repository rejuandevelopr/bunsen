'use client';

import { useExperimentStore } from '@/store/experiment-store';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';
import { NPC_PERSONAS, type NpcPersonaId } from './personas';

type TutorContextType = 'chat' | 'failure' | 'surprise' | 'queued';

export async function requestTutorMessage(
  playerMessage: string,
  options: {
    contextType?: TutorContextType;
    speechBubble?: boolean;
    echoPlayer?: boolean;
    personaId?: NpcPersonaId;
  } = {},
) {
  const tutor = useTutorStore.getState();
  if (tutor.isStreaming) return;
  const personaId = options.personaId ?? tutor.activePersonaId ?? 'professor-quill';
  const persona = NPC_PERSONAS[personaId];

  const echoPlayer = options.echoPlayer ?? (options.contextType ?? 'chat') === 'chat';
  const playerId = `player-${Date.now()}`;
  const professorId = `${personaId}-${Date.now() + 1}`;
  if (echoPlayer) {
    tutor.addMessage(personaId, { id: playerId, role: 'player', content: playerMessage });
  }
  tutor.addMessage(personaId, { id: professorId, role: 'professor', content: '', streaming: true });
  tutor.setStreaming(true);
  useLabStore.getState().setTutorState('talking');

  const experiment = useExperimentStore.getState();
  const chatHistory = useTutorStore
    .getState()
    .sessions[personaId]?.filter((message) => message.id !== professorId && message.content)
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content })) ?? [];

  const lab = useLabStore.getState();
  const currentExperiment = experiment.currentExperiment;

  try {
    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentState: {
          experiment: experiment.currentExperiment,
          status: experiment.status,
          stepIndex: experiment.stepIndex,
          completedStepIds: experiment.completedStepIds,
          observations: experiment.observations,
          lastOutcome: experiment.lastOutcome,
        },
        actionHistory: experiment.actionHistory,
        chatHistory,
        playerMessage,
        contextType: options.contextType ?? 'chat',
        personaId,
        currentZone: lab.currentZone,
        experimentProgress: {
          current: {
            id: currentExperiment.id,
            title: currentExperiment.title,
            status: experiment.status,
            completedSteps: experiment.completedStepIds.length,
            totalSteps: currentExperiment.steps.length,
          },
          completed: experiment.completedExperiments.map(({ id, title }) => ({ id, title })),
        },
      }),
    });

    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `${persona.name} could not connect.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const dataLine = block
          .split('\n')
          .find((line) => line.startsWith('data: '));
        if (!dataLine) continue;
        const event = JSON.parse(dataLine.slice(6)) as
          | { type: 'token'; token: string }
          | { type: 'usage'; usage: { inputTokens: number; outputTokens: number; totalTokens: number; demo: boolean }; model: string }
          | { type: 'error'; error: string };

        if (event.type === 'token') {
          reply += event.token;
          useTutorStore.getState().updateMessage(personaId, professorId, reply, true);
        } else if (event.type === 'usage') {
          useTutorStore.getState().addUsage({ ...event.usage, personaId, model: event.model });
        } else {
          throw new Error(event.error);
        }
      }
      if (done) break;
    }

    useTutorStore.getState().updateMessage(personaId, professorId, reply, false);
    if (options.speechBubble && reply) {
      useTutorStore.getState().showSpeechBubble(reply);
      window.setTimeout(() => {
        if (useTutorStore.getState().speechBubble === reply) {
          useTutorStore.getState().showSpeechBubble(null);
        }
      }, 8000);
    }
  } catch (error) {
    useTutorStore.getState().updateMessage(
      personaId,
      professorId,
      error instanceof Error
        ? `I lost the connection for a moment. ${error.message}`
        : 'I lost the connection for a moment. Please try again.',
      false,
    );
  } finally {
    useTutorStore.getState().setStreaming(false);
    useLabStore.getState().setTutorState('idle');
  }
}
