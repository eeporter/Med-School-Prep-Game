// Pure quiz logic: option shuffling, answer checking, XP, and interleaving.

export function shuffle(items, rng = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle a question's options for display. Each displayed option keeps its
// original id, so grading always compares ids, never display positions.
// Leading number of an option such as "7.5 mL/min" or "10%", or NaN.
function leadingNumber(text) {
  const m = /^\s*[<>≤≥~]?\s*(-?\d[\d,]*(?:\.\d+)?)/.exec(text);
  return m ? Number(m[1].replace(/,/g, '')) : NaN;
}

// NBME lists numeric options in numeric order, so those are sorted instead
// of shuffled. Everything else is shuffled.
export function presentQuestion(question, rng = Math.random) {
  const numeric = question.options.every((o) => Number.isFinite(leadingNumber(o.text)));
  const options = numeric
    ? [...question.options].sort((a, b) => leadingNumber(a.text) - leadingNumber(b.text) || a.text.localeCompare(b.text))
    : shuffle(question.options, rng);
  return {
    id: question.id,
    options: options.map((o, i) => ({ id: o.id, text: o.text, label: String.fromCharCode(65 + i) })),
  };
}

export function isCorrect(question, chosenOptionId) {
  return chosenOptionId === question.answer;
}

// XP rewards accuracy and spacing, never speed. Guesses that happen to be
// right earn less than confident knowledge, so guessing is not a strategy.
export const XP = Object.freeze({ sure: 10, unsure: 8, guess: 4, reviewBonus: 5 });

export function xpFor({ correct, confidence, wasDueReview }) {
  if (!correct) return 0;
  return XP[confidence] + (wasDueReview ? XP.reviewBonus : 0);
}

export const LEVELS = Object.freeze([
  { name: 'MS1', xp: 0 },
  { name: 'MS2', xp: 250 },
  { name: 'MS3', xp: 750 },
  { name: 'MS4', xp: 1500 },
  { name: 'Intern', xp: 3000 },
  { name: 'Resident', xp: 6000 },
  { name: 'Chief Resident', xp: 10000 },
  { name: 'Attending', xp: 16000 },
]);

export function levelFor(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) current = l;
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  return { name: current.name, index: idx, next };
}

// Order questions so consecutive items come from different organ systems
// whenever possible (interleaved practice). Greedy: repeatedly take a random
// question whose system differs from the previous one.
export function interleave(questions, key = (q) => q.system, rng = Math.random) {
  const pool = shuffle(questions, rng);
  const out = [];
  while (pool.length) {
    const prev = out.length ? key(out[out.length - 1]) : undefined;
    let idx = pool.findIndex((q) => key(q) !== prev);
    if (idx === -1) idx = 0;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// A question needs relearning in the same session when it was missed or only
// guessed right (SM-2 grade below 4). Wozniak's SM-2 repeats such items at the
// end of the day's session until they score at least 4, and successive
// relearning (Rawson & Dunlosky) retrieves each item to criterion in every
// spaced session.
export function needsRelearning(correct, confidence) {
  return !correct || confidence === 'guess';
}

// Share of "sure" answers that were right, or null if there are none.
export function sureAccuracy(history) {
  const sure = history.filter((h) => h.confidence === 'sure');
  if (!sure.length) return null;
  return { right: sure.filter((h) => h.correct).length, total: sure.length };
}

export function updateStreak(streak, todayStr, daysBetweenFn) {
  const s = { count: 0, lastDay: null, ...streak };
  if (s.lastDay === todayStr) return s;
  const gap = s.lastDay ? daysBetweenFn(s.lastDay, todayStr) : null;
  return { count: gap === 1 ? s.count + 1 : 1, lastDay: todayStr };
}

// Focus picks. Topics are keyed by system too, because the same topic name
// (for example acid-base compensation) can sit under more than one system.
export function topicKey(q) {
  return `${q.system}|${q.topic}`;
}

// A question joins a Focus drill if it matches any pick: a ticked NBME subject,
// a ticked topic, or (with "missed" on) a question she is still struggling with.
export function matchesFocus(q, { subjects = [], topics = [], missed = false } = {}, struggling = false) {
  return subjects.includes(q.discipline) || topics.includes(topicKey(q)) || (missed && struggling);
}
