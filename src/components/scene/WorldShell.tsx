'use client';

import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Box3, InstancedMesh, Mesh, Object3D, type Vector3Tuple } from 'three';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';

function seededRandom(seed = 72026) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function FloorSpeckles() {
  const ref = useRef<InstancedMesh>(null);
  const transforms = useMemo(() => {
    const random = seededRandom();
    return Array.from({ length: 430 }, () => ({
      x: random() * 31.2 - 15.6,
      z: random() * 27.1 - 6.95,
      scale: random() * 0.022 + 0.01,
    }));
  }, []);

  useEffect(() => {
    const dummy = new Object3D();
    transforms.forEach((transform, index) => {
      dummy.position.set(transform.x, 0.025, transform.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(transform.scale);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(index, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, transforms.length]} receiveShadow>
      <circleGeometry args={[1, 5]} />
      <LowPolyMaterial color="trim" transparent opacity={0.16} />
    </instancedMesh>
  );
}

function Window({
  position,
  rotation = [0, 0, 0],
  width = 4.1,
}: {
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  width?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[width, 2.35, 0.12]} radius={0.045} smoothness={2} castShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[width - 0.3, 2.05]} />
        <LowPolyMaterial color="glass" emissive="glass" emissiveIntensity={0.08} transparent opacity={0.48} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[0.09, 2.05, 0.06]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[width - 0.3, 0.09, 0.06]} />
        <LowPolyMaterial color="trim" />
      </mesh>
    </group>
  );
}

