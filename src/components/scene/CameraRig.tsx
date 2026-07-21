'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera as ThreePerspectiveCamera,
  Raycaster,
  Vector3,
} from 'three';
import { useLabStore } from '@/store/lab-store';

type CameraRigProps = {
  playerRef: MutableRefObject<Group | null>;
  headingRef: MutableRefObject<Vector3>;
};

type FadeState = {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

const TACTICAL_POSITION = new Vector3(25, 30, 42);
const TACTICAL_TARGET = new Vector3(0, 0, 6.55);
const CINEMATIC_TARGET = new Vector3(0, 0.4, 6.55);
const FALLBACK_PLAYER_POSITION = new Vector3(0, 0, 5.4);
const STATION_PANEL_COMPOSITION_OFFSET = 0.92;
const WORLD_UP = new Vector3(0, 1, 0);

function damping(strength: number, delta: number) {
  return 1 - Math.exp(-strength * delta);
}

export function CameraRig({ playerRef, headingRef }: CameraRigProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const lookTarget = useRef(new Vector3(0, 0, 0));
  const zoomDistance = useRef(4.8);
  const raycaster = useRef(new Raycaster());
  const fadedMaterials = useRef(new Map<MeshStandardMaterial, FadeState>());
  const previousPhase = useRef(useLabStore.getState().gamePhase);
  const introStart = useRef(0);
  const introFromPosition = useRef(new Vector3(26, 15, 25));
  const introFromTarget = useRef(new Vector3(0, 0, 0));
  const introCompleted = useRef(false);
  const previousStationId = useRef<string | null>(null);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const { gamePhase, viewMode } = useLabStore.getState();
      if (gamePhase !== 'playing' || viewMode !== 'thirdPerson' || useLabStore.getState().isPaused) return;
      zoomDistance.current = MathUtils.clamp(zoomDistance.current + event.deltaY * 0.004, 3, 8);
    };

    const handleViewToggle = (event: KeyboardEvent) => {
      if (event.code !== 'KeyV' || event.repeat) return;
      if (useLabStore.getState().gamePhase === 'playing' && !useLabStore.getState().isPaused) {
        useLabStore.getState().toggleTacticalView();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleViewToggle);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleViewToggle);
    };
  }, []);

  useFrame(({ clock, scene }, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const { activeStation, gamePhase, viewMode, completeIntro } = useLabStore.getState();
    if (!activeStation) previousStationId.current = null;
    const playerPosition = playerRef.current
      ? playerRef.current.getWorldPosition(new Vector3())
      : FALLBACK_PLAYER_POSITION.clone();
    const playerHeading = headingRef.current.clone().normalize();
    const followTarget = playerPosition
      .clone()
      .add(new Vector3(0, 1.35, 0))
      .addScaledVector(playerHeading, 1.4);
    const followPosition = playerPosition
      .clone()
      .addScaledVector(playerHeading, -zoomDistance.current)
      .add(new Vector3(0, 2.5, 0));

    if (previousPhase.current !== gamePhase) {
      if (gamePhase === 'intro') {
        introStart.current = clock.getElapsedTime();
        introFromPosition.current.copy(camera.position);
        introFromTarget.current.copy(lookTarget.current);
        introCompleted.current = false;
      }
      previousPhase.current = gamePhase;
    }

    if (gamePhase === 'title') {
      const time = clock.getElapsedTime();
      const angle = 0.72 + time * 0.055;
      const cinematicPosition = new Vector3(
        Math.cos(angle) * 34,
        17 + Math.sin(time * 0.18) * 0.65,
        6.55 + Math.sin(angle) * 34,
      );
      camera.position.lerp(cinematicPosition, damping(1.6, delta));
      lookTarget.current.lerp(CINEMATIC_TARGET, damping(2.1, delta));
      camera.fov = MathUtils.damp(camera.fov, 35, 2.4, delta);
      restoreFadedMaterials(fadedMaterials.current);
    } else if (gamePhase === 'intro') {
      const progress = MathUtils.clamp((clock.getElapsedTime() - introStart.current) / 2.5, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(introFromPosition.current, followPosition, eased);
      lookTarget.current.lerpVectors(introFromTarget.current, followTarget, eased);
      camera.fov = MathUtils.lerp(35, 42, eased);
      restoreFadedMaterials(fadedMaterials.current);

      if (progress >= 1 && !introCompleted.current) {
        introCompleted.current = true;
        completeIntro();
      }
    } else if (activeStation) {
      const stationTarget = new Vector3(
        activeStation.cameraTarget.x,
        activeStation.cameraTarget.y,
        activeStation.cameraTarget.z,
      );
      const approachDirection = playerPosition.clone().sub(stationTarget);
      approachDirection.y = 0;
      if (approachDirection.lengthSq() < 0.16) {
        approachDirection.copy(playerHeading).multiplyScalar(-1);
      } else {
        approachDirection.normalize();
      }
      const stationCameraPosition = stationTarget
        .clone()
        .addScaledVector(approachDirection, 3.8)
        .add(new Vector3(0, 2.3, 0));
      const viewDirection = stationTarget.clone().sub(stationCameraPosition).normalize();
      const cameraRight = new Vector3().crossVectors(viewDirection, WORLD_UP).normalize();
      const compositionTarget = stationTarget
        .clone()
        .addScaledVector(cameraRight, STATION_PANEL_COMPOSITION_OFFSET);
      if (previousStationId.current !== activeStation.id) {
        previousStationId.current = activeStation.id;
        if (process.env.NODE_ENV === 'development') {
          console.info(
            `[Bunsen:station-camera] ${activeStation.id} target=${stationTarget.toArray().map((value) => value.toFixed(2)).join(',')} composition=${compositionTarget.toArray().map((value) => value.toFixed(2)).join(',')} panelOffset=${STATION_PANEL_COMPOSITION_OFFSET.toFixed(2)}`,
          );
        }
      }
      camera.position.lerp(stationCameraPosition, damping(4.5, delta));
      lookTarget.current.lerp(compositionTarget, damping(6.5, delta));
      camera.fov = MathUtils.damp(camera.fov, 38, 4, delta);
      restoreFadedMaterials(fadedMaterials.current);
    } else if (viewMode === 'tactical') {
      camera.position.lerp(TACTICAL_POSITION, damping(3.2, delta));
      lookTarget.current.lerp(TACTICAL_TARGET, damping(4, delta));
      camera.fov = MathUtils.damp(camera.fov, 32, 3.5, delta);
      restoreFadedMaterials(fadedMaterials.current);
    } else {
      camera.position.lerp(followPosition, damping(4.2, delta));
      lookTarget.current.lerp(followTarget, damping(6, delta));
      camera.fov = MathUtils.damp(camera.fov, 42, 4, delta);
      updateFurnitureFade(
        scene,
        camera,
        playerPosition.clone().add(new Vector3(0, 1.1, 0)),
        raycaster.current,
        fadedMaterials.current,
      );
    }

    camera.lookAt(lookTarget.current);
    camera.updateProjectionMatrix();
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={35}
      near={0.1}
      far={100}
      position={[26, 15, 25]}
    />
  );
}

function findFadeRoot(object: Object3D) {
  let current: Object3D | null = object;
  while (current && !current.userData.cameraFadeRoot) current = current.parent;
  return current;
}

function updateFurnitureFade(
  scene: Object3D,
  camera: ThreePerspectiveCamera,
  origin: Vector3,
  raycaster: Raycaster,
  previous: Map<MeshStandardMaterial, FadeState>,
) {
  const direction = camera.position.clone().sub(origin);
  const cameraDistance = direction.length();
  raycaster.set(origin, direction.normalize());
  raycaster.far = cameraDistance;

  const roots = new Set<Object3D>();
  for (const hit of raycaster.intersectObjects(scene.children, true)) {
    if (hit.distance >= cameraDistance - 0.15) continue;
    const root = findFadeRoot(hit.object);
    if (root) roots.add(root);
  }

  const active = new Set<MeshStandardMaterial>();
  roots.forEach((root) => {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshStandardMaterial)) return;
        active.add(material);
        if (!previous.has(material)) {
          previous.set(material, {
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite,
          });
          material.transparent = true;
          material.depthWrite = false;
          material.needsUpdate = true;
        }
        material.opacity = 0.3;
      });
    });
  });

  previous.forEach((state, material) => {
    if (active.has(material)) return;
    material.opacity = state.opacity;
    material.transparent = state.transparent;
    material.depthWrite = state.depthWrite;
    material.needsUpdate = true;
    previous.delete(material);
  });
}

function restoreFadedMaterials(materials: Map<MeshStandardMaterial, FadeState>) {
  materials.forEach((state, material) => {
    material.opacity = state.opacity;
    material.transparent = state.transparent;
    material.depthWrite = state.depthWrite;
    material.needsUpdate = true;
  });
  materials.clear();
}
