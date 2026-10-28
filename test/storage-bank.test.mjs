import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load, save, emptyState, sanitize, STORAGE_KEY } from '../src/storage.js';
import { validateQuestion, validateBank, usableQuestions } from '../src/bank.js';

class MemoryStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
}

test('load returns an empty state for missing, corrupt, or wrong-version data', () => {
  assert.deepEqual(load(new MemoryStorage()), emptyState());
  assert.deepEqual(load(new MemoryStorage({ [STORAGE_KEY]: '{not json' })), emptyState());
  assert.deepEqual(load(new MemoryStorage({ [STORAGE_KEY]: '{"version":99}' })), emptyState());
  assert.deepEqual(load(null), emptyState());
  const throwing = { getItem() { throw new Error('SecurityError'); } };
  assert.deepEqual(load(throwing), emptyState());
});

test('save then load round-trips progress', () => {
  const s = new MemoryStorage();
  const state = emptyState();
  state.xp = 42;
  state.cards.q1 = { reps: 2, interval: 6, ease: 2.6, due: '2026-03-07' };
  assert.equal(save(s, state), true);
  assert.deepEqual(load(s), state);
});

test('save reports failure instead of throwing (quota exceeded, private mode)', () => {
  const full = { setItem() { throw new Error('QuotaExceededError'); } };
  assert.equal(save(full, emptyState()), false);
});

test('sanitize drops malformed cards and bad fields but keeps good ones', () => {
  const out = sanitize({
    version: 1,
    xp: -5,
    cards: { good: { reps: 1, interval: 1, ease: 2.5 }, bad: { reps: 'x' }, worse: null },
    streak: 'nope',
    history: 'nope',
  });
  assert.deepEqual(Object.keys(out.cards), ['good']);
  assert.equal(out.xp, 0);
  assert.deepEqual(out.streak, { count: 0, lastDay: null });
  assert.deepEqual(out.history, []);
});

const good = () => ({
  id: 'demo-001',
  exams: ['usmle-step1'],
  discipline: 'Pathology',
  system: 'Renal & Urinary',
  topic: 'Demo',
  difficulty: 1,
  stem: 'A patient has a finding.',
  leadIn: 'Which of the following is the most likely diagnosis?',
  options: [
    { id: 'a', text: 'One' }, { id: 'b', text: 'Two' }, { id: 'c', text: 'Three' }, { id: 'd', text: 'Four' },
  ],
  answer: 'a',
  explanation: 'Because.',
  whyWrong: { b: 'x', c: 'y', d: 'z' },
  sources: [{ title: 'A source', url: 'https://example.org/a' }],
});

test('a well-formed question validates', () => {
  assert.deepEqual(validateQuestion(good()), []);
  const withLinks = { ...good(), readMore: [{ title: 'Further reading', url: 'https://example.org/b' }] };
  assert.deepEqual(validateQuestion(withLinks), []);
});

test('validator catches each schema problem', () => {
  const cases = [
    [(q) => { q.answer = 'z'; }, /answer must match exactly one/],
    [(q) => { q.options[1].id = 'a'; }, /option ids must be unique/],
    [(q) => { q.explanation = ' '; }, /explanation is empty/],
    [(q) => { q.sources = []; }, /sources/],
    [(q) => { q.sources = [{ title: 'x', url: 'http://insecure' }]; }, /https/],
    [(q) => { q.exams = ['mcat']; }, /exams/],
    [(q) => { q.system = 'Spleen'; }, /unknown system/],
    [(q) => { q.discipline = 'Cooking'; }, /unknown discipline/],
    [(q) => { delete q.whyWrong.c; }, /whyWrong missing for option c/],
    [(q) => { q.options[3].text = 'All of the above'; }, /all\/none of the above/],
    [(q) => { q.leadIn = 'Each of the following is true EXCEPT:'; }, /negatively phrased/],
    [(q) => { q.options = q.options.slice(0, 3); }, /4 to 6/],
    [(q) => { q.id = 'Bad ID'; }, /id must be/],
    [(q) => { q.difficulty = 7; }, /difficulty/],
    [(q) => { q.readMore = [{ title: 'x', url: 'http://insecure' }]; }, /readMore/],
    [(q) => { q.readMore = [{ url: 'https://example.org/b' }]; }, /readMore/],
  ];
  for (const [mutate, pattern] of cases) {
    const q = good();
    mutate(q);
    const errs = validateQuestion(q);
    assert.ok(errs.some((e) => pattern.test(e)), `expected ${pattern} in ${JSON.stringify(errs)}`);
  }
});

test('duplicate ids are rejected by the bank validator and skipped by the app', () => {
  const bank = { questions: [good(), good()] };
  assert.ok(validateBank(bank).some((e) => /duplicate id/.test(e)));
  assert.equal(usableQuestions(bank).length, 1);
});

test('the shipped question bank is valid', () => {
  const bank = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateBank(bank), []);
  assert.ok(bank.questions.length >= 20);
});

test('corrupt date strings are repaired instead of crashing the scheduler', async () => {
  const { isDue } = await import('../src/scheduler.js');
  const out = sanitize({
    version: 1,
    xp: 10,
    cards: {
      a: { reps: 1, interval: 1, ease: 2.5, due: 'garbage', lastReviewed: '2026-13-40' },
      b: { reps: 1, interval: 1, ease: 2.5, due: '2026-02-30' },
      c: { reps: 1, interval: 1, ease: 2.5, due: '2026-03-02' },
    },
    streak: { count: 3, lastDay: 'not-a-day' },
  });
  assert.equal(out.cards.a.due, null);
  assert.equal('lastReviewed' in out.cards.a, false);
  assert.equal(out.cards.b.due, null);
  assert.equal(out.cards.c.due, '2026-03-02');
  assert.deepEqual(out.streak, { count: 0, lastDay: null });
  // Repaired cards are due now; none of these calls throw.
  assert.equal(isDue(out.cards.a, '2026-03-01'), true);
  assert.equal(isDue(out.cards.c, '2026-03-01'), false);
});

test('load survives a stored state with corrupt dates', () => {
  const raw = JSON.stringify({ version: 1, cards: { q: { reps: 1, interval: 1, ease: 2.5, due: 5 } }, streak: { count: 1, lastDay: 7 } });
  const s = load(new MemoryStorage({ [STORAGE_KEY]: raw }));
  assert.equal(s.cards.q.due, null);
  assert.deepEqual(s.streak, { count: 0, lastDay: null });
});
