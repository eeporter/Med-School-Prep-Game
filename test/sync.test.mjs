import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, sanitize } from '../src/storage.js';
import {
  mergeStates, addXp, unattributedXp, markRemoved, markAdded, examKey, reportKey,
  backupText, readBackup, backupFileName, BACKUP_KIND,
  makeSyncCode, normalizeSyncCode, CODE_LENGTH,
  docUrl, accountPath, handoverPath, pullRemote, pushRemote, syncOnce, hasProgress, SyncError,
} from '../src/sync.js';

const card = (lastReviewed, seen, extra = {}) => ({ reps: 1, interval: 1, ease: 2.5, due: '2026-11-03', lapses: 0, seen, misconception: false, lastReviewed, ...extra });
const answer = (id, day, correct = true, confidence = 'sure') => ({ id, day, correct, confidence });

test('cards: the copy reviewed most recently wins, then the one seen more', () => {
  const a = emptyState();
  const b = emptyState();
  a.cards.q1 = card('2026-11-01', 3, { interval: 6 });
  b.cards.q1 = card('2026-11-02', 2, { interval: 1 });
  a.cards.q2 = card('2026-11-01', 4);
  b.cards.q2 = card('2026-11-01', 5);
  a.cards.onlyA = card('2026-10-30', 1);
  b.cards.onlyB = card('2026-10-31', 1);
  const m = mergeStates(a, b);
  assert.equal(m.cards.q1.lastReviewed, '2026-11-02');
  assert.equal(m.cards.q2.seen, 5);
  assert.ok(m.cards.onlyA && m.cards.onlyB);
});

test('history keeps every answer once, however many times devices sync', () => {
  const a = emptyState();
  const b = emptyState();
  a.history = [answer('q1', '2026-11-01'), answer('q2', '2026-11-02', false)];
  b.history = [answer('q1', '2026-11-01'), answer('q3', '2026-11-01')];
  const once = mergeStates(a, b);
  assert.deepEqual(once.history.map((h) => h.id), ['q1', 'q3', 'q2']);
  const again = mergeStates(mergeStates(once, b), a);
  assert.deepEqual(again.history, once.history);
});

test('XP earned on two devices is added once, and old unattributed XP is not doubled', () => {
  const start = emptyState();
  start.xp = 100; // earned before per-device tracking
  const phone = sanitize(structuredClone(start));
  const laptop = sanitize(structuredClone(start));
  addXp(phone, 'phone', 30);
  addXp(laptop, 'laptop', 20);
  const m = mergeStates(phone, laptop);
  assert.equal(m.xp, 150);
  assert.equal(unattributedXp(m), 100);
  // Syncing the same states again changes nothing.
  assert.equal(mergeStates(m, phone).xp, 150);
  assert.equal(mergeStates(laptop, m).xp, 150);
  addXp(m, 'phone', 5);
  assert.equal(mergeStates(m, laptop).xp, 155);
});

test('streak follows the later study day, then the longer count', () => {
  const a = emptyState();
  const b = emptyState();
  a.streak = { count: 9, lastDay: '2026-11-01' };
  b.streak = { count: 3, lastDay: '2026-11-02' };
  assert.deepEqual(mergeStates(a, b).streak, b.streak);
  b.streak = { count: 4, lastDay: '2026-11-01' };
  assert.deepEqual(mergeStates(a, b).streak, a.streak);
});

test('a removed exam or cleared report does not come back from another device', () => {
  const exam = { type: 'usmle-step1', date: '2027-03-01' };
  const report = { id: 'q1', day: '2026-11-01', reason: 'wrong', note: 'key looks off', choice: 'b' };
  const phone = emptyState();
  phone.exams = [exam];
  phone.reports = [report];
  const laptop = sanitize(structuredClone(phone));
  laptop.exams = [];
  markRemoved(laptop, examKey(exam), 1000);
  for (const r of laptop.reports) markRemoved(laptop, reportKey(r), 1000);
  laptop.reports = [];
  const m = mergeStates(phone, laptop);
  assert.deepEqual(m.exams, []);
  assert.deepEqual(m.reports, []);
  // Adding the same exam again later brings it back everywhere, even though
  // the laptop still remembers the older removal.
  m.exams.push(exam);
  markAdded(m, examKey(exam), 2000);
  assert.deepEqual(mergeStates(m, laptop).exams, [exam]);
  assert.deepEqual(mergeStates(laptop, m).exams, [exam]);
  // An exam added before the removal stays removed.
  const old = sanitize(structuredClone(phone));
  markAdded(old, examKey(exam), 500);
  assert.deepEqual(mergeStates(old, laptop).exams, []);
});

