'use client';

import { useEffect, useRef } from 'react';
import { LoopOnce, LoopRepeat, type AnimationAction } from 'three';

type AnimationActions = Partial<Record<string, AnimationAction | null>>;

export const SAFE_IDLE_PRIORITY = [
  'CharacterArmature|Idle_Neutral',
  'CharacterArmature|Idle',
  'HumanArmature|Man_Standing',
  'HumanArmature|Man_Idle',
] as const;

export const SAFE_DIALOGUE_PRIORITY = [
  'CharacterArmature|Idle_Neutral',
  'CharacterArmature|Idle',
  'HumanArmature|Man_Idle',
  // Despite its name, this pack's Man_Standing clip contains a pronounced
  // knee-raised/sitting motion. Keep it only as a last-resort fallback.
  'HumanArmature|Man_Standing',
] as const;

export const SAFE_WALK_PRIORITY = [
  'CharacterArmature|Walk',
  'HumanArmature|Man_Walk',
] as const;

export const SAFE_GESTURE_PRIORITY = [
  'CharacterArmature|Interact',
  'HumanArmature|Man_Standing',
] as const;

const UNSAFE_CLIP_TERMS = [
  'sit',
  'death',
  'gun',
  'punch',
  'kick',
  'sword',
  'hit',
  'roll',
  'run',
  'upper',
  'partial',
  'halfbody',
] as const;

export function resolveSafeNpcClip(
  names: readonly string[],
  priorities: readonly string[],
  safeTerms: readonly string[],
) {
  for (const preferred of priorities) {
    if (names.includes(preferred) && !isUnsafeNpcClip(preferred)) return preferred;
  }
  return names.find((name) => {
    const normalized = name.toLowerCase();
    return !isUnsafeNpcClip(name) && safeTerms.some((term) => normalized.includes(term));
  });
}

export function resolveDialogueIdleClip(names: readonly string[]) {
  return resolveSafeNpcClip(names, SAFE_DIALOGUE_PRIORITY, ['standing', 'idle']);
}

export function isUnsafeNpcClip(name: string) {
  const normalized = name.toLowerCase();
  return UNSAFE_CLIP_TERMS.some((term) => normalized.includes(term));
}

export function useGuardedNpcAnimation({
  actions,
  clip,
  label,
  once = false,
  crossfadeSeconds = 0.2,
}: {
  actions: AnimationActions;
  clip?: string;
  label: string;
  once?: boolean;
  crossfadeSeconds?: number;
}) {
  const activeClip = useRef<string | null>(null);
  const activeAction = useRef<AnimationAction | null>(null);

  useEffect(() => {
    if (!clip) return;
    const nextAction = actions[clip];
    if (!nextAction || (activeClip.current === clip && activeAction.current === nextAction)) {
      return;
    }

    const previousAction = activeAction.current;
    previousAction?.fadeOut(crossfadeSeconds);
    nextAction
      .reset()
      .setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity)
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(crossfadeSeconds)
      .play();
    nextAction.clampWhenFinished = once;
    activeClip.current = clip;
    activeAction.current = nextAction;

    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:npc-animation] ${label} clip=${clip} once=${once}`);
    }
  }, [actions, clip, crossfadeSeconds, label, once]);

  useEffect(
    () => () => {
      activeAction.current?.stop();
      activeAction.current = null;
      activeClip.current = null;
    },
    [],
  );

  return { activeClip, activeAction } as const;
}
