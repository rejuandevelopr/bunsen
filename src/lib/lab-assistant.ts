import { WORLD_OBSTACLES, zoneForPosition, type Obstacle, type ZoneId } from './world';

export type LabAssistantWaypoint = {
  id: string;
  position: readonly [x: number, z: number];
  interest?: readonly [x: number, z: number];
  zone: ZoneId;
};

export const LAB_ASSISTANT_RADIUS = 0.32;
export const LAB_ASSISTANT_SPEED = 1.35;

// Navigation-only points omit `interest`; points of interest dwell for 4–8 seconds.
export const LAB_ASSISTANT_ROUTE: readonly LabAssistantWaypoint[] = [
  { id: 'greenhouse-planters', position: [12.1, 3.1], interest: [13.85, 2.45], zone: 'greenhouse' },
  { id: 'greenhouse-basin', position: [9.75, 4.0], interest: [8.25, 5.45], zone: 'greenhouse' },
  { id: 'greenhouse-south-arch', position: [10.25, 6.45], zone: 'greenhouse' },
  { id: 'instrument-north-arch', position: [10.25, 7.85], zone: 'instrument' },
  { id: 'instrument-east-aisle', position: [7.55, 10.35], zone: 'instrument' },
  { id: 'instrument-burner', position: [7.55, 13.45], interest: [4.25, 13.45], zone: 'instrument' },
  { id: 'instrument-burner-clearance', position: [7.55, 15.4], zone: 'instrument' },
  { id: 'instrument-scope', position: [8.6, 16.75], interest: [11.3, 17.1], zone: 'instrument' },
  { id: 'instrument-west-aisle', position: [0.2, 16.75], zone: 'instrument' },
  { id: 'instrument-discovery-arch', position: [-4.55, 14.2], zone: 'instrument' },
  { id: 'discovery-instrument-arch', position: [-5.62, 14.2], zone: 'discovery' },
  { id: 'discovery-arch-clearance', position: [-5.62, 15.65], zone: 'discovery' },
  { id: 'discovery-south-aisle', position: [-9.0, 16.65], zone: 'discovery' },
  { id: 'discovery-astronaut', position: [-9.3, 17.0], interest: [-11.55, 13.2], zone: 'discovery' },
  { id: 'discovery-desk', position: [-11.9, 17.65], interest: [-11.9, 19.2], zone: 'discovery' },
  { id: 'discovery-desk-clearance', position: [-9.3, 17.0], zone: 'discovery' },
  { id: 'discovery-exhibit-corridor', position: [-9.4, 11.15], zone: 'discovery' },
  { id: 'discovery-study-arch', position: [-10.35, 7.8], zone: 'discovery' },
  { id: 'study-south-arch', position: [-10.35, 6.45], zone: 'study' },
  { id: 'study-table-bypass', position: [-7.25, 6.25], zone: 'study' },
  { id: 'study-south-entry', position: [-7.0, -3.0], zone: 'study' },
  { id: 'study-chalkboard-approach', position: [-13.3, -3.0], zone: 'study' },
  { id: 'study-chalkboard', position: [-14.2, 1.0], interest: [-15.82, 0.55], zone: 'study' },
  { id: 'study-bookcase-approach', position: [-13.0, -3.6], zone: 'study' },
  { id: 'study-bookcase', position: [-13.0, -4.0], interest: [-13.7, -5.7], zone: 'study' },
  { id: 'study-south-aisle', position: [-7.0, -3.0], zone: 'study' },
  { id: 'study-return-arch', position: [-5.75, 1.6], zone: 'study' },
  { id: 'chemistry-return-west', position: [-3.8, 2.45], zone: 'chemistry' },
  { id: 'chemistry-shelf', position: [-3.45, -3.65], interest: [-3.55, -5.72], zone: 'chemistry' },
  { id: 'chemistry-west-aisle', position: [-3.85, 1.6], zone: 'chemistry' },
  { id: 'chemistry-stool-clearance-west', position: [-3.0, 3.2], zone: 'chemistry' },
  { id: 'chemistry-stool-clearance-center', position: [0.0, 3.4], zone: 'chemistry' },
  { id: 'chemistry-workbench', position: [3.65, 3.6], interest: [0.45, 0.75], zone: 'chemistry' },
  { id: 'greenhouse-arch-east', position: [4.55, 2.5], zone: 'chemistry' },
  { id: 'greenhouse-arch', position: [5.75, 2.5], zone: 'greenhouse' },
] as const;

export type PatrolRouteIssue = {
  from: string;
  to: string;
  sample: readonly [x: number, z: number];
};

export function auditLabAssistantRoute(
  route: readonly LabAssistantWaypoint[] = LAB_ASSISTANT_ROUTE,
  obstacles: readonly Obstacle[] = WORLD_OBSTACLES,
): PatrolRouteIssue[] {
  const issues: PatrolRouteIssue[] = [];
  for (let index = 0; index < route.length; index += 1) {
    const from = route[index];
    const to = route[(index + 1) % route.length];
    const distance = Math.hypot(
      to.position[0] - from.position[0],
      to.position[1] - from.position[1],
    );
    const sampleCount = Math.max(1, Math.ceil(distance / 0.08));
    for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
      const progress = sampleIndex / sampleCount;
      const x = from.position[0] + (to.position[0] - from.position[0]) * progress;
      const z = from.position[1] + (to.position[1] - from.position[1]) * progress;
      if (isPatrolPointBlocked(x, z, obstacles)) {
        issues.push({ from: from.id, to: to.id, sample: [x, z] });
        break;
      }
    }
  }
  return issues;
}

export function isPatrolPointBlocked(
  x: number,
  z: number,
  obstacles: readonly Obstacle[] = WORLD_OBSTACLES,
) {
  return obstacles.some(
    (obstacle) =>
      x > obstacle.minX - LAB_ASSISTANT_RADIUS &&
      x < obstacle.maxX + LAB_ASSISTANT_RADIUS &&
      z > obstacle.minZ - LAB_ASSISTANT_RADIUS &&
      z < obstacle.maxZ + LAB_ASSISTANT_RADIUS,
  );
}

export function routeZoneAt(x: number, z = 0) {
  return zoneForPosition(x, z);
}
