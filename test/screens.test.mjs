import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const between = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));

test('the sign-in screen comes first, and the home screen starts hidden', () => {
  const gate = html.indexOf('id="view-signin"');
  const home = html.indexOf('id="view-home"');
  assert.ok(gate > 0 && gate < home);
  assert.match(html, /<section id="view-home" class="view" hidden>/);
  assert.match(between('id="view-signin"', 'id="view-home"'), /id="gate-signin"[^>]*>Sign in with Google</);
  // Settings load before the first render, so home never flashes before sign-in.
  assert.match(app, /\[settings\] = await Promise\.all\(\[loadFirebaseSettings/);
  assert.match(app, /show\(gateOn\(\) \? 'signin' : 'home'\)/);
});

test('no leftover sync controls: syncing has no button', () => {
  assert.doesNotMatch(html, /id="sync-now"|Sync now|Turn on sync|Use this code/);
  assert.doesNotMatch(app, /sync-now/);
});

test('every question screen has a visible way home', () => {
  const quiz = between('id="view-quiz"', 'id="view-summary"');
  assert.match(quiz, /id="quiz-home"[^>]*>Home</);
  assert.match(quiz, /id="fb-home"[^>]*>Home</);
  assert.match(html.slice(html.indexOf('id="view-summary"')), /id="sum-home"[^>]*>Back to home</);
  assert.match(app, /addEventListener\('popstate'/);
});

test('a sync merges answers given while it was on its way', () => {
  assert.match(app, /adoptState\(mergeStates\(state, merged\)\)/);
  assert.doesNotMatch(app, /adoptState\(merged\)/);
});

test('the footer does not link to the repository, which is going private', () => {
  assert.doesNotMatch(html.slice(html.indexOf('<footer')), /github\.com/);
});

test('sign-in is never a locked door: failures say why and offer studying on the device', () => {
  assert.match(html, /id="gate-skip"[^>]*>Study without signing in</);
  assert.match(app, /function signInFailed/);
  // Firebase's sign-in helper frame is allowed (needed when it is not on the game's own host).
  assert.match(html, /frame-src 'self' https:\/\/medschool-sync\.firebaseapp\.com;/);
});

test('closing or hiding the page sends one upload that outlives the tab', () => {
  assert.match(app, /addEventListener\('pagehide', flushOnHide\)/);
  assert.match(app, /keepalive: true/);
});

test('the page is never served from a stale cache, and a stale copy reloads itself', () => {
  const fb = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'));
  const rule = fb.hosting.headers.find((h) => h.source === '**');
  assert.ok(rule && rule.headers.some((x) => x.key === 'Cache-Control' && x.value === 'no-cache'));
  for (const id of [...app.matchAll(/PAGE_MARKERS = \[([^\]]+)\]/g)][0][1].match(/'([^']+)'/g).map((x) => x.slice(1, -1))) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} missing from index.html`);
  }
});

test('no backup files: Google sign-in sync replaced them', () => {
  assert.doesNotMatch(html, /backup/i);
  assert.doesNotMatch(app, /backup/i);
  assert.match(html, /<summary><h2 id="progress-head">Account<\/h2><\/summary>/);
});
