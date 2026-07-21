import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_QUEST_ID, QUESTS } from '../src/lib/quests';
import { advanceQuest, matchesQuestTrigger, type QuestProgress } from '../src/lib/quests/runner';
import type { QuestEvent } from '../src/lib/quests/schema';
import { ACHIEVEMENTS } from '../src/lib/quests/achievements';
import { LEARNING_MATERIAL_IDS } from '../src/lib/quests/materials';
import { STATIONS } from '../src/lib/world';

test('the five authored chapters form one valid ordered chain', () => {
  assert.equal(QUESTS.length, 5);
  assert.equal(FIRST_QUEST_ID, 'welcome-to-bunsen');
  QUESTS.slice(0, -1).forEach((quest, index) => {
    assert.deepEqual(quest.unlocks, [QUESTS[index + 1].id]);
  });
  assert.deepEqual(QUESTS.at(-1)?.unlocks, []);
});

test('Chapter 1 advances only through its four ordered gameplay events', () => {
  let progress: QuestProgress = {
    activeQuestId: FIRST_QUEST_ID,
    currentSubTaskIndex: 0,
    completedQuestIds: [],
  };
  const events: QuestEvent[] = [
    { type: 'talked-to-npc', npcId: 'professor-quill', interaction: 'opened' },
    { type: 'station-opened', stationId: 'titration' },
    { type: 'experiment-outcome', experimentId: 'acid-base-titration', outcomeType: 'success' },
    { type: 'talked-to-npc', npcId: 'professor-quill', interaction: 'question' },
  ];

  events.forEach((event) => {
    const result = advanceQuest(progress, event);
    assert.equal(result.advanced, true);
    progress = result;
  });
  assert.equal(progress.activeQuestId, 'measure-of-things');
  assert.deepEqual(progress.completedQuestIds, ['welcome-to-bunsen']);
});

test('out-of-order events and the wrong experiment outcome do not advance', () => {
  const progress: QuestProgress = {
    activeQuestId: FIRST_QUEST_ID,
    currentSubTaskIndex: 0,
    completedQuestIds: [],
  };
  assert.equal(advanceQuest(progress, { type: 'station-opened', stationId: 'titration' }).advanced, false);
  const trigger = QUESTS[0].subTasks[2].trigger;
  assert.equal(matchesQuestTrigger(trigger, {
    type: 'experiment-outcome',
    experimentId: 'acid-base-titration',
    outcomeType: 'failure',
  }), false);
});

test('the finale accepts a completed generated experiment through the generated alias', () => {
  const trigger = QUESTS[4].subTasks[2].trigger;
  assert.equal(matchesQuestTrigger(trigger, {
    type: 'experiment-outcome',
    experimentId: 'ice-density-investigation',
    outcomeType: 'success',
    generated: true,
  }), true);
});

test('later chapter triggers progress through every zone to the finale', () => {
  let progress: QuestProgress = {
    activeQuestId: 'measure-of-things',
    currentSubTaskIndex: 0,
    completedQuestIds: ['welcome-to-bunsen'],
  };
  const laterEvents: QuestEvent[] = [
    { type: 'reached-zone', zoneId: 'instrument' },
    { type: 'talked-to-npc', npcId: 'elias-reed', interaction: 'opened' },
    { type: 'read-material', materialId: 'instruments' },
    { type: 'experiment-outcome', experimentId: 'instrument-flame-test', outcomeType: 'success' },
    { type: 'talked-to-npc', npcId: 'mira-chen', interaction: 'opened' },
    { type: 'read-material', materialId: 'optics' },
    { type: 'reached-zone', zoneId: 'discovery' },
    { type: 'talked-to-npc', npcId: 'lena-ortiz', interaction: 'opened' },
    { type: 'experiment-outcome', experimentId: 'moon-gravity-bounce', outcomeType: 'success' },
    { type: 'talked-to-npc', npcId: 'amara-okafor', interaction: 'opened' },
    { type: 'talked-to-npc', npcId: 'kai-morgan', interaction: 'opened' },
    { type: 'read-material', materialId: 'scientific-method' },
    { type: 'station-opened', stationId: 'research' },
    { type: 'experiment-generated', experimentId: 'generated-test' },
    { type: 'experiment-outcome', experimentId: 'generated-test', outcomeType: 'success', generated: true },
  ];

  laterEvents.forEach((event) => {
    const result = advanceQuest(progress, event);
    assert.equal(result.advanced, true, `Expected ${JSON.stringify(event)} to advance`);
    progress = result;
  });
  assert.equal(progress.activeQuestId, null);
  assert.equal(progress.completedQuestIds.length, 5);
});

test('four Field Notes stations and all seven achievements are authored', () => {
  const materialStations = STATIONS.filter((station) => 'materialId' in station);
  assert.equal(materialStations.length, 4);
  assert.deepEqual(
    new Set(materialStations.map((station) => station.materialId)),
    new Set(LEARNING_MATERIAL_IDS),
  );
  assert.equal(ACHIEVEMENTS.length, 7);
});
