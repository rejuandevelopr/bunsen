'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, LinearFilter, Mesh, SRGBColorSpace } from 'three';
import { ArmatureDisplay, Astronaut, LabTable, Scope, Stool } from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { PALETTE } from '@/lib/palette';
import { TABLE_WORK_SCALE, WORK_SURFACE_Y } from '@/lib/spatial';
import { useExperimentStore } from '@/store/experiment-store';

function createStarChartTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 440;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = PALETTE.furniture;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = PALETTE.paper;
  context.font = '700 42px Georgia, serif';
  context.fillText('OUR PLACE IN SPACE', 42, 58);
  const stars = [
    [84, 118, 4], [142, 176, 7], [205, 142, 4], [268, 221, 6], [344, 178, 4],
    [421, 116, 7], [476, 206, 4], [552, 152, 5], [625, 228, 7], [680, 124, 4],
    [112, 326, 6], [226, 356, 4], [363, 308, 7], [512, 350, 5], [658, 326, 4],
  ];
  context.strokeStyle = PALETTE.accent1;
  context.lineWidth = 3;
  context.beginPath();
  stars.slice(0, 10).forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  stars.forEach(([x, y, radius], index) => {
    context.fillStyle = index % 4 === 0 ? PALETTE.accent2 : PALETTE.paper;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = PALETTE.glass;
  context.font = '24px Georgia, serif';
  context.fillText('Moon gravity = about 1/6 Earth gravity', 42, 408);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  return texture;
}

function StarChart() {
  const texture = useMemo(createStarChartTexture, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group position={[-13.85, 3.35, 7.36]}>
      <mesh castShadow><boxGeometry args={[3.75, 2.35, 0.12]} /><LowPolyMaterial color="trim" /></mesh>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[3.52, 2.12]} />
        <meshStandardMaterial
          color={PALETTE.paper}
          map={texture ?? undefined}
          emissive={PALETTE.glass}
          emissiveIntensity={0.16}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function ExhibitPedestal({
  position,
  width = 2.3,
  children,
}: {
  position: [number, number, number];
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <group position={position} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.48, width * 0.55, 0.56, 12]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.52, width * 0.48, 0.12, 12]} />
        <LowPolyMaterial color="paper" />
      </mesh>
      {children}
    </group>
  );
}

function Placard({ position, labelBars = 2 }: { position: [number, number, number]; labelBars?: number }) {
  return (
    <group position={position} rotation={[-0.32, 0, 0]}>
      <mesh castShadow><boxGeometry args={[1.05, 0.62, 0.08]} /><LowPolyMaterial color="trim" /></mesh>
      <mesh position={[0, 0, 0.05]}><planeGeometry args={[0.92, 0.5]} /><LowPolyMaterial color="paper" /></mesh>
      {Array.from({ length: labelBars }, (_, index) => (
        <mesh key={index} position={[0, 0.12 - index * 0.17, 0.075]}>
          <boxGeometry args={[index === 0 ? 0.62 : 0.74, 0.045, 0.02]} />
          <LowPolyMaterial color={index === 0 ? 'accent1' : 'wood'} />
        </mesh>
      ))}
    </group>
  );
}

