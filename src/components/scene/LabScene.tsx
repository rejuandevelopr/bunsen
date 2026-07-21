'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Group, PCFSoftShadowMap } from 'three';
import { PALETTE } from '@/lib/palette';
import { DustMotes } from './DustMotes';
import { Effects } from './Effects';
import { LabRoom } from './LabRoom';
import { LabAssistantPatrol } from './LabAssistantPatrol';
import { Lighting } from './Lighting';
import { PlayerExperience } from './PlayerExperience';
import { AmbientResearchers } from './AmbientResearchers';

export function LabScene() {
  const labAssistantRef = useRef<Group>(null);
  const researcherRefs = useRef(
    Array.from({ length: 5 }, () => ({ current: null as Group | null })),
  ).current;

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 1.5]}
      shadows={{ type: PCFSoftShadowMap }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.background, 38, 90]} />
      <Lighting />
      <Suspense fallback={null}>
        <LabRoom />
        <LabAssistantPatrol characterRef={labAssistantRef} />
        <AmbientResearchers characterRefs={researcherRefs} />
        <PlayerExperience assistantRef={labAssistantRef} researcherRefs={researcherRefs} />
        <DustMotes />
        <ContactShadows
          position={[0, 0.015, 6.55]}
          scale={42}
          opacity={0.24}
          blur={2.8}
          far={4}
          resolution={512}
          frames={1}
          color={PALETTE.background}
        />
      </Suspense>
      <Effects />
    </Canvas>
  );
}
