import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { examFormat, examScope, nextExam, weightedSample, isValidExam, examLabel, SUBJECT_EXAMS, STEP1_NEW_FORMAT_FROM } from '../src/exams.js';
import { DISCIPLINES } from '../src/bank.js';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('Step 1 format follows the test date (format change on 2026-05-14)', () => {
  assert.equal(STEP1_NEW_FORMAT_FROM, '2026-05-14');
  assert.equal(examFormat({ type: 'usmle-step1', date: '2026-05-13' }).blockSize, 40);
  assert.equal(examFormat({ type: 'usmle-step1', date: '2026-05-14' }).blockSize, 20);
  assert.equal(examFormat({ type: 'nbme-cbssa', date: '2027-01-01' }).blockSize, 50);
  assert.match(examFormat({ type: 'nbme-subject', subject: 'Pathology', date: '2027-01-01' }).summary, /125 questions in 3 h 8 min/);
  assert.match(examFormat({ type: 'nbme-subject', subject: 'Microbiology & Immunology', date: '2027-01-01' }).summary, /150 questions in 3 h 45 min/);
});

test('every subject exam maps to disciplines the bank uses', () => {
  for (const [name, s] of Object.entries(SUBJECT_EXAMS)) {
    for (const d of s.disciplines) assert.ok(DISCIPLINES.includes(d), `${name} -> ${d}`);
    // All NBME basic science exams run at about 90 seconds per question.
    assert.ok(Math.abs((s.minutes * 60) / s.items - 90) < 1, name);
  }
});

test('a subject exam scopes to its discipline; Step 1 scopes by exam tag', () => {
  const path = examScope({ type: 'nbme-subject', subject: 'Pathology', date: '2027-01-01' });
  assert.equal(path.inScope({ discipline: 'Pathology', exams: ['nbme'] }), true);
  assert.equal(path.inScope({ discipline: 'Pharmacology', exams: ['nbme'] }), false);
  const mi = examScope({ type: 'nbme-subject', subject: 'Microbiology & Immunology', date: '2027-01-01' });
  assert.equal(mi.inScope({ discipline: 'Immunology', exams: [] }), true);
  const s1 = examScope({ type: 'usmle-step1', date: '2027-01-01' });
  assert.equal(s1.inScope({ exams: ['usmle-step1'] }), true);
  assert.equal(s1.inScope({ exams: ['nbme'] }), false);
  assert.ok(s1.weight({ system: 'Multisystem' }) > s1.weight({ system: 'Skin & Subcutaneous Tissue' }));
});

test('next exam is the soonest one today or later', () => {
  const exams = [
    { type: 'usmle-step1', date: '2027-06-01' },
    { type: 'nbme-subject', subject: 'Pathology', date: '2026-11-15' },
    { type: 'nbme-subject', subject: 'Physiology', date: '2026-10-01' },
  ];
  assert.equal(nextExam(exams, '2026-10-27').subject, 'Pathology');
  assert.equal(nextExam(exams, '2026-11-15').subject, 'Pathology', 'an exam today still counts');
  assert.equal(nextExam(exams, '2026-11-16').type, 'usmle-step1');
  assert.equal(nextExam(exams, '2027-07-01'), null);
  assert.equal(nextExam([], '2026-10-27'), null);
});

test('exam validation and labels', () => {
  assert.equal(isValidExam({ type: 'nbme-subject', subject: 'Pathology', date: '2026-12-01' }), true);
  assert.equal(isValidExam({ type: 'nbme-subject', subject: 'toString', date: '2026-12-01' }), false);
  assert.equal(isValidExam({ type: 'nbme-cbse' }), false);
  assert.equal(examLabel({ type: 'nbme-subject', subject: 'Pathology' }), 'NBME Pathology subject exam');
});

test('weighted sampling follows system weights, not bank counts', () => {
  // 90 cardio questions vs 10 renal, equal weights: draws should be about 50/50.
  const qs = [
    ...Array.from({ length: 90 }, (_, i) => ({ id: `c${i}`, system: 'Cardiovascular' })),
    ...Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, system: 'Renal & Urinary' })),
  ];
  let renal = 0;
  const trials = 400;
  const r = rng(7);
  for (let t = 0; t < trials; t++) if (weightedSample(qs, 1, () => 1, r)[0].system === 'Renal & Urinary') renal++;
  assert.ok(renal > trials * 0.4 && renal < trials * 0.6, `renal share ${renal / trials}`);
  // Without replacement, and never more than asked for.
  const ten = weightedSample(qs, 10, () => 1, rng(3));
  assert.equal(new Set(ten.map((q) => q.id)).size, 10);
  assert.equal(weightedSample(qs.slice(0, 3), 10, () => 1).length, 3);
});

test('every question in the bank is in scope for at least one exam profile', () => {
  const bank = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
  const profiles = [
    { type: 'usmle-step1', date: '2027-01-01' }, { type: 'nbme-cbse', date: '2027-01-01' },
    ...Object.keys(SUBJECT_EXAMS).map((subject) => ({ type: 'nbme-subject', subject, date: '2027-01-01' })),
  ].map(examScope);
  for (const q of bank.questions) assert.ok(profiles.some((p) => p.inScope(q)), q.id);
});
