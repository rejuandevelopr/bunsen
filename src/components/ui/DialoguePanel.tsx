'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { requestTutorMessage } from '@/lib/ai/tutor-client';
import { NPC_PERSONAS } from '@/lib/ai/personas';
import { PALETTE } from '@/lib/palette';
import { useTutorStore } from '@/store/tutor-store';
import { useQuestStore } from '@/store/quest-store';

export function DialoguePanel() {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpen = useTutorStore((state) => state.isOpen);
  const isStreaming = useTutorStore((state) => state.isStreaming);
  const messages = useTutorStore((state) => state.messages);
  const usageHistory = useTutorStore((state) => state.usageHistory);
  const activePersonaId = useTutorStore((state) => state.activePersonaId);
  const closeChat = useTutorStore((state) => state.closeChat);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  if (!isOpen) return null;
  const persona = NPC_PERSONAS[activePersonaId];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;
    setMessage('');
    useQuestStore.getState().recordNpcQuestion(activePersonaId);
    void requestTutorMessage(trimmed, {
      contextType: 'chat',
      echoPlayer: true,
      personaId: activePersonaId,
    });
  };

  const lastUsage = [...usageHistory]
    .reverse()
    .find((usage) => usage.personaId === activePersonaId);

  return (
    <section
      aria-label={`${persona.name} chat`}
      className="pointer-events-auto w-[min(48rem,calc(100vw-2rem))] border px-4 py-4 backdrop-blur-xl sm:px-6"
      style={{
        background: `color-mix(in srgb, ${PALETTE.background} 24%, ${PALETTE.wood})`,
        borderColor: PALETTE.trim,
        boxShadow: `0 20px 70px color-mix(in srgb, ${PALETTE.background} 78%, transparent)`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-serif text-[0.66rem] font-semibold uppercase tracking-[0.25em]" style={{ color: PALETTE.accent2 }}>
            {persona.name}
          </p>
          <p className="mt-1 text-[0.58rem]" style={{ color: PALETTE.paper }}>
            {persona.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={closeChat}
          className="border px-2 py-1 text-[0.55rem] uppercase tracking-[0.12em]"
          style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
        >
          Esc · close
        </button>
      </div>

      <div ref={scrollRef} className="max-h-52 space-y-3 overflow-y-auto pr-2" aria-live="polite">
        {messages.map((chatMessage) => (
          <article
            key={chatMessage.id}
            className={`max-w-[88%] border-l-2 px-3 py-2 ${chatMessage.role === 'player' ? 'ml-auto' : ''}`}
            style={{
              borderColor: chatMessage.role === 'professor' ? PALETTE.accent1 : PALETTE.accent2,
              background: `color-mix(in srgb, ${PALETTE.background} 28%, transparent)`,
            }}
          >
            <p className="text-[0.5rem] font-semibold uppercase tracking-[0.16em]" style={{ color: PALETTE.paper }}>
              {chatMessage.role === 'professor' ? persona.name : 'You'}
            </p>
            <p className="mt-1 font-serif text-sm leading-relaxed" style={{ color: PALETTE.paper }}>
              {chatMessage.content || 'Thinking…'}
              {chatMessage.streaming ? <span className="stream-caret ml-1" aria-hidden="true">▍</span> : null}
            </p>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <label htmlFor="tutor-message" className="sr-only">Ask {persona.name}</label>
        <input
          id="tutor-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isStreaming}
          autoComplete="off"
          placeholder={isStreaming ? `${persona.name} is responding…` : `Ask ${persona.name} a science question…`}
          className="min-w-0 flex-1 border bg-transparent px-3 py-2 text-xs outline-none placeholder:opacity-55 focus:ring-1"
          style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
        />
        <button
          type="submit"
          disabled={!message.trim() || isStreaming}
          className="border px-4 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: PALETTE.trim, background: PALETTE.wood, color: PALETTE.paper }}
        >
          Ask
        </button>
      </form>
      {lastUsage ? (
        <p className="mt-2 text-right text-[0.48rem] uppercase tracking-[0.12em] opacity-45" style={{ color: PALETTE.paper }}>
          {lastUsage.demo ? 'Demo tutor' : `${lastUsage.totalTokens.toLocaleString()} tokens`}
        </p>
      ) : null}
    </section>
  );
}
