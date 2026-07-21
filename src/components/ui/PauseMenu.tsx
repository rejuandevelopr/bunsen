'use client';

import { useState } from 'react';
import { PALETTE } from '@/lib/palette';
import { useExperimentStore } from '@/store/experiment-store';
import { useLabStore } from '@/store/lab-store';
import { useQuestStore } from '@/store/quest-store';
import { useTutorStore } from '@/store/tutor-store';

export function PauseMenu() {
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const isPaused = useLabStore((state) => state.isPaused);
  const audioMuted = useLabStore((state) => state.audioMuted);
  const musicEnabled = useLabStore((state) => state.musicEnabled);
  const musicVolume = useLabStore((state) => state.musicVolume);
  const closePause = useLabStore((state) => state.closePause);
  const toggleAudio = useLabStore((state) => state.toggleAudio);
  const toggleMusic = useLabStore((state) => state.toggleMusic);
  const setMusicVolume = useLabStore((state) => state.setMusicVolume);
  const exitToTitle = useLabStore((state) => state.exitToTitle);

  if (!isPaused) return null;

  const restartStory = () => {
    useQuestStore.getState().restartStory();
    useExperimentStore.getState().resetExperiment();
    useTutorStore.getState().closeChat();
    useLabStore.getState().closeStation();
    setConfirmingRestart(false);
    closePause();
  };

  const exit = () => {
    useTutorStore.getState().closeChat();
    exitToTitle();
  };

  return (
    <section
      aria-label="Pause menu"
      className="pointer-events-auto absolute inset-0 z-30 grid place-items-center backdrop-blur-sm"
      style={{ background: `color-mix(in srgb, ${PALETTE.background} 62%, transparent)` }}
    >
      <div
        className="pause-menu-enter w-[min(22rem,calc(100vw-2rem))] border p-6"
        style={{
          background: `color-mix(in srgb, ${PALETTE.background} 20%, ${PALETTE.wood})`,
          borderColor: PALETTE.trim,
          boxShadow: `0 26px 90px color-mix(in srgb, ${PALETTE.background} 82%, transparent)`,
        }}
      >
        <p className="text-[0.58rem] uppercase tracking-[0.24em]" style={{ color: PALETTE.accent2 }}>Bunsen Science Center</p>
        <h2 className="mt-2 font-serif text-3xl" style={{ color: PALETTE.paper }}>Paused</h2>
        <div className="mt-6 grid gap-2">
          <MenuAction label="Resume" onClick={closePause} primary />
          {!confirmingRestart ? (
            <MenuAction label="Restart Story" onClick={() => setConfirmingRestart(true)} />
          ) : (
            <div className="border p-3" style={{ borderColor: PALETTE.accent2 }}>
              <p className="text-xs leading-relaxed" style={{ color: PALETTE.paper }}>
                Restart all chapters, Field Notes, and achievements?
              </p>
              <div className="mt-3 flex gap-2">
                <MenuAction label="Yes, restart" onClick={restartStory} compact />
                <MenuAction label="Cancel" onClick={() => setConfirmingRestart(false)} compact />
              </div>
            </div>
          )}
          <MenuAction label={audioMuted ? 'Sound: Muted' : 'Sound: Ready'} onClick={toggleAudio} />
          <MenuAction label={musicEnabled ? 'Music: On' : 'Music: Off'} onClick={toggleMusic} />
          <div
            className="border px-4 py-3"
            style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
          >
            <span className="flex items-center justify-between text-[0.58rem] font-semibold uppercase tracking-[0.14em]">
              <label htmlFor="music-volume">Music volume</label>
              <span>{musicVolume}%</span>
            </span>
            <div className="mt-3 flex items-center gap-2">
              <VolumeStepButton
                label="Lower music volume"
                onClick={() => setMusicVolume(musicVolume - 5)}
              >
                −
              </VolumeStepButton>
              <input
                id="music-volume"
                aria-label="Music volume"
                className="h-1.5 min-w-0 flex-1 cursor-pointer"
                style={{ accentColor: PALETTE.accent1 }}
                type="range"
                min="0"
                max="100"
                step="1"
                value={musicVolume}
                onChange={(event) => setMusicVolume(Number(event.target.value))}
              />
              <VolumeStepButton
                label="Raise music volume"
                onClick={() => setMusicVolume(musicVolume + 5)}
              >
                +
              </VolumeStepButton>
            </div>
          </div>
          <MenuAction label="Exit to Title" onClick={exit} />
        </div>
        <p className="mt-5 text-center text-[0.5rem] uppercase tracking-[0.16em] opacity-65" style={{ color: PALETTE.paper }}>
          Esc · Resume
        </p>
      </div>
    </section>
  );
}

function VolumeStepButton({
  children,
  label,
  onClick,
}: {
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center border text-sm leading-none transition hover:brightness-125"
      style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}
    >
      {children}
    </button>
  );
}

function MenuAction({
  label,
  onClick,
  primary = false,
  compact = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${compact ? 'flex-1 px-2 py-2 text-[0.52rem]' : 'w-full px-4 py-3 text-xs'} border font-semibold uppercase tracking-[0.14em] transition hover:-translate-y-0.5 hover:brightness-110`}
      style={{
        borderColor: primary ? PALETTE.accent1 : PALETTE.trim,
        background: primary ? PALETTE.furniture : 'transparent',
        color: PALETTE.paper,
      }}
    >
      {label}
    </button>
  );
}
