'use client';

import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  CanvasTexture,
  InstancedMesh,
  LinearFilter,
  Object3D,
  SRGBColorSpace,
  type Vector3Tuple,
} from 'three';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import { PALETTE } from '@/lib/palette';
import { STATIONS } from '@/lib/world';

type PanelKind = 'sign' | 'whiteboard' | 'chalkboard' | 'diagram';

function createPanelTexture(kind: PanelKind) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = kind === 'sign' ? 240 : 520;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const background = kind === 'chalkboard' ? PALETTE.furniture : PALETTE.paper;
  const ink = kind === 'chalkboard' ? PALETTE.paper : PALETTE.accent1;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (kind === 'sign') {
    context.font = '700 72px Georgia, serif';
    context.textAlign = 'center';
    context.fillText('BUNSEN SCIENCE CENTER', 512, 112);
    context.font = '500 24px Arial, sans-serif';
    context.letterSpacing = '9px';
    context.fillStyle = PALETTE.wood;
    context.fillText('DISCOVER  •  TEST  •  LEARN', 512, 172);
  } else if (kind === 'whiteboard') {
    context.font = '700 44px Georgia, serif';
    context.fillText('RESEARCH NOTES', 52, 62);
    context.font = '34px Georgia, serif';
    context.fillText('H2O + H+  ->  H3O+', 62, 154);
    context.fillText('NaOH + HCl  ->  NaCl + H2O', 62, 222);
    context.fillText('observe  ->  measure  ->  explain', 62, 432);
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(90, 330);
    context.bezierCurveTo(260, 265, 410, 400, 590, 305);
    context.stroke();
  } else if (kind === 'chalkboard') {
    context.font = '700 46px Georgia, serif';
    context.fillText('TODAY: SCIENTIFIC METHOD', 45, 64);
    context.font = '32px Georgia, serif';
    context.fillText('question + evidence = discovery', 54, 132);
    context.fillText('C6H6', 730, 402);
    context.lineWidth = 6;
    const centerX = 760;
    const centerY = 225;
    const radius = 82;
    context.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = Math.PI / 6 + index * (Math.PI / 3);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(centerX, centerY, 44, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(90, 265);
    context.lineTo(520, 265);
    context.lineTo(485, 240);
    context.moveTo(520, 265);
    context.lineTo(485, 290);
    context.stroke();
  } else {
    context.font = '700 40px Georgia, serif';
    context.fillText('CELL STUDY', 44, 56);
    context.strokeStyle = PALETTE.accent2;
    context.lineWidth = 7;
    context.beginPath();
    context.arc(280, 270, 128, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(280, 270, 42, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = PALETTE.wood;
    context.font = '28px Arial, sans-serif';
    context.fillText('membrane', 520, 210);
    context.fillText('nucleus', 520, 285);
    context.fillText('cytoplasm', 520, 360);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  return texture;
}

function TexturePanel({
  kind,
  position,
  rotation = [0, 0, 0],
  size,
}: {
  kind: PanelKind;
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  size: [number, number];
}) {
  const texture = useMemo(() => createPanelTexture(kind), [kind]);
  useEffect(() => () => texture?.dispose(), [texture]);
  const frameColor = kind === 'chalkboard' ? 'wood' : 'trim';

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[size[0] + 0.24, size[1] + 0.24, 0.14]} radius={0.05} smoothness={2} castShadow>
        <LowPolyMaterial color={frameColor} />
      </RoundedBox>
      <mesh position={[0, 0, 0.085]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={PALETTE.paper}
          map={texture ?? undefined}
          emissive={kind === 'chalkboard' ? PALETTE.glass : PALETTE.accent1}
          emissiveIntensity={kind === 'sign' ? 0.2 : 0.09}
          flatShading
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function PeriodicTable() {
  const tealRef = useRef<InstancedMesh>(null);
  const pinkRef = useRef<InstancedMesh>(null);
  const woodRef = useRef<InstancedMesh>(null);
  const paperRef = useRef<InstancedMesh>(null);
  const groups = useMemo(() => {
    const output = [[], [], [], []] as Array<Array<[number, number]>>;
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        if ((row === 0 || row === 1) && column > 1 && column < 9) continue;
        output[(row * 3 + column) % 4].push([column, row]);
      }
    }
    return output;
  }, []);

  useEffect(() => {
    const dummy = new Object3D();
    const refs = [tealRef, pinkRef, woodRef, paperRef];
    groups.forEach((cells, groupIndex) => {
      cells.forEach(([column, row], index) => {
        dummy.position.set((column - 5.5) * 0.18, (2.5 - row) * 0.18, 0);
        dummy.updateMatrix();
        refs[groupIndex].current?.setMatrixAt(index, dummy.matrix);
      });
      if (refs[groupIndex].current) refs[groupIndex].current.instanceMatrix.needsUpdate = true;
    });
  }, [groups]);

  const entries = [
    [tealRef, 'accent1'], [pinkRef, 'accent2'], [woodRef, 'wood'], [paperRef, 'paper'],
  ] as const;

  return (
    <group position={[3.55, 3.55, -7.5]}>
      <RoundedBox args={[2.55, 1.8, 0.12]} radius={0.04} smoothness={2} castShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[2.32, 1.58]} />
        <LowPolyMaterial color="wall" />
      </mesh>
      {entries.map(([ref, color], groupIndex) => (
        <instancedMesh key={color} ref={ref} args={[undefined, undefined, groups[groupIndex].length]} position={[0, -0.08, 0.12]}>
          <boxGeometry args={[0.14, 0.14, 0.025]} />
          <LowPolyMaterial color={color} />
        </instancedMesh>
      ))}
    </group>
  );
}

function StationMarker({ number, position }: { number: number; position: Vector3Tuple }) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = PALETTE.paper;
    context.fillRect(0, 0, 160, 160);
    context.fillStyle = PALETTE.wood;
    context.font = '700 104px Georgia, serif';
    context.textAlign = 'center';
    context.fillText(String(number), 80, 118);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [number]);
  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.35, 0.18, 8]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 0.74, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 1.3, 7]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshStandardMaterial color={PALETTE.paper} map={texture ?? undefined} flatShading roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

