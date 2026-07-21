export const FLOOR_Y = 0;

export type ZoneId = 'study' | 'chemistry' | 'greenhouse' | 'instrument' | 'discovery';

export const WORLD_BOUNDS = {
  minX: -15.25,
  maxX: 15.25,
  minZ: -7.15,
  maxZ: 20.55,
} as const;

export const ZONES = {
  study: {
    id: 'study',
    name: 'Study Hall',
    minX: -15.25,
    maxX: -5.15,
    minZ: -7.15,
    maxZ: 7.15,
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry Lab',
    minX: -5.15,
    maxX: 5.15,
    minZ: -7.15,
    maxZ: 7.15,
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse Corner',
    minX: 5.15,
    maxX: 15.25,
    minZ: -7.15,
    maxZ: 7.15,
  },
  discovery: {
    id: 'discovery',
    name: 'Discovery Room',
    minX: -15.25,
    maxX: -5.15,
    minZ: 7.15,
    maxZ: 20.55,
  },
  instrument: {
    id: 'instrument',
    name: 'Instrument Hall',
    minX: -5.15,
    maxX: 15.25,
    minZ: 7.15,
    maxZ: 20.55,
  },
} as const;

export type StationId =
  | 'titration'
  | 'research'
  | 'plant'
  | 'experiment'
  | 'instrument'
  | 'discovery'
  | 'notes-instruments'
  | 'notes-optics'
  | 'notes-method'
  | 'notes-plants';

export const PROFESSOR_POSITION = { x: 3.72, z: -1.15 } as const;

export const STATIONS = [
  {
    id: 'titration',
    number: 1,
    name: 'Titration Station',
    zone: 'chemistry',
    position: { x: 0.7, z: 2.9 },
    cameraTarget: { x: 0.45, y: 1.0, z: 0.75 },
    description: 'Investigate acids, bases, indicators, and neutralization.',
  },
  {
    id: 'research',
    number: 2,
    name: 'Research Desk',
    zone: 'study',
    position: { x: -7.8, z: 1.1 },
    cameraTarget: { x: -10.45, y: 1.0, z: 1.0 },
    description: 'Review notes, diagrams, and evidence before an experiment.',
  },
  {
    id: 'plant',
    number: 3,
    name: 'Plant Station',
    zone: 'greenhouse',
    position: { x: 7.7, z: 0.7 },
    cameraTarget: { x: 10.25, y: 1.0, z: 0.5 },
    description: 'Explore plant growth, water cycles, and photosynthesis.',
  },
  {
    id: 'experiment',
    number: 4,
    name: 'Experiment Bench',
    zone: 'chemistry',
    position: { x: 3.55, z: 2.95 },
    cameraTarget: { x: 1.5, y: 1.0, z: 0.85 },
    description: 'Run a flexible investigation designed from your own science question.',
  },
  {
    id: 'instrument',
    number: 5,
    name: 'Instrument Bench',
    zone: 'instrument',
    position: { x: 4.25, z: 15.45 },
    cameraTarget: { x: 4.25, y: 1.05, z: 13.45 },
    description: 'Read flame colors and compare the signatures of excited metal ions.',
  },
  {
    id: 'discovery',
    number: 6,
    name: 'Discovery Exhibit',
    zone: 'discovery',
    position: { x: -10.25, z: 15.55 },
    cameraTarget: { x: -12.15, y: 1.1, z: 14.45 },
    description: 'Predict how motion changes when gravity is weaker on the Moon.',
  },
  {
    id: 'notes-instruments',
    number: 7,
    name: 'Instruments Field Notes',
    zone: 'instrument',
    position: { x: -0.75, z: 7.9 },
    cameraTarget: { x: -2.7, y: 1.05, z: 9.25 },
    description: 'Read how units, calibration, precision, and uncertainty make measurements trustworthy.',
    materialId: 'instruments',
  },
  {
    id: 'notes-optics',
    number: 8,
    name: 'Optics Field Notes',
    zone: 'instrument',
    position: { x: -0.35, z: 19.15 },
    cameraTarget: { x: -2.7, y: 1.05, z: 19.15 },
    description: 'Explore how telescopes gather light, form images, and reveal faint detail.',
    materialId: 'optics',
  },
  {
    id: 'notes-method',
    number: 9,
    name: 'Scientific Method Field Notes',
    zone: 'study',
    position: { x: -7.45, z: 4.65 },
    cameraTarget: { x: -10.45, y: 1.05, z: 4.65 },
    description: 'Connect questions, variables, observations, and conclusions into a repeatable investigation.',
    materialId: 'scientific-method',
  },
  {
    id: 'notes-plants',
    number: 10,
    name: 'Plant Science Field Notes',
    zone: 'greenhouse',
    position: { x: 10.25, z: 2.9 },
    cameraTarget: { x: 10.25, y: 1.05, z: 0.5 },
    description: 'Learn how plants balance light, water, gases, pigments, and directional growth.',
    materialId: 'plant-science',
  },
] as const;

