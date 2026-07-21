'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  type Material,
  type Object3D,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/lib/assets';
import type { ResearcherDefinition } from '@/lib/researchers';
import { auditCharacterPose, groundCharacter } from './Characters';
import { NpcInteractionMarker } from '@/components/scene/NpcInteractionMarker';
import {
  SAFE_GESTURE_PRIORITY,
  SAFE_IDLE_PRIORITY,
  SAFE_WALK_PRIORITY,
  resolveSafeNpcClip,
  useGuardedNpcAnimation,
} from './npcAnimation';

export type ResearcherMotion = 'working' | 'walking' | 'gesturing';

type ResearcherModelProps = {
  definition: ResearcherDefinition;
  motion: ResearcherMotion;
  characterRef: MutableRefObject<Group | null>;
};

type MaterialSlot = {
  mesh: string;
  material: string;
  color: string;
};

export function ResearcherModel({ definition, motion, characterRef }: ResearcherModelProps) {
  const modelGroup = useRef<Group>(null);
  const groundingFrames = useRef(0);
  const grounded = useRef(false);
  const auditedMotions = useRef(new Set<ResearcherMotion>());
  const { scene, animations } = useGLTF(ASSETS[definition.model]);
  const styled = useMemo(
    () => createResearcherCharacter(scene, definition.skinTone),
    [definition.skinTone, scene],
  );
  const { actions, names } = useAnimations(animations, characterRef);
  const idleClip = resolveSafeNpcClip(names, SAFE_IDLE_PRIORITY, ['idle', 'standing']);
  const walkClip = resolveSafeNpcClip(names, SAFE_WALK_PRIORITY, ['walk']);
  const gestureClip = resolveSafeNpcClip(names, SAFE_GESTURE_PRIORITY, ['interact', 'standing']);
  const requestedClip = motion === 'walking' ? walkClip : motion === 'gesturing' ? gestureClip : idleClip;
  useGuardedNpcAnimation({
    actions,
    clip: requestedClip,
    label: definition.id,
    once: motion === 'gesturing',
  });

  useEffect(() => {
    styled.character.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = definition.castShadow;
      object.receiveShadow = true;
    });

    console.info(`[Bunsen:researcher-materials] ${definition.id} before=${JSON.stringify(styled.before)}`);
    console.info(`[Bunsen:researcher-materials] ${definition.id} applied=${JSON.stringify(styled.after)}`);
  }, [definition.castShadow, definition.id, styled]);

  useEffect(() => {
    console.info(`[Bunsen:animations] ${definition.id} ${names.join(', ')}`);
    console.info(
      `[Bunsen:researcher-animation-map] ${definition.id} working=${idleClip ?? 'missing'} walking=${walkClip ?? 'stationary-only'} gesture=${gestureClip ?? 'none'}`,
    );
  }, [definition.id, gestureClip, idleClip, names, walkClip]);

  useFrame(() => {
    if (!grounded.current) {
      if (!idleClip || !actions[idleClip]?.isRunning()) return;
      groundingFrames.current += 1;
      if (groundingFrames.current < 2) return;
      grounded.current = groundCharacter(
        characterRef.current,
        modelGroup.current,
        styled.character,
        definition.id,
      );
      return;
    }

    if (auditedMotions.current.has(motion) || !requestedClip || !actions[requestedClip]?.isRunning()) {
      return;
    }
    auditCharacterPose(characterRef.current, styled.character, requestedClip, definition.id);
    auditedMotions.current.add(motion);
  });

  return (
    <group
      ref={characterRef}
      dispose={null}
      userData={{ ambientResearcherCollider: true, researcherId: definition.id }}
    >
      <group ref={modelGroup} scale={definition.scale}>
        <primitive object={styled.character} />
      </group>
      <NpcInteractionMarker personaId={definition.personaId} />
    </group>
  );
}

function createResearcherCharacter(source: Object3D, skinTone: string) {
  const character = clone(source);
  const before = getMaterialSlots(character);

  character.traverse((object) => {
    if (!(object instanceof SkinnedMesh)) return;
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const isolatedMaterials = sourceMaterials.map((sourceMaterial) => {
      // Preserve the authored shader/material type; clone only to isolate this NPC's colors.
      const material: Material = sourceMaterial.clone();
      if (material instanceof MeshStandardMaterial) {
        const targetColor = colorForSlot(object.name, material.name, skinTone);
        if (targetColor) material.color.set(targetColor);
        material.roughness = Math.max(material.roughness, 0.82);
        material.metalness = 0;
        material.needsUpdate = true;
      }
      return material;
    });
    object.material = Array.isArray(object.material) ? isolatedMaterials : isolatedMaterials[0]!;
  });

  return { character, before, after: getMaterialSlots(character) };
}

function colorForSlot(meshName: string, materialName: string, skinTone: string) {
  const mesh = meshName.toLowerCase();
  const material = materialName.toLowerCase();

  if (material.includes('skin')) return material.includes('darker') ? shadeSkin(skinTone, 0.88) : skinTone;
  if (mesh.includes('body')) return '#f5f2ea';
  if (mesh.includes('legs')) return '#2a2a30';
  if (mesh.includes('feet')) return '#24242a';
  return undefined;
}

function shadeSkin(hex: string, multiplier: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = Math.round(((value >> 16) & 255) * multiplier);
  const green = Math.round(((value >> 8) & 255) * multiplier);
  const blue = Math.round((value & 255) * multiplier);
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getMaterialSlots(character: Object3D): MaterialSlot[] {
  const slots: MaterialSlot[] = [];
  character.traverse((object) => {
    if (!(object instanceof SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      slots.push({
        mesh: object.name || '(unnamed)',
        material: material.name || '(unnamed)',
        color: material instanceof MeshStandardMaterial ? `#${material.color.getHexString()}` : 'n/a',
      });
    });
  });
  return slots;
}
