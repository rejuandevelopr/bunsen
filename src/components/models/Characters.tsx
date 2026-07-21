'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SkinnedMesh,
  Vector3,
  type AnimationAction,
  type Material,
  type Vector3Tuple,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/lib/assets';
import { PALETTE } from '@/lib/palette';
import { useTutorStore } from '@/store/tutor-store';
import { NpcInteractionMarker } from '@/components/scene/NpcInteractionMarker';
import { useNpcDialogueFacing } from '@/components/scene/useNpcDialogueFacing';
import {
  resolveDialogueIdleClip,
  resolveSafeNpcClip,
  useGuardedNpcAnimation,
} from './npcAnimation';

export const CHARACTER_ANIMATIONS = {
  idle: 'HumanArmature|Man_Idle',
  clapping: 'HumanArmature|Man_Clapping',
  walk: 'HumanArmature|Man_Walk',
  run: 'HumanArmature|Man_Run',
} as const;

type ProfessorProps = {
  celebrateSuccess?: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number;
};

const STUDENT_MATERIAL_COLORS: Readonly<Record<string, string>> = {
  Shirt: '#f5f2ea',
  Pants: '#2a2a30',
  // This character pack groups the shoes with its dark eye accents.
  Eyes: '#2a2a30',
  Skin: '#f0d5b8',
};
const LAB_ASSISTANT_MATERIAL_COLORS: Readonly<Record<string, string>> = {
  Shirt: '#f5f2ea',
  Skin: '#f0d5b8',
  Details: PALETTE.accent1,
  TieTexture: PALETTE.accent1,
};

