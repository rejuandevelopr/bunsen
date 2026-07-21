'use client';

import {
  DEFAULT_MUSIC_VOLUME,
  MUSIC_BASE_TRIM,
  MUSIC_LOOP_CROSSFADE_SECONDS,
  MUSIC_TRACK_PATH,
  SeamlessMusicTrack,
} from '@/lib/music-track';

export {
  DEFAULT_MUSIC_VOLUME,
  MUSIC_LOOP_CROSSFADE_SECONDS,
  MUSIC_TRACK_PATH,
};

export const INTERACTION_SOUND_SECONDS = 0.12;

export const SFX_ASSETS = {
  footstepWalk: '/sfx/footstep-walk.mp3',
  footstepRun: '/sfx/footstep-run.mp3',
  cameraWhoosh: '/sfx/camera-whoosh.mp3',
  objectiveDing: '/sfx/objective-ding.mp3',
  musicAmbient: MUSIC_TRACK_PATH,
} as const;

type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

class GameAudioBus {
  private context: AudioContext | null = null;
  private music: SeamlessMusicTrack | null = null;
  private unlocked = false;
  private muted = false;
  private musicEnabled = true;
  private paused = false;
  private dialogueStreaming = false;
  private musicVolume = DEFAULT_MUSIC_VOLUME;
  private interactionSequence = 0;
  private lifecycleAttached = false;

  private readonly handlePageExit = () => {
    this.dispose();
  };

  private readonly handleVisibilityChange = () => {
    const context = this.context;
    if (!context) return;
    if (document.visibilityState === 'hidden') {
      void context.suspend();
      return;
    }
    if (this.unlocked && context.state === 'suspended') void context.resume();
  };

  setMuted(muted: boolean) {
    this.muted = muted;
    this.refreshMusicMix();
    this.syncDebugAttributes();
  }

  isMuted() {
    return this.muted;
  }

  async unlock() {
    const context = this.getContext();
    if (!context) return;
    this.unlocked = true;
    if (context.state === 'suspended') await context.resume();
    this.ensureMusic(context);
    this.refreshMusicMix();
    await this.music?.start();
    this.syncDebugAttributes();
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[Bunsen audio] context ${context.state}; licensed ambient track unlocked`);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.refreshMusicMix();
    this.syncDebugAttributes();
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  setMusicVolume(percent: number) {
    this.musicVolume = Math.min(100, Math.max(0, percent));
    this.refreshMusicMix();
    this.syncDebugAttributes();
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.refreshMusicMix();
    this.syncDebugAttributes();
  }

  setDialogueStreaming(streaming: boolean) {
    this.dialogueStreaming = streaming;
    this.refreshMusicMix();
    this.syncDebugAttributes();
  }

  getMusicDebugState() {
    return {
      contextState: this.context?.state ?? 'not-created',
      enabled: this.musicEnabled,
      muted: this.muted,
      paused: this.paused,
      dialogueStreaming: this.dialogueStreaming,
      volumePercent: this.musicVolume,
      ...this.music?.getDebugState(),
    } as const;
  }

  dispose() {
    this.music?.stop();
    this.music = null;
    this.unlocked = false;

    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') {
      void context.close().catch(() => undefined);
    }

    this.detachLifecycle();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.bunsenAudioDisposed = 'true';
      document.documentElement.dataset.bunsenMusicPlaying = 'false';
      document.documentElement.dataset.bunsenAudioState = 'closed';
    }
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Bunsen audio] stopped and disposed');
    }
  }

  footstep(running: boolean) {
    if (this.muted || !this.unlocked) return;
    const context = this.getContext();
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(running ? 105 : 82, now);
    oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.07);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(running ? 0.018 : 0.012, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  }

  interactionOpen() {
    this.interactionTone('open');
  }

  interactionClose() {
    this.interactionTone('close');
  }

  whoosh() {
    if (this.muted || !this.unlocked) return;
    const context = this.getContext();
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(170, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.34);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  objectiveDing() {
    if (this.muted || !this.unlocked) return;
    const context = this.getContext();
    if (!context) return;

    const now = context.currentTime;
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.075;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.025, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
    });
  }

  private interactionTone(kind: 'open' | 'close') {
    if (this.muted || !this.unlocked) return;
    const context = this.context;
    if (!context) return;
    this.interactionSequence += 1;
    document.documentElement.dataset.bunsenLastInteractionSfx = kind;
    document.documentElement.dataset.bunsenInteractionSfxCount = String(this.interactionSequence);
    const now = context.currentTime;
    const frequencies = kind === 'open' ? [510, 680] : [470, 360];
    const peak = kind === 'open' ? 0.007 : 0.005;

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.024;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * (kind === 'open' ? 1.06 : 0.92),
        start + INTERACTION_SOUND_SECONDS,
      );
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + INTERACTION_SOUND_SECONDS);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + INTERACTION_SOUND_SECONDS + 0.01);
    });
  }

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (this.context) return this.context;
    const AudioContextConstructor =
      window.AudioContext ?? (window as BrowserWindow).webkitAudioContext;
    this.context = AudioContextConstructor ? new AudioContextConstructor() : null;
    if (this.context) {
      this.attachLifecycle();
      document.documentElement.dataset.bunsenAudioDisposed = 'false';
    }
    return this.context;
  }

  private attachLifecycle() {
    if (this.lifecycleAttached || typeof window === 'undefined') return;
    window.addEventListener('pagehide', this.handlePageExit);
    window.addEventListener('beforeunload', this.handlePageExit);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.lifecycleAttached = true;
  }

  private detachLifecycle() {
    if (!this.lifecycleAttached || typeof window === 'undefined') return;
    window.removeEventListener('pagehide', this.handlePageExit);
    window.removeEventListener('beforeunload', this.handlePageExit);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.lifecycleAttached = false;
  }

  private ensureMusic(context: AudioContext) {
    if (this.music) return;
    this.music = new SeamlessMusicTrack(context, context.destination);
  }

  private refreshMusicMix() {
    const ducked = this.paused || this.dialogueStreaming;
    const audible = !this.muted && this.musicEnabled;
    const level = audible
      ? MUSIC_BASE_TRIM * (this.musicVolume / 100) * (ducked ? 0.5 : 1)
      : 0;
    this.music?.setTargetLevel(level);
  }

  private syncDebugAttributes() {
    if (typeof document === 'undefined') return;
    const debug = this.music?.getDebugState();
    const root = document.documentElement;
    root.dataset.bunsenAudioState = this.context?.state ?? 'not-created';
    root.dataset.bunsenMusic = this.musicEnabled ? 'on' : 'off';
    root.dataset.bunsenAudioMuted = this.muted ? 'true' : 'false';
    root.dataset.bunsenMusicDucked = this.paused || this.dialogueStreaming ? 'true' : 'false';
    root.dataset.bunsenMusicVolume = String(Math.round(this.musicVolume));
    root.dataset.bunsenMusicSource = MUSIC_TRACK_PATH;
    root.dataset.bunsenMusicPlaying = debug?.playing ? 'true' : 'false';
    root.dataset.bunsenMusicLoopCrossfade = String(MUSIC_LOOP_CROSSFADE_SECONDS);
    root.dataset.bunsenMusicDuration = debug?.duration ? debug.duration.toFixed(2) : '0';
  }
}

export const gameAudio = new GameAudioBus();
