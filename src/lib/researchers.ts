import type { AssetKey } from './assets';
import type { NpcPersonaId } from './ai/personas';
import { LAB_ASSISTANT_RADIUS, LAB_ASSISTANT_ROUTE } from './lab-assistant';
import { STATIONS, WORLD_OBSTACLES, type Obstacle, type ZoneId } from './world';

export type ResearcherWorkPoint = {
  position: readonly [x: number, z: number];
  interest: readonly [x: number, z: number];
  gesture?: boolean;
};

export type ResearcherDefinition = {
  id: string;
  name: string;
  personaId: NpcPersonaId;
  model: Extract<AssetKey, 'npcSuit' | 'womanCasual' | 'npcCasual2'>;
  zone: ZoneId;
  skinTone: string;
  scale: number;
  castShadow: boolean;
  points: readonly ResearcherWorkPoint[];
};

export const RESEARCHER_RADIUS = 0.34;
export const RESEARCHER_PLAYER_CLEARANCE = 0.64;
export const RESEARCHER_SPEED = 0.82;

export const RESEARCHERS: readonly ResearcherDefinition[] = [
  {
    id: 'instrument-scope-researcher',
    name: 'Dr. Mira Chen',
    personaId: 'mira-chen',
    model: 'womanCasual',
    zone: 'instrument',
    skinTone: '#c89065',
    scale: 1.12,
    castShadow: true,
    points: [
      { position: [1.05, 9.45], interest: [3.35, 9.3] },
      { position: [1.05, 10.85], interest: [3.35, 9.3] },
    ],
  },
  {
    id: 'instrument-dial-researcher',
    name: 'Dr. Elias Reed',
    personaId: 'elias-reed',
    model: 'npcCasual2',
    zone: 'instrument',
    skinTone: '#8a5a3a',
    scale: 1.1,
    castShadow: false,
    points: [
      { position: [5.7, 9.55], interest: [5.05, 7.38] },
      { position: [5.7, 11.45], interest: [4.25, 13.45], gesture: true },
    ],
  },
  {
    id: 'discovery-astronaut-researcher',
    name: 'Dr. Lena Ortiz',
    personaId: 'lena-ortiz',
    model: 'npcSuit',
    zone: 'discovery',
    skinTone: '#f0d5b8',
    scale: 1.12,
    castShadow: true,
    points: [
      { position: [-14.2, 14.3], interest: [-11.55, 13.2] },
      { position: [-14.2, 17.55], interest: [-13.1, 19.2], gesture: true },
    ],
  },
  {
    id: 'study-south-researcher',
    name: 'Dr. Amara Okafor',
    personaId: 'amara-okafor',
    model: 'womanCasual',
    zone: 'study',
    skinTone: '#8a5a3a',
    scale: 1.11,
    castShadow: false,
    points: [
      { position: [-12.15, 3.0], interest: [-12.15, 4.65] },
      { position: [-11.4, 3.0], interest: [-11.4, 4.65] },
    ],
  },
  {
    id: 'study-north-researcher',
    name: 'Kai Morgan',
    personaId: 'kai-morgan',
    model: 'npcCasual2',
    zone: 'study',
    skinTone: '#c89065',
    scale: 1.09,
    castShadow: false,
    points: [
      { position: [-12.15, 6.15], interest: [-12.15, 4.65] },
      { position: [-11.45, 6.15], interest: [-11.45, 4.65] },
    ],
  },
] as const;

export type ResearcherClearanceIssue = {
  researcher: string;
  reason: 'world' | 'assistant-route' | 'station' | 'researcher';
  detail: string;
};

