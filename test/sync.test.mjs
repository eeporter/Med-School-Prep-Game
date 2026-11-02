import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, sanitize } from '../src/storage.js';
import {
  mergeStates, addXp, unattributedXp, markRemoved, markAdded, examKey, reportKey,
  backupText, readBackup, backupFileName, BACKUP_KIND,
  makeSyncCode, normalizeSyncCode, formatSyncCode, CODE_LENGTH,
  remoteUrl, pullRemote, pushRemote, syncOnce,
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

test('sync codes are 20 easy-to-type characters and forgive typing slips', () => {
  const code = makeSyncCode((n) => Uint8Array.from({ length: n }, (_, i) => i * 7));
  assert.equal(code.length, CODE_LENGTH);
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{20}$/);
  const shown = formatSyncCode(code);
  assert.match(shown, /^(.{5}-){3}.{5}$/);
  assert.equal(normalizeSyncCode(shown.toLowerCase()), code);
  assert.equal(normalizeSyncCode(` ${shown} `), code);
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
    calls.push({ url, method: opts.method ?? 'GET' });
    const code = /documents\/progress\/([^?]+)/.exec(url)[1];
    if ((opts.method ?? 'GET') === 'GET') {
      if (!docs.has(code)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => docs.get(code) };
    }
    docs.set(code, JSON.parse(opts.body));
    return { ok: true, status: 200, json: async () => docs.get(code) };
  };
  return { docs, calls, fetchFn };
}

const config = { projectId: 'demo-project', apiKey: 'key-123' };

test('remote URL points at one Firestore document per code', () => {
  assert.equal(remoteUrl(config, 'ABC'),
    'https://firestore.googleapis.com/v1/projects/demo-project/databases/(default)/documents/progress/ABC?key=key-123');
  assert.ok(!remoteUrl({ projectId: 'p' }, 'ABC').includes('?'));
});

test('two devices syncing through the same code end up with the same progress', async () => {
  const fs = fakeFirestore();
  const code = 'ABCDEFGHJKMNPQRSTVWX';
  const phone = emptyState();
  phone.cards.q1 = card('2026-11-01', 1);
  phone.history = [answer('q1', '2026-11-01')];
  addXp(phone, 'phone', 10);
  const laptop = emptyState();
  laptop.cards.q2 = card('2026-11-02', 1);
  laptop.history = [answer('q2', '2026-11-02', false)];
  addXp(laptop, 'laptop', 4);

  assert.equal(await pullRemote(fs.fetchFn, config, code), null);
  const phone1 = await syncOnce(fs.fetchFn, config, code, phone);
  const laptop1 = await syncOnce(fs.fetchFn, config, code, laptop);
  const phone2 = await syncOnce(fs.fetchFn, config, code, phone1);
  assert.deepEqual(phone2, laptop1);
  assert.equal(phone2.xp, 14);
  assert.deepEqual(Object.keys(phone2.cards).sort(), ['q1', 'q2']);
  assert.equal(phone2.history.length, 2);
  assert.ok(fs.calls.some((c) => c.method === 'PATCH'));
});

test('a failed upload or download throws so the caller keeps local progress', async () => {
  const down = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(pullRemote(down, config, 'X'), /503/);
  await assert.rejects(pushRemote(down, config, 'X', emptyState()), /503/);
});
