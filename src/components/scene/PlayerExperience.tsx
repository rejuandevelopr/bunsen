'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, Quaternion, Vector3 } from 'three';
import { CHARACTER_ANIMATIONS, StudentPlayerModel } from '@/components/models/Characters';
import { gameAudio } from '@/lib/audio';
import { derivePlayerMotion } from '@/lib/player-motion';
import { RESEARCHER_PLAYER_CLEARANCE } from '@/lib/researchers';
import { RESEARCHERS } from '@/lib/researchers';
import { NPC_PERSONAS, type NpcPersonaId } from '@/lib/ai/personas';
import { FLOOR_Y, PROFESSOR_POSITION, WORLD_LIMITS, WORLD_OBSTACLES } from '@/lib/world';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';
import { useQuestStore } from '@/store/quest-store';
import { CameraRig } from './CameraRig';

const PLAYER_START = new Vector3(0, FLOOR_Y, 5.4);

const UP = new Vector3(0, 1, 0);
const PLAYER_RADIUS = 0.26;
const LAB_ASSISTANT_COLLISION_RADIUS = 0.68;

type PlayerExperienceProps = {
  assistantRef: MutableRefObject<Group | null>;
  researcherRefs: readonly MutableRefObject<Group | null>[];
};

export function PlayerExperience({ assistantRef, researcherRefs }: PlayerExperienceProps) {
  const playerRef = useRef<Group>(null);
  const headingRef = useRef(new Vector3(0, 0, -1));
  const pressedKeys = useRef(new Set<string>());
  const footstepTimer = useRef(0);
  const positionSampleTimer = useRef(0);
  const assistantCollisionLogCooldown = useRef(0);
  const animationRef = useRef<string>(CHARACTER_ANIMATIONS.idle);
  const [animation, setAnimation] = useState<string>(CHARACTER_ANIMATIONS.idle);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.position.copy(resolveDevelopmentSpawn());
      player.rotation.y = Math.PI;
      useLabStore.getState().updatePlayerPosition(player.position.x, player.position.z);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.code);
      if (event.repeat) return;
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      if (
        event.code === 'KeyE'
        && useLabStore.getState().gamePhase === 'playing'
        && !useLabStore.getState().isPaused
      ) {
        const npc = findNearestNpc(
          currentPlayer.position.x,
          currentPlayer.position.z,
          assistantRef,
          researcherRefs,
        );
        if (npc) {
          useLabStore.getState().closeStation();
          useTutorStore.getState().openChat(npc.personaId);
          useQuestStore.getState().dispatchQuestEvent({
            type: 'talked-to-npc',
            npcId: npc.personaId,
            interaction: 'opened',
          });
        } else {
          useLabStore.getState().activateNearbyStation(currentPlayer.position.x, currentPlayer.position.z);
        }
      }
      if (event.code === 'Escape') {
        const lab = useLabStore.getState();
        const tutor = useTutorStore.getState();
        if (tutor.isOpen) {
          tutor.closeChat();
        } else if (lab.activeStation) {
          lab.closeStation();
        } else if (lab.gamePhase === 'playing') {
          if (lab.isPaused) lab.closePause();
          else lab.openPause();
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code);
    };
    const clearKeys = () => pressedKeys.current.clear();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [assistantRef, researcherRefs]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player) return;
    positionSampleTimer.current += delta;
    if (positionSampleTimer.current >= 0.1) {
      positionSampleTimer.current %= 0.1;
      useLabStore.getState().updatePlayerPosition(player.position.x, player.position.z);
      useTutorStore.getState().setNearbyNpc(
        findNearestNpc(player.position.x, player.position.z, assistantRef, researcherRefs),
      );
    }
    if (useLabStore.getState().gamePhase !== 'playing' || useLabStore.getState().isPaused) {
      updateAnimation(CHARACTER_ANIMATIONS.idle, 0);
      return;
    }

    if (useLabStore.getState().activeStation || useTutorStore.getState().isOpen) {
      updateAnimation(CHARACTER_ANIMATIONS.idle, 0);
      return;
    }

    const keys = pressedKeys.current;
    const forwardInput = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const sideInput = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const isMoving = forwardInput !== 0 || sideInput !== 0;
    const isRunning = isMoving && (keys.has('ShiftLeft') || keys.has('ShiftRight'));

    if (!isMoving) {
      footstepTimer.current = 0;
      updateAnimation(CHARACTER_ANIMATIONS.idle, 0);
      return;
    }

    const cameraForward = camera.getWorldDirection(new Vector3());
    cameraForward.y = 0;
    cameraForward.normalize();
    const cameraRight = new Vector3().crossVectors(cameraForward, UP).normalize();
    const movement = cameraForward
      .multiplyScalar(forwardInput)
      .addScaledVector(cameraRight, sideInput)
      .normalize();

    const speed = isRunning ? 3.15 : 1.85;
    const step = movement.clone().multiplyScalar(speed * delta);
    const previousX = player.position.x;
    const previousZ = player.position.z;
    assistantCollisionLogCooldown.current = Math.max(0, assistantCollisionLogCooldown.current - delta);
    const dynamicBlock = moveWithCollisions(
      player.position,
      step,
      assistantRef.current?.position,
      researcherRefs,
    );
    if (
      dynamicBlock &&
      assistantCollisionLogCooldown.current === 0 &&
      process.env.NODE_ENV === 'development'
    ) {
      assistantCollisionLogCooldown.current = 1;
      console.info(`[Bunsen:player-collision] ${dynamicBlock}`);
    }
    const horizontalSpeed = Math.hypot(
      player.position.x - previousX,
      player.position.z - previousZ,
    ) / Math.max(delta, 0.0001);

    headingRef.current.lerp(movement, 1 - Math.exp(-9 * delta)).normalize();
    const targetYaw = Math.atan2(headingRef.current.x, headingRef.current.z);
    const targetRotation = new Quaternion().setFromAxisAngle(UP, targetYaw);
    player.quaternion.slerp(targetRotation, 1 - Math.exp(-11 * delta));

    const derivedAnimation = CHARACTER_ANIMATIONS[derivePlayerMotion(horizontalSpeed)];
    updateAnimation(derivedAnimation, horizontalSpeed);
    if (derivedAnimation === CHARACTER_ANIMATIONS.idle) {
      footstepTimer.current = 0;
      return;
    }
    footstepTimer.current += delta;
    const cadence = isRunning ? 0.29 : 0.46;
    if (footstepTimer.current >= cadence) {
      footstepTimer.current %= cadence;
      gameAudio.footstep(isRunning);
    }
  });

  const updateAnimation = (nextAnimation: string, speed: number) => {
    if (animationRef.current === nextAnimation) return;
    const previousAnimation = animationRef.current;
    animationRef.current = nextAnimation;
    setAnimation(nextAnimation);
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[Bunsen:player-state] ${previousAnimation} -> ${nextAnimation} speed=${speed.toFixed(2)}`,
      );
    }
  };

  return (
    <>
      <StudentPlayerModel animation={animation} characterRef={playerRef} />
      <CameraRig playerRef={playerRef} headingRef={headingRef} />
    </>
  );
}

function resolveDevelopmentSpawn() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return PLAYER_START;
  const spawn = new URLSearchParams(window.location.search).get('spawn');
  if (spawn === 'instrument') return new Vector3(4.25, FLOOR_Y, 15.45);
  if (spawn === 'discovery') return new Vector3(-10.25, FLOOR_Y, 15.55);
  if (spawn === 'study') return new Vector3(-10.35, FLOOR_Y, 6.35);
  if (spawn === 'greenhouse') return new Vector3(10.25, FLOOR_Y, 6.35);
  if (spawn === 'titration') return new Vector3(0.7, FLOOR_Y, 4.7);
  if (spawn === 'research-desk') return new Vector3(-7.8, FLOOR_Y, 2.9);
  if (spawn === 'notes-instruments') return new Vector3(-0.75, FLOOR_Y, 7.9);
  if (spawn === 'notes-optics') return new Vector3(-0.35, FLOOR_Y, 19.15);
  if (spawn === 'notes-method') return new Vector3(-7.45, FLOOR_Y, 5.95);
  if (spawn === 'notes-plants') return new Vector3(10.25, FLOOR_Y, 3.95);
  if (spawn === 'professor') return new Vector3(3.72, FLOOR_Y, 0.75);
  if (spawn === 'researcher') return new Vector3(-11.48, FLOOR_Y, 6.15);
  if (spawn === 'mira') return new Vector3(0.15, FLOOR_Y, 9.45);
  if (spawn === 'elias') return new Vector3(5.7, FLOOR_Y, 10.75);
  if (spawn === 'lena') return new Vector3(-14.7, FLOOR_Y, 13.55);
  if (spawn === 'amara') return new Vector3(-12.15, FLOOR_Y, 2.15);
  if (spawn === 'kai') return new Vector3(-12.15, FLOOR_Y, 6.82);
  if (spawn === 'rowan') return new Vector3(11.2, FLOOR_Y, 3.1);
  return PLAYER_START;
}

function findNearestNpc(
  x: number,
  z: number,
  assistantRef: MutableRefObject<Group | null>,
  researcherRefs: readonly MutableRefObject<Group | null>[],
) {
  const candidates: Array<{ personaId: NpcPersonaId; name: string; x: number; z: number }> = [
    {
      personaId: 'professor-quill',
      name: NPC_PERSONAS['professor-quill'].name,
      x: PROFESSOR_POSITION.x,
      z: PROFESSOR_POSITION.z,
    },
  ];

  const assistant = assistantRef.current;
  if (assistant) {
    candidates.push({
      personaId: 'rowan-vale',
      name: NPC_PERSONAS['rowan-vale'].name,
      x: assistant.position.x,
      z: assistant.position.z,
    });
  }

  researcherRefs.forEach((researcherRef, index) => {
    const researcher = researcherRef.current;
    const definition = RESEARCHERS[index];
    if (!researcher || !definition) return;
    candidates.push({
      personaId: definition.personaId,
      name: definition.name,
      x: researcher.position.x,
      z: researcher.position.z,
    });
  });

  const nearest = candidates.reduce<(typeof candidates)[number] & { distance: number } | null>(
    (current, candidate) => {
      const distance = Math.hypot(candidate.x - x, candidate.z - z);
      if (distance > 2.25 || (current && current.distance <= distance)) return current;
      return { ...candidate, distance };
    },
    null,
  );

  return nearest
    ? { personaId: nearest.personaId, name: nearest.name, distance: nearest.distance }
    : null;
}

function moveWithCollisions(
  position: Vector3,
  step: Vector3,
  assistantPosition: Vector3 | undefined,
  researcherRefs: readonly MutableRefObject<Group | null>[],
) {
  const nextX = MathUtils.clamp(position.x + step.x, WORLD_LIMITS.minX, WORLD_LIMITS.maxX);
  const nextZ = MathUtils.clamp(position.z + step.z, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ);

  const fullBlock = blockedBy(nextX, nextZ, assistantPosition, researcherRefs);
  let dynamicBlock = fullBlock === 'assistant' || fullBlock === 'researcher' ? fullBlock : null;
  if (!fullBlock) {
    position.x = nextX;
    position.z = nextZ;
    return dynamicBlock;
  }
  const xBlock = blockedBy(nextX, position.z, assistantPosition, researcherRefs);
  const zBlock = blockedBy(position.x, nextZ, assistantPosition, researcherRefs);
  if (!dynamicBlock && (xBlock === 'assistant' || xBlock === 'researcher')) dynamicBlock = xBlock;
  if (!dynamicBlock && (zBlock === 'assistant' || zBlock === 'researcher')) dynamicBlock = zBlock;
  if (!xBlock) position.x = nextX;
  if (!zBlock) position.z = nextZ;
  return dynamicBlock;
}

function blockedBy(
  x: number,
  z: number,
  assistantPosition: Vector3 | undefined,
  researcherRefs: readonly MutableRefObject<Group | null>[],
): 'world' | 'assistant' | 'researcher' | null {
  const worldBlocked = WORLD_OBSTACLES.some(
    (obstacle) =>
      x > obstacle.minX - PLAYER_RADIUS &&
      x < obstacle.maxX + PLAYER_RADIUS &&
      z > obstacle.minZ - PLAYER_RADIUS &&
      z < obstacle.maxZ + PLAYER_RADIUS,
  );
  if (worldBlocked) return 'world';
  if (
    assistantPosition &&
    Math.hypot(x - assistantPosition.x, z - assistantPosition.z) < LAB_ASSISTANT_COLLISION_RADIUS
  ) {
    return 'assistant';
  }
  if (
    researcherRefs.some((researcherRef) => {
      const researcher = researcherRef.current;
      return researcher && Math.hypot(x - researcher.position.x, z - researcher.position.z) < RESEARCHER_PLAYER_CLEARANCE;
    })
  ) {
    return 'researcher';
  }
  return null;
}
