'use client';

import { create } from 'zustand';
import { gameAudio } from '@/lib/audio';
import {
  NPC_PERSONAS,
  type NpcPersonaId,
} from '@/lib/ai/personas';
import type { AiUsage } from './experiment-store';

export type TutorChatMessage = {
  id: string;
  role: 'player' | 'professor';
  content: string;
  streaming?: boolean;
};

export type NearbyNpc = {
  personaId: NpcPersonaId;
  name: string;
  distance: number;
} | null;

export type QueuedTutorContext = {
  contextType: 'failure' | 'surprise' | 'queued';
  message: string;
} | null;

type PersonaSessions = Partial<Record<NpcPersonaId, TutorChatMessage[]>>;

type TutorChatState = {
  isOpen: boolean;
  isStreaming: boolean;
  activePersonaId: NpcPersonaId;
  messages: TutorChatMessage[];
  sessions: PersonaSessions;
  usageHistory: AiUsage[];
  speechBubble: string | null;
  queuedContext: QueuedTutorContext;
  nearbyNpc: NearbyNpc;
  openChat: (personaId?: NpcPersonaId) => void;
  closeChat: () => void;
  addMessage: (personaId: NpcPersonaId, message: TutorChatMessage) => void;
  updateMessage: (
    personaId: NpcPersonaId,
    id: string,
    content: string,
    streaming?: boolean,
  ) => void;
  setStreaming: (isStreaming: boolean) => void;
  addUsage: (usage: AiUsage) => void;
  showSpeechBubble: (message: string | null) => void;
  queueContext: (context: QueuedTutorContext) => void;
  setNearbyNpc: (nearbyNpc: NearbyNpc) => void;
};

const QUILL_ID: NpcPersonaId = 'professor-quill';
const quillMessages = openerMessages(QUILL_ID);

export const useTutorStore = create<TutorChatState>((set) => ({
  isOpen: false,
  isStreaming: false,
  activePersonaId: QUILL_ID,
  messages: quillMessages,
  sessions: { [QUILL_ID]: quillMessages },
  usageHistory: [],
  speechBubble: null,
  queuedContext: null,
  nearbyNpc: null,
  openChat: (personaId = QUILL_ID) =>
    set((state) => {
      gameAudio.interactionOpen();
      const messages = state.sessions[personaId] ?? openerMessages(personaId);
      return {
        isOpen: true,
        activePersonaId: personaId,
        messages,
        sessions: { ...state.sessions, [personaId]: messages },
      };
    }),
  closeChat: () =>
    set((state) => {
      if (state.isOpen) gameAudio.interactionClose();
      return { isOpen: false };
    }),
  addMessage: (personaId, message) =>
    set((state) => {
      const current = state.sessions[personaId] ?? openerMessages(personaId);
      const messages = [...current, message].slice(-30);
      return {
        sessions: { ...state.sessions, [personaId]: messages },
        messages: state.activePersonaId === personaId ? messages : state.messages,
      };
    }),
  updateMessage: (personaId, id, content, streaming = false) =>
    set((state) => {
      const current = state.sessions[personaId] ?? openerMessages(personaId);
      const messages = current.map((message) =>
        message.id === id ? { ...message, content, streaming } : message,
      );
      return {
        sessions: { ...state.sessions, [personaId]: messages },
        messages: state.activePersonaId === personaId ? messages : state.messages,
      };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  addUsage: (usage) =>
    set((state) => ({ usageHistory: [...state.usageHistory, usage].slice(-24) })),
  showSpeechBubble: (speechBubble) => set({ speechBubble }),
  queueContext: (queuedContext) => set({ queuedContext }),
  setNearbyNpc: (nearbyNpc) =>
    set((state) => {
      if (
        state.nearbyNpc?.personaId === nearbyNpc?.personaId &&
        Math.abs((state.nearbyNpc?.distance ?? 0) - (nearbyNpc?.distance ?? 0)) < 0.08
      ) {
        return state;
      }
      return { nearbyNpc };
    }),
}));

function openerMessages(personaId: NpcPersonaId): TutorChatMessage[] {
  return NPC_PERSONAS[personaId].openers.map((content, index) => ({
    id: `${personaId}-opener-${index}`,
    role: 'professor' as const,
    content,
  }));
}
