'use client';

import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { InstancedMesh, Object3D, type Vector3Tuple } from 'three';
import { PottedPlant, Workbench } from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { SURFACE_GAP, TABLE_CROSS_WORK_SCALE, WORK_SURFACE_Y } from '@/lib/spatial';

function GlassPanel({ position, rotation = [0, 0, 0] }: { position: Vector3Tuple; rotation?: Vector3Tuple }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[3.5, 3.6, 0.12]} radius={0.06} smoothness={2} castShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[3.22, 3.32]} />
        <LowPolyMaterial color="glass" emissive="glass" emissiveIntensity={0.08} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[0.08, 3.32, 0.05]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[3.22, 0.08, 0.05]} />
        <LowPolyMaterial color="trim" />
      </mesh>
    </group>
  );
}

function Planter({ position, width = 3.2 }: { position: Vector3Tuple; width?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.7, 1.05]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[width - 0.18, 0.12, 0.87]} />
        <LowPolyMaterial color="floor" />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const x = (index - 3) * ((width - 0.6) / 6);
        return (
          <group key={index} position={[x, 1.02 + (index % 2) * 0.12, (index % 3 - 1) * 0.17]}>
            <mesh castShadow>
              <icosahedronGeometry args={[0.38 + (index % 3) * 0.06, 0]} />
              <LowPolyMaterial color={index % 3 === 0 ? 'accent1' : 'furniture'} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BenchPlants() {
  const potsRef = useRef<InstancedMesh>(null);
  const leavesRef = useRef<InstancedMesh>(null);
  const placements = useMemo(
    () => [
      [8.7, 0.1, 0.8], [9.35, 0.72, 1.05], [10.1, 0.02, 0.9],
      [10.8, 0.82, 1.12], [11.55, 0.12, 0.86],
    ] as const,
    [],
  );

  useEffect(() => {
    const dummy = new Object3D();
    placements.forEach(([x, z, scale], index) => {
      const potCenterY = WORK_SURFACE_Y + 0.38 * scale * 0.5 + SURFACE_GAP;
      dummy.position.set(x, potCenterY, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      potsRef.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, potCenterY + 0.52 * scale, z);
      dummy.rotation.set(0, index * 0.9, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      leavesRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (potsRef.current) potsRef.current.instanceMatrix.needsUpdate = true;
    if (leavesRef.current) leavesRef.current.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <>
      <instancedMesh ref={potsRef} args={[undefined, undefined, placements.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 0.38, 8]} />
        <LowPolyMaterial color="accent2" />
      </instancedMesh>
      <instancedMesh ref={leavesRef} args={[undefined, undefined, placements.length]} castShadow>
        <dodecahedronGeometry args={[0.38, 0]} />
        <LowPolyMaterial color="furniture" />
      </instancedMesh>
    </>
  );
}

function WaterBasin() {
  return (
    <group position={[8.25, 0, 5.45]} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.84, 0.82, 14]} />
        <LowPolyMaterial color="furniture" />
      </mesh>
      <mesh position={[0, WORK_SURFACE_Y - 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 0.88, 0.3, 16]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, WORK_SURFACE_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.93, 16]} />
        <LowPolyMaterial color="glass" emissive="glass" emissiveIntensity={0.12} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 1.39, -0.7]} castShadow>
        <cylinderGeometry args={[0.065, 0.075, 0.58, 8]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 1.64, -0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.065, 0.5, 8]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 1.55, -0.2]} castShadow>
        <cylinderGeometry args={[0.055, 0.06, 0.22, 8]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0.65, WORK_SURFACE_Y + 0.055, 0.14]} rotation={[0, -0.18, 0]} castShadow>
        <boxGeometry args={[0.28, 0.1, 0.2]} />
        <LowPolyMaterial color="accent2" />
      </mesh>
      <mesh position={[-0.62, WORK_SURFACE_Y + 0.09, 0.1]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 8]} />
        <LowPolyMaterial color="paper" />
      </mesh>
    </group>
  );
}

export function Greenhouse() {
  return (
    <group>
      <GlassPanel position={[15.82, 3.15, -4.55]} rotation={[0, -Math.PI / 2, 0]} />
      <GlassPanel position={[15.82, 3.15, -0.85]} rotation={[0, -Math.PI / 2, 0]} />
      <GlassPanel position={[15.82, 3.15, 2.85]} rotation={[0, -Math.PI / 2, 0]} />

      <Workbench position={[10.25, 0, 0.5]} scale={TABLE_CROSS_WORK_SCALE} />
      <mesh position={[10.25, WORK_SURFACE_Y - 0.055, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.11, 1.95]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <BenchPlants />

      <Planter position={[13.85, 0, -4.7]} width={3.2} />
      <Planter position={[13.85, 0, -1.1]} width={3.2} />
      <Planter position={[13.85, 0, 2.45]} width={3.2} />
      <Planter position={[6.65, 0, -4.85]} width={2.5} />

      <PottedPlant position={[7.25, 0, -5.75]} rotation={[0, -0.35, 0]} scale={3.6} />
      <PottedPlant position={[9.35, 0, -5.95]} rotation={[0, 0.4, 0]} scale={2.8} />
      <PottedPlant position={[11.1, 0, -5.75]} rotation={[0, -0.65, 0]} scale={3.35} />
      <PottedPlant position={[14.55, 0, 5.5]} rotation={[0, 0.25, 0]} scale={3.1} />
      <PottedPlant position={[6.2, 0, 4.9]} rotation={[0, -0.25, 0]} scale={2.55} />

      <WaterBasin />
      <pointLight position={[11.2, 5.2, -0.5]} color="#fff0d5" intensity={1.25} distance={13} decay={2} />
    </group>
  );
}
