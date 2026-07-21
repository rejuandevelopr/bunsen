'use client';

import { useEffect, useMemo } from 'react';
import { PALETTE } from '@/lib/palette';
import { questById } from '@/lib/quests';
import type { LearningMaterialId } from '@/lib/quests/materials';
import { STATIONS, WORLD_BOUNDS, ZONES } from '@/lib/world';
import { useLabStore } from '@/store/lab-store';
import { useQuestStore } from '@/store/quest-store';
import { useTutorStore } from '@/store/tutor-store';
import { DialoguePanel } from './DialoguePanel';
import { ExperimentRunnerPanel } from './ExperimentRunnerPanel';
import { ObjectiveCard } from './ObjectiveCard';
import { ResearchDeskPanel } from './ResearchDeskPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { LearningMaterialPanel } from './LearningMaterialPanel';
import { PauseMenu } from './PauseMenu';
import { QuestToasts } from './QuestToasts';

const PANEL_STYLE = {
  background: `color-mix(in srgb, ${PALETTE.background} 18%, ${PALETTE.wood})`,
  borderColor: PALETTE.trim,
  boxShadow: `0 18px 55px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
};

const STATION_PANEL_STYLE = {
  ...PANEL_STYLE,
  boxShadow: `0 18px 60px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
};

function Keycap({ children }: { children: string }) {
  return (
    <span
      className="inline-grid min-w-6 place-items-center border px-1.5 py-1 text-[0.58rem] font-semibold"
      style={{ borderColor: PALETTE.furniture, color: PALETTE.paper }}
    >
      {children}
    </span>
  );
}

function ControlsCard() {
  return (
    <aside className="hidden w-56 border p-4 backdrop-blur-md sm:block" style={PANEL_STYLE} aria-label="Controls">
      <p className="mb-3 font-serif text-[0.62rem] font-semibold uppercase tracking-[0.24em]" style={{ color: PALETTE.paper }}>Movement</p>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 text-[0.68rem] font-medium" style={{ color: PALETTE.paper }}>
        <span className="flex gap-1"><Keycap>W</Keycap><Keycap>A</Keycap><Keycap>S</Keycap><Keycap>D</Keycap></span><span>Move</span>
        <Keycap>Shift</Keycap><span>Run</span>
        <Keycap>E</Keycap><span>Interact</span>
        <Keycap>V</Keycap><span>Tactical view</span>
        <Keycap>Esc</Keycap><span>Menu</span>
      </div>
    </aside>
  );
}

