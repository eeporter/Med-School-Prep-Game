// Progress persistence. Every read and write is wrapped so a missing,
// blocked, or corrupt localStorage never crashes the app.

export const STORAGE_KEY = 'med-study-game:v1';
export const SCHEMA_VERSION = 1;

export function emptyState() {
  return { version: SCHEMA_VERSION, cards: {}, xp: 0, streak: { count: 0, lastDay: null }, history: [] };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function sanitize(raw) {
  const base = emptyState();
  if (!isObj(raw) || raw.version !== SCHEMA_VERSION) return base;
  const cards = {};
  if (isObj(raw.cards)) {
    for (const [id, c] of Object.entries(raw.cards)) {
      if (isObj(c) && Number.isFinite(c.interval) && Number.isFinite(c.ease) && Number.isFinite(c.reps)) {
        cards[id] = c;
      }
    }
  }
  return {
    version: SCHEMA_VERSION,
    cards,
    xp: Number.isFinite(raw.xp) && raw.xp >= 0 ? raw.xp : 0,
    streak: isObj(raw.streak) && Number.isFinite(raw.streak.count) ? raw.streak : base.streak,
    history: Array.isArray(raw.history) ? raw.history.slice(-500) : [],
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
