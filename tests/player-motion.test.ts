import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IDLE_SPEED_THRESHOLD,
  RUN_SPEED_THRESHOLD,
  derivePlayerMotion,
} from '../src/lib/player-motion';

test('player motion derives idle, walk, and run from actual horizontal speed', () => {
  assert.equal(derivePlayerMotion(0), 'idle');
  assert.equal(derivePlayerMotion(IDLE_SPEED_THRESHOLD - 0.001), 'idle');
  assert.equal(derivePlayerMotion(IDLE_SPEED_THRESHOLD), 'walk');
  assert.equal(derivePlayerMotion(1.85), 'walk');
  assert.equal(derivePlayerMotion(RUN_SPEED_THRESHOLD - 0.001), 'walk');
  assert.equal(derivePlayerMotion(RUN_SPEED_THRESHOLD), 'run');
  assert.equal(derivePlayerMotion(3.15), 'run');
});
