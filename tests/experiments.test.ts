import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { INITIAL_RUNNER_STATE, runExperimentAction } from '../src/lib/experiments/runner';
import { ExperimentSchema } from '../src/lib/experiments/schema';

function fixture(name: string) {
  const path = fileURLToPath(new URL(`../src/lib/experiments/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

test('all authored and demo experiments satisfy the full contract', () => {
  assert.equal(ExperimentSchema.safeParse(fixture('titration.json')).success, true);
  assert.equal(ExperimentSchema.safeParse(fixture('demo-ice-density.json')).success, true);
  assert.equal(ExperimentSchema.safeParse(fixture('flame-test.json')).success, true);
  assert.equal(ExperimentSchema.safeParse(fixture('moon-gravity.json')).success, true);
});

test('every flame sample advances and the observation-first shortcut stays put', () => {
  const experiment = ExperimentSchema.parse(fixture('flame-test.json'));
  const earlyRecord = runExperimentAction(experiment, INITIAL_RUNNER_STATE, 'record-before-testing', 1);
  assert.equal(earlyRecord.outcome?.type, 'surprise');
  assert.equal(earlyRecord.state.stepIndex, 0);

  for (const sample of ['choose-sodium', 'choose-copper', 'choose-potassium']) {
    const lit = runExperimentAction(experiment, INITIAL_RUNNER_STATE, 'light-burner', 2);
    const chosen = runExperimentAction(experiment, lit.state, sample, 3);
    assert.equal(chosen.state.stepIndex, 2);
  }
});

test('moon gravity assignment completes through prediction, demo, and conclusion', () => {
  const experiment = ExperimentSchema.parse(fixture('moon-gravity.json'));
  const predicted = runExperimentAction(experiment, INITIAL_RUNNER_STATE, 'predict-moon-higher', 1);
  const demonstrated = runExperimentAction(experiment, predicted.state, 'run-bounce-comparison', 2);
  const concluded = runExperimentAction(experiment, demonstrated.state, 'record-one-sixth-gravity', 3);

  assert.equal(concluded.state.status, 'complete');
  assert.equal(concluded.outcome?.type, 'success');
});

test('titration overshoot emits a failure without advancing the step', () => {
  const experiment = ExperimentSchema.parse(fixture('titration.json'));
  const afterIndicator = runExperimentAction(experiment, INITIAL_RUNNER_STATE, 'add-indicator', 1);
  const afterBurette = runExperimentAction(experiment, afterIndicator.state, 'fill-burette', 2);
  const overshoot = runExperimentAction(experiment, afterBurette.state, 'overshoot-endpoint', 3);

  assert.equal(overshoot.outcome?.type, 'failure');
  assert.equal(overshoot.state.stepIndex, 2);
  assert.equal(overshoot.state.status, 'running');
});

test('a correct surprise action records evidence and advances', () => {
  const experiment = ExperimentSchema.parse(fixture('demo-ice-density.json'));
  const prediction = runExperimentAction(experiment, INITIAL_RUNNER_STATE, 'predict-float', 1);
  const observation = runExperimentAction(experiment, prediction.state, 'lower-ice-gently', 2);

  assert.equal(observation.outcome?.type, 'surprise');
  assert.equal(observation.state.stepIndex, 2);
  assert.match(observation.state.observations.at(-1) ?? '', /waterline/i);
});

test('schema rejects an experiment without both required outcome types', () => {
  const experiment = fixture('demo-ice-density.json') as { outcomes: Array<{ type: string }> };
  experiment.outcomes = experiment.outcomes.filter((outcome) => outcome.type !== 'failure');
  const result = ExperimentSchema.safeParse(experiment);

  assert.equal(result.success, false);
  if (!result.success) assert.match(result.error.message, /failure outcome/i);
});
