import assert from 'node:assert/strict';
import test from 'node:test';
import { NPC_PERSONAS, NPC_PERSONA_IDS } from '../src/lib/ai/personas';

test('all seven dialogue personas have unique names and static openers', () => {
  const personas = NPC_PERSONA_IDS.map((id) => NPC_PERSONAS[id]);

  assert.equal(personas.length, 7);
  assert.equal(new Set(personas.map((persona) => persona.name)).size, 7);
  personas.forEach((persona) => {
    assert.ok(persona.openers.length >= 1 && persona.openers.length <= 2);
  });
});

test('Quill remains Socratic while the six specialists may answer directly', () => {
  const quill = NPC_PERSONAS['professor-quill'];
  const specialists = NPC_PERSONA_IDS
    .filter((id) => id !== 'professor-quill')
    .map((id) => NPC_PERSONAS[id]);

  assert.equal(quill.socratic, true);
  assert.match(quill.systemPrompt, /Never give the direct answer/i);
  assert.equal(specialists.length, 6);
  specialists.forEach((persona) => {
    assert.equal(persona.socratic, false);
    assert.match(persona.systemPrompt, /MAY give direct answers/);
    assert.match(persona.systemPrompt, /2-4 concise/);
  });
});
