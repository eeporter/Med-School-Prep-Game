// Moving progress between devices: backup files, a synced copy per signed-in
// account, and a merge that never loses an answer. Everything here is pure
// except pullRemote and pushRemote, which take a fetch function so tests can
// stub the network.
//
// Merge rules (run the same on every device, so the result does not depend on
// which device syncs first):
//   cards    - the copy reviewed most recently wins (then the one seen more)
//   history  - every answer from either side, each kept once
//   XP       - each device's earnings are kept apart and added up, so XP
//              earned on two devices is neither lost nor counted twice
//   streak   - the one with the later study day (then the longer count)
//   exams, reports - joined, minus anything removed or cleared on any device
//              (unless it was added again after that)

import { sanitize, SCHEMA_VERSION } from './storage.js';
import { MAX_REPORTS } from './insights.js';

export const BACKUP_KIND = 'med-study-game-progress';
const MAX_HISTORY = 500;
const MAX_EXAMS = 20;

// ---- XP kept per device ----

const sumParts = (parts) => Object.values(parts).reduce((a, b) => a + b, 0);

// XP from before per-device tracking (or from an old backup) belongs to no device.
export const unattributedXp = (s) => Math.max(0, s.xp - sumParts(s.xpParts));

export function addXp(state, deviceId, gained) {
  state.xpParts[deviceId] = (state.xpParts[deviceId] || 0) + gained;
  state.xp += gained;
}

// ---- Add and remove times, so a removed exam or cleared report stays gone ----

export const examKey = (e) => `exam:${e.type}|${e.subject ?? ''}|${e.date}`;
export const reportKey = (r) => `report:${r.id}|${r.day}|${r.reason}|${r.note}`;

export function markRemoved(state, key, now = Date.now()) {
  state.removedAt = { ...state.removedAt, [key]: now };
}

// Re-adding something that was removed earlier brings it back everywhere.
export function markAdded(state, key, now = Date.now()) {
  state.addedAt = { ...state.addedAt, [key]: now };
}

const isLive = (key, addedAt, removedAt) => !(key in removedAt) || (addedAt[key] ?? 0) > removedAt[key];

function latest(x, y) {
  const out = { ...x };
  for (const [k, t] of Object.entries(y)) out[k] = Math.max(out[k] ?? 0, t);
  return out;
}

// ---- Merge ----

function pickCard(x, y) {
  if (!x) return y;
  if (!y) return x;
  const dx = x.lastReviewed ?? '';
  const dy = y.lastReviewed ?? '';
  if (dx !== dy) return dx > dy ? x : y;
  return (y.seen ?? 0) > (x.seen ?? 0) ? y : x;
}

const historyKey = (h) => `${h.id}|${h.day}|${h.correct}|${h.confidence}`;

// Keeps each answer once even after many syncs: an answer that appears n times
// on one side and m times on the other appears max(n, m) times in the result.
function mergeHistory(a, b) {
  const seen = new Map();
  for (const h of a) seen.set(historyKey(h), (seen.get(historyKey(h)) || 0) + 1);
  const out = [...a];
  const used = new Map();
  for (const h of b) {
    const k = historyKey(h);
    const n = (used.get(k) || 0) + 1;
    used.set(k, n);
    if (n > (seen.get(k) || 0)) out.push(h);
  }
  // Stable sort by day keeps same-day answers in the order they were given.
  return out
    .map((h, i) => [h, i])
    .sort(([x, i], [y, j]) => (x.day < y.day ? -1 : x.day > y.day ? 1 : i - j))
    .map(([h]) => h)
    .slice(-MAX_HISTORY);
}

function joinBy(a, b, key, live) {
  const out = new Map();
  for (const item of [...a, ...b]) {
    const k = key(item);
    if (live(k) && !out.has(k)) out.set(k, item);
  }
  return [...out.values()];
}

