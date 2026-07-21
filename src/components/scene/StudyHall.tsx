'use client';

import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';
import { Bookcase, PottedPlant, RoundRug, Stool } from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { SURFACE_GAP, WORK_SURFACE_Y, centeredPropY } from '@/lib/spatial';
import { StudyShelfBooks } from './ShelfContents';

const STUDY_BOOKCASES = [
  { position: [-13.7, 0, -5.75] as [number, number, number], scale: 4.05 },
  { position: [-8.8, 0, -5.85] as [number, number, number], scale: 3.9 },
];

function LongTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.45, 0.18, 1.65]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      {[-1.78, 1.78].flatMap((x) =>
        [-0.58, 0.58].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.5, z]} castShadow>
            <boxGeometry args={[0.18, 1, 0.18]} />
            <LowPolyMaterial color="trim" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[3.65, 0.12, 0.18]} />
        <LowPolyMaterial color="trim" />
      </mesh>
    </group>
  );
}

function StudyScatter() {
  const paperRef = useRef<InstancedMesh>(null);
  const bookRef = useRef<InstancedMesh>(null);
  const transforms = useMemo(
    () => [
      [-11.7, centeredPropY(WORK_SURFACE_Y, 0.025), 0.7, -0.18], [-10.8, centeredPropY(WORK_SURFACE_Y, 0.025), 1.25, 0.14], [-9.6, centeredPropY(WORK_SURFACE_Y, 0.025), 0.65, 0.32],
      [-11.9, centeredPropY(WORK_SURFACE_Y, 0.025), 4.35, 0.16], [-10.55, centeredPropY(WORK_SURFACE_Y, 0.025), 4.9, -0.12], [-9.25, centeredPropY(WORK_SURFACE_Y, 0.025), 4.2, 0.25],
      [-13.8, 0.035, 2.15, 0.43], [-7.0, 0.035, 5.85, -0.28],
    ] as const,
    [],
  );

  useEffect(() => {
    const dummy = new Object3D();
    transforms.forEach(([x, y, z, rotation], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(index % 3 === 0 ? 1.15 : 0.88, 1, index % 2 ? 0.8 : 1);
      dummy.updateMatrix();
      paperRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (paperRef.current) paperRef.current.instanceMatrix.needsUpdate = true;

    transforms.slice(0, 6).forEach(([x, y, z, rotation], index) => {
      const scaleY = 1 + (index % 3) * 0.35;
      dummy.position.set(x + 0.34, WORK_SURFACE_Y + 0.025 + 0.1 * scaleY * 0.5 + SURFACE_GAP, z - 0.2);
      dummy.rotation.set(0, rotation + 0.08, 0);
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      bookRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (bookRef.current) bookRef.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <>
      <instancedMesh ref={paperRef} args={[undefined, undefined, transforms.length]} castShadow>
        <boxGeometry args={[0.48, 0.025, 0.34]} />
        <LowPolyMaterial color="paper" />
      </instancedMesh>
      <instancedMesh ref={bookRef} args={[undefined, undefined, 6]} castShadow>
        <boxGeometry args={[0.42, 0.1, 0.3]} />
        <LowPolyMaterial color="accent2" />
      </instancedMesh>
    </>
  );
}

function Globe() {
  return (
    <group position={[-13.55, 0, 3.15]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.32, 10]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.72, 14, 9]} />
        <LowPolyMaterial color="accent1" />
      </mesh>
      <mesh position={[-0.22, 1.35, 0.63]} rotation={[0.4, 0.1, -0.2]}>
        <circleGeometry args={[0.2, 6]} />
        <LowPolyMaterial color="paper" doubleSided />
      </mesh>
      <mesh position={[0.34, 0.95, 0.58]} rotation={[0.15, 0.1, 0.35]}>
        <circleGeometry args={[0.25, 7]} />
        <LowPolyMaterial color="furniture" doubleSided />
      </mesh>
    </group>
  );
}

export function StudyHall() {
  return (
    <group>
      <RoundRug position={[-12.2, 0.02, 3.65]} scale={4.7} />
      <LongTable position={[-10.45, 0, 1]} />
      <LongTable position={[-10.45, 0, 4.65]} />
      {STUDY_BOOKCASES.map((bookcase) => (
        <Bookcase key={bookcase.position[0]} position={bookcase.position} scale={bookcase.scale} />
      ))}
      <PottedPlant position={[-14.7, 0, -3.45]} rotation={[0, 0.4, 0]} scale={3.15} />

      <Stool position={[-12.2, 0, -0.05]} rotation={[0, 0.12, 0]} scale={2.55} />
      <Stool position={[-9.0, 0, -0.05]} rotation={[0, -0.2, 0]} scale={2.55} />
      <Stool position={[-12.2, 0, 2.35]} rotation={[0, -0.1, 0]} scale={2.55} />
      <Stool position={[-8.9, 0, 2.45]} rotation={[0, 0.28, 0]} scale={2.55} />
      <Stool position={[-7.0, 0, 4.1]} rotation={[0.03, 0.72, -0.04]} scale={2.45} />

      <Globe />
      <StudyScatter />
      <StudyShelfBooks bookcases={STUDY_BOOKCASES} />
    </group>
  );
}