test('merge result does not depend on which device syncs first', () => {
  const a = emptyState();
  const b = emptyState();
  a.cards.q1 = card('2026-11-01', 1);
  b.cards.q1 = card('2026-11-02', 2);
  a.history = [answer('q1', '2026-11-01')];
  b.history = [answer('q1', '2026-11-02', false)];
  addXp(a, 'a', 10);
  addXp(b, 'b', 7);
  b.exams = [{ type: 'nbme', date: '2026-12-01' }];
  const ab = mergeStates(a, b);
  const ba = mergeStates(b, a);
  assert.deepEqual(ab.cards, ba.cards);
  assert.deepEqual(ab.history, ba.history);
  assert.equal(ab.xp, ba.xp);
  assert.deepEqual(ab.exams, ba.exams);
});

test('backup files round-trip and reject anything else', () => {
  const s = emptyState();
  s.cards.q1 = card('2026-11-01', 1);
  addXp(s, 'phone', 12);
  const text = backupText(s, '2026-11-02T10:00:00.000Z');
  assert.equal(JSON.parse(text).kind, BACKUP_KIND);
  assert.deepEqual(readBackup(text).state, sanitize(s));
  // Bare saved progress (the browser's own copy) is accepted too.
  assert.deepEqual(readBackup(JSON.stringify(s)).state, sanitize(s));
  assert.ok(readBackup('not json').error);
  assert.ok(readBackup('{"kind":"something-else"}').error);
  assert.ok(readBackup('{"version":99}').error);
  assert.equal(backupFileName('2026-11-02'), 'med-prep-progress-2026-11-02.json');
});

test('random codes are 20 characters and forgive typing slips', () => {
  const code = makeSyncCode((n) => Uint8Array.from({ length: n }, (_, i) => i * 7));
  assert.equal(code.length, CODE_LENGTH);
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{20}$/);
  assert.equal(normalizeSyncCode(code.toLowerCase()), code);
  assert.equal(normalizeSyncCode('ABCDE-FGHOJ-KMNPQ-RSTVI'), 'ABCDEFGH0JKMNPQRSTV1');
  assert.equal(normalizeSyncCode('too-short'), null);
  assert.equal(normalizeSyncCode('ABCDE-FGHJK-MNPQR-STVWU'), null); // U is not used
  assert.equal(normalizeSyncCode(null), null);
});

// A stand-in for the Firestore REST API: one document per code.
function fakeFirestore() {
  const docs = new Map();
  const calls = [];
  const fetchFn = async (url, opts = {}) => {
    calls.push({ url, method: opts.method ?? 'GET', auth: opts.headers?.Authorization ?? null });
    const code = /documents\/(.+)$/.exec(url)[1];
    if ((opts.method ?? 'GET') === 'GET') {
      if (!docs.has(code)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => docs.get(code) };
    }
    docs.set(code, JSON.parse(opts.body));
    return { ok: true, status: 200, json: async () => docs.get(code) };
  };
  return { docs, calls, fetchFn };
}

test('each signed-in account has its own document; hand-overs use a code', () => {
  assert.equal(docUrl('medschool-sync', accountPath('uid/1')),
    'https://firestore.googleapis.com/v1/projects/medschool-sync/databases/(default)/documents/users/uid%2F1');
  assert.equal(docUrl('p', handoverPath('ABC')),
    'https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents/progress/ABC');
});

