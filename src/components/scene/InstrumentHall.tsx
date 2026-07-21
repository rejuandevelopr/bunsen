'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  Object3D,
  PointLight,
} from 'three';
import {
  Extinguisher,
  LabTable,
  LavaLamp,
  ScienceTubes,
  Scope,
  TestTube,
  Workbench,
} from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { PALETTE } from '@/lib/palette';
import { TABLE_CROSS_WORK_SCALE, TABLE_WORK_SCALE, WORK_SURFACE_Y } from '@/lib/spatial';
import { useExperimentStore } from '@/store/experiment-store';

const FLAME_COLORS = {
  'choose-sodium': '#ffc247',
  'choose-copper': '#45d8c2',
  'choose-potassium': '#c8a2ff',
} as const;

function Bench({ position, width = 4.6 }: { position: [number, number, number]; width?: number }) {
  return (
    <group position={position} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, WORK_SURFACE_Y - 0.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.14, 1.75]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      {[-1, 1].flatMap((xSign) =>
        [-1, 1].map((zSign) => (
          <mesh key={`${xSign}-${zSign}`} position={[xSign * (width / 2 - 0.28), 0.53, zSign * 0.58]} castShadow>
            <boxGeometry args={[0.18, 1.06, 0.18]} />
            <LowPolyMaterial color="trim" />
          </mesh>
        )),
      )}
    </group>
  );
}

function BunsenBurner() {
  const flameRef = useRef<Mesh>(null);
  const pointRef = useRef<PointLight>(null);
  const actionHistory = useExperimentStore((state) => state.actionHistory);
  const lastSample = [...actionHistory]
    .reverse()
    .find((record) => record.actionId in FLAME_COLORS)?.actionId as keyof typeof FLAME_COLORS | undefined;
  const lit = actionHistory.some((record) => record.actionId === 'light-burner');
  const flameColor = lastSample ? FLAME_COLORS[lastSample] : PALETTE.accent2;

  useFrame(({ clock }) => {
    const pulse = 0.92 + Math.sin(clock.getElapsedTime() * 16) * 0.08;
    if (flameRef.current) flameRef.current.scale.set(1, pulse, 1);
    if (pointRef.current) pointRef.current.intensity = lit ? 0.45 + pulse * 0.18 : 0.18;
  });

  return (
    <group position={[4.25, WORK_SURFACE_Y + 0.005, 13.45]}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.18, 12]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.21, 0.78, 12]} />
        <LowPolyMaterial color="furniture" />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.09, 12]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.18, 0]} castShadow>
        <coneGeometry args={[0.2, 0.62, 10]} />
        <meshStandardMaterial
          color={flameColor}
          emissive={flameColor}
          emissiveIntensity={lit ? 2.1 : 0.8}
          transparent
          opacity={lit ? 0.92 : 0.48}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      <pointLight ref={pointRef} position={[0, 1.25, 0]} color={flameColor} distance={3.5} decay={2} />
    </group>
  );
}

function DialPanel() {
  const twitchNeedle = useRef<Mesh>(null);
  const dialRotations = [-0.78, -0.16, 0.46, 0.92];

  useFrame(({ clock }) => {
    if (twitchNeedle.current) {
      twitchNeedle.current.rotation.z = 0.46 + Math.sin(clock.getElapsedTime() * 1.6) * 0.08;
    }
  });

  return (
    <group position={[5.05, 3.25, 7.38]} userData={{ cameraFadeRoot: true }}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4.25, 2.25, 0.16]} />
        <LowPolyMaterial color="furniture" />
      </mesh>
      <mesh position={[0, 0, 0.095]}>
        <boxGeometry args={[3.98, 1.98, 0.06]} />
        <LowPolyMaterial color="wall" />
      </mesh>
      {dialRotations.map((rotation, index) => (
        <group key={index} position={[(index - 1.5) * 0.94, 0.25, 0.16]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.075, 18]} />
            <LowPolyMaterial color="paper" emissive="glass" emissiveIntensity={0.08} />
          </mesh>
          <mesh ref={index === 2 ? twitchNeedle : undefined} position={[0, 0.12, 0.22]} rotation={[0, 0, rotation]}>
            <boxGeometry args={[0.04, 0.27, 0.035]} />
            <meshStandardMaterial color={PALETTE.wood} emissive={PALETTE.accent2} emissiveIntensity={0.12} roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
      {[-1.35, -0.45, 0.45, 1.35].map((x, index) => (
        <mesh key={x} position={[x, -0.57, 0.16]}>
          <boxGeometry args={[0.58, 0.075, 0.035]} />
          <LowPolyMaterial color={index % 2 ? 'accent1' : 'wood'} />
        </mesh>
      ))}
    </group>
  );
}