export function Professor({
  celebrateSuccess = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.42,
}: ProfessorProps) {
  const speechBubble = useTutorStore((state) => state.speechBubble);
  const isDialogueOpen = useTutorStore(
    (state) => state.isOpen && state.activePersonaId === 'professor-quill',
  );
  const initialRotation = useRef<Vector3Tuple>([rotation[0], rotation[1], rotation[2]]);
  const group = useRef<Group>(null);
  const modelGroup = useRef<Group>(null);
  const groundingFrames = useRef(0);
  const grounded = useRef(false);
  const auditedDialogueClip = useRef<string | null>(null);
  const { scene, animations } = useGLTF(ASSETS.professor);
  const character = useMemo(() => clone(scene), [scene]);
  const { actions, names } = useAnimations(animations, group);
  const idleClip = resolveSafeNpcClip(
    names,
    [CHARACTER_ANIMATIONS.idle, 'HumanArmature|Man_Standing'],
    ['idle', 'standing'],
  );
  const dialogueClip = resolveDialogueIdleClip(names);
  const clapClip = names.includes(CHARACTER_ANIMATIONS.clapping)
    ? CHARACTER_ANIMATIONS.clapping
    : idleClip;
  const dialoguePoseActive = isDialogueOpen || Boolean(speechBubble);
  const requestedClip = dialoguePoseActive ? dialogueClip : celebrateSuccess ? clapClip : idleClip;
  useGuardedNpcAnimation({
    actions,
    clip: requestedClip,
    label: 'professor-quill',
    once: !dialoguePoseActive && celebrateSuccess,
  });
  useNpcDialogueFacing({
    characterRef: group,
    conversationActive: isDialogueOpen,
    npcId: 'professor-quill',
  });

  useEffect(() => {
    character.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [character]);

  useEffect(() => {
    console.info(`[Bunsen:animations] professor ${names.join(', ')}`);
    console.info(
      `[Bunsen:professor-animation-map] idle=${idleClip ?? 'missing'} dialogue=${dialogueClip ?? 'missing'} clap=${clapClip ?? 'missing'}`,
    );
  }, [clapClip, dialogueClip, idleClip, names]);

  useFrame(() => {
    const professor = group.current;
    if (professor) professor.position.y = position[1];

    if (!grounded.current && idleClip && actions[idleClip]?.isRunning()) {
      groundingFrames.current += 1;
      if (groundingFrames.current >= 2) {
        grounded.current = groundCharacter(group.current, modelGroup.current, character, 'professor');
      }
    }

    if (process.env.NODE_ENV === 'development' && professor && requestedClip) {
      document.documentElement.dataset.bunsenQuillMotionClip = requestedClip;
      document.documentElement.dataset.bunsenQuillY = professor.position.y.toFixed(4);
      document.documentElement.dataset.bunsenQuillYaw = professor.rotation.y.toFixed(4);
      if (isDialogueOpen) {
        document.documentElement.dataset.bunsenQuillDialogueClip = requestedClip;
      } else {
        delete document.documentElement.dataset.bunsenQuillDialogueClip;
      }
      if (
        isDialogueOpen &&
        grounded.current &&
        auditedDialogueClip.current !== requestedClip &&
        actions[requestedClip]?.isRunning()
      ) {
        auditCharacterPose(professor, character, requestedClip, 'professor-dialogue');
        auditedDialogueClip.current = requestedClip;
      }
    }
  });

  return (
    <group ref={group} position={position} rotation={initialRotation.current} dispose={null}>
      <group ref={modelGroup} scale={scale}>
        <primitive object={character} />
      </group>
      {speechBubble ? (
        <Html position={[0, 2.35, 0]} center distanceFactor={9} zIndexRange={[30, 10]}>
          <div
            className="professor-bubble w-72 border px-4 py-3 text-[0.72rem] leading-relaxed backdrop-blur-md"
            style={{
              background: `color-mix(in srgb, ${PALETTE.background} 20%, ${PALETTE.wood})`,
              borderColor: PALETTE.trim,
              color: PALETTE.paper,
              boxShadow: `0 12px 40px color-mix(in srgb, ${PALETTE.background} 72%, transparent)`,
              pointerEvents: 'none',
            }}
          >
            <span className="mb-1 block font-serif text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: PALETTE.accent2 }}>
              Professor Quill
            </span>
            {speechBubble}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

type LabAssistantModelProps = {
  animation: string;
  characterRef: MutableRefObject<Group | null>;
};

export function LabAssistantModel({ animation, characterRef }: LabAssistantModelProps) {
  const modelGroup = useRef<Group>(null);
  const groundingFrames = useRef(0);
  const grounded = useRef(false);
  const auditFrames = useRef(0);
  const auditedAnimations = useRef(new Set<string>());
  const activeAnimation = useRef<string | null>(null);
  const activeAction = useRef<AnimationAction | null>(null);
  const { scene, animations } = useGLTF(ASSETS.professor);
  const styled = useMemo(() => createLabAssistantCharacter(scene), [scene]);
  const { actions, names } = useAnimations(animations, characterRef);

  useEffect(() => {
    styled.character.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    console.info(`[Bunsen:lab-assistant-materials] before ${JSON.stringify(styled.before)}`);
    console.info(`[Bunsen:lab-assistant-materials] applied ${JSON.stringify(styled.after)}`);
  }, [styled]);

  useEffect(() => {
    console.info(`[Bunsen:animations] lab-assistant ${names.join(', ')}`);
  }, [names]);

  useEffect(() => {
    const nextAction = actions[animation] ?? actions[CHARACTER_ANIMATIONS.idle];
    if (!nextAction || (activeAnimation.current === animation && activeAction.current === nextAction)) {
      return;
    }

    const previousAction = activeAction.current;
    previousAction?.fadeOut(0.2);
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
    activeAnimation.current = animation;
    activeAction.current = nextAction;
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:lab-assistant-animation] ${animation}`);
    }
  }, [actions, animation]);

  useEffect(
    () => () => {
      activeAction.current?.stop();
      activeAction.current = null;
      activeAnimation.current = null;
    },
    [],
  );

  useEffect(() => {
    auditFrames.current = 0;
  }, [animation]);

  useFrame(() => {
    if (!grounded.current) {
      if (!actions[CHARACTER_ANIMATIONS.idle]?.isRunning()) return;
      groundingFrames.current += 1;
      if (groundingFrames.current < 2) return;
      grounded.current = groundCharacter(
        characterRef.current,
        modelGroup.current,
        styled.character,
        'assistant',
      );
      return;
    }

    if (auditedAnimations.current.has(animation) || !actions[animation]?.isRunning()) return;
    auditFrames.current += 1;
    if (auditFrames.current < 1) return;
    auditCharacterPose(characterRef.current, styled.character, animation, 'assistant');
    auditedAnimations.current.add(animation);
  });

  return (
    <group ref={characterRef} dispose={null} userData={{ labAssistantCollider: true }}>
      <group ref={modelGroup} scale={0.47}>
        <primitive object={styled.character} />
      </group>
      <NpcInteractionMarker personaId="rowan-vale" />
    </group>
  );
}

type CharacterMaterialSlot = {
  mesh: string;
  material: string;
  color: string;
};

function createLabAssistantCharacter(source: Object3D) {
  const character = clone(source);
  const before = getCharacterMaterialSlots(character);
  const isolatedMaterials = new Map<Material, Material>();

  character.traverse((object) => {
    if (!(object instanceof SkinnedMesh)) return;
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const replacements = sourceMaterials.map((sourceMaterial) => {
      const existingMaterial = isolatedMaterials.get(sourceMaterial);
      const material: Material = existingMaterial ?? sourceMaterial.clone();
      if (!existingMaterial) {
        isolatedMaterials.set(sourceMaterial, material);
      }
      if (material instanceof MeshStandardMaterial) {
        const targetColor = LAB_ASSISTANT_MATERIAL_COLORS[material.name];
        if (targetColor) material.color.set(targetColor);
      }
      return material;
    });
    object.material = Array.isArray(object.material) ? replacements : replacements[0]!;
  });

  return { character, before, after: getCharacterMaterialSlots(character) };
}

function getCharacterMaterialSlots(character: Object3D): CharacterMaterialSlot[] {
  const slots: CharacterMaterialSlot[] = [];
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

type StudentPlayerModelProps = {
  animation: string;
  characterRef: MutableRefObject<Group | null>;
};

export function StudentPlayerModel({ animation, characterRef }: StudentPlayerModelProps) {
  const modelGroup = useRef<Group>(null);
  const groundingFrames = useRef(0);
  const grounded = useRef(false);
  const auditFrames = useRef(0);
  const auditedAnimations = useRef(new Set<string>());
  const activeAnimation = useRef<string | null>(null);
  const activeAction = useRef<AnimationAction | null>(null);
  const { scene, animations } = useGLTF(ASSETS.student);
  const character = useMemo(() => clone(scene), [scene]);
  const { actions, names } = useAnimations(animations, characterRef);

  useEffect(() => {
    const materialSlots: Array<{
      mesh: string;
      slot: number;
      material: string;
      color: string;
    }> = [];

    character.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (!(object instanceof SkinnedMesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material, slot) => {
          materialSlots.push({
            mesh: object.name || '(unnamed)',
            slot,
            material: material.name || '(unnamed)',
            color: material instanceof MeshStandardMaterial
              ? `#${material.color.getHexString()}`
              : 'n/a',
          });
        });
      }
    });

    console.info(`[Bunsen:materials] student slots before color ${JSON.stringify(materialSlots)}`);

    character.traverse((object) => {
      if (!(object instanceof SkinnedMesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshStandardMaterial)) return;
        const targetColor = STUDENT_MATERIAL_COLORS[material.name];
        if (!targetColor) return;
        material.color.set(targetColor);
        material.needsUpdate = true;
      });
    });

    console.info(`[Bunsen:materials] student colors applied ${JSON.stringify(STUDENT_MATERIAL_COLORS)}`);
  }, [character]);

  useEffect(() => {
    console.info(`[Bunsen:animations] student ${names.join(', ')}`);
  }, [names]);

  useEffect(() => {
    const nextAction = actions[animation] ?? actions[CHARACTER_ANIMATIONS.idle];
    if (!nextAction || (activeAnimation.current === animation && activeAction.current === nextAction)) {
      return;
    }

    const previousAction = activeAction.current;
    previousAction?.fadeOut(0.2);
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
    activeAnimation.current = animation;
    activeAction.current = nextAction;

    if (process.env.NODE_ENV === 'development') {
      console.info(`[Bunsen:student-animation] ${animation}`);
    }
  }, [actions, animation]);

  useEffect(
    () => () => {
      activeAction.current?.stop();
      activeAction.current = null;
      activeAnimation.current = null;
    },
    [],
  );

  useEffect(() => {
    auditFrames.current = 0;
  }, [animation]);

  useFrame(() => {
    if (!grounded.current) {
      if (!actions[CHARACTER_ANIMATIONS.idle]?.isRunning()) return;
      groundingFrames.current += 1;
      if (groundingFrames.current < 2) return;
      grounded.current = groundCharacter(characterRef.current, modelGroup.current, character, 'student');
      return;
    }

    if (auditedAnimations.current.has(animation) || !actions[animation]?.isRunning()) return;
    auditFrames.current += 1;
    if (auditFrames.current < 1) return;
    auditCharacterPose(characterRef.current, character, animation, 'student');
    auditedAnimations.current.add(animation);
  });

  return (
    <group ref={characterRef} dispose={null}>
      <group ref={modelGroup} scale={0.42}>
        <primitive object={character} />
      </group>
    </group>
  );
}

