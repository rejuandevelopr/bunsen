'use client';

import { ACHIEVEMENTS } from '@/lib/quests/achievements';
import { PALETTE } from '@/lib/palette';
import { useQuestStore } from '@/store/quest-store';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';

export function AchievementsPanel() {
  const unlockedAchievementIds = useQuestStore((state) => state.unlockedAchievementIds);
  const activeStation = useLabStore((state) => state.activeStation);
  const isPaused = useLabStore((state) => state.isPaused);
  const tutorOpen = useTutorStore((state) => state.isOpen);
  if (activeStation || tutorOpen || isPaused) return null;

  return (
    <aside
      aria-label="Achievements"
      className="pointer-events-auto w-[17rem] border p-3 backdrop-blur-md"
      style={{
        background: `color-mix(in srgb, ${PALETTE.background} 18%, ${PALETTE.wood})`,
        borderColor: PALETTE.trim,
        boxShadow: `0 14px 42px color-mix(in srgb, ${PALETTE.background} 62%, transparent)`,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="font-serif text-[0.58rem] font-semibold uppercase tracking-[0.2em]" style={{ color: PALETTE.paper }}>
          Achievements
        </p>
        <span className="text-[0.48rem] uppercase tracking-[0.12em]" style={{ color: PALETTE.paper }}>
          {unlockedAchievementIds.length} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedAchievementIds.includes(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`grid aspect-square place-items-center border text-sm ${unlocked ? 'achievement-pop' : 'opacity-25 grayscale'}`}
              style={{
                borderColor: unlocked ? PALETTE.accent1 : PALETTE.paper,
                background: unlocked ? PALETTE.furniture : 'transparent',
                color: unlocked ? PALETTE.paper : PALETTE.background,
                boxShadow: unlocked ? `0 0 12px color-mix(in srgb, ${PALETTE.glass} 45%, transparent)` : 'none',
              }}
              title={`${achievement.label}: ${achievement.detail}`}
              aria-label={`${achievement.label} — ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <span aria-hidden="true">{achievement.icon === 'flask' ? '⚗' : '🏆'}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