test('only progress worth keeping is carried to the new site', () => {
  assert.equal(hasProgress(emptyState()), false);
  const s = emptyState();
  s.exams = [{ type: 'nbme', date: '2026-12-01' }];
  assert.equal(hasProgress(s), true);
  const t = emptyState();
  t.history = [answer('q1', '2026-11-01')];
  assert.equal(hasProgress(t), true);
});

test('two devices signed in to the same account end up with the same progress', async () => {
  const fs = fakeFirestore();
  const url = docUrl('demo', accountPath('elissa-uid'));
  const phone = emptyState();
  phone.cards.q1 = card('2026-11-01', 1);
  phone.history = [answer('q1', '2026-11-01')];
  addXp(phone, 'phone', 10);
  const laptop = emptyState();
  laptop.cards.q2 = card('2026-11-02', 1);
  laptop.history = [answer('q2', '2026-11-02', false)];
  addXp(laptop, 'laptop', 4);

  assert.equal(await pullRemote(fs.fetchFn, url, 'tok'), null);
  const phone1 = await syncOnce(fs.fetchFn, url, phone, 'tok');
  const laptop1 = await syncOnce(fs.fetchFn, url, laptop, 'tok');
  const phone2 = await syncOnce(fs.fetchFn, url, phone1, 'tok');
  assert.deepEqual(phone2, laptop1);
  assert.equal(phone2.xp, 14);
  assert.deepEqual(Object.keys(phone2.cards).sort(), ['q1', 'q2']);
  assert.equal(phone2.history.length, 2);
  assert.ok(fs.calls.some((c) => c.method === 'PATCH'));
  // Every request carries the signed-in account's token.
  assert.ok(fs.calls.every((c) => c.auth === 'Bearer tok'));
});

test('a failed upload or download throws so the caller keeps local progress', async () => {
  const down = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(pullRemote(down, 'u'), /503/);
  await assert.rejects(pushRemote(down, 'u', emptyState()), /503/);
  const denied = async () => ({ ok: false, status: 403, json: async () => ({}) });
  await assert.rejects(pullRemote(denied, 'u', 't'), (e) => e instanceof SyncError && e.status === 403);
});

test('pushRemote can ask the browser to finish the upload after the page closes', async () => {
  const { pushRemote } = await import('../src/sync.js');
  const seen = [];
  const fake = async (url, opts) => { seen.push(opts.keepalive); return { ok: true, status: 200 }; };
  await pushRemote(fake, 'u', { a: 1 }, 't', { keepalive: true });
  await pushRemote(fake, 'u', { a: 1 }, 't');
  assert.deepEqual(seen, [true, false]);
});

test('a large close-upload is gzipped to fit, and every reader understands both forms', async () => {
  const { pushRemote, pullRemote, KEEPALIVE_LIMIT } = await import('../src/sync.js');
  const big = emptyState();
  for (let i = 0; i < 985; i++) {
    big.cards[`q-${String(i).padStart(4, '0')}-some-topic`] = { ease: 2.5, interval: 6, reps: 2, due: '2026-11-20', lastReviewed: '2026-11-02', seen: 3, lapses: 0, misconception: false };
  }
  let sent = null;
  const fake = async (url, opts) => {
    if (opts.method === 'PATCH') { sent = opts.body; return { ok: true, status: 200 }; }
    return { ok: true, status: 200, json: async () => JSON.parse(sent) };
  };
  await pushRemote(fake, 'u', big, 't');
  assert.ok(sent.length > KEEPALIVE_LIMIT);
  assert.ok(!JSON.parse(sent).fields.data.stringValue.startsWith('gz:'));
  await pushRemote(fake, 'u', big, 't', { keepalive: true });
  assert.ok(sent.length < KEEPALIVE_LIMIT, `gzipped body is ${sent.length} bytes`);
  assert.ok(JSON.parse(sent).fields.data.stringValue.startsWith('gz:'));
  const back = await pullRemote(fake, 'u', 't');
  assert.equal(Object.keys(back.cards).length, Object.keys(sanitize(big).cards).length);
});
