'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';
import type { NpcPersonaId } from '@/lib/ai/personas';
import { PALETTE } from '@/lib/palette';
import { useTutorStore } from '@/store/tutor-store';

export function NpcInteractionMarker({ personaId }: { personaId: NpcPersonaId }) {
  const ring = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const highlighted = useTutorStore(
    (state) => state.nearbyNpc?.personaId === personaId && !state.isOpen,
  );

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.4) * 0.045;
    ring.current?.scale.setScalar(highlighted ? pulse : 1);
    if (material.current) material.current.opacity = highlighted ? 0.82 : 0.24;
  });

  return (
    <mesh ref={ring} position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.52, 0.6, 28]} />
      <meshStandardMaterial
        ref={material}
        color={PALETTE.accent1}
        emissive={PALETTE.accent1}
        emissiveIntensity={0.7}
        transparent
        opacity={0.24}
        depthWrite={false}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}
