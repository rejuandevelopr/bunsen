'use client';

import { useEffect, useRef, useState } from 'react';
import { Professor } from '@/components/models/Characters';
import {
  Bookcase,
  Cabinet,
  Flask,
  LabEquipment,
  LabTable,
  Microscope,
  Sink,
  Stool,
  Workbench,
} from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { SINK_WORK_SCALE, TABLE_CROSS_WORK_SCALE, TABLE_WORK_SCALE, WORK_SURFACE_Y } from '@/lib/spatial';
import { onOutcomeReached } from '@/lib/experiments/events';
import { ChemistryShelfFlasks } from './ShelfContents';

function TutorCharacter() {
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () =>
      onOutcomeReached(({ experiment, outcome }) => {
        if (experiment.id !== 'acid-base-titration' || outcome.type !== 'success') return;
        setCelebrating(true);
        if (celebrationTimer.current) globalThis.clearTimeout(celebrationTimer.current);
        celebrationTimer.current = globalThis.setTimeout(() => {
          setCelebrating(false);
          celebrationTimer.current = null;
        }, 2600);
      }),
    [],
  );

  useEffect(
    () => () => {
      if (celebrationTimer.current) globalThis.clearTimeout(celebrationTimer.current);
    },
    [],
  );

  return (
    <Professor
      celebrateSuccess={celebrating}
      position={[3.72, 0, -1.15]}
      rotation={[0, -1.25, 0]}
      scale={0.47}
    />
  );
}

function TubeStand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.15, 0.12, 0.45]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, index) => (
        <mesh key={x} position={[x, 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.68 - index * 0.035, 7]} />
          <LowPolyMaterial
            color={index % 2 ? 'accent2' : 'glass'}
            emissive="glass"
            emissiveIntensity={0.28}
            transparent
            opacity={0.62}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ChemistryZone() {
  return (
    <group>
      <Workbench position={[0.45, 0, 0.75]} rotation={[0, -0.04, 0]} scale={TABLE_CROSS_WORK_SCALE} />
      <mesh position={[0.45, WORK_SURFACE_Y - 0.055, 0.75]} rotation={[0, -0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.45, 0.11, 2.02]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <LabEquipment position={[0.65, WORK_SURFACE_Y + 0.01, 0.72]} rotation={[0, Math.PI / 2, 0]} scale={1.42} />
      <TubeStand position={[-0.45, WORK_SURFACE_Y + 0.06, 0.22]} />
      <Flask position={[-1.3, WORK_SURFACE_Y + 0.004, 1.0]} scale={0.038} liquidColor="glass" />
      <Flask position={[1.8, WORK_SURFACE_Y + 0.004, 1.25]} rotation={[0, 0.4, 0]} scale={0.034} liquidColor="accent2" />

      <LabTable position={[3.35, 0, -5.25]} scale={TABLE_WORK_SCALE} />
      <mesh position={[3.35, WORK_SURFACE_Y - 0.05, -5.25]} castShadow>
        <boxGeometry args={[3.65, 0.1, 1.62]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <Microscope position={[2.85, WORK_SURFACE_Y + 0.01, -5.28]} rotation={[0, -0.35, 0]} scale={1.1} />
      <Flask position={[4.25, WORK_SURFACE_Y + 0.004, -5.12]} rotation={[0, -0.3, 0]} scale={0.033} liquidColor="accent1" />

      <Bookcase position={[-3.55, 0, -5.72]} scale={3.9} />
      <ChemistryShelfFlasks position={[-3.55, 0, -5.72]} bookcaseScale={3.9} />
      <Cabinet position={[-0.2, 0, -5.9]} scale={4.25} />
      <Sink position={[-4.15, 0, 4.65]} rotation={[0, Math.PI / 2, 0]} scale={SINK_WORK_SCALE} />

      <Stool position={[-1.3, 0, 2.42]} rotation={[0, 0.08, 0]} scale={2.7} />
      <Stool position={[1.45, 0, 2.52]} rotation={[0, -0.12, 0]} scale={2.7} />
      <Stool position={[3.25, 0, -3.95]} rotation={[0, Math.PI, 0]} scale={2.55} />

      <TutorCharacter />
    </group>
  );
}