export type WorldStation = (typeof STATIONS)[number];

export type Obstacle = { minX: number; maxX: number; minZ: number; maxZ: number };

export const WORLD_LIMITS = { minX: -15.15, maxX: 15.15, minZ: -7.05, maxZ: 20.45 };

export const WORLD_OBSTACLES: Obstacle[] = [
  // Chemistry lab benches and back-wall furniture.
  { minX: -2.35, maxX: 2.85, minZ: -0.55, maxZ: 2.05 },
  { minX: 1.8, maxX: 4.9, minZ: -6.45, maxZ: -4.35 },
  { minX: -4.75, maxX: -2.5, minZ: -6.55, maxZ: -4.55 },
  { minX: -1.55, maxX: 1.35, minZ: -6.55, maxZ: -5.25 },

  // Study hall tables, reading bookcases, and globe corner.
  { minX: -12.8, maxX: -8.15, minZ: -0.25, maxZ: 2.25 },
  { minX: -12.8, maxX: -8.15, minZ: 3.65, maxZ: 5.6 },
  { minX: -14.75, maxX: -12.55, minZ: -6.6, maxZ: -4.55 },
  { minX: -10.1, maxX: -7.7, minZ: -6.6, maxZ: -5.2 },

  // Greenhouse benches, planters, and water basin.
  { minX: 8.0, maxX: 12.5, minZ: -0.7, maxZ: 1.75 },
  { minX: 12.8, maxX: 14.8, minZ: -5.9, maxZ: 4.9 },
  { minX: 6.0, maxX: 7.45, minZ: -6.45, maxZ: -3.25 },
  { minX: 7.2, maxX: 9.3, minZ: 4.65, maxZ: 6.35 },

  // Shared-wall segments; openings remain clear from z -2.0 to 2.85.
  { minX: -5.35, maxX: -4.95, minZ: -7.25, maxZ: -2.0 },
  { minX: -5.35, maxX: -4.95, minZ: 2.85, maxZ: 7.25 },
  { minX: 4.95, maxX: 5.35, minZ: -7.25, maxZ: -2.0 },
  { minX: 4.95, maxX: 5.35, minZ: 2.85, maxZ: 7.25 },

  // Shared south wall: three broad archways connect the original rooms to the expansion.
  { minX: -16.15, maxX: -12.45, minZ: 6.95, maxZ: 7.35 },
  { minX: -8.25, maxX: -2.05, minZ: 6.95, maxZ: 7.35 },
  { minX: 2.05, maxX: 8.15, minZ: 6.95, maxZ: 7.35 },
  { minX: 12.35, maxX: 16.15, minZ: 6.95, maxZ: 7.35 },

  // Discovery / Instrument partition; the center archway remains open.
  { minX: -5.35, maxX: -4.95, minZ: 7.15, maxZ: 12.05 },
  { minX: -5.35, maxX: -4.95, minZ: 16.15, maxZ: 20.65 },

  // Instrument Hall showcases and perimeter benches.
  { minX: 1.6, maxX: 6.9, minZ: 12.25, maxZ: 14.65 },
  { minX: 12.7, maxX: 14.95, minZ: 9.0, maxZ: 17.55 },
  { minX: -4.75, maxX: -1.15, minZ: 18.15, maxZ: 20.25 },
  { minX: 9.9, maxX: 12.55, minZ: 11.05, maxZ: 13.65 },
  { minX: -4.45, maxX: -1.0, minZ: 8.25, maxZ: 10.35 },
  // Grounded floor scopes.
  { minX: 2.4, maxX: 4.3, minZ: 8.5, maxZ: 10.1 },
  { minX: 10.5, maxX: 12.1, minZ: 16.15, maxZ: 18.05 },

  // Discovery Room exhibits and writing desk.
  { minX: -13.15, maxX: -10.0, minZ: 11.8, maxZ: 14.95 },
  { minX: -8.4, maxX: -6.0, minZ: 11.8, maxZ: 14.95 },
  { minX: -13.75, maxX: -10.75, minZ: 14.9, maxZ: 16.2 },
  { minX: -14.75, maxX: -9.1, minZ: 18.25, maxZ: 20.3 },
  { minX: -14.95, maxX: -13.05, minZ: 9.65, maxZ: 11.25 },
];

export function zoneForPosition(x: number, z = 0): ZoneId {
  if (z > 7.15) return x < -5.15 ? 'discovery' : 'instrument';
  if (x < -5.15) return 'study';
  if (x > 5.15) return 'greenhouse';
  return 'chemistry';
}
