import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, presentQuestion, isCorrect, xpFor, levelFor, interleave, updateStreak, LEVELS, needsRelearning, sureAccuracy } from '../src/quiz.js';
import { daysBetween } from '../src/dates.js';

// Deterministic PRNG (mulberry32) so tests are repeatable.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = {
  id: 'x',
  answer: 'c',
  options: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, text: `option ${id}` })),
};

test('shuffle returns a permutation and leaves the input alone', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const out = shuffle(input, rng(1));
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
});

test('shuffle reaches every position (not stuck)', () => {
  const firstSeen = new Set();
  const r = rng(7);
  for (let i = 0; i < 200; i++) firstSeen.add(shuffle(['a', 'b', 'c', 'd', 'e'], r)[0]);
  assert.equal(firstSeen.size, 5);
});

test('shuffled options keep the correct key mapped by id', () => {
  const r = rng(42);
  for (let i = 0; i < 100; i++) {
    const p = presentQuestion(q, r);
    assert.deepEqual(p.options.map((o) => o.label), ['A', 'B', 'C', 'D', 'E']);
    const key = p.options.find((o) => o.id === q.answer);
    assert.equal(key.text, 'option c');
    // Choosing the displayed key is scored right; every other display slot is scored wrong.
    for (const o of p.options) assert.equal(isCorrect(q, o.id), o.id === 'c');
  }
});

test('grading never uses display labels', () => {
  assert.equal(isCorrect(q, 'C'), false);
  assert.equal(isCorrect(q, undefined), false);
});

test('XP rewards correct, confident, spaced answers and never wrong answers', () => {
  assert.equal(xpFor({ correct: false, confidence: 'sure', wasDueReview: true }), 0);
  assert.equal(xpFor({ correct: true, confidence: 'sure', wasDueReview: false }), 10);
  assert.equal(xpFor({ correct: true, confidence: 'unsure', wasDueReview: false }), 8);
  assert.equal(xpFor({ correct: true, confidence: 'guess', wasDueReview: false }), 4);
  assert.equal(xpFor({ correct: true, confidence: 'sure', wasDueReview: true }), 15);
});

test('levels step at their thresholds', () => {
  assert.equal(levelFor(0).name, 'MS1');
  assert.equal(levelFor(249).name, 'MS1');
  assert.equal(levelFor(250).name, 'MS2');
  assert.equal(levelFor(1e9).name, LEVELS[LEVELS.length - 1].name);
  assert.equal(levelFor(1e9).next, null);
});

test('interleave avoids back-to-back systems when possible', () => {
  const items = [];
  for (const s of ['cv', 'renal', 'gi']) for (let i = 0; i < 4; i++) items.push({ id: `${s}${i}`, system: s });
  const out = interleave(items, (x) => x.system, rng(3));
  assert.equal(out.length, items.length);
  assert.deepEqual(new Set(out.map((x) => x.id)).size, items.length);
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i].system, out[i - 1].system);
});

test('interleave still returns everything when one system dominates', () => {
  const items = [{ id: 1, system: 'a' }, { id: 2, system: 'a' }, { id: 3, system: 'a' }, { id: 4, system: 'b' }];
  assert.equal(interleave(items, (x) => x.system, rng(5)).length, 4);
});

test('streak counts consecutive days and resets after a gap', () => {
  let s = updateStreak(undefined, '2026-03-01', daysBetween);
  assert.deepEqual(s, { count: 1, lastDay: '2026-03-01' });
  s = updateStreak(s, '2026-03-01', daysBetween);
  assert.equal(s.count, 1);
  s = updateStreak(s, '2026-03-02', daysBetween);
  assert.equal(s.count, 2);
  s = updateStreak(s, '2026-03-05', daysBetween);
  assert.equal(s.count, 1);
});

test('missed or guessed answers are relearned in the same session (SM-2 grade below 4)', () => {
  assert.equal(needsRelearning(false, 'sure'), true);
  assert.equal(needsRelearning(false, 'guess'), true);
  assert.equal(needsRelearning(true, 'guess'), true);
  assert.equal(needsRelearning(true, 'unsure'), false);
  assert.equal(needsRelearning(true, 'sure'), false);
});

test('sure-answer accuracy is computed from history', () => {
  assert.equal(sureAccuracy([]), null);
  assert.equal(sureAccuracy([{ confidence: 'unsure', correct: true }]), null);
  assert.deepEqual(sureAccuracy([
    { confidence: 'sure', correct: true }, { confidence: 'sure', correct: false },
    { confidence: 'sure', correct: true }, { confidence: 'guess', correct: false },
  ]), { right: 2, total: 3 });
});
