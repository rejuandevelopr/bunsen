import assert from 'node:assert/strict';
import test from 'node:test';
import { LAB_ASSISTANT_ROUTE, auditLabAssistantRoute } from '../src/lib/lab-assistant';

test('lab assistant starts in the Greenhouse and patrols every zone in order', () => {
  assert.equal(LAB_ASSISTANT_ROUTE[0].id, 'greenhouse-planters');
  const inspectionZones = LAB_ASSISTANT_ROUTE
    .filter((waypoint) => waypoint.interest)
    .map((waypoint) => waypoint.zone)
    .filter((zone, index, zones) => zone !== zones[index - 1]);
  assert.deepEqual(inspectionZones, ['greenhouse', 'instrument', 'discovery', 'study', 'chemistry']);
});

test('every authored assistant route segment clears registered obstacles', () => {
  assert.deepEqual(auditLabAssistantRoute(), []);
});
