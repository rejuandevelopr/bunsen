import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  INTERACTION_SOUND_SECONDS,
  SFX_ASSETS,
} from '../src/lib/audio';
import {
  DEFAULT_MUSIC_VOLUME,
  MUSIC_BASE_TRIM,
  MUSIC_LOOP_CROSSFADE_SECONDS,
  MUSIC_TRACK_PATH,
  createTrackCrossfadeCurves,
} from '../src/lib/music-track';

test('licensed ambient music is mapped to the renamed local asset', () => {
  const target = join(process.cwd(), 'public', 'sfx', 'music-ambient.mp3');
  const oldSource = join(process.cwd(), 'public', 'freesound_community-violin-music-64019.mp3');
  assert.equal(MUSIC_TRACK_PATH, '/sfx/music-ambient.mp3');
  assert.equal(SFX_ASSETS.musicAmbient, MUSIC_TRACK_PATH);
  assert.equal(existsSync(target), true);
  assert.ok(statSync(target).size > 100_000);
  assert.equal(existsSync(oldSource), false);
});

test('music defaults to a quiet 15 percent mix and overlaps its loop by 1.5 seconds', () => {
  assert.equal(DEFAULT_MUSIC_VOLUME, 15);
  assert.equal(MUSIC_LOOP_CROSSFADE_SECONDS, 1.5);
  assert.ok(MUSIC_BASE_TRIM <= 0.35);
});

test('loop curves keep constant power through the tail-to-head overlap', () => {
  const { fadeIn, fadeOut } = createTrackCrossfadeCurves();
  for (let index = 0; index < fadeIn.length; index += 1) {
    const combinedPower = fadeIn[index] ** 2 + fadeOut[index] ** 2;
    assert.ok(Math.abs(combinedPower - 1) < 0.000001);
  }
  assert.equal(fadeIn[0], 0);
  assert.ok(Math.abs(fadeOut[fadeOut.length - 1]) < 0.000001);
});

test('interaction pop envelope stays brief and subtle', () => {
  assert.equal(INTERACTION_SOUND_SECONDS, 0.12);
});

test('music is synchronously stopped on page exit and suspended while hidden', () => {
  const audioSource = readFileSync(join(process.cwd(), 'src/lib/audio.ts'), 'utf8');
  const trackSource = readFileSync(join(process.cwd(), 'src/lib/music-track.ts'), 'utf8');
  assert.match(audioSource, /addEventListener\('pagehide', this\.handlePageExit\)/);
  assert.match(audioSource, /addEventListener\('beforeunload', this\.handlePageExit\)/);
  assert.match(audioSource, /visibilityState === 'hidden'/);
  assert.match(audioSource, /this\.music\?\.stop\(\)/);
  assert.match(audioSource, /context\.close\(\)/);
  assert.match(trackSource, /this\.sources\.forEach/);
  assert.match(trackSource, /source\.stop\(now\)/);
  assert.match(trackSource, /this\.output\.disconnect\(\)/);
});
