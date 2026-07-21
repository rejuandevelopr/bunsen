import assert from 'node:assert/strict';
import test from 'node:test';
import { RESEARCHERS, auditResearcherClearance } from '../src/lib/researchers';

test('five ambient researchers are assigned across the requested zones', () => {
  assert.equal(RESEARCHERS.length, 5);
  assert.equal(RESEARCHERS.filter((researcher) => researcher.zone === 'instrument').length, 2);
  assert.equal(RESEARCHERS.filter((researcher) => researcher.zone === 'discovery').length, 1);
  assert.equal(RESEARCHERS.filter((researcher) => researcher.zone === 'study').length, 2);
});

test('researcher workstation routes clear furniture, stations, each other, and assistant patrol', () => {
  assert.deepEqual(auditResearcherClearance(), []);
});

test('researcher routes never exceed two local work points', () => {
  RESEARCHERS.forEach((researcher) => {
    assert.ok(researcher.points.length >= 1 && researcher.points.length <= 2);
  });
});
