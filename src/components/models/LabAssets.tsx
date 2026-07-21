'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Euler, Vector3Tuple } from 'three';
import { ASSETS } from '@/lib/assets';
import type { PaletteKey } from '@/lib/palette';
import { StyledAsset } from './StyledAsset';
import { OriginalAsset } from './OriginalAsset';

type TransformProps = {
  position?: Vector3Tuple;
  rotation?: Euler | Vector3Tuple;
  scale?: number;
};

const WORKBENCH_COLORS = { 'tableCross(Clone)': 'furniture' } as const;
const TABLE_COLORS = { 'table(Clone)': 'wood' } as const;
const BOOKCASE_COLORS = { 'bookcaseOpen(Clone)': 'wood' } as const;
const CABINET_COLORS = {
  Mesh_bathroomCabinetDrawer: 'furniture',
  Mesh_bathroomCabinetDrawer_1: 'paper',
  Mesh_bathroomCabinetDrawer_2: 'trim',
  Mesh_bathroomCabinetDrawer_3: 'paper',
  Mesh_drawerTop: 'furniture',
  Mesh_drawerTop_1: 'paper',
  Mesh_drawerTop_2: 'trim',
} as const;
const STOOL_COLORS = {
  Mesh_stoolBar: 'wood',
  Mesh_stoolBar_1: 'furniture',
} as const;
const SINK_COLORS = {
  Mesh_bathroomSink: 'paper',
  Mesh_bathroomSink_1: 'trim',
  Mesh_bathroomSink_2: 'furniture',
} as const;
const PLANT_COLORS = {
  Mesh_pottedPlant: 'wood',
  Mesh_pottedPlant_1: 'trim',
  plant: 'furniture',
} as const;
const RUG_COLORS = {
  Mesh_rugRound: 'accent1',
  Mesh_rugRound_1: 'paper',
} as const;
const LAB_EQUIPMENT_COLORS = {
  'Node-Mesh': 'paper',
  'Node-Mesh_1': 'trim',
  'Node-Mesh_2': 'glass',
  'Node-Mesh_3': 'furniture',
  'Node-Mesh_4': 'glass',
  'Node-Mesh_5': 'accent1',
  'Node-Mesh_6': 'accent2',
  'Node-Mesh_7': 'glass',
} as const;
const MICROSCOPE_COLORS = {
  'Node-Mesh': 'paper',
  'Node-Mesh_1': 'furniture',
  'Node-Mesh_2': 'trim',
  'Node-Mesh_3': 'glass',
} as const;
const ARMATURE_COLORS = {
  Object1: 'paper',
  Object2: 'furniture',
  Object3: 'accent1',
  Object4: 'trim',
  Object5: 'paper',
  Object6: 'furniture',
  Object7: 'accent2',
} as const;
const LAVA_LAMP_COLORS = {
  'Node-Mesh': 'trim',
  'Node-Mesh_1': 'accent2',
  'Node-Mesh_2': 'glass',
} as const;
const TEST_TUBE_COLORS = {
  mesh396116694: 'glass',
  mesh396116694_1: 'accent1',
} as const;
const SCIENCE_TUBES_COLORS = {
  group1466635588: 'wood',
  group1888901795: 'paper',
  group463301023: 'wood',
  group1930054553: 'wood',
  mesh1215768112: 'glass',
  mesh1215768112_1: 'accent2',
  mesh458924257: 'glass',
  mesh458924257_1: 'accent1',
  mesh1699342119: 'glass',
  mesh1699342119_1: 'accent2',
  mesh902564457: 'glass',
  mesh902564457_1: 'furniture',
} as const;
const GAUGE_COLORS = {
  group981162523: 'accent1',
  group1747968966: 'accent1',
  group1516217414: 'furniture',
  group234678999: 'trim',
  group273458143: 'accent2',
  group297942839: 'accent2',
  group102177373: 'paper',
  group371240728: 'paper',
  group310643415: 'paper',
} as const;

export function Workbench(props: TransformProps) {
  return <StyledAsset path={ASSETS.workbench} colorMap={WORKBENCH_COLORS} {...props} />;
}

export function LabTable(props: TransformProps) {
  return <StyledAsset path={ASSETS.table} colorMap={TABLE_COLORS} {...props} />;
}

export function Bookcase(props: TransformProps) {
  return <StyledAsset path={ASSETS.bookcase} colorMap={BOOKCASE_COLORS} {...props} />;
}

export function Cabinet(props: TransformProps) {
  return <StyledAsset path={ASSETS.cabinet} colorMap={CABINET_COLORS} {...props} />;
}

export function Stool(props: TransformProps) {
  return <StyledAsset path={ASSETS.stool} colorMap={STOOL_COLORS} {...props} />;
}

export function Sink(props: TransformProps) {
  return <StyledAsset path={ASSETS.sink} colorMap={SINK_COLORS} {...props} />;
}

export function PottedPlant(props: TransformProps) {
  return <StyledAsset path={ASSETS.plant} colorMap={PLANT_COLORS} {...props} />;
}

export function RoundRug(props: TransformProps) {
  return <StyledAsset path={ASSETS.rug} colorMap={RUG_COLORS} {...props} />;
}

export function LabEquipment(props: TransformProps) {
  return <StyledAsset path={ASSETS.labEquipment} colorMap={LAB_EQUIPMENT_COLORS} {...props} />;
}

export function Microscope(props: TransformProps) {
  return <StyledAsset path={ASSETS.microscope} colorMap={MICROSCOPE_COLORS} {...props} />;
}

export function Astronaut(props: TransformProps) {
  return <OriginalAsset path={ASSETS.astronaut} {...props} />;
}

export function Extinguisher(props: TransformProps) {
  return <OriginalAsset path={ASSETS.extinguisher} {...props} />;
}

export function ArmatureDisplay(props: TransformProps) {
  return <StyledAsset path={ASSETS.armature} colorMap={ARMATURE_COLORS} {...props} />;
}

export function LavaLamp(props: TransformProps) {
  return <StyledAsset path={ASSETS.lavaLamp} colorMap={LAVA_LAMP_COLORS} {...props} />;
}

export function TestTube(props: TransformProps) {
  return <StyledAsset path={ASSETS.testTube} colorMap={TEST_TUBE_COLORS} {...props} />;
}

export function ScienceTubes(props: TransformProps) {
  return <StyledAsset path={ASSETS.scienceTubes} colorMap={SCIENCE_TUBES_COLORS} {...props} />;
}

export function Scope(props: TransformProps) {
  return <StyledAsset path={ASSETS.gauge} colorMap={GAUGE_COLORS} {...props} />;
}

type FlaskProps = TransformProps & { liquidColor?: PaletteKey };

export function Flask({ liquidColor = 'glass', ...props }: FlaskProps) {
  const colorMap = useMemo(
    () => ({
      Beaker_Icosphere_1: 'glass' as const,
      Beaker_Icosphere_1_1: 'paper' as const,
      Beaker_Icosphere_1_2: liquidColor,
    }),
    [liquidColor],
  );

  return <StyledAsset path={ASSETS.flask} colorMap={colorMap} {...props} />;
}

Object.values(ASSETS).forEach((path) => useGLTF.preload(path));
