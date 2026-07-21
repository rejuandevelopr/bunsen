export type PlayerMotionState = 'idle' | 'walk' | 'run';

export const IDLE_SPEED_THRESHOLD = 0.08;
export const RUN_SPEED_THRESHOLD = 2.45;

export function derivePlayerMotion(speed: number): PlayerMotionState {
  if (speed < IDLE_SPEED_THRESHOLD) return 'idle';
  if (speed >= RUN_SPEED_THRESHOLD) return 'run';
  return 'walk';
}
