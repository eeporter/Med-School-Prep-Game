import { test } from 'node:test';
import assert from 'node:assert/strict';
import { review, newCard, gradeFor, nextEase, isDue, isMastered, reviewedOn, isStruggling, MIN_EASE } from '../src/scheduler.js';
import { addDays, daysBetween, toDayString } from '../src/dates.js';

const D = '2026-03-01';

test('grade mapping rewards confident correct answers most', () => {
  assert.equal(gradeFor(false, 'sure'), 1);
  assert.equal(gradeFor(false, 'guess'), 1);
  assert.equal(gradeFor(true, 'guess'), 3);
  assert.equal(gradeFor(true, 'unsure'), 4);
  assert.equal(gradeFor(true, 'sure'), 5);
  assert.throws(() => gradeFor(true, 'maybe'));
});

test('SM-2 ease update matches the published formula', () => {
  assert.equal(nextEase(2.5, 5), 2.6);
  assert.equal(nextEase(2.5, 4), 2.5);
  assert.equal(nextEase(2.5, 3), 2.36);
  assert.equal(nextEase(1.3, 1), MIN_EASE);
});

test('intervals follow 1, 6, then interval x ease', () => {
  let c = review(newCard(), { correct: true, confidence: 'sure' }, D);
  assert.equal(c.interval, 1);
  assert.equal(c.due, '2026-03-02');
  c = review(c, { correct: true, confidence: 'sure' }, c.due);
  assert.equal(c.interval, 6);
  const ease = c.ease;
  const prevInterval = c.interval;
  c = review(c, { correct: true, confidence: 'sure' }, c.due);
  assert.equal(c.interval, Math.round(prevInterval * Math.min(ease + 0.1, 99)));
  assert.equal(c.reps, 3);
});

test('a wrong answer resets reps and schedules for tomorrow', () => {
  let c = newCard();
  for (let i = 0; i < 4; i++) c = review(c, { correct: true, confidence: 'sure' }, D);
  assert.ok(c.interval > 6);
  const after = review(c, { correct: false, confidence: 'unsure' }, D);
  assert.equal(after.reps, 0);
  assert.equal(after.interval, 1);
  assert.equal(after.due, addDays(D, 1));
  assert.equal(after.lapses, c.lapses + 1);
  assert.ok(after.ease < c.ease);
});

test('confident wrong answers are flagged as misconceptions until answered correctly', () => {
  let c = review(newCard(), { correct: false, confidence: 'sure' }, D);
  assert.equal(c.misconception, true);
  c = review(c, { correct: false, confidence: 'guess' }, D);
  assert.equal(c.misconception, true, 'an unsure miss does not clear the flag');
  c = review(c, { correct: true, confidence: 'unsure' }, D);
  assert.equal(c.misconception, false);
});

test('review does not mutate the input card', () => {
  const c = newCard();
  const copy = { ...c };
  review(c, { correct: true, confidence: 'sure' }, D);
  assert.deepEqual(c, copy);
});

test('isDue compares local calendar days', () => {
  assert.equal(isDue(null, D), false);
  assert.equal(isDue({ due: null }, D), true, 'a stored card without a due date is due now');
  assert.equal(isDue({ due: '2026-03-01' }, D), true);
  assert.equal(isDue({ due: '2026-02-20' }, D), true);
  assert.equal(isDue({ due: '2026-03-02' }, D), false);
});

test('mastery requires an interval of at least 21 days', () => {
  assert.equal(isMastered({ interval: 20 }), false);
  assert.equal(isMastered({ interval: 21 }), true);
  assert.equal(isMastered(undefined), false);
});

test('day arithmetic survives month, year, leap-day, and DST boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  // US DST starts 2026-03-08 and ends 2026-11-01.
  assert.equal(addDays('2026-03-07', 1), '2026-03-08');
  assert.equal(addDays('2026-03-08', 1), '2026-03-09');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetween('2026-11-02', '2026-10-31'), -2);
  assert.equal(toDayString(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.throws(() => addDays('03/01/2026', 1));
});

test('with an exam date, review dates converge on the exam and never pass it', () => {
  let c = newCard();
  for (let i = 0; i < 5; i++) c = review(c, { correct: true, confidence: 'sure' }, D);
  assert.ok(c.interval > 10, 'without an exam date the interval keeps growing');
  const capped = review(c, { correct: true, confidence: 'sure' }, D, { examDate: '2026-03-11' });
  assert.equal(capped.due, '2026-03-06', 'gap is capped at half the 10 days left');
  assert.equal(capped.interval, review(c, { correct: true, confidence: 'sure' }, D).interval,
    'the SM-2 interval itself is not capped');
  // Repeated reviews converge on the exam without passing it.
  let r = capped;
  const days = [];
  while (r.due < '2026-03-11' && days.length < 10) {
    days.push(r.due);
    r = review(r, { correct: true, confidence: 'sure' }, r.due, { examDate: '2026-03-11' });
  }
  assert.deepEqual(days, ['2026-03-06', '2026-03-08', '2026-03-09', '2026-03-10']);
  // Short gaps are untouched, and a past exam is ignored.
  assert.equal(review(newCard(), { correct: true, confidence: 'sure' }, D, { examDate: '2026-03-11' }).due, '2026-03-02');
  assert.equal(review(c, { correct: true, confidence: 'sure' }, D, { examDate: '2026-02-01' }).due,
    review(c, { correct: true, confidence: 'sure' }, D).due);
  // Exam tomorrow: the minimum gap of 1 day lands on exam day, never after it.
  assert.equal(review(c, { correct: true, confidence: 'sure' }, D, { examDate: '2026-03-02' }).due, '2026-03-02');
});

test('mastery can still be reached while an exam is close', () => {
  let c = newCard();
  let day = D;
  const exam = '2026-03-31';
  for (let i = 0; i < 6 && !isMastered(c); i++) {
    c = review(c, { correct: true, confidence: 'sure' }, day, { examDate: exam });
    day = c.due;
  }
  assert.ok(isMastered(c), `interval ${c.interval}`);
  assert.ok(c.due <= exam);
});

test('only the first answer of a day counts as a review', () => {
  const c = review(newCard(), { correct: true, confidence: 'sure' }, D);
  assert.equal(reviewedOn(c, D), true);
  assert.equal(reviewedOn(c, '2026-03-02'), false);
  assert.equal(reviewedOn(undefined, D), false);
  assert.equal(reviewedOn(newCard(), D), false);
});

test('isStruggling: missed at least once and not yet mastered', () => {
  assert.equal(isStruggling(undefined), false);
  assert.equal(isStruggling(newCard()), false);
  assert.equal(isStruggling({ ...newCard(), lapses: 1, interval: 6 }), true);
  assert.equal(isStruggling({ ...newCard(), lapses: 1, interval: 21 }), false);
});