function MiniMap() {
  const playerPosition = useLabStore((state) => state.playerPosition);
  const currentZone = useLabStore((state) => state.currentZone);
  const activeQuestId = useQuestStore((state) => state.activeQuestId);
  const currentSubTaskIndex = useQuestStore((state) => state.currentSubTaskIndex);
  const quest = questById(activeQuestId);
  const targetZone = quest?.subTasks[currentSubTaskIndex]?.targetZone ?? null;
  const mapWidth = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const mapDepth = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ;
  const left = ((playerPosition.x - WORLD_BOUNDS.minX) / mapWidth) * 100;
  const top = ((playerPosition.z - WORLD_BOUNDS.minZ) / mapDepth) * 100;

  return (
    <aside className="hidden w-64 border p-3 backdrop-blur-md md:block" style={PANEL_STYLE} aria-label="Science Center map">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-serif text-[0.62rem] font-semibold uppercase tracking-[0.2em]" style={{ color: PALETTE.paper }}>Center map</p>
        <p className="text-[0.48rem] uppercase tracking-[0.16em]" style={{ color: PALETTE.paper }}>{ZONES[currentZone].name}</p>
      </div>
      <div className="relative h-32 overflow-hidden border" style={{ borderColor: PALETTE.trim, background: PALETTE.floor }}>
        {targetZone ? (
          <span
            className="quest-map-target pointer-events-none absolute z-10 border-2"
            style={{ ...ZONE_MAP_RECTS[targetZone], borderColor: PALETTE.accent1, boxShadow: `inset 0 0 14px color-mix(in srgb, ${PALETTE.glass} 55%, transparent)` }}
            aria-label={`Quest target: ${ZONES[targetZone].name}`}
          />
        ) : null}
        <div className="absolute inset-x-0 top-0 grid h-[51.6%] grid-cols-3 border-b" style={{ borderColor: PALETTE.trim }}>
          {(['study', 'chemistry', 'greenhouse'] as const).map((zone) => (
            <div key={zone} className="relative border-r last:border-r-0" style={{ borderColor: PALETTE.trim }}>
              <span className="absolute left-1 top-1 text-[0.4rem] font-semibold uppercase tracking-[0.08em]" style={{ color: PALETTE.wood }}>
                {ZONES[zone].name.replace(' Corner', '')}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 grid h-[48.4%] grid-cols-3">
          <div className="relative border-r" style={{ borderColor: PALETTE.trim }}>
            <span className="absolute left-1 top-1 text-[0.4rem] font-semibold uppercase tracking-[0.08em]" style={{ color: PALETTE.wood }}>
              Discovery
            </span>
          </div>
          <div className="relative col-span-2">
            <span className="absolute left-1 top-1 text-[0.4rem] font-semibold uppercase tracking-[0.08em]" style={{ color: PALETTE.wood }}>
              Instrument Hall
            </span>
          </div>
        </div>
        {STATIONS.map((station) => (
          <span
            key={station.id}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              left: `${((station.position.x - WORLD_BOUNDS.minX) / mapWidth) * 100}%`,
              top: `${((station.position.z - WORLD_BOUNDS.minZ) / mapDepth) * 100}%`,
              background: 'materialId' in station ? PALETTE.accent1 : PALETTE.accent2,
            }}
            title={station.name}
          />
        ))}
        <span
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${left}%`, top: `${top}%`, background: PALETTE.accent1, borderColor: PALETTE.paper, boxShadow: `0 0 12px ${PALETTE.accent1}` }}
          aria-label="Player position"
        />
      </div>
    </aside>
  );
}

const ZONE_MAP_RECTS = {
  study: { left: '0%', top: '0%', width: '33.333%', height: '51.6%' },
  chemistry: { left: '33.333%', top: '0%', width: '33.333%', height: '51.6%' },
  greenhouse: { left: '66.666%', top: '0%', width: '33.334%', height: '51.6%' },
  discovery: { left: '0%', top: '51.6%', width: '33.333%', height: '48.4%' },
  instrument: { left: '33.333%', top: '51.6%', width: '66.667%', height: '48.4%' },
} as const;

function ZoneLabel() {
  const currentZone = useLabStore((state) => state.currentZone);
  return (
    <div key={currentZone} className="zone-label absolute left-1/2 top-24 -translate-x-1/2 text-center sm:top-8">
      <p className="font-serif text-xl uppercase tracking-[0.22em] sm:text-2xl" style={{ color: PALETTE.paper, textShadow: `0 2px 14px ${PALETTE.background}` }}>
        {ZONES[currentZone].name}
      </p>
      <span className="mx-auto mt-2 block h-px w-20" style={{ background: PALETTE.trim }} />
    </div>
  );
}

function StationPrompt() {
  const playerPosition = useLabStore((state) => state.playerPosition);
  const activeStation = useLabStore((state) => state.activeStation);
  const tutorOpen = useTutorStore((state) => state.isOpen);
  const nearbyNpc = useTutorStore((state) => state.nearbyNpc);
  const station = useMemo(() => {
    if (activeStation || tutorOpen) return null;
    return STATIONS.find(
      (candidate) => Math.hypot(candidate.position.x - playerPosition.x, candidate.position.z - playerPosition.z) <= 2.25,
    );
  }, [activeStation, playerPosition, tutorOpen]);
  const visibleNpc = !activeStation && !tutorOpen ? nearbyNpc : null;
  if (!station && !visibleNpc) return null;
  return (
    <div className="station-prompt absolute bottom-32 left-1/2 -translate-x-1/2 border px-5 py-3 backdrop-blur-md" style={PANEL_STYLE}>
      <p className="flex items-center gap-3 text-sm font-semibold" style={{ color: PALETTE.paper }}>
        <Keycap>E</Keycap>
        {visibleNpc ? `Talk to ${visibleNpc.name}` : station?.name}
      </p>
    </div>
  );
}

function StationPanel() {
  const activeStation = useLabStore((state) => state.activeStation);
  const closeStation = useLabStore((state) => state.closeStation);
  if (!activeStation) return null;

  return (
    <section
      className="station-panel pointer-events-auto absolute right-4 top-1/2 max-h-[70vh] w-[min(23.75rem,calc(100vw-2rem))] -translate-y-1/2 overflow-y-auto overscroll-contain border px-5 py-4 backdrop-blur-md sm:right-6 sm:px-6 sm:py-5 lg:right-8"
      style={STATION_PANEL_STYLE}
      aria-label={`${activeStation.name} panel`}
    >
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em]" style={{ color: PALETTE.accent2 }}>
        Station {activeStation.number} · {ZONES[activeStation.zone].name}
      </p>
      <h2 className="mt-2 font-serif text-2xl" style={{ color: PALETTE.paper }}>{activeStation.name}</h2>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: PALETTE.paper }}>{activeStation.description}</p>
      {activeStation.id === 'research' ? <ResearchDeskPanel /> : null}
      {activeStation.id === 'titration' || activeStation.id === 'experiment' || activeStation.id === 'instrument' || activeStation.id === 'discovery' ? (
        <ExperimentRunnerPanel stationId={activeStation.id} />
      ) : null}
      {activeStation.id === 'plant' ? (
        <div className="mt-5 border p-4 text-xs leading-relaxed" style={{ borderColor: PALETTE.furniture, color: PALETTE.paper }}>
          Compare leaf color, water level, and light exposure. This station is ready for a future plant-growth module.
        </div>
      ) : null}
      {'materialId' in activeStation ? (
        <LearningMaterialPanel materialId={activeStation.materialId as LearningMaterialId} />
      ) : null}
      <button type="button" onClick={closeStation} className="mt-5 border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:brightness-110" style={{ borderColor: PALETTE.trim, color: PALETTE.paper }}>
        Esc · Close
      </button>
    </section>
  );
}

export function LabHUD() {
  const gamePhase = useLabStore((state) => state.gamePhase);
  const viewMode = useLabStore((state) => state.viewMode);
  const completeIntro = useLabStore((state) => state.completeIntro);
  const openPause = useLabStore((state) => state.openPause);

  useEffect(() => {
    const skipIntro = () => {
      if (useLabStore.getState().gamePhase === 'intro') completeIntro();
    };
    window.addEventListener('keydown', skipIntro);
    return () => window.removeEventListener('keydown', skipIntro);
  }, [completeIntro]);

  if (gamePhase === 'title') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() => {
          useLabStore.getState().closeStation();
          useTutorStore.getState().closeChat();
          openPause();
        }}
        className="pointer-events-auto absolute left-4 top-4 flex items-center gap-2 border px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-md transition hover:brightness-110 sm:left-6 sm:top-6 lg:left-8 lg:top-8"
        style={PANEL_STYLE}
        aria-label="Open pause menu"
      >
        <span aria-hidden="true" style={{ color: PALETTE.glass }}>⚗</span>
        <span style={{ color: PALETTE.paper }}>Menu</span>
      </button>
      <div className={`absolute left-4 top-16 sm:left-6 sm:top-[4.75rem] lg:left-8 lg:top-20 ${gamePhase === 'intro' ? 'objective-enter' : ''}`}><ObjectiveCard /></div>
      <div className={`absolute right-4 top-4 sm:right-6 sm:top-6 lg:right-8 lg:top-8 ${gamePhase === 'intro' ? 'controls-enter' : ''}`}><ControlsCard /></div>
      <ZoneLabel />

      <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8"><MiniMap /></div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8"><DialoguePanel /></div>
      <StationPrompt />
      <StationPanel />
      <QuestToasts />

      <div className="absolute bottom-14 right-4 hidden sm:block lg:bottom-16 lg:right-8"><AchievementsPanel /></div>

      <div className={`absolute bottom-5 right-5 hidden sm:block lg:bottom-8 lg:right-8 ${gamePhase === 'intro' ? 'controls-enter' : ''}`}>
        <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em]" style={{ color: PALETTE.paper, textShadow: `0 2px 8px ${PALETTE.background}` }}>
          WASD move · Shift run · E interact · Scroll zoom · V {viewMode === 'tactical' ? 'return to player' : 'tactical view'} · Esc menu
        </p>
      </div>

      {gamePhase === 'intro' ? (
        <p className="intro-skip absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.52rem] uppercase tracking-[0.24em]" style={{ color: PALETTE.paper }}>Press any key to skip</p>
      ) : null}
      <PauseMenu />
    </div>
  );
}
