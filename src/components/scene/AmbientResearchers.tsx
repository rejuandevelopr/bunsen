'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { ResearcherModel, type ResearcherMotion } from '@/components/models/ResearcherModel';
import {
  RESEARCHERS,
  RESEARCHER_SPEED,
  auditResearcherClearance,
  type ResearcherDefinition,
} from '@/lib/researchers';
import { FLOOR_Y } from '@/lib/world';
import { useLabStore } from '@/store/lab-store';
import { useTutorStore } from '@/store/tutor-store';
import { useNpcDialogueFacing } from './useNpcDialogueFacing';

type AmbientResearchersProps = {
  characterRefs: readonly MutableRefObject<Group | null>[];
};

type WorkerMode = 'working' | 'walking';

type WorkerState = {
  currentIndex: number;
  targetIndex: number;
  mode: WorkerMode;
  dwellRemaining: number;
  gestureRemaining: number;
  gesturePlayed: boolean;
  cycles: number;
  facingOffset: number;
};

const ARRIVAL_DISTANCE = 0.045;

export function AmbientResearchers({ characterRefs }: AmbientResearchersProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const issues = auditResearcherClearance();
    console.info(
      `[Bunsen:researcher-clearance] ${issues.length === 0 ? 'clear' : 'blocked'} workers=${RESEARCHERS.length} issues=${JSON.stringify(issues)}`,
    );
  }, []);

  return (
    <group>
      {RESEARCHERS.map((definition, index) => (
        <WorkstationResearcher
          key={definition.id}
          definition={definition}
          characterRef={characterRefs[index]}
        />
      ))}
    </group>
  );
}

