'use client';

export const MUSIC_TRACK_PATH = '/sfx/music-ambient.mp3';
export const MUSIC_LOOP_CROSSFADE_SECONDS = 1.5;
export const MUSIC_BASE_TRIM = 0.35;
export const DEFAULT_MUSIC_VOLUME = 15;

const CURVE_SAMPLES = 129;

export function createTrackCrossfadeCurves(level = 1, samples = CURVE_SAMPLES) {
  const length = Math.max(2, samples);
  const fadeIn = new Float32Array(length);
  const fadeOut = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const progress = index / (length - 1);
    const phase = progress * Math.PI * 0.5;
    fadeIn[index] = Math.sin(phase) * level;
    fadeOut[index] = Math.cos(phase) * level;
  }
  return { fadeIn, fadeOut };
}

type MusicTimer = ReturnType<typeof globalThis.setTimeout>;

export class SeamlessMusicTrack {
  private readonly context: AudioContext;
  private readonly output: GainNode;
  private readonly sources = new Set<AudioBufferSourceNode>();
  private buffer: AudioBuffer | null = null;
  private loadPromise: Promise<AudioBuffer> | null = null;
  private scheduleTimer: MusicTimer | null = null;
  private started = false;
  private disposed = false;
  private targetLevel = 0;
  private scheduledSources = 0;

  constructor(context: AudioContext, destination: AudioNode) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.setValueAtTime(0, context.currentTime);
    this.output.connect(destination);
  }

  async start() {
    if (this.started || this.disposed) return;
    try {
      this.buffer = await this.load();
      if (this.started || this.disposed) return;
      this.started = true;
      this.scheduleSource(this.context.currentTime + 0.06, true);
      if (process.env.NODE_ENV !== 'production') {
        console.info(
          `[Bunsen music] playing ${MUSIC_TRACK_PATH}; ${this.buffer.duration.toFixed(2)}s buffer; ${MUSIC_LOOP_CROSSFADE_SECONDS.toFixed(1)}s loop overlap`,
        );
      }
    } catch (error) {
      console.error('[Bunsen music] Could not load the ambient track.', error);
    }
  }

  setTargetLevel(level: number, rampSeconds = 0.25) {
    if (this.disposed) return;
    this.targetLevel = Math.min(1, Math.max(0, level));
    const now = this.context.currentTime;
    holdAudioParam(this.output.gain, now);
    this.output.gain.linearRampToValueAtTime(this.targetLevel, now + rampSeconds);
  }

  getDebugState() {
    return {
      loaded: Boolean(this.buffer),
      playing: this.started && !this.disposed,
      duration: this.buffer?.duration ?? 0,
      targetLevel: this.targetLevel,
      loopCrossfadeSeconds: MUSIC_LOOP_CROSSFADE_SECONDS,
      scheduledSources: this.scheduledSources,
    } as const;
  }

  stop() {
    if (this.disposed) return;
    this.disposed = true;
    this.started = false;
    this.targetLevel = 0;
    if (this.scheduleTimer) {
      globalThis.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }

    const now = this.context.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(0, now);
    this.sources.forEach((source) => {
      try {
        source.stop(now);
      } catch {
        // The source may already have ended; disconnecting the graph is sufficient.
      }
    });
    this.sources.clear();
    this.output.disconnect();
  }

  private load() {
    if (this.buffer) return Promise.resolve(this.buffer);
    if (!this.loadPromise) {
      this.loadPromise = fetch(MUSIC_TRACK_PATH)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes));
    }
    return this.loadPromise;
  }

  private scheduleSource(requestedStart: number, first: boolean) {
    const buffer = this.buffer;
    if (!buffer || !this.started || this.disposed) return;

    const overlap = Math.min(MUSIC_LOOP_CROSSFADE_SECONDS, buffer.duration * 0.2);
    const cycleDuration = buffer.duration - overlap;
    let startTime = requestedStart;
    while (startTime < this.context.currentTime + 0.04) startTime += cycleDuration;

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const { fadeIn, fadeOut } = createTrackCrossfadeCurves();
    const endTime = startTime + buffer.duration;
    const nextStart = endTime - overlap;
    const initialFade = first ? Math.min(1.5, overlap) : overlap;

    source.buffer = buffer;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.setValueCurveAtTime(fadeIn, startTime, initialFade);
    gain.gain.setValueAtTime(1, nextStart);
    gain.gain.setValueCurveAtTime(fadeOut, nextStart, overlap);
    source.connect(gain).connect(this.output);
    source.start(startTime);
    source.stop(endTime + 0.08);
    this.scheduledSources += 1;
    document.documentElement.dataset.bunsenMusicScheduledSources = String(this.scheduledSources);
    this.sources.add(source);
    source.addEventListener('ended', () => {
      this.sources.delete(source);
      source.disconnect();
      gain.disconnect();
    }, { once: true });

    const lookAhead = Math.min(5, cycleDuration * 0.25);
    const scheduleInMs = Math.max(0, (nextStart - this.context.currentTime - lookAhead) * 1000);
    if (this.scheduleTimer) globalThis.clearTimeout(this.scheduleTimer);
    this.scheduleTimer = globalThis.setTimeout(() => {
      this.scheduleTimer = null;
      this.scheduleSource(nextStart, false);
    }, scheduleInMs);
  }
}

function holdAudioParam(parameter: AudioParam, atTime: number) {
  if (typeof parameter.cancelAndHoldAtTime === 'function') {
    parameter.cancelAndHoldAtTime(atTime);
    return;
  }
  const currentValue = parameter.value;
  parameter.cancelScheduledValues(atTime);
  parameter.setValueAtTime(currentValue, atTime);
}
