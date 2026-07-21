'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { useLabStore } from '@/store/lab-store';

type FacingTransition = {
  from: number;
  to: number;
  elapsed: number;
  returning: boolean;
};

const TALK_TURN_DURATION = 0.4;

export function useNpcDialogueFacing({
  characterRef,
  conversationActive,
  npcId,
  onConversationStart,
  onReturnComplete,
}: {
  characterRef: MutableRefObject<Group | null>;
  conversationActive: boolean;
  npcId: string;
  onConversationStart?: () => void;
  onReturnComplete?: () => void;
}) {
  const previousConversationActive = useRef(false);
  const storedYaw = useRef(0);
  const transition = useRef<FacingTransition | null>(null);
  const isTransitioning = useRef(false);
  const onConversationStartRef = useRef(onConversationStart);
  const onReturnCompleteRef = useRef(onReturnComplete);
  onConversationStartRef.current = onConversationStart;
  onReturnCompleteRef.current = onReturnComplete;

  useEffect(() => {
    const character = characterRef.current;
    if (!character || previousConversationActive.current === conversationActive) return;
    previousConversationActive.current = conversationActive;

    if (conversationActive) {
      storedYaw.current = character.rotation.y;
      const player = useLabStore.getState().playerPosition;
      const targetYaw = Math.atan2(
        player.x - character.position.x,
        player.z - character.position.z,
      );
      transition.current = {
        from: character.rotation.y,
        to: nearestYaw(character.rotation.y, targetYaw),
        elapsed: 0,
        returning: false,
      };
      onConversationStartRef.current?.();
    } else {
      transition.current = {
        from: character.rotation.y,
        to: nearestYaw(character.rotation.y, storedYaw.current),
        elapsed: 0,
        returning: true,
      };
    }
    isTransitioning.current = true;

    if (process.env.NODE_ENV === 'development') {
      const turn = transition.current;
      console.info(
        `[Bunsen:npc-facing] ${npcId} ${conversationActive ? 'face-player' : 'return'} from=${turn.from.toFixed(3)} to=${turn.to.toFixed(3)}`,
      );
    }
  }, [characterRef, conversationActive, npcId]);

  useFrame((_, delta) => {
    const character = characterRef.current;
    const turn = transition.current;
    if (!character || !turn) return;
    turn.elapsed += Math.min(delta, 0.05);
    const progress = MathUtils.clamp(turn.elapsed / TALK_TURN_DURATION, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    character.rotation.y = MathUtils.lerp(turn.from, turn.to, eased);
    if (progress < 1) return;

    character.rotation.y = turn.to;
    transition.current = null;
    isTransitioning.current = false;
    if (turn.returning) onReturnCompleteRef.current?.();

    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[Bunsen:npc-facing] ${npcId} ${turn.returning ? 'work-facing-restored' : 'player-facing-held'} yaw=${turn.to.toFixed(3)}`,
      );
    }
  });

  return { isTransitioning } as const;
}

function nearestYaw(current: number, target: number) {
  const turn = MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + turn;
}
