export const ASSETS = {
  flask: '/models/Erlenmeyer flask by Poly by Google - eqlGxcsBe1V.glb',
  labEquipment: '/models/Lab Equipment by matt bower - fSWYfMERNak.glb',
  microscope: '/models/Microscope by Colonel Cthulu - 05VXLT8kN4k.glb',
  professor: '/models/professor.glb',
  student: '/models/student.glb',
  npcSuit: '/models/npc-suit.glb',
  womanCasual: '/models/woman-casual.glb',
  npcCasual2: '/models/npc-casual2.glb',
  workbench: '/models/furniture/tableCross.glb',
  table: '/models/furniture/table.glb',
  bookcase: '/models/furniture/bookcaseOpen.glb',
  cabinet: '/models/furniture/bathroomCabinetDrawer.glb',
  stool: '/models/furniture/stoolBar.glb',
  sink: '/models/furniture/bathroomSink.glb',
  plant: '/models/furniture/pottedPlant.glb',
  rug: '/models/furniture/rugRound.glb',
  astronaut: '/models/Astronaut by Poly by Google - dLHpzNdygsg.glb',
  armature: '/models/armature by Jeremy Eyring - 9tUn_T_nMK5.glb',
  lavaLamp: '/models/Lava Lamp by Jarlan Perez - 2ey-GJxzXQN.glb',
  testTube: '/models/Test tube, blue Liquid by Jakob Hippe - 1F33UFXOEau.glb',
  scienceTubes: '/models/Science Tubes by Ryan Donaldson - 6TUXVb_x88c.glb',
  extinguisher: '/models/extinguisher.glb',
  gauge: '/models/gauge.glb',
} as const;

export type AssetKey = keyof typeof ASSETS;
export type AssetPath = (typeof ASSETS)[AssetKey];
