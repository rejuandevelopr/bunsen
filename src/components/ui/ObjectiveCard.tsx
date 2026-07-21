'use client';

import { PALETTE } from '@/lib/palette';
import { questById } from '@/lib/quests';
import { ZONES } from '@/lib/world';
import { useQuestStore } from '@/store/quest-store';

export function ObjectiveCard() {
  const activeQuestId = useQuestStore((state) => state.activeQuestId);
  const currentSubTaskIndex = useQuestStore((state) => state.currentSubTaskIndex);
  const objectivePulse = useQuestStore((state) => state.objectivePulse);
  const quest = questById(activeQuestId);
  const subTask = quest?.subTasks[currentSubTaskIndex];

  return (
    <aside
      key={`${activeQuestId}-${currentSubTaskIndex}-${objectivePulse}`}
      aria-label="Current objective"
      className={`pointer-events-auto w-[min(21rem,calc(100vw-2rem))] border px-5 py-4 backdrop-blur-md sm:px-6 sm:py-5 ${objectivePulse ? 'quest-objective-highlight' : ''}`}
      style={{
        background: `color-mix(in srgb, ${PALETTE.background} 18%, ${PALETTE.wood})`,
        borderColor: PALETTE.trim,
        boxShadow: `0 18px 60px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="block h-1.5 w-1.5 rotate-45"
          style={{ backgroundColor: PALETTE.trim }}
        />
        <p
          className="font-serif text-[0.66rem] font-semibold uppercase tracking-[0.28em]"
          style={{ color: PALETTE.paper }}
        >
          {quest ? `Chapter ${quest.chapter} · ${ZONES[subTask?.targetZone ?? quest.zone].name}` : 'Story complete'}
        </p>
        <span
          aria-hidden="true"
          className="h-px flex-1 opacity-50"
          style={{ backgroundColor: PALETTE.trim }}
        />
      </div>
      <p className="font-serif text-lg leading-snug" style={{ color: PALETTE.paper }}>
        {quest?.title ?? "You're a Bunsen researcher now"}
      </p>
      {quest ? <p className="mt-1 text-[0.62rem] leading-relaxed opacity-75" style={{ color: PALETTE.paper }}>{quest.objectiveText}</p> : null}
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed tracking-wide" style={{ color: PALETTE.paper }}>
        <span aria-hidden="true" style={{ color: PALETTE.glass }}>→</span>
        {subTask?.label ?? 'Keep exploring, reading, and asking new questions'}
      </p>
    </aside>
  );
}
