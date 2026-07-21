'use client';

import type { Vector3Tuple } from 'three';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { WORK_SURFACE_Y } from '@/lib/spatial';

const NOTE_PLACEMENTS: Array<{
  id: string;
  position: Vector3Tuple;
  rotation: number;
}> = [
  { id: 'instruments', position: [-2.75, WORK_SURFACE_Y + 0.025, 9.72], rotation: -0.08 },
  { id: 'optics', position: [-2.65, WORK_SURFACE_Y + 0.025, 19.62], rotation: 0.12 },
  { id: 'scientific-method', position: [-10.45, WORK_SURFACE_Y + 0.025, 5.08], rotation: -0.1 },
  { id: 'plant-science', position: [12.02, WORK_SURFACE_Y + 0.025, 1.18], rotation: 0.14 },
];

export function FieldNotesProps() {
  return (
    <group>
      {NOTE_PLACEMENTS.map((placement) => (
        <OpenBook key={placement.id} position={placement.position} rotation={placement.rotation} />
      ))}
    </group>
  );
}

function OpenBook({ position, rotation }: { position: Vector3Tuple; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.014, 0]} castShadow>
        <boxGeometry args={[0.88, 0.045, 0.58]} />
        <LowPolyMaterial color="accent1" />
      </mesh>
      <mesh position={[-0.225, 0.035, 0]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[0.43, 0.025, 0.54]} />
        <LowPolyMaterial color="paper" emissive="glass" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0.225, 0.035, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[0.43, 0.025, 0.54]} />
        <LowPolyMaterial color="paper" emissive="glass" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.025, 0.025, 0.52]} />
        <LowPolyMaterial color="trim" emissive="trim" emissiveIntensity={0.15} />
      </mesh>
      {[-0.24, 0.19].map((x) => (
        <group key={x} position={[x, 0.055, 0.04]}>
          {[0, 1, 2].map((line) => (
            <mesh key={line} position={[0, 0, (line - 1) * 0.11]}>
              <boxGeometry args={[0.24, 0.012, 0.018]} />
              <LowPolyMaterial color={line === 1 ? 'accent1' : 'wood'} emissive="glass" emissiveIntensity={0.1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
