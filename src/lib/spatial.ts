export const WORK_SURFACE_Y = 1.11;
export const SURFACE_GAP = 0.004;

// Measured from the upward-facing triangles in the Kenney source meshes.
export const TABLE_CROSS_SOURCE_HEIGHT = 0.3474;
export const TABLE_SOURCE_HEIGHT = 0.3267;
export const TABLE_CROSS_WORK_SCALE = WORK_SURFACE_Y / TABLE_CROSS_SOURCE_HEIGHT;
export const TABLE_WORK_SCALE = WORK_SURFACE_Y / TABLE_SOURCE_HEIGHT;
export const SINK_SOURCE_RIM_FROM_BOTTOM = 0.51;
export const SINK_WORK_SCALE = WORK_SURFACE_Y / SINK_SOURCE_RIM_FROM_BOTTOM;

export const BOOKCASE_SOURCE = {
  width: 0.4,
  depth: 0.25,
  innerWidth: 0.36,
  shelfDepth: 0.21,
  shelfTops: [0.13, 0.37, 0.61, 0.85],
} as const;

export function shelfTopY(rootY: number, scale: number, row: number) {
  return rootY + BOOKCASE_SOURCE.shelfTops[row] * scale;
}

export function centeredPropY(
  surfaceY: number,
  sourceHeight: number,
  scaleY = 1,
  gap = SURFACE_GAP,
) {
  return surfaceY + sourceHeight * scaleY * 0.5 + gap;
}

export function shelfContainedZ(
  rootZ: number,
  bookcaseScale: number,
  propDepth: number,
  inset = 0.055,
) {
  const frontEdge = rootZ + BOOKCASE_SOURCE.depth * bookcaseScale * 0.5;
  return frontEdge - propDepth * 0.5 - inset;
}

export function shelfX(
  rootX: number,
  bookcaseScale: number,
  normalizedPosition: number,
  propWidth: number,
) {
  const availableHalfWidth = Math.max(
    0,
    BOOKCASE_SOURCE.innerWidth * bookcaseScale * 0.5 - propWidth * 0.5 - 0.025,
  );
  return rootX + normalizedPosition * availableHalfWidth;
}