export function auditCharacterPose(
  wrapper: Group | null,
  character: Object3D,
  animation: string,
  label: string,
) {
  if (!wrapper || process.env.NODE_ENV !== 'development') return;
  wrapper.updateWorldMatrix(true, true);
  const floorY = wrapper.getWorldPosition(new Vector3()).y;
  const bounds = getAnimatedCharacterBounds(character);
  console.info(
    `[Bunsen:grounding-audit] ${label} ${animation} floor=${floorY.toFixed(4)} foot=${bounds.min.y.toFixed(4)} delta=${(bounds.min.y - floorY).toFixed(4)}`,
  );
}

export function groundCharacter(
  wrapper: Group | null,
  modelGroup: Group | null,
  character: Object3D,
  label: string,
) {
  if (!wrapper || !modelGroup) return false;

  wrapper.updateWorldMatrix(true, true);
  const bounds = getAnimatedCharacterBounds(character);
  if (bounds.isEmpty()) return false;

  const floorY = wrapper.getWorldPosition(new Vector3()).y;
  const correction = floorY - bounds.min.y;
  modelGroup.position.y += correction;
  wrapper.updateWorldMatrix(true, true);

  if (process.env.NODE_ENV === 'development') {
    const groundedBounds = getAnimatedCharacterBounds(character);
    console.info(
      `[Bunsen:grounding] ${label} floor=${floorY.toFixed(4)} foot=${groundedBounds.min.y.toFixed(4)} top=${groundedBounds.max.y.toFixed(4)} height=${(groundedBounds.max.y - groundedBounds.min.y).toFixed(4)} correction=${correction.toFixed(4)}`,
    );
  }
  return true;
}

function getAnimatedCharacterBounds(character: Object3D) {
  const bounds = new Box3().makeEmpty();
  const vertex = new Vector3();

  character.updateWorldMatrix(true, true);
  character.traverse((object) => {
    if (object instanceof SkinnedMesh) {
      object.skeleton.update();
      const position = object.geometry.attributes.position;
      if (!position) return;
      for (let index = 0; index < position.count; index += 1) {
        vertex.fromBufferAttribute(position, index);
        object.applyBoneTransform(index, vertex);
        vertex.applyMatrix4(object.matrixWorld);
        bounds.expandByPoint(vertex);
      }
      return;
    }

    if (object instanceof Mesh) {
      object.geometry.computeBoundingBox();
      if (object.geometry.boundingBox) {
        bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
      }
    }
  });
  return bounds;
}
