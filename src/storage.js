// Progress persistence. Every read and write is wrapped so a missing,
// blocked, or corrupt localStorage never crashes the app.

import { isValidExam } from './exams.js';
import { sanitizeReports } from './insights.js';

export const STORAGE_KEY = 'med-study-game:v1';
export const SCHEMA_VERSION = 1;

export function emptyState() {
  return { version: SCHEMA_VERSION, cards: {}, xp: 0, streak: { count: 0, lastDay: null }, history: [], exams: [], reports: [], xpParts: {}, addedAt: {}, removedAt: {} };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A real calendar day in "YYYY-MM-DD" form (rejects "2026-02-30" and junk).
export function isDayString(v) {
  if (typeof v !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
}

function sanitizeCard(c) {
  if (!isObj(c) || !Number.isFinite(c.interval) || !Number.isFinite(c.ease) || !Number.isFinite(c.reps)) return null;
  const card = { ...c };
  // A corrupt due date would make the card impossible to schedule; make it due now.
  if (card.due !== null && !isDayString(card.due)) card.due = null;
  if (card.lastReviewed !== undefined && !isDayString(card.lastReviewed)) delete card.lastReviewed;
  return card;
}

// When each exam or report was last added or removed (milliseconds), so a
// sync can tell a removal from an older copy apart from a later re-add.
function sanitizeTimes(raw) {
  if (!isObj(raw)) return {};
  const entries = Object.entries(raw).filter(([k, t]) => k.length <= 800 && Number.isFinite(t) && t >= 0);
  entries.sort((x, y) => y[1] - x[1]);
  return Object.fromEntries(entries.slice(0, 500));
}

// XP earned on each device (see sync.js), keyed by a random device id.
function sanitizeXpParts(raw) {
  const parts = {};
  if (!isObj(raw)) return parts;
  for (const [dev, n] of Object.entries(raw).slice(0, 50)) {
    if (typeof dev === 'string' && dev.length <= 64 && Number.isFinite(n) && n >= 0) parts[dev] = n;
  }
  return parts;
}

export function sanitize(raw) {
  const base = emptyState();
  if (!isObj(raw) || raw.version !== SCHEMA_VERSION) return base;
  const cards = {};
  if (isObj(raw.cards)) {
    for (const [id, c] of Object.entries(raw.cards)) {
      const card = sanitizeCard(c);
      if (card) cards[id] = card;
    }
  }
  const streakOk = isObj(raw.streak) && Number.isFinite(raw.streak.count) && raw.streak.count >= 0
    && (raw.streak.lastDay === null || isDayString(raw.streak.lastDay));
  return {
    version: SCHEMA_VERSION,
    cards,
    xp: Number.isFinite(raw.xp) && raw.xp >= 0 ? raw.xp : 0,
    streak: streakOk ? raw.streak : base.streak,
    history: Array.isArray(raw.history) ? raw.history.slice(-500) : [],
    exams: Array.isArray(raw.exams)
      ? raw.exams.filter((e) => isValidExam(e) && isDayString(e.date)).slice(0, 20)
        .map((e) => (e.type === 'nbme-subject' ? { type: e.type, subject: e.subject, date: e.date } : { type: e.type, date: e.date }))
      : [],
    reports: sanitizeReports(raw.reports),
    xpParts: sanitizeXpParts(raw.xpParts),
    addedAt: sanitizeTimes(raw.addedAt),
    removedAt: sanitizeTimes(raw.removedAt),
  };
}

export function load(storage) {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    if (!text) return emptyState();
    return sanitize(JSON.parse(text));
  } catch {
    return emptyState();
  }
}

export function save(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
