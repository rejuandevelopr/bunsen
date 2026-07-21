'use client';

import { useEffect } from 'react';
import { PALETTE } from '@/lib/palette';
import { useQuestStore, type QuestToast } from '@/store/quest-store';

export function QuestToasts() {
  const toasts = useQuestStore((state) => state.toasts);
  return (
    <div className="pointer-events-none absolute left-1/2 top-[18%] flex w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {toasts.map((toast) => <QuestToastItem key={toast.id} toast={toast} />)}
    </div>
  );
}

function QuestToastItem({ toast }: { toast: QuestToast }) {
  const dismissToast = useQuestStore((state) => state.dismissToast);
  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), toast.kind === 'story' ? 5200 : 3600);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast.id, toast.kind]);

  return (
    <div
      className="quest-toast border px-6 py-3 text-center backdrop-blur-xl"
      style={{
        borderColor: toast.kind === 'achievement' ? PALETTE.accent1 : PALETTE.trim,
        background: `color-mix(in srgb, ${PALETTE.background} 24%, ${PALETTE.wood})`,
        color: PALETTE.paper,
        boxShadow: `0 16px 52px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
      }}
    >
      <p className="font-serif text-sm uppercase tracking-[0.12em]">{toast.message}</p>
    </div>
  );
}
