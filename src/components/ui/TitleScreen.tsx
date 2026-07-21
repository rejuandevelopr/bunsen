'use client';

import { gameAudio } from '@/lib/audio';
import { PALETTE } from '@/lib/palette';
import { useLabStore } from '@/store/lab-store';

export function TitleScreen() {
  const gamePhase = useLabStore((state) => state.gamePhase);
  const audioMuted = useLabStore((state) => state.audioMuted);
  const beginGame = useLabStore((state) => state.beginGame);
  const toggleAudio = useLabStore((state) => state.toggleAudio);

  if (gamePhase !== 'title') return null;

  const handleBegin = () => {
    void gameAudio.unlock();
    beginGame();
  };

  return (
    <section
      className="title-screen absolute inset-0 z-30 grid place-items-center overflow-hidden"
      style={{
        background: `radial-gradient(circle at center, color-mix(in srgb, ${PALETTE.wood} 72%, transparent), color-mix(in srgb, ${PALETTE.background} 92%, transparent))`,
      }}
      aria-label="Bunsen title screen"
    >
      <button
        type="button"
        onClick={toggleAudio}
        className="absolute right-5 top-5 border px-3 py-2 text-[0.58rem] uppercase tracking-[0.2em] backdrop-blur-md transition hover:brightness-125 sm:right-8 sm:top-8"
        style={{
          borderColor: PALETTE.trim,
          color: PALETTE.paper,
          background: PALETTE.wood,
        }}
        aria-pressed={!audioMuted}
      >
        {audioMuted ? 'Sound muted' : 'Sound ready'}
      </button>

      <div
        className="title-lockup flex -translate-y-4 flex-col items-center border px-12 py-9 text-center backdrop-blur-md sm:px-20 sm:py-11"
        style={{
          background: `color-mix(in srgb, ${PALETTE.wood} 90%, transparent)`,
          borderColor: PALETTE.trim,
          boxShadow: `0 24px 80px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
        }}
      >
        <div className="flask-logo mb-7" aria-hidden="true">
          <span className="flask-neck" />
          <span className="flask-body">
            <span className="flask-liquid" />
          </span>
        </div>

        <p
          className="font-serif text-4xl font-semibold tracking-[0.3em] sm:text-6xl"
          style={{ color: PALETTE.paper, textShadow: `0 3px 28px ${PALETTE.wood}` }}
        >
          BUNSEN
        </p>
        <p
          className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.48em] sm:text-xs"
          style={{ color: PALETTE.paper, textShadow: `0 2px 12px ${PALETTE.wood}` }}
        >
          Bunsen Science Center
        </p>

        <button
          type="button"
          onClick={handleBegin}
          className="begin-button mt-10 min-w-40 border px-8 py-3 font-serif text-sm uppercase tracking-[0.24em] transition duration-300"
          style={{
            borderColor: PALETTE.trim,
            color: PALETTE.paper,
            background: PALETTE.wood,
          }}
        >
          Begin
        </button>
      </div>

      <p
        className="absolute bottom-6 text-[0.52rem] uppercase tracking-[0.25em] opacity-60"
        style={{ color: PALETTE.paper }}
      >
        Five learning zones · One world of discovery
      </p>
    </section>
  );
}
