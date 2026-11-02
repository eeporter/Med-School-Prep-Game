import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weakSpots, weakSpotsText, describeSpot, sanitizeReports, addReport, reportsText, MAX_REPORTS, MAX_NOTE } from '../src/insights.js';

const mk = (id, topic, system = 'Renal & Urinary') => ({
  id, topic, system, stem: `A patient for ${id} has a finding. Labs follow.`, leadIn: `Lead-in for ${id}?`, answer: 'a',
  options: [{ id: 'a', text: `Key ${id}` }, { id: 'b', text: 'Other' }],
});
const qs = [mk('q1', 'Acid-base'), mk('q2', 'Acid-base'), mk('q3', 'Diuretics'), mk('q4', 'Murmurs', 'Cardiovascular')];

test('weak spots rank misses and sure-but-wrong answers above lucky guesses', () => {
  const history = [
    { id: 'q1', day: '2026-10-01', correct: false, confidence: 'sure' },
    { id: 'q2', day: '2026-10-02', correct: true, confidence: 'sure' },
    { id: 'q3', day: '2026-10-02', correct: true, confidence: 'guess' },
    { id: 'q4', day: '2026-10-03', correct: true, confidence: 'sure' },
    { id: 'gone', day: '2026-10-03', correct: false, confidence: 'sure' },
  ];
  const spots = weakSpots(history, qs);
  assert.deepEqual(spots.map((s) => s.topic), ['Acid-base', 'Diuretics']);
  assert.equal(spots[0].attempts, 2);
  assert.equal(spots[0].misses, 1);
  assert.equal(spots[0].sureWrong, 1);
  assert.deepEqual(spots[0].ids, ['q1']);
  assert.equal(describeSpot(spots[0]), 'missed 1 of 2; wrong while sure 1 time');
  assert.equal(describeSpot(spots[1]), 'missed 0 of 1; right only by guessing 1 time');
});

test('weak spots are empty with no history and never list topics she always gets right', () => {
  assert.deepEqual(weakSpots([], qs), []);
  assert.deepEqual(weakSpots([{ id: 'q4', day: '2026-10-01', correct: true, confidence: 'unsure' }], qs), []);
});

test('the Claude text lists topics with the questions behind them and asks to log them', () => {
  const spots = weakSpots([{ id: 'q3', day: '2026-10-01', correct: false, confidence: 'unsure' }], qs);
  const text = weakSpotsText(spots, qs, '2026-10-28');
  assert.match(text, /1\. Diuretics \(Renal & Urinary\): missed 1 of 1\./);
  assert.match(text, /Question: "Lead-in for q3\?" Correct answer: Key q3\./);
  assert.match(text, /struggle-log\.md/);
});

test('reports keep valid entries only, trim notes, and cap the list', () => {
  const ok = { id: 'q1', day: '2026-10-28', reason: 'wrong', note: 'x'.repeat(MAX_NOTE + 50) };
  const cleaned = sanitizeReports([ok, { id: 'q2', day: '2026-10-28', reason: 'nonsense' }, null, 'junk']);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].note.length, MAX_NOTE);
  assert.deepEqual(sanitizeReports('not a list'), []);
  let many = [];
  for (let i = 0; i < MAX_REPORTS + 5; i++) many = addReport(many, { id: `q${i}`, day: '2026-10-28', reason: 'typo' });
  assert.equal(many.length, MAX_REPORTS);
  assert.equal(many.at(-1).id, `q${MAX_REPORTS + 4}`);
});

test('report text gives each report as a block for her Claude, with file option ids', () => {
  const text = reportsText([
    { id: 'q1', day: '2026-10-28', reason: 'wrong', note: 'Which kidney?', choice: 'a' },
    { id: 'q2', day: '2026-10-27', reason: 'unclear', note: '' },
    { id: 'gone', day: '2026-10-26', reason: 'typo', note: '', choice: 'c' },
  ], qs);
  const [head, , ...rest] = text.split('\n');
  assert.equal(head, 'Question report from my Med School Prep study game (3 reports)');
  const blocks = rest.join('\n').split('\n\n');
  assert.equal(blocks.length, 3);
  const q1 = qs[0];
  const text1 = (id) => `${q1.options.find((o) => o.id === id).text} (option ${id} in the question file)`;
  assert.deepEqual(blocks[0].split('\n'), [
    'Report 1 of 3', 'Date: 2026-10-28', 'Question id: q1',
    `Question starts: ${q1.stem.split(/(?<=[.?!])\s/)[0]}`,
    `My answer: ${text1('a')}`, `Keyed answer: ${text1(q1.answer)}`,
    'Problem: Answer or explanation seems wrong', 'My note: Which kidney?',
  ]);
  assert.match(blocks[1], /My answer: not saved \(reported before this update\)\nKeyed answer: /);
  assert.match(blocks[1], /My note: \(none\)$/);
  assert.match(blocks[2], /Question starts: \(not found in the current question bank\)/);
});

test('reports keep the chosen option id and drop a bad one', () => {
  const [kept, dropped] = sanitizeReports([
    { id: 'q1', day: '2026-10-28', reason: 'typo', choice: 'b' },
    { id: 'q1', day: '2026-10-28', reason: 'typo', choice: 7 },
  ]);
  assert.equal(kept.choice, 'b');
  assert.equal('choice' in dropped, false);
});
