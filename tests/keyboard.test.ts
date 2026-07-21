import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { isTextEntryTarget } from '../src/lib/keyboard';

test('text-entry targets are recognized without browser globals', () => {
  assert.equal(isTextEntryTarget({ nodeName: 'INPUT' } as unknown as EventTarget), true);
  assert.equal(isTextEntryTarget({ nodeName: 'textarea' } as unknown as EventTarget), true);
  assert.equal(isTextEntryTarget({ nodeName: 'SELECT' } as unknown as EventTarget), true);
  assert.equal(isTextEntryTarget({ nodeName: 'DIV', isContentEditable: true } as unknown as EventTarget), true);
  assert.equal(isTextEntryTarget({ nodeName: 'CANVAS' } as unknown as EventTarget), false);
  assert.equal(isTextEntryTarget(null), false);
});

test('tactical view is gated to normal exploration', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/components/scene/CameraRig.tsx'),
    'utf8',
  );
  assert.match(source, /isTextEntryTarget\(event\.target\)/);
  assert.match(source, /useTutorStore\.getState\(\)\.isOpen/);
  assert.match(source, /lab\.activeStation/);
  assert.match(source, /lab\.gamePhase !== 'playing'/);
  assert.match(source, /lab\.toggleTacticalView\(\)/);
});
