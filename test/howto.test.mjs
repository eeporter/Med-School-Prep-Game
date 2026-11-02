import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTIONS_KEY, closedSections, sectionsValue } from '../src/sections.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('<details class="howto" id="howto"');
const end = html.indexOf('</details>', start) + '</details>'.length;
const box = html.slice(start, end);
const rest = html.slice(0, start) + html.slice(end);
const text = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

test('the How to play box is on the home screen, before the study modes', () => {
  assert.ok(start > 0 && end > start);
  assert.ok(start < html.indexOf('class="cards"'));
  assert.match(box, /<summary>How to play<\/summary>/);
  assert.match(box, /id="howto-hide"/);
});

test('every button or section the box names really is on screen with that wording', () => {
  const labels = [...box.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1]);
  assert.ok(labels.length >= 15);
  const screen = text(rest);
  for (const label of labels) assert.ok(screen.includes(label), `"${label}" is not on screen`);
});

test('the box is plain text: no scripts, inline handlers or links out', () => {
  assert.doesNotMatch(box, /<script|\son\w+=|<a\s|<iframe|<img/i);
});

test('How to play starts collapsed, with no saved state that could open it', () => {
  assert.match(box, /^<details class="howto" id="howto">/);
  assert.doesNotMatch(readFileSync(new URL('../src/app.js', import.meta.url), 'utf8'), /howto\.open = true|box\.open = how/);
});

test('every home section can collapse, under a unique name', () => {
  const home = html.slice(html.indexOf('id="view-home"'), html.indexOf('id="view-quiz"'));
  const names = [...home.matchAll(/<details class="section" data-section="([a-z]+)" open>\s*<summary>/g)].map((m) => m[1]);
  assert.deepEqual(names, ['exams', 'weak', 'rounds', 'block', 'focus', 'reports', 'mastery']);
  assert.equal(new Set(names).size, names.length);
});

test('closed sections are remembered, and bad saved data leaves everything open', () => {
  assert.equal(SECTIONS_KEY, 'med-prep-sections');
  assert.deepEqual([...closedSections(sectionsValue(['weak', 'exams']))], ['weak', 'exams']);
  for (const bad of [null, '', 'garbage', '{"a":1}', '3']) assert.equal(closedSections(bad).size, 0);
  assert.deepEqual([...closedSections('["weak",7]')], ['weak']);
});
