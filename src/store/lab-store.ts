import { create } from 'zustand';
import { DEFAULT_MUSIC_VOLUME, gameAudio } from '@/lib/audio';
import { STATIONS, zoneForPosition, type WorldStation, type ZoneId } from '@/lib/world';
import { useQuestStore } from '@/store/quest-store';

type Dialogue = {
  speaker: string;
  message: string;
};

export type TutorState = 'idle' | 'talking';
export type GamePhase = 'title' | 'intro' | 'playing';
export type ViewMode = 'thirdPerson' | 'tactical';

type LabState = {
  objective: string;
  subtask: string;
  dialogue: Dialogue | null;
  tutorState: TutorState;
  gamePhase: GamePhase;
  viewMode: ViewMode;
  audioMuted: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  isPaused: boolean;
  currentZone: ZoneId;
  playerPosition: { x: number; z: number };
  stations: typeof STATIONS;
  activeStation: WorldStation | null;
  setObjective: (objective: string) => void;
  setSubtask: (subtask: string) => void;
  showDialogue: (dialogue: Dialogue) => void;
  hideDialogue: () => void;
  setTutorState: (tutorState: TutorState) => void;
  beginGame: () => void;
  completeIntro: () => void;
  toggleTacticalView: () => void;
  toggleAudio: () => void;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  openPause: () => void;
  closePause: () => void;
  exitToTitle: () => void;
  updatePlayerPosition: (x: number, z: number) => void;
  activateNearbyStation: (x: number, z: number) => void;
  closeStation: () => void;
};

export const useLabStore = create<LabState>((set, get) => ({
  objective: 'Neutralize the acid',
  subtask: 'Talk to the professor',
  dialogue: null,
  tutorState: 'idle',
  gamePhase: 'title',
  viewMode: 'thirdPerson',
  audioMuted: false,
  musicEnabled: true,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  isPaused: false,
  currentZone: 'chemistry',
  playerPosition: { x: 0, z: 5.4 },
  stations: STATIONS,
  activeStation: null,
  setObjective: (objective) => {
    gameAudio.objectiveDing();
    set({ objective });
  },
  setSubtask: (subtask) => {
    gameAudio.objectiveDing();
    set({ subtask });
  },
  showDialogue: (dialogue) => set({ dialogue, tutorState: 'talking' }),
  hideDialogue: () => set({ dialogue: null, tutorState: 'idle' }),
  setTutorState: (tutorState) => set({ tutorState }),
  beginGame: () => {
    gameAudio.whoosh();
    gameAudio.setPaused(false);
    set({ gamePhase: 'intro', viewMode: 'thirdPerson', tutorState: 'idle', isPaused: false });
  },
  completeIntro: () => set({ gamePhase: 'playing' }),
  toggleTacticalView: () => {
    gameAudio.whoosh();
    set((state) => ({
      viewMode: state.viewMode === 'thirdPerson' ? 'tactical' : 'thirdPerson',
    }));
  },
  toggleAudio: () =>
    set((state) => {
      const audioMuted = !state.audioMuted;
      gameAudio.setMuted(audioMuted);
      return { audioMuted };
    }),
  toggleMusic: () =>
    set((state) => {
      const musicEnabled = !state.musicEnabled;
      gameAudio.setMusicEnabled(musicEnabled);
      return { musicEnabled };
    }),
  setMusicVolume: (volume) => {
    const musicVolume = Math.min(100, Math.max(0, Math.round(volume)));
    gameAudio.setMusicVolume(musicVolume);
    set({ musicVolume });
  },
  openPause: () => {
    gameAudio.setPaused(true);
    set({ isPaused: true });
  },
  closePause: () => {
    gameAudio.setPaused(false);
    set({ isPaused: false });
  },
  exitToTitle: () => {
    gameAudio.whoosh();
    gameAudio.setPaused(false);
    set({ gamePhase: 'title', isPaused: false, activeStation: null, tutorState: 'idle' });
  },
  updatePlayerPosition: (x, z) => {
      const state = get();
      const currentZone = zoneForPosition(x, z);
      if (
        state.currentZone === currentZone &&
        Math.abs(state.playerPosition.x - x) < 0.03 &&
        Math.abs(state.playerPosition.z - z) < 0.03
      ) {
        return;
      }
      set({ playerPosition: { x, z }, currentZone });
      if (state.currentZone !== currentZone) {
        useQuestStore.getState().dispatchQuestEvent({ type: 'reached-zone', zoneId: currentZone });
      }
    },
  activateNearbyStation: (x, z) => {
    if (get().isPaused) return;
    const station = STATIONS.reduce<WorldStation | null>((nearest, candidate) => {
      const distance = Math.hypot(candidate.position.x - x, candidate.position.z - z);
      if (distance > 2.25) return nearest;
      if (!nearest) return candidate;
      const nearestDistance = Math.hypot(nearest.position.x - x, nearest.position.z - z);
      return distance < nearestDistance ? candidate : nearest;
    }, null);
    if (station) {
      gameAudio.interactionOpen();
      set({ activeStation: station });
      useQuestStore.getState().dispatchQuestEvent({ type: 'station-opened', stationId: station.id });
    }
  },
  closeStation: () =>
    set((state) => {
      if (state.activeStation) gameAudio.interactionClose();
      return { activeStation: null };
    }),
}));
