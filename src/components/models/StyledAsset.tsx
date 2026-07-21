'use client';

import { useMemo } from 'react';
import { Box3, Vector3, type Euler, type Vector3Tuple } from 'three';
import type { AssetPath } from '@/lib/assets';
import { type ModelColorMap, useStyledModel } from './useStyledModel';

type StyledAssetProps = {
  path: AssetPath;
  colorMap: ModelColorMap;
  position?: Vector3Tuple;
  rotation?: Euler | Vector3Tuple;
  scale?: number;
};

export function StyledAsset({
  path,
  colorMap,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: StyledAssetProps) {
  const model = useStyledModel(path, colorMap);
  const offset = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    return [-center.x, -bounds.min.y, -center.z] as Vector3Tuple;
  }, [model]);

  return (
    <group position={position} rotation={rotation} scale={scale} userData={{ cameraFadeRoot: true }}>
      <primitive object={model} position={offset} />
    </group>
  );
}
