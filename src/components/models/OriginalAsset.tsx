'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Mesh, Vector3, type Euler, type Vector3Tuple } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { AssetPath } from '@/lib/assets';

type OriginalAssetProps = {
  path: AssetPath;
  position?: Vector3Tuple;
  rotation?: Euler | Vector3Tuple;
  scale?: number;
};

export function OriginalAsset({
  path,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: OriginalAssetProps) {
  const { scene } = useGLTF(path);
  const { model, offset } = useMemo(() => {
    const instance = clone(scene);
    instance.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    const bounds = new Box3().setFromObject(instance);
    const center = bounds.getCenter(new Vector3());
    return {
      model: instance,
      offset: [-center.x, -bounds.min.y, -center.z] as Vector3Tuple,
    };
  }, [scene]);

  return (
    <group position={position} rotation={rotation} scale={scale} userData={{ cameraFadeRoot: true }}>
      <primitive object={model} position={offset} />
    </group>
  );
}