function StationRing({ position }: { position: Vector3Tuple }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <torusGeometry args={[0.62, 0.035, 6, 32]} />
      <LowPolyMaterial
        color="accent1"
        emissive="accent1"
        emissiveIntensity={0.24}
        transparent
        opacity={0.72}
      />
    </mesh>
  );
}

const STATION_MARKER_POSITIONS: Partial<Record<(typeof STATIONS)[number]['id'], Vector3Tuple>> = {
  titration: [1.5, 0, 3.5],
  research: [-7.1, 0, 1.55],
  plant: [6.95, 0, 0.2],
  experiment: [4.15, 0, 3.65],
  instrument: [5.05, 0, 15.45],
  discovery: [-9.45, 0, 15.55],
};

function DensityScatter() {
  const paperRef = useRef<InstancedMesh>(null);
  const crateRef = useRef<InstancedMesh>(null);
  const cupRef = useRef<InstancedMesh>(null);
  const sampleRef = useRef<InstancedMesh>(null);
  const papers = useMemo(
    () => [
      [-14.2, -1.8, 0.3], [-12.8, 6.1, -0.4], [-7.2, 3.1, 0.2], [-6.4, -2.7, -0.2],
      [-3.7, 3.2, 0.4], [-2.2, 5.7, -0.15], [3.4, 3.7, 0.25], [4.1, -2.0, -0.35],
      [6.3, 2.9, 0.18], [7.4, -1.7, -0.25], [12.2, 5.7, 0.38], [14.5, 0.1, -0.12],
      [-14.1, 10.1, 0.24], [-12.9, 16.4, -0.18], [-10.2, 17.2, 0.31], [-6.4, 18.0, -0.25],
      [-3.9, 11.1, 0.14], [-1.2, 16.8, -0.38], [1.1, 18.1, 0.22], [7.7, 16.7, -0.16],
      [10.2, 9.1, 0.35], [14.4, 18.3, -0.2],
    ] as const,
    [],
  );

  useEffect(() => {
    const dummy = new Object3D();
    papers.forEach(([x, z, rotation], index) => {
      dummy.position.set(x, 0.035, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(index % 2 ? 0.8 : 1.1, 1, index % 3 ? 0.85 : 1);
      dummy.updateMatrix();
      paperRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (paperRef.current) paperRef.current.instanceMatrix.needsUpdate = true;
    [[-14, -3.4], [-6.3, 5.9], [4.1, 5.4], [7.1, 3.55], [14.3, 6.2], [-13.9, 16.8], [-6.1, 17.4], [0.4, 10.1], [14.0, 19.1]].forEach(([x, z], index) => {
      dummy.position.set(x, 0.22, z);
      dummy.rotation.set(0, index * 0.31, 0);
      dummy.scale.set(0.75 + (index % 2) * 0.25, 0.75, 0.75);
      dummy.updateMatrix();
      crateRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (crateRef.current) crateRef.current.instanceMatrix.needsUpdate = true;

    const cups = [
      [-14.2, 0.8], [-13.2, 2.65], [-12.1, -2.2], [-10.4, -3.35], [-8.1, 2.75], [-6.25, 4.4],
      [-4.25, 4.95], [-3.25, -2.6], [-1.6, 4.6], [2.9, 4.7], [3.75, -2.7], [4.35, 2.75],
      [6.45, 3.65], [7.15, -2.2], [8.25, 3.65], [9.8, -3.2], [11.8, 3.7], [13.4, 5.7], [14.6, -2.4],
      [-14.4, 9.2], [-12.8, 16.6], [-10.0, 17.1], [-6.4, 18.1], [-3.8, 11.3], [-1.1, 16.8],
      [1.1, 18.0], [7.6, 16.9], [10.1, 9.0], [14.3, 18.2],
    ];
    cups.forEach(([x, z], index) => {
      dummy.position.set(x, 0.14, z);
      dummy.rotation.set(0, index * 0.37, index % 5 === 0 ? 0.22 : 0);
      dummy.scale.setScalar(0.82 + (index % 3) * 0.1);
      dummy.updateMatrix();
      cupRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (cupRef.current) cupRef.current.instanceMatrix.needsUpdate = true;

    cups.slice(0, 14).forEach(([x, z], index) => {
      dummy.position.set(x + 0.38, 0.07, z - 0.25);
      dummy.rotation.set(0, index * 0.58, 0);
      dummy.scale.setScalar(0.75 + (index % 2) * 0.2);
      dummy.updateMatrix();
      sampleRef.current?.setMatrixAt(index, dummy.matrix);
    });
    if (sampleRef.current) sampleRef.current.instanceMatrix.needsUpdate = true;
  }, [papers]);

  return (
    <>
      <instancedMesh ref={paperRef} args={[undefined, undefined, papers.length]} castShadow>
        <boxGeometry args={[0.48, 0.025, 0.34]} />
        <LowPolyMaterial color="paper" />
      </instancedMesh>
      <instancedMesh ref={crateRef} args={[undefined, undefined, 9]} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <LowPolyMaterial color="wood" />
      </instancedMesh>
      <instancedMesh ref={cupRef} args={[undefined, undefined, 29]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.28, 8]} />
        <LowPolyMaterial color="accent1" />
      </instancedMesh>
      <instancedMesh ref={sampleRef} args={[undefined, undefined, 14]} castShadow>
        <dodecahedronGeometry args={[0.08, 0]} />
        <LowPolyMaterial color="accent2" />
      </instancedMesh>
    </>
  );
}

export function SetDressing() {
  return (
    <>
      <TexturePanel kind="sign" position={[0, 5.58, -7.5]} size={[5.8, 1.05]} />
      <TexturePanel kind="whiteboard" position={[-6.8, 3.45, -7.5]} size={[2.75, 2.1]} />
      <TexturePanel kind="chalkboard" position={[-15.82, 3.35, 0.55]} rotation={[0, Math.PI / 2, 0]} size={[5.15, 2.65]} />
      <TexturePanel kind="diagram" position={[-14.15, 3.25, -7.5]} size={[2.7, 2.2]} />
      <PeriodicTable />
      {STATIONS.map((station) => (
        <group key={station.id}>
          <StationRing position={[station.position.x, 0.035, station.position.z]} />
          {STATION_MARKER_POSITIONS[station.id] ? (
            <StationMarker number={station.number} position={STATION_MARKER_POSITIONS[station.id]!} />
          ) : null}
        </group>
      ))}
      <DensityScatter />
    </>
  );
}