export function mergeStates(rawA, rawB) {
  const a = sanitize(rawA);
  const b = sanitize(rawB);
  const cards = {};
  for (const id of new Set([...Object.keys(a.cards), ...Object.keys(b.cards)])) {
    cards[id] = pickCard(a.cards[id], b.cards[id]);
  }
  const xpParts = { ...a.xpParts };
  for (const [dev, n] of Object.entries(b.xpParts)) xpParts[dev] = Math.max(xpParts[dev] || 0, n);
  const xp = sumParts(xpParts) + Math.max(unattributedXp(a), unattributedXp(b));

  const sa = a.streak;
  const sb = b.streak;
  let streak;
  if ((sa.lastDay ?? '') !== (sb.lastDay ?? '')) streak = (sa.lastDay ?? '') > (sb.lastDay ?? '') ? sa : sb;
  else streak = sa.count >= sb.count ? sa : sb;

  const addedAt = latest(a.addedAt, b.addedAt);
  const removedAt = latest(a.removedAt, b.removedAt);
  const live = (k) => isLive(k, addedAt, removedAt);
  return sanitize({
    version: SCHEMA_VERSION,
    cards,
    xp,
    xpParts,
    streak: { ...streak },
    history: mergeHistory(a.history, b.history),
    exams: joinBy(a.exams, b.exams, examKey, live).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0)).slice(0, MAX_EXAMS),
    reports: joinBy(a.reports, b.reports, reportKey, live).slice(-MAX_REPORTS),
    addedAt,
    removedAt,
  });
}

// ---- Backup files ----

export function backupText(state, exportedAt) {
  return JSON.stringify({ kind: BACKUP_KIND, exportedAt, state });
}

export function backupFileName(todayStr) {
  return `med-prep-progress-${todayStr}.json`;
}

// Accepts a backup file (or bare saved progress). Returns { state } or { error }.
export function readBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'That file is not a progress backup from this game.' };
  }
  const candidate = raw && raw.kind === BACKUP_KIND ? raw.state : raw;
  if (!candidate || typeof candidate !== 'object' || candidate.version !== SCHEMA_VERSION) {
    return { error: 'That file is not a progress backup from this game.' };
  }
  return { state: sanitize(candidate) };
}

// ---- Random codes (device ids and the hand-over from the old site) ----

// Crockford base32: no I, L, O or U. 20 characters carry 100 random bits,
// too many to guess.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 20;

export function makeSyncCode(randomBytes) {
  const bytes = randomBytes(CODE_LENGTH);
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += ALPHABET[bytes[i] % 32];
  return s;
}

// Forgiving input: any case, spaces or dashes, and I/L/O read as 1/1/0.
export function normalizeSyncCode(input) {
  if (typeof input !== 'string') return null;
  const s = input.toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  if (s.length !== CODE_LENGTH || [...s].some((c) => !ALPHABET.includes(c))) return null;
  return s;
}

// ---- Remote copy (one Firestore document, via its REST API) ----

const FIRESTORE = 'https://firestore.googleapis.com/v1';

// path is e.g. "users/<uid>" (a signed-in account) or "progress/<code>"
// (a one-time hand-over from the old site).
export function docUrl(projectId, path) {
  return `${FIRESTORE}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path}`;
}

export const accountPath = (uid) => `users/${encodeURIComponent(uid)}`;
export const handoverPath = (code) => `progress/${code}`;

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export class SyncError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Returns the saved progress, or null when nothing has been saved there yet.
export async function pullRemote(fetchFn, url, token = null) {
  const res = await fetchFn(url, { cache: 'no-store', headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new SyncError(`Sync download failed (${res.status})`, res.status);
  const doc = await res.json();
  const text = doc?.fields?.data?.stringValue;
  if (typeof text !== 'string') return null;
  return sanitize(JSON.parse(text));
}

// keepalive lets the upload finish after the page closes (browsers cap such a
// body at 64 KB, and reject a bigger one before sending it).
export async function pushRemote(fetchFn, url, state, token = null, { keepalive = false } = {}) {
  const res = await fetchFn(url, {
    method: 'PATCH',
    keepalive,
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(state) } } }),
  });
  if (!res.ok) throw new SyncError(`Sync upload failed (${res.status})`, res.status);
}

// Download, merge with this device, upload the result. Returns the merged progress.
export async function syncOnce(fetchFn, url, local, token = null) {
  const remote = await pullRemote(fetchFn, url, token);
  const merged = remote ? mergeStates(local, remote) : sanitize(local);
  await pushRemote(fetchFn, url, merged, token);
  return merged;
}

// True when there is anything worth carrying to another site.
export function hasProgress(s) {
  return Object.keys(s.cards).length > 0 || s.history.length > 0 || s.xp > 0
    || s.exams.length > 0 || s.reports.length > 0;
}
