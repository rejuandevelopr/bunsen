'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { CHARACTER_ANIMATIONS, LabAssistantModel } from '@/components/models/Characters';
import {
  LAB_ASSISTANT_ROUTE,
  LAB_ASSISTANT_SPEED,
  auditLabAssistantRoute,
  routeZoneAt,
} from '@/lib/lab-assistant';
import { FLOOR_Y } from '@/lib/world';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';

type PatrolMode = 'inspecting' | 'walking' | 'waitingForPlayer';

type PatrolState = {
  currentIndex: number;
  targetIndex: number;
  mode: PatrolMode;
  dwellRemaining: number;
  loops: number;
};

type LabAssistantPatrolProps = {
  characterRef: MutableRefObject<Group | null>;
};

type FacingTransition = {
  from: number;
  to: number;
  elapsed: number;
  returning: boolean;
};

const PLAYER_WAIT_DISTANCE = 1.28;
const PLAYER_PATH_HALF_WIDTH = 0.76;
const PLAYER_RESUME_DISTANCE = 1.52;
const PLAYER_RESUME_PATH_HALF_WIDTH = 0.92;
const ARRIVAL_DISTANCE = 0.055;
const TALK_TURN_DURATION = 0.4;
const LAB_ASSISTANT_ANIMATION_BY_MODE: Readonly<Record<PatrolMode, string>> = {
  inspecting: CHARACTER_ANIMATIONS.idle,
  walking: CHARACTER_ANIMATIONS.walk,
  waitingForPlayer: CHARACTER_ANIMATIONS.idle,
};

