import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOWTO_KEY, howToStartsOpen, howToValue } from '../src/howto.js';

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

test('it starts open until hidden, and remembers being hidden', () => {
  assert.equal(HOWTO_KEY, 'med-prep-howto');
  assert.equal(howToStartsOpen(null), true);
  assert.equal(howToStartsOpen('open'), true);
  assert.equal(howToStartsOpen('closed'), false);
  assert.equal(howToStartsOpen('garbage'), true);
  assert.equal(howToValue(false), 'closed');
  assert.equal(howToStartsOpen(howToValue(true)), true);
});