function LavaLampDisplay() {
  const blobs = useRef<Array<Mesh | null>>([]);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    blobs.current.forEach((blob, index) => {
      if (!blob) return;
      blob.position.y = 0.25 + ((time * (0.18 + index * 0.035) + index * 0.31) % 0.72);
      blob.scale.setScalar(0.75 + Math.sin(time * 1.4 + index) * 0.15);
    });
  });
  return (
    <group position={[-3.45, WORK_SURFACE_Y + 0.004, 9.25]}>
      <LavaLamp scale={0.9} />
      {[0, 1, 2].map((index) => (
        <mesh key={index} ref={(node) => { blobs.current[index] = node; }} position={[0, 0.24 + index * 0.22, 0.03]}>
          <icosahedronGeometry args={[0.055 + index * 0.012, 1]} />
          <LowPolyMaterial color="accent2" emissive="accent2" emissiveIntensity={0.7} transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function FumeHood() {
  const smoke = useRef<Array<Mesh | null>>([]);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    smoke.current.forEach((particle, index) => {
      if (!particle) return;
      const rise = (time * (0.12 + index * 0.015) + index * 0.19) % 1;
      particle.position.set(Math.sin(time + index) * 0.12, 0.85 + rise * 1.45, Math.cos(time * 0.7 + index) * 0.08);
      particle.scale.setScalar(0.45 + rise * 0.85);
    });
  });
  return (
    <group position={[13.75, 0, 15.25]} rotation={[0, -Math.PI / 2, 0]} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.7, 3.1, 1.35]} />
        <LowPolyMaterial color="furniture" />
      </mesh>
      <mesh position={[0, 1.6, -0.7]}>
        <planeGeometry args={[3.35, 2.45]} />
        <LowPolyMaterial color="glass" emissive="glass" emissiveIntensity={0.08} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[0, WORK_SURFACE_Y - 0.05, -0.74]} castShadow>
        <boxGeometry args={[3.45, 0.12, 1.15]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <group position={[0, WORK_SURFACE_Y, -0.82]}>
        {Array.from({ length: 6 }, (_, index) => (
          <mesh key={index} ref={(node) => { smoke.current[index] = node; }}>
            <icosahedronGeometry args={[0.13, 1]} />
            <LowPolyMaterial color="paper" transparent opacity={0.1} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function VanDeGraaff() {
  const arc = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!arc.current) return;
    const pulse = Math.max(0, Math.sin(clock.getElapsedTime() * 2.4 - 1.8));
    arc.current.visible = pulse > 0.92;
    arc.current.rotation.z = pulse * 0.45;
  });
  return (
    <group position={[11.25, 0, 12.25]} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.72, 0.82, 0.36, 12]} /><LowPolyMaterial color="wood" /></mesh>
      <mesh position={[0, 1.32, 0]} castShadow><cylinderGeometry args={[0.25, 0.34, 2.3, 12]} /><LowPolyMaterial color="furniture" /></mesh>
      <mesh position={[0, 2.65, 0]} castShadow><sphereGeometry args={[0.82, 18, 12]} /><LowPolyMaterial color="trim" emissive="paper" emissiveIntensity={0.08} /></mesh>
      <mesh ref={arc} position={[0.9, 2.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 5]} />
        <LowPolyMaterial color="glass" emissive="glass" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function NewtonCradle() {
  const endBalls = useRef<Array<Object3D | null>>([]);
  useFrame(({ clock }) => {
    const swing = Math.sin(clock.getElapsedTime() * 2.2);
    if (endBalls.current[0]) endBalls.current[0]!.rotation.z = Math.max(0, swing) * 0.52;
    if (endBalls.current[1]) endBalls.current[1]!.rotation.z = Math.min(0, swing) * 0.52;
  });
  return (
    <group position={[-2.25, WORK_SURFACE_Y + 0.04, 9.25]}>
      <mesh position={[0, 0.05, 0]} castShadow><boxGeometry args={[1.7, 0.1, 0.75]} /><LowPolyMaterial color="wood" /></mesh>
      {[-0.72, 0.72].flatMap((x) => [-0.28, 0.28].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.75, z]} castShadow><cylinderGeometry args={[0.035, 0.045, 1.4, 7]} /><LowPolyMaterial color="trim" /></mesh>
      )))}
      {[-0.48, -0.24, 0, 0.24, 0.48].map((x, index) => (
        <group key={x} ref={index === 0 ? (node) => { endBalls.current[0] = node; } : index === 4 ? (node) => { endBalls.current[1] = node; } : undefined} position={[x, 1.35, 0]}>
          <mesh position={[0, -0.65, 0]} castShadow><sphereGeometry args={[0.13, 10, 8]} /><LowPolyMaterial color="trim" /></mesh>
          <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.012, 0.012, 0.7, 5]} /><LowPolyMaterial color="paper" /></mesh>
        </group>
      ))}
    </group>
  );
}