export function auditResearcherClearance(
  researchers: readonly ResearcherDefinition[] = RESEARCHERS,
  obstacles: readonly Obstacle[] = WORLD_OBSTACLES,
): ResearcherClearanceIssue[] {
  const issues: ResearcherClearanceIssue[] = [];

  researchers.forEach((researcher) => {
    const workerSamples = sampleWorkerRoute(researcher.points);
    workerSamples.forEach(([x, z]) => {
      if (pointBlockedByWorld(x, z, obstacles)) {
        issues.push({ researcher: researcher.id, reason: 'world', detail: `${x.toFixed(2)},${z.toFixed(2)}` });
      }

      STATIONS.forEach((station) => {
        const distance = Math.hypot(x - station.position.x, z - station.position.z);
        if (distance < 1.15 + RESEARCHER_RADIUS) {
          issues.push({ researcher: researcher.id, reason: 'station', detail: station.id });
        }
      });

      for (let routeIndex = 0; routeIndex < LAB_ASSISTANT_ROUTE.length; routeIndex += 1) {
        const from = LAB_ASSISTANT_ROUTE[routeIndex].position;
        const to = LAB_ASSISTANT_ROUTE[(routeIndex + 1) % LAB_ASSISTANT_ROUTE.length].position;
        const distance = pointToSegmentDistance(x, z, from[0], from[1], to[0], to[1]);
        if (distance < RESEARCHER_RADIUS + LAB_ASSISTANT_RADIUS + 0.12) {
          issues.push({
            researcher: researcher.id,
            reason: 'assistant-route',
            detail: `${LAB_ASSISTANT_ROUTE[routeIndex].id}->${LAB_ASSISTANT_ROUTE[(routeIndex + 1) % LAB_ASSISTANT_ROUTE.length].id}`,
          });
          break;
        }
      }
    });
  });

  for (let leftIndex = 0; leftIndex < researchers.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < researchers.length; rightIndex += 1) {
      const left = researchers[leftIndex];
      const right = researchers[rightIndex];
      const leftSamples = sampleWorkerRoute(left.points);
      const rightSamples = sampleWorkerRoute(right.points);
      const overlaps = leftSamples.some(([leftX, leftZ]) =>
        rightSamples.some(([rightX, rightZ]) =>
          Math.hypot(leftX - rightX, leftZ - rightZ) < RESEARCHER_RADIUS * 2 + 0.18,
        ),
      );
      if (overlaps) {
        issues.push({ researcher: left.id, reason: 'researcher', detail: right.id });
      }
    }
  }

  return dedupeIssues(issues);
}

function sampleWorkerRoute(points: readonly ResearcherWorkPoint[]) {
  if (points.length === 1) return [points[0].position];
  const samples: Array<readonly [number, number]> = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const distance = Math.hypot(
      next.position[0] - point.position[0],
      next.position[1] - point.position[1],
    );
    const count = Math.max(1, Math.ceil(distance / 0.12));
    for (let sampleIndex = 0; sampleIndex <= count; sampleIndex += 1) {
      const progress = sampleIndex / count;
      samples.push([
        point.position[0] + (next.position[0] - point.position[0]) * progress,
        point.position[1] + (next.position[1] - point.position[1]) * progress,
      ]);
    }
  });
  return samples;
}

function pointBlockedByWorld(x: number, z: number, obstacles: readonly Obstacle[]) {
  return obstacles.some(
    (obstacle) =>
      x > obstacle.minX - RESEARCHER_RADIUS &&
      x < obstacle.maxX + RESEARCHER_RADIUS &&
      z > obstacle.minZ - RESEARCHER_RADIUS &&
      z < obstacle.maxZ + RESEARCHER_RADIUS,
  );
}

function pointToSegmentDistance(
  x: number,
  z: number,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
) {
  const segmentX = toX - fromX;
  const segmentZ = toZ - fromZ;
  const lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
  if (lengthSquared === 0) return Math.hypot(x - fromX, z - fromZ);
  const progress = Math.max(
    0,
    Math.min(1, ((x - fromX) * segmentX + (z - fromZ) * segmentZ) / lengthSquared),
  );
  return Math.hypot(x - (fromX + segmentX * progress), z - (fromZ + segmentZ * progress));
}

function dedupeIssues(issues: readonly ResearcherClearanceIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.researcher}:${issue.reason}:${issue.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