function MoonBounceDemo() {
  const earthBall = useRef<Mesh>(null);
  const moonBall = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const actionHistory = useExperimentStore((state) => state.actionHistory);
  const runCount = actionHistory.filter((record) => record.actionId === 'run-bounce-comparison').length;

  useEffect(() => {
    if (runCount > 0) elapsed.current = 0.001;
  }, [runCount]);

  useFrame((_, delta) => {
    if (elapsed.current <= 0) return;
    elapsed.current += delta;
    const time = elapsed.current;
    if (earthBall.current) earthBall.current.position.y = 0.38 + Math.abs(Math.sin(time * 4.8)) * 0.58 * Math.exp(-time * 0.1);
    if (moonBall.current) moonBall.current.position.y = 0.38 + Math.abs(Math.sin(time * 1.8)) * 1.72 * Math.exp(-time * 0.045);
    if (time > 8) elapsed.current = 0;
  });

  return (
    <group position={[-12.25, 0, 15.55]} userData={{ cameraFadeRoot: true }}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow><boxGeometry args={[2.75, 0.24, 1.25]} /><LowPolyMaterial color="wood" /></mesh>
      <mesh position={[-0.68, 0.27, 0]}><circleGeometry args={[0.34, 18]} /><LowPolyMaterial color="accent1" /></mesh>
      <mesh position={[0.68, 0.27, 0]}><circleGeometry args={[0.34, 18]} /><LowPolyMaterial color="paper" /></mesh>
      <mesh ref={earthBall} position={[-0.68, 0.38, 0]} castShadow><sphereGeometry args={[0.19, 12, 9]} /><LowPolyMaterial color="accent1" emissive="accent1" emissiveIntensity={0.25} /></mesh>
      <mesh ref={moonBall} position={[0.68, 0.38, 0]} castShadow><sphereGeometry args={[0.19, 12, 9]} /><LowPolyMaterial color="accent2" emissive="accent2" emissiveIntensity={0.25} /></mesh>
    </group>
  );
}

function DeskPapers() {
  return (
    <group>
      {[
        [-13.15, 19.1, -0.18], [-12.45, 19.0, 0.12], [-11.55, 19.35, -0.22], [-10.7, 18.95, 0.16],
      ].map(([x, z, rotation], index) => (
        <group key={index} position={[x, WORK_SURFACE_Y + 0.025, z]} rotation={[0, rotation, 0]}>
          <mesh castShadow><boxGeometry args={[0.58, 0.04, 0.4]} /><LowPolyMaterial color="paper" /></mesh>
          {index % 2 === 0 ? (
            <mesh position={[0.12, 0.08, -0.04]} castShadow><boxGeometry args={[0.44, 0.12, 0.32]} /><LowPolyMaterial color="accent2" /></mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

export function DiscoveryRoom() {
  return (
    <group>
      <StarChart />
      <Scope position={[-14.0, 0, 10.45]} rotation={[0, 0.62, 0]} scale={0.78} />
      <ExhibitPedestal position={[-11.55, 0, 13.2]} width={2.5}>
        <Astronaut position={[0, 0.67, 0]} rotation={[0, 0.25, 0]} scale={0.56} />
      </ExhibitPedestal>
      <Placard position={[-10.15, 0.72, 14.55]} />

      <ExhibitPedestal position={[-7.2, 0, 13.2]} width={2.35}>
        <ArmatureDisplay position={[0, 0.66, 0]} rotation={[0, -0.32, 0]} scale={0.00017} />
      </ExhibitPedestal>
      <Placard position={[-5.92, 0.72, 14.6]} labelBars={3} />

      <MoonBounceDemo />

      <LabTable position={[-11.9, 0, 19.2]} scale={TABLE_WORK_SCALE} />
      <mesh position={[-11.9, WORK_SURFACE_Y - 0.05, 19.2]} castShadow receiveShadow>
        <boxGeometry args={[5.15, 0.1, 1.6]} />
        <LowPolyMaterial color="wood" />
      </mesh>
      <DeskPapers />
      <Stool position={[-13.2, 0, 17.9]} rotation={[0, 0.12, 0]} scale={2.55} />
      <Stool position={[-10.7, 0, 17.9]} rotation={[0, -0.16, 0]} scale={2.55} />

      <mesh position={[-11.55, 5.45, 13.2]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.36, 10]} />
        <LowPolyMaterial color="trim" emissive="paper" emissiveIntensity={0.18} />
      </mesh>
      <spotLight position={[-11.55, 5.2, 13.2]} target-position={[-11.55, 0.6, 13.2]} color="#fff0d5" intensity={1.1} angle={0.42} penumbra={0.65} distance={8} castShadow={false} />
      <spotLight position={[-7.2, 5.2, 13.2]} target-position={[-7.2, 0.6, 13.2]} color="#fff0d5" intensity={0.85} angle={0.42} penumbra={0.65} distance={8} castShadow={false} />
    </group>
  );
}