function SafetyPoster() {
  return (
    <group position={[-4.93, 3.45, 18.8]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow><boxGeometry args={[1.45, 1.85, 0.1]} /><LowPolyMaterial color="trim" /></mesh>
      <mesh position={[0, 0, 0.065]}><planeGeometry args={[1.28, 1.68]} /><LowPolyMaterial color="paper" /></mesh>
      <mesh position={[0, 0.38, 0.09]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.48, 0.48, 0.04]} /><LowPolyMaterial color="accent2" /></mesh>
      <mesh position={[0, -0.36, 0.09]}><boxGeometry args={[0.82, 0.08, 0.04]} /><LowPolyMaterial color="wood" /></mesh>
      <mesh position={[0, -0.58, 0.09]}><boxGeometry args={[0.68, 0.06, 0.04]} /><LowPolyMaterial color="furniture" /></mesh>
    </group>
  );
}

export function InstrumentHall() {
  return (
    <group>
      <Workbench position={[4.25, 0, 13.45]} scale={TABLE_CROSS_WORK_SCALE} />
      <mesh position={[4.25, WORK_SURFACE_Y - 0.055, 13.45]} castShadow receiveShadow>
        <boxGeometry args={[5.0, 0.11, 2.08]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <BunsenBurner />
      <ScienceTubes position={[2.75, WORK_SURFACE_Y + 0.005, 13.25]} scale={1.25} />
      <TestTube position={[5.8, WORK_SURFACE_Y + 0.005, 13.25]} scale={0.92} />

      <LabTable position={[-2.7, 0, 9.25]} scale={TABLE_WORK_SCALE} />
      <mesh position={[-2.7, WORK_SURFACE_Y - 0.05, 9.25]} castShadow>
        <boxGeometry args={[3.45, 0.1, 1.6]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <LavaLampDisplay />
      <NewtonCradle />

      <Bench position={[-2.85, 0, 19.15]} width={3.3} />
      <ScienceTubes position={[-3.25, WORK_SURFACE_Y + 0.005, 19.1]} rotation={[0, 0.2, 0]} scale={1.45} />
      <TestTube position={[-1.95, WORK_SURFACE_Y + 0.005, 19.1]} rotation={[0, -0.18, 0]} scale={1.08} />

      <DialPanel />
      <Scope position={[3.35, 0, 9.3]} rotation={[0, -0.48, 0]} scale={0.82} />
      <Scope position={[11.3, 0, 17.1]} rotation={[0, 2.05, 0]} scale={0.78} />
      <FumeHood />
      <VanDeGraaff />

      <Extinguisher position={[-4.84, 1.0, 17.55]} rotation={[0, Math.PI / 2, 0]} scale={0.33} />
      <SafetyPoster />
      <pointLight position={[4.2, 5.4, 13.5]} color="#fff0d5" intensity={0.7} distance={11} decay={2} />
    </group>
  );
}
