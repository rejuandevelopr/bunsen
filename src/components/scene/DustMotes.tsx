'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';

const DUST_COUNT = 160;

type DustParticle = {
  x: number;
  y: number;
  z: number;
  scale: number;
  phase: number;
  speed: number;
};

function createRandom(seed = 1937) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function DustMotes() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const particles = useMemo<DustParticle[]>(() => {
    const random = createRandom();

    return Array.from({ length: DUST_COUNT }, () => ({
      x: random() * 31 - 15.5,
      y: random() * 6 + 0.35,
      z: random() * 27.5 - 7,
      scale: random() * 0.65 + 0.35,
      phase: random() * Math.PI * 2,
      speed: random() * 0.22 + 0.08,
    }));
  }, []);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    particles.forEach((particle, index) => {
      const wave = elapsed * particle.speed + particle.phase;
      dummy.position.set(
        particle.x + Math.sin(wave * 0.7) * 0.16,
        particle.y + Math.sin(wave) * 0.24,
        particle.z + Math.cos(wave * 0.55) * 0.14,
      );
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DUST_COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.045, 0.045]} />
      <LowPolyMaterial
        color="trim"
        transparent
        opacity={0.26}
        doubleSided
        depthWrite={false}
      />
    </instancedMesh>
  );
}
