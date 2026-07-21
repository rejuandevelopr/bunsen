import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOOKCASE_SOURCE,
  SINK_SOURCE_RIM_FROM_BOTTOM,
  SINK_WORK_SCALE,
  TABLE_CROSS_SOURCE_HEIGHT,
  TABLE_CROSS_WORK_SCALE,
  TABLE_SOURCE_HEIGHT,
  TABLE_WORK_SCALE,
  WORK_SURFACE_Y,
  shelfTopY,
} from '../src/lib/spatial';

test('all normalized work surfaces resolve to the study-table height', () => {
  assert.ok(Math.abs(TABLE_CROSS_SOURCE_HEIGHT * TABLE_CROSS_WORK_SCALE - WORK_SURFACE_Y) < 1e-10);
  assert.ok(Math.abs(TABLE_SOURCE_HEIGHT * TABLE_WORK_SCALE - WORK_SURFACE_Y) < 1e-10);
  assert.ok(Math.abs(SINK_SOURCE_RIM_FROM_BOTTOM * SINK_WORK_SCALE - WORK_SURFACE_Y) < 1e-10);
});

test('bookcase rows use the measured upward-facing shelf planes', () => {
  const scale = 3.9;
  assert.deepEqual(
    BOOKCASE_SOURCE.shelfTops.map((_, row) => Number(shelfTopY(0, scale, row).toFixed(3))),
    [0.507, 1.443, 2.379, 3.315],
  );
});
