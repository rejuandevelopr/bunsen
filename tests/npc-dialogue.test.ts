import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  isUnsafeNpcClip,
  resolveDialogueIdleClip,
} from '../src/components/models/npcAnimation';

test('dialogue mapping prefers the stable idle clip over the pose-changing standing clip', () => {
  const names = [
    'HumanArmature|Man_Sitting',
    'HumanArmature|Man_Standing_UpperBody',
    'HumanArmature|Man_Idle',
    'HumanArmature|Man_Standing',
  ];
  assert.equal(resolveDialogueIdleClip(names), 'HumanArmature|Man_Idle');
  assert.equal(
    resolveDialogueIdleClip(['HumanArmature|Man_Sitting', 'HumanArmature|Man_Idle']),
    'HumanArmature|Man_Idle',
  );
  assert.equal(isUnsafeNpcClip('HumanArmature|Man_Sitting'), true);
  assert.equal(isUnsafeNpcClip('HumanArmature|Man_Standing_UpperBody'), true);
});

test('Quill and researchers share the guarded animation and facing controllers', () => {
  const root = process.cwd();
  const characters = readFileSync(join(root, 'src/components/models/Characters.tsx'), 'utf8');
  const researcherModel = readFileSync(join(root, 'src/components/models/ResearcherModel.tsx'), 'utf8');
  const researchers = readFileSync(join(root, 'src/components/scene/AmbientResearchers.tsx'), 'utf8');
  const chemistry = readFileSync(join(root, 'src/components/scene/ChemistryZone.tsx'), 'utf8');

  assert.match(characters, /useGuardedNpcAnimation\(/);
  assert.match(researcherModel, /useGuardedNpcAnimation\(/);
  assert.match(characters, /useNpcDialogueFacing\(/);
  assert.match(researchers, /useNpcDialogueFacing\(/);
  assert.doesNotMatch(chemistry, /tutorState|CHARACTER_ANIMATIONS\.talking/);
  assert.doesNotMatch(characters, /Bunsen:professor-facing/);
  assert.doesNotMatch(characters, /Man_Wave|waveFallback|specialMotion/);
  assert.doesNotMatch(chemistry, /gamePhase === 'intro'|'wave'/);
});

test('the titration success event retains Quill’s clapping celebration', () => {
  const chemistry = readFileSync(
    join(process.cwd(), 'src/components/scene/ChemistryZone.tsx'),
    'utf8',
  );
  assert.match(chemistry, /experiment\.id !== 'acid-base-titration'/);
  assert.match(chemistry, /outcome\.type !== 'success'/);
  assert.match(chemistry, /celebrateSuccess=\{celebrating\}/);
  assert.match(
    readFileSync(join(process.cwd(), 'src/components/models/Characters.tsx'), 'utf8'),
    /celebrateSuccess \? clapClip : idleClip/,
  );
});
