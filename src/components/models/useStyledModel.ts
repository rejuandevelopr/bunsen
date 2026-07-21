'use client';

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, SkinnedMesh, type Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PALETTE, type PaletteKey } from '@/lib/palette';

export type ModelColorMap = Readonly<Record<string, PaletteKey>>;

const loggedModels = new Set<string>();

export function useStyledModel(path: string, colorMap: ModelColorMap) {
  const { scene } = useGLTF(path);

  const styled = useMemo(() => {
    const instance = clone(scene) as Group;
    const materials: MeshStandardMaterial[] = [];
    const meshNames: string[] = [];

    instance.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      meshNames.push(object.name || '(unnamed)');
      object.castShadow = true;
      object.receiveShadow = true;

      // Character skins retain their authored materials and skeleton bindings.
      if (object instanceof SkinnedMesh) return;

      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const paletteColor = colorMap[object.name] ?? 'furniture';
      const looksLikeVessel = /glass|liquid|solution|beaker|flask/i.test(object.name);
      const isGlass = paletteColor === 'glass' || (looksLikeVessel && paletteColor !== 'paper');
      const replacements = sourceMaterials.map(() => {
        const material = new MeshStandardMaterial({
          color: PALETTE[paletteColor],
          emissive: PALETTE[isGlass ? 'glass' : paletteColor],
          emissiveIntensity: isGlass ? 0.35 : 0,
          flatShading: true,
          roughness: 0.9,
          metalness: 0,
          transparent: isGlass,
          opacity: isGlass ? 0.55 : 1,
          depthWrite: !isGlass,
        });
        materials.push(material);
        return material;
      });

      object.material = Array.isArray(object.material) ? replacements : replacements[0];
    });

    if (process.env.NODE_ENV === 'development' && !loggedModels.has(path)) {
      loggedModels.add(path);
      console.info(`[Bunsen:model] ${path}`, meshNames);
    }

    return { instance, materials };
  }, [colorMap, path, scene]);

  useEffect(
    () => () => {
      styled.materials.forEach((material) => material.dispose());
    },
    [styled.materials],
  );

  return styled.instance;
}