function Partition({ x }: { x: number }) {
  return (
    <group userData={{ cameraFadeRoot: true }}>
      <RoundedBox args={[0.32, 5.8, 5.2]} radius={0.1} smoothness={2} position={[x, 2.9, -4.62]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox args={[0.32, 5.8, 4.45]} radius={0.1} smoothness={2} position={[x, 2.9, 5.07]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox args={[0.42, 1.08, 4.85]} radius={0.18} smoothness={3} position={[x, 5.28, 0.43]} castShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      <mesh position={[x, 2.65, -1.96]} castShadow>
        <boxGeometry args={[0.46, 5.3, 0.18]} />
        <LowPolyMaterial color="trim" />
      </mesh>
      <mesh position={[x, 2.65, 2.82]} castShadow>
        <boxGeometry args={[0.46, 5.3, 0.18]} />
        <LowPolyMaterial color="trim" />
      </mesh>
    </group>
  );
}

function HorizontalPartition() {
  const segments = [
    { x: -14.25, width: 3.6 },
    { x: -5.15, width: 6.2 },
    { x: 5.1, width: 6.1 },
    { x: 14.2, width: 3.7 },
  ];
  const arches = [
    { x: -10.35, width: 4.2 },
    { x: 0, width: 4.1 },
    { x: 10.25, width: 4.2 },
  ];

  return (
    <group userData={{ cameraFadeRoot: true }}>
      {segments.map((segment) => (
        <RoundedBox
          key={segment.x}
          args={[segment.width, 5.8, 0.32]}
          radius={0.1}
          smoothness={2}
          position={[segment.x, 2.9, 7.15]}
          castShadow
          receiveShadow
        >
          <LowPolyMaterial color="wall" />
        </RoundedBox>
      ))}
      {arches.map((arch) => (
        <group key={arch.x}>
          <RoundedBox args={[arch.width, 1.08, 0.42]} radius={0.18} smoothness={3} position={[arch.x, 5.28, 7.15]} castShadow>
            <LowPolyMaterial color="trim" />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[arch.x + side * (arch.width / 2 - 0.08), 2.65, 7.15]} castShadow>
              <boxGeometry args={[0.18, 5.3, 0.46]} />
              <LowPolyMaterial color="trim" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function ExpansionPartition() {
  return (
    <group userData={{ cameraFadeRoot: true }}>
      <RoundedBox args={[0.32, 5.8, 4.9]} radius={0.1} smoothness={2} position={[-5.15, 2.9, 9.6]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox args={[0.32, 5.8, 4.5]} radius={0.1} smoothness={2} position={[-5.15, 2.9, 18.35]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox args={[0.42, 1.08, 4.1]} radius={0.18} smoothness={3} position={[-5.15, 5.28, 14.1]} castShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      {[12.05, 16.15].map((z) => (
        <mesh key={z} position={[-5.15, 2.65, z]} castShadow>
          <boxGeometry args={[0.46, 5.3, 0.18]} />
          <LowPolyMaterial color="trim" />
        </mesh>
      ))}
    </group>
  );
}

function SunPools() {
  const pools = [
    { position: [-10.7, 0.035, -2.7] as Vector3Tuple, rotation: -0.18, size: [5.4, 3.1] as [number, number] },
    { position: [0.2, 0.037, -2.4] as Vector3Tuple, rotation: -0.22, size: [5.1, 2.8] as [number, number] },
    { position: [10.7, 0.039, -1.5] as Vector3Tuple, rotation: -0.14, size: [6.5, 4.2] as [number, number] },
    { position: [-10.6, 0.041, 13.7] as Vector3Tuple, rotation: 0.2, size: [5.4, 4.2] as [number, number] },
    { position: [5.2, 0.043, 14.2] as Vector3Tuple, rotation: -0.16, size: [9.2, 4.8] as [number, number] },
  ];

  return (
    <>
      {pools.map((pool, index) => (
        <mesh key={index} position={pool.position} rotation={[-Math.PI / 2, 0, pool.rotation]}>
          <planeGeometry args={pool.size} />
          <LowPolyMaterial color="paper" transparent opacity={index === 2 ? 0.24 : 0.17} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function LightShafts() {
  return (
    <>
      {[-10.7, 0, 10.7].map((x) => (
        <group key={x} position={[x, 2.25, -4.8]} rotation={[-0.17, 0, -0.12]}>
          {[0, 1, 2].map((index) => (
            <mesh key={index} position={[(index - 1) * 0.75, 0, index * 0.06]} rotation={[0, 0, 0]}>
              <planeGeometry args={[0.55, 5.2]} />
              <LowPolyMaterial color="paper" transparent opacity={0.035} doubleSided depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[-15.45, 2.25, 13.7]} rotation={[-0.12, Math.PI / 2, -0.1]}>
        {[0, 1].map((index) => (
          <mesh key={index} position={[(index - 0.5) * 0.85, 0, index * 0.08]}>
            <planeGeometry args={[0.65, 5.4]} />
            <LowPolyMaterial color="paper" transparent opacity={0.04} doubleSided depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group position={[15.45, 2.25, 13.7]} rotation={[-0.12, -Math.PI / 2, 0.1]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[(index - 1) * 0.8, 0, index * 0.06]}>
            <planeGeometry args={[0.58, 5.4]} />
            <LowPolyMaterial color="paper" transparent opacity={0.035} doubleSided depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function WorldShell() {
  const visibleFloor = useRef<Mesh>(null);
  const loggedFloor = useRef(false);

  useFrame(() => {
    if (loggedFloor.current || !visibleFloor.current) return;
    visibleFloor.current.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(visibleFloor.current, true);
    console.info(`[Bunsen:floor] min=${bounds.min.y.toFixed(4)} top=${bounds.max.y.toFixed(4)}`);
    loggedFloor.current = true;
  });

  return (
    <group>
      <RoundedBox args={[33, 0.9, 29.6]} radius={0.38} smoothness={3} position={[0, -0.5, 6.55]} castShadow receiveShadow>
        <LowPolyMaterial color="trim" />
      </RoundedBox>
      <RoundedBox ref={visibleFloor} args={[32.45, 0.22, 29.05]} radius={0.08} smoothness={3} position={[0, -0.11, 6.55]} receiveShadow>
        <LowPolyMaterial color="floor" />
      </RoundedBox>
      <FloorSpeckles />
      <SunPools />

      <RoundedBox userData={{ cameraFadeRoot: true }} args={[32.35, 6.05, 0.38]} radius={0.16} smoothness={2} position={[0, 3.02, -7.75]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox userData={{ cameraFadeRoot: true }} args={[0.38, 6.05, 12]} radius={0.16} smoothness={2} position={[-16.05, 3.02, -1.75]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox userData={{ cameraFadeRoot: true }} args={[0.38, 6.05, 12]} radius={0.16} smoothness={2} position={[16.05, 3.02, -1.75]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox userData={{ cameraFadeRoot: true }} args={[0.38, 6.05, 13.4]} radius={0.16} smoothness={2} position={[-16.05, 3.02, 13.85]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>
      <RoundedBox userData={{ cameraFadeRoot: true }} args={[0.38, 6.05, 13.4]} radius={0.16} smoothness={2} position={[16.05, 3.02, 13.85]} castShadow receiveShadow>
        <LowPolyMaterial color="wall" />
      </RoundedBox>

      <Partition x={-5.15} />
      <Partition x={5.15} />
      <HorizontalPartition />
      <ExpansionPartition />
      <Window position={[-10.7, 3.45, -7.52]} width={4.6} />
      <Window position={[0, 3.45, -7.52]} width={4.35} />
      <Window position={[10.7, 3.45, -7.52]} width={5.3} />
      <Window position={[-15.82, 3.45, 13.75]} rotation={[0, Math.PI / 2, 0]} width={4.8} />
      <Window position={[15.82, 3.45, 13.75]} rotation={[0, -Math.PI / 2, 0]} width={5.6} />
      <LightShafts />
    </group>
  );
}