export function LabAssistantPatrol({ characterRef }: LabAssistantPatrolProps) {
  const animationRef = useRef<string>(CHARACTER_ANIMATIONS.idle);
  const [animation, setAnimation] = useState<string>(CHARACTER_ANIMATIONS.idle);
  const metrics = useRef({ elapsed: 0, frames: 0 });
  const conversationActive = useTutorStore(
    (state) => state.isOpen && state.activePersonaId === 'rowan-vale',
  );
  const previousConversationActive = useRef(false);
  const storedYaw = useRef(0);
  const facingTransition = useRef<FacingTransition | null>(null);
  const patrol = useRef<PatrolState>({
    currentIndex: 0,
    targetIndex: 1,
    mode: 'inspecting',
    dwellRemaining: randomDwell(),
    loops: 0,
  });

  useEffect(() => {
    const assistant = characterRef.current;
    const startingWaypoint = LAB_ASSISTANT_ROUTE[0];
    if (assistant) {
      assistant.position.set(startingWaypoint.position[0], FLOOR_Y, startingWaypoint.position[1]);
      faceInterestImmediately(assistant, startingWaypoint.interest);
      storedYaw.current = assistant.rotation.y;
    }

    if (process.env.NODE_ENV === 'development') {
      const routeIssues = auditLabAssistantRoute();
      console.info(
        `[Bunsen:lab-assistant-route] ${routeIssues.length === 0 ? 'clear' : 'blocked'} segments=${LAB_ASSISTANT_ROUTE.length} issues=${JSON.stringify(routeIssues)}`,
      );
      console.info(
        `[Bunsen:lab-assistant-animation-map] inspecting=${LAB_ASSISTANT_ANIMATION_BY_MODE.inspecting} walking=${LAB_ASSISTANT_ANIMATION_BY_MODE.walking} waiting=${LAB_ASSISTANT_ANIMATION_BY_MODE.waitingForPlayer}`,
      );
      console.info(
        `[Bunsen:lab-assistant] dwell waypoint=${startingWaypoint.id} seconds=${patrol.current.dwellRemaining.toFixed(2)}`,
      );
    }
  }, [characterRef]);

  useEffect(() => {
    const assistant = characterRef.current;
    if (!assistant || previousConversationActive.current === conversationActive) return;
    previousConversationActive.current = conversationActive;

    if (conversationActive) {
      storedYaw.current = assistant.rotation.y;
      const player = useLabStore.getState().playerPosition;
      const targetYaw = Math.atan2(
        player.x - assistant.position.x,
        player.z - assistant.position.z,
      );
      facingTransition.current = {
        from: assistant.rotation.y,
        to: nearestYaw(assistant.rotation.y, targetYaw),
        elapsed: 0,
        returning: false,
      };
      setAssistantAnimation(CHARACTER_ANIMATIONS.idle);
    } else {
      facingTransition.current = {
        from: assistant.rotation.y,
        to: nearestYaw(assistant.rotation.y, storedYaw.current),
        elapsed: 0,
        returning: true,
      };
    }

    if (process.env.NODE_ENV === 'development') {
      const transition = facingTransition.current;
      console.info(
        `[Bunsen:lab-assistant-facing] ${conversationActive ? 'face-player' : 'return'} from=${transition.from.toFixed(3)} to=${transition.to.toFixed(3)} mode=${patrol.current.mode}`,
      );
    }
  }, [characterRef, conversationActive]);

  useFrame((_, delta) => {
    const assistant = characterRef.current;
    if (!assistant) return;
    if (useLabStore.getState().isPaused) return;
    const frameDelta = Math.min(delta, 0.05);
    assistant.position.y = FLOOR_Y;
    recordPerformance(metrics.current, assistant, patrol.current, delta);

    const transition = facingTransition.current;
    if (transition) {
      transition.elapsed += frameDelta;
      const progress = MathUtils.clamp(transition.elapsed / TALK_TURN_DURATION, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      assistant.rotation.y = MathUtils.lerp(transition.from, transition.to, eased);
      if (progress >= 1) {
        assistant.rotation.y = transition.to;
        facingTransition.current = null;
        if (transition.returning) {
          setAssistantAnimation(LAB_ASSISTANT_ANIMATION_BY_MODE[patrol.current.mode]);
        }
        if (process.env.NODE_ENV === 'development') {
          console.info(
            `[Bunsen:lab-assistant-facing] ${transition.returning ? 'patrol-facing-restored' : 'player-facing-held'} yaw=${transition.to.toFixed(3)}`,
          );
        }
      }
      return;
    }

    if (conversationActive) return;

    if (patrol.current.mode === 'inspecting') {
      const waypoint = LAB_ASSISTANT_ROUTE[patrol.current.currentIndex];
      if (waypoint.interest) {
        turnToward(assistant, waypoint.interest[0], waypoint.interest[1], frameDelta, 7.5);
      }
      patrol.current.dwellRemaining -= frameDelta;
      if (patrol.current.dwellRemaining <= 0) beginWalking(patrol.current);
      return;
    }

    const target = LAB_ASSISTANT_ROUTE[patrol.current.targetIndex];
    const dx = target.position[0] - assistant.position.x;
    const dz = target.position[1] - assistant.position.z;
    const distance = Math.hypot(dx, dz);

    if (playerBlocksPath(assistant, dx, dz, distance, patrol.current.mode === 'waitingForPlayer')) {
      if (patrol.current.mode !== 'waitingForPlayer') {
        transitionPatrolMode(patrol.current, 'waitingForPlayer');
        if (process.env.NODE_ENV === 'development') {
          console.info(`[Bunsen:lab-assistant] player-blocked target=${target.id}`);
        }
      }
      return;
    }

    if (patrol.current.mode === 'waitingForPlayer') {
      transitionPatrolMode(patrol.current, 'walking');
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Bunsen:lab-assistant] player-clear target=${target.id}`);
      }
    }

    if (distance <= Math.max(ARRIVAL_DISTANCE, LAB_ASSISTANT_SPEED * frameDelta)) {
      arriveAtWaypoint(assistant, patrol.current);
      return;
    }

    const directionX = dx / distance;
    const directionZ = dz / distance;
    const step = Math.min(distance, LAB_ASSISTANT_SPEED * frameDelta);
    assistant.position.x += directionX * step;
    assistant.position.z += directionZ * step;
    turnToward(assistant, target.position[0], target.position[1], frameDelta, 10);
  });

  function setAssistantAnimation(nextAnimation: string) {
    if (animationRef.current === nextAnimation) return;
    const previousAnimation = animationRef.current;
    animationRef.current = nextAnimation;
    setAnimation(nextAnimation);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:lab-assistant-state] ${previousAnimation} -> ${nextAnimation}`);
    }
  }

  function transitionPatrolMode(state: PatrolState, nextMode: PatrolMode) {
    if (state.mode === nextMode) return;
    const previousMode = state.mode;
    state.mode = nextMode;
    setAssistantAnimation(LAB_ASSISTANT_ANIMATION_BY_MODE[nextMode]);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:lab-assistant-mode] ${previousMode} -> ${nextMode}`);
    }
  }

  function beginWalking(state: PatrolState) {
    state.targetIndex = (state.currentIndex + 1) % LAB_ASSISTANT_ROUTE.length;
    transitionPatrolMode(state, 'walking');
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[Bunsen:lab-assistant] walk from=${LAB_ASSISTANT_ROUTE[state.currentIndex].id} to=${LAB_ASSISTANT_ROUTE[state.targetIndex].id}`,
      );
    }
  }

  function arriveAtWaypoint(assistant: Group, state: PatrolState) {
    const arrivedIndex = state.targetIndex;
    const waypoint = LAB_ASSISTANT_ROUTE[arrivedIndex];
    assistant.position.set(waypoint.position[0], FLOOR_Y, waypoint.position[1]);
    state.currentIndex = arrivedIndex;
    if (arrivedIndex === 0) {
      state.loops += 1;
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Bunsen:lab-assistant] loop-complete count=${state.loops}`);
      }
    }

    if (!waypoint.interest) {
      state.targetIndex = (arrivedIndex + 1) % LAB_ASSISTANT_ROUTE.length;
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Bunsen:lab-assistant] navigate via=${waypoint.id} next=${LAB_ASSISTANT_ROUTE[state.targetIndex].id}`);
      }
      return;
    }

    state.dwellRemaining = randomDwell();
    transitionPatrolMode(state, 'inspecting');
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[Bunsen:lab-assistant] dwell waypoint=${waypoint.id} animation=${LAB_ASSISTANT_ANIMATION_BY_MODE.inspecting} seconds=${state.dwellRemaining.toFixed(2)}`,
      );
    }
  }

  return <LabAssistantModel animation={animation} characterRef={characterRef} />;
}

function playerBlocksPath(
  assistant: Group,
  targetDx: number,
  targetDz: number,
  targetDistance: number,
  alreadyWaiting: boolean,
) {
  if (useLabStore.getState().gamePhase !== 'playing' || targetDistance <= ARRIVAL_DISTANCE) return false;
  const player = useLabStore.getState().playerPosition;
  const playerDx = player.x - assistant.position.x;
  const playerDz = player.z - assistant.position.z;
  const playerDistance = Math.hypot(playerDx, playerDz);
  const waitDistance = alreadyWaiting ? PLAYER_RESUME_DISTANCE : PLAYER_WAIT_DISTANCE;
  if (playerDistance > waitDistance) return false;

  const directionX = targetDx / targetDistance;
  const directionZ = targetDz / targetDistance;
  const forwardDistance = playerDx * directionX + playerDz * directionZ;
  const lateralDistance = Math.abs(playerDx * directionZ - playerDz * directionX);
  const pathHalfWidth = alreadyWaiting ? PLAYER_RESUME_PATH_HALF_WIDTH : PLAYER_PATH_HALF_WIDTH;
  return forwardDistance > -0.08 && lateralDistance < pathHalfWidth;
}

function turnToward(group: Group, targetX: number, targetZ: number, delta: number, response: number) {
  const targetYaw = Math.atan2(targetX - group.position.x, targetZ - group.position.z);
  const turn = MathUtils.euclideanModulo(targetYaw - group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  group.rotation.y += turn * (1 - Math.exp(-response * delta));
}

function faceInterestImmediately(group: Group, interest?: readonly [number, number]) {
  if (!interest) return;
  group.rotation.y = Math.atan2(interest[0] - group.position.x, interest[1] - group.position.z);
}

function nearestYaw(current: number, target: number) {
  const turn = MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + turn;
}

function randomDwell() {
  return 4 + Math.random() * 4;
}

function recordPerformance(
  metrics: { elapsed: number; frames: number },
  assistant: Group,
  state: PatrolState,
  delta: number,
) {
  if (process.env.NODE_ENV !== 'development') return;
  metrics.elapsed += delta;
  metrics.frames += 1;
  if (metrics.elapsed < 5) return;
  const fps = metrics.frames / metrics.elapsed;
  document.documentElement.dataset.bunsenFps = fps.toFixed(1);
  const target = LAB_ASSISTANT_ROUTE[state.mode === 'inspecting' ? state.currentIndex : state.targetIndex];
  console.info(
    `[Bunsen:lab-assistant-perf] fps=${fps.toFixed(1)} position=${assistant.position.x.toFixed(2)},${assistant.position.y.toFixed(3)},${assistant.position.z.toFixed(2)} zone=${routeZoneAt(assistant.position.x, assistant.position.z)} phase=${state.mode} target=${target.id}`,
  );
  metrics.elapsed = 0;
  metrics.frames = 0;
}
