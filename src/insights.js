// Weak spots and question reports. Pure functions: the UI turns their text
// into lists and copy buttons.

import { topicKey } from './quiz.js';

export const REPORT_REASONS = Object.freeze({
  unclear: 'Question is unclear',
  wrong: 'Answer or explanation seems wrong',
  typo: 'Typo or formatting problem',
  other: 'Something else',
});

export const MAX_REPORTS = 200;
export const MAX_NOTE = 500;

// Topics ranked weakest first, from first-of-the-day answers in history.
// A miss counts 2, a miss while "sure" counts 2 more (a misconception), and
// a right answer that was only a guess counts 1. Topics with no misses and
// no lucky guesses are left out.
export function weakSpots(history, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const spots = new Map();
  for (const h of history) {
    const q = byId.get(h.id);
    if (!q) continue;
    const key = topicKey(q);
    let s = spots.get(key);
    if (!s) {
      s = { key, topic: q.topic, system: q.system, attempts: 0, misses: 0, sureWrong: 0, guessedRight: 0, lastDay: '', ids: [] };
      spots.set(key, s);
    }
    s.attempts += 1;
    if (h.day > s.lastDay) s.lastDay = h.day;
    const weak = !h.correct || h.confidence === 'guess';
    if (!h.correct) s.misses += 1;
    if (!h.correct && h.confidence === 'sure') s.sureWrong += 1;
    if (h.correct && h.confidence === 'guess') s.guessedRight += 1;
    if (weak) {
      s.ids = s.ids.filter((id) => id !== q.id);
      s.ids.unshift(q.id);
    }
  }
  const score = (s) => 2 * s.misses + 2 * s.sureWrong + s.guessedRight;
  return [...spots.values()]
    .filter((s) => s.misses > 0 || s.guessedRight > 0)
    .map((s) => ({ ...s, score: score(s) }))
    .sort((a, b) => b.score - a.score || b.misses / b.attempts - a.misses / a.attempts
      || (a.lastDay < b.lastDay ? 1 : a.lastDay > b.lastDay ? -1 : 0) || a.key.localeCompare(b.key));
}

export function describeSpot(s) {
  const parts = [`missed ${s.misses} of ${s.attempts}`];
  if (s.sureWrong) parts.push(`wrong while sure ${s.sureWrong} time${s.sureWrong === 1 ? '' : 's'}`);
  if (s.guessedRight) parts.push(`right only by guessing ${s.guessedRight} time${s.guessedRight === 1 ? '' : 's'}`);
  return parts.join('; ');
}

// A ready-to-paste request for Elissa's own Claude (the study buddy or guide
// writer in her prompt kit), weakest topics first.
export function weakSpotsText(spots, questions, todayStr, limit = 20) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const lines = [
    `From my Med School Prep study game (${todayStr}): the concepts I am struggling with, weakest first.`,
    '',
  ];
  spots.slice(0, limit).forEach((s, i) => {
    lines.push(`${i + 1}. ${s.topic} (${s.system}): ${describeSpot(s)}.`);
    for (const id of s.ids.slice(0, 2)) {
      const q = byId.get(id);
      const key = q.options.find((o) => o.id === q.answer).text;
      lines.push(`   - Question: "${q.leadIn}" Correct answer: ${key}.`);
    }
  });
  lines.push('',
    'Please add each topic to struggle-log.md (source: study game), then write study guides for the top topics that are not covered yet, following the guide writer instructions. Explain the "why" behind each correct answer above.');
  return lines.join('\n');
}

export function sanitizeReports(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === 'object' && typeof r.id === 'string' && r.id.length <= 100
      && typeof r.day === 'string' && Object.hasOwn(REPORT_REASONS, r.reason))
    .map((r) => {
      const clean = { id: r.id, day: r.day, reason: r.reason, note: typeof r.note === 'string' ? r.note.slice(0, MAX_NOTE) : '' };
      // The option id in the question file, not the shuffled on-screen letter.
      if (typeof r.choice === 'string' && r.choice.length <= 100) clean.choice = r.choice;
      return clean;
    })
    .slice(-MAX_REPORTS);
}

export function addReport(reports, report) {
  return sanitizeReports([...reports, report]);
}

// A ready-to-paste report for Elissa's own Claude (the "Fix a reported
// question" prompt in docs/claude-prompts.md), which checks each question and
// fixes it in the game if she is right. Options are named by their id in the
// question file because on-screen letters are shuffled.
export function reportsText(reports, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const n = reports.length;
  const optionLine = (q, id) => `${q.options.find((o) => o.id === id)?.text ?? '(option not found)'} (option ${id} in the question file)`;
  const blocks = reports.map((r, i) => {
    const q = byId.get(r.id);
    const lines = [`Report ${i + 1} of ${n}`, `Date: ${r.day}`, `Question id: ${r.id}`];
    const mine = (text) => `My answer: ${r.choice ? text : 'not saved (reported before this update)'}`;
    if (q) {
      lines.push(`Question starts: ${q.stem.split(/(?<=[.?!])\s/)[0]}`, mine(r.choice && optionLine(q, r.choice)),
        `Keyed answer: ${optionLine(q, q.answer)}`);
    } else {
      lines.push('Question starts: (not found in the current question bank)', mine(`option ${r.choice} in the question file`));
    }
    lines.push(`Problem: ${REPORT_REASONS[r.reason]}`, `My note: ${r.note || '(none)'}`);
    return lines.join('\n');
  });
  return [`Question report from my Med School Prep study game (${n} report${n === 1 ? '' : 's'})`, '', blocks.join('\n\n')].join('\n');
}