function WorkstationResearcher({
  definition,
  characterRef,
}: {
  definition: ResearcherDefinition;
  characterRef: MutableRefObject<Group | null>;
}) {
  const [motion, setMotion] = useState<ResearcherMotion>('working');
  const motionRef = useRef<ResearcherMotion>('working');
  const conversationActive = useTutorStore(
    (store) => store.isOpen && store.activePersonaId === definition.personaId,
  );
  const state = useRef<WorkerState>({
    currentIndex: 0,
    targetIndex: definition.points.length > 1 ? 1 : 0,
    mode: 'working',
    dwellRemaining: randomDwell(definition),
    gestureRemaining: 0,
    gesturePlayed: false,
    cycles: 0,
    facingOffset: randomFacingOffset(),
  });
  const dialogueFacing = useNpcDialogueFacing({
    characterRef,
    conversationActive,
    npcId: definition.id,
    onConversationStart: () => setDisplayedMotion('working'),
    onReturnComplete: () => setDisplayedMotion(behaviorMotion(state.current)),
  });

  useEffect(() => {
    const worker = characterRef.current;
    const startingPoint = definition.points[0];
    if (!worker) return;
    worker.position.set(startingPoint.position[0], FLOOR_Y, startingPoint.position[1]);
    facePoint(worker, startingPoint.interest, state.current.facingOffset);
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[Bunsen:researcher-loop] ${definition.id} start=${startingPoint.position.join(',')} dwell=${state.current.dwellRemaining.toFixed(2)}`,
      );
    }
  }, [characterRef, definition]);

  useFrame((_, delta) => {
    const worker = characterRef.current;
    if (!worker) return;
    if (useLabStore.getState().isPaused) return;
    const frameDelta = Math.min(delta, 0.05);
    worker.position.y = FLOOR_Y;

    if (dialogueFacing.isTransitioning.current || conversationActive) return;

    if (state.current.mode === 'working') {
      const point = definition.points[state.current.currentIndex];
      turnToward(
        worker,
        point.interest[0],
        point.interest[1],
        frameDelta,
        5.5,
        state.current.facingOffset,
      );

      state.current.dwellRemaining -= frameDelta;
      if (state.current.gestureRemaining > 0) {
        state.current.gestureRemaining -= frameDelta;
        if (state.current.gestureRemaining <= 0) setDisplayedMotion('working');
      } else if (point.gesture && !state.current.gesturePlayed && state.current.dwellRemaining <= 4.2) {
        state.current.gesturePlayed = true;
        state.current.gestureRemaining = 1.8;
        setDisplayedMotion('gesturing');
        if (process.env.NODE_ENV === 'development') {
          console.info(`[Bunsen:researcher-gesture] ${definition.id} point=${state.current.currentIndex}`);
        }
      }

      if (state.current.dwellRemaining > 0) return;

      if (definition.points.length < 2) {
        state.current.dwellRemaining = randomDwell(definition);
        state.current.facingOffset = randomFacingOffset();
        state.current.gesturePlayed = false;
        state.current.cycles += 1;
        setDisplayedMotion('working');
        logCycle(definition.id, state.current);
        return;
      }

      state.current.targetIndex = (state.current.currentIndex + 1) % definition.points.length;
      transitionBehavior('walking');
      return;
    }

    const target = definition.points[state.current.targetIndex];
    const deltaX = target.position[0] - worker.position.x;
    const deltaZ = target.position[1] - worker.position.z;
    const distance = Math.hypot(deltaX, deltaZ);

    if (distance <= Math.max(ARRIVAL_DISTANCE, RESEARCHER_SPEED * frameDelta)) {
      worker.position.set(target.position[0], FLOOR_Y, target.position[1]);
      state.current.currentIndex = state.current.targetIndex;
      state.current.dwellRemaining = randomDwell(definition);
      state.current.gestureRemaining = 0;
      state.current.gesturePlayed = false;
      state.current.facingOffset = randomFacingOffset();
      state.current.cycles += 1;
      transitionBehavior('working');
      logCycle(definition.id, state.current);
      return;
    }

    const directionX = deltaX / distance;
    const directionZ = deltaZ / distance;
    const step = Math.min(distance, RESEARCHER_SPEED * frameDelta);
    worker.position.x += directionX * step;
    worker.position.z += directionZ * step;
    turnToward(worker, target.position[0], target.position[1], frameDelta, 9, 0);
  });

  function transitionBehavior(nextMode: WorkerMode) {
    if (state.current.mode === nextMode) return;
    const previous = state.current.mode;
    state.current.mode = nextMode;
    setDisplayedMotion(nextMode);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:researcher-state] ${definition.id} ${previous}->${nextMode}`);
    }
  }

  function setDisplayedMotion(nextMotion: ResearcherMotion) {
    if (motionRef.current === nextMotion) return;
    motionRef.current = nextMotion;
    setMotion(nextMotion);
  }

  return <ResearcherModel definition={definition} motion={motion} characterRef={characterRef} />;
}

function behaviorMotion(state: WorkerState): ResearcherMotion {
  if (state.mode === 'walking') return 'walking';
  return state.gestureRemaining > 0 ? 'gesturing' : 'working';
}

function randomDwell(definition: ResearcherDefinition) {
  const maximum = definition.zone === 'discovery' ? 10 : 12;
  return 6 + Math.random() * (maximum - 6);
}

function randomFacingOffset() {
  return (Math.random() - 0.5) * 0.16;
}

function facePoint(group: Group, interest: readonly [number, number], offset: number) {
  group.rotation.y = Math.atan2(
    interest[0] - group.position.x,
    interest[1] - group.position.z,
  ) + offset;
}

function turnToward(
  group: Group,
  targetX: number,
  targetZ: number,
  delta: number,
  response: number,
  offset: number,
) {
  const targetYaw = Math.atan2(targetX - group.position.x, targetZ - group.position.z) + offset;
  const turn = MathUtils.euclideanModulo(targetYaw - group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  group.rotation.y += turn * (1 - Math.exp(-response * delta));
}

function logCycle(id: string, state: WorkerState) {
  if (process.env.NODE_ENV !== 'development') return;
  console.info(
    `[Bunsen:researcher-cycle] ${id} count=${state.cycles} point=${state.currentIndex} dwell=${state.dwellRemaining.toFixed(2)}`,
  );
}
