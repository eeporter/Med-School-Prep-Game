// Spaced repetition based on SM-2 (Wozniak, 1990), with the quality grade
// derived from correctness plus the learner's confidence rating.
//
//   wrong (any confidence) -> 1  (relearn: due tomorrow, reps reset)
//   right, "guess"         -> 3
//   right, "unsure"        -> 4
//   right, "sure"          -> 5
//
// A confident wrong answer is tracked separately as a misconception so it
// can be surfaced for review (high-confidence errors are the ones most
// readily corrected by feedback; Butterfield & Metcalfe, 2001).

import { addDays, daysBetween } from './dates.js';

export const MIN_EASE = 1.3;
export const START_EASE = 2.5;
export const MASTERED_INTERVAL = 21;

export const CONFIDENCE = Object.freeze(['guess', 'unsure', 'sure']);

export function newCard() {
  return { reps: 0, interval: 0, ease: START_EASE, due: null, lapses: 0, seen: 0, misconception: false };
}

export function gradeFor(correct, confidence) {
  if (!CONFIDENCE.includes(confidence)) throw new Error(`Unknown confidence: ${confidence}`);
  if (!correct) return 1;
  return { guess: 3, unsure: 4, sure: 5 }[confidence];
}

export function nextEase(ease, q) {
  const updated = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASE, Math.round(updated * 1000) / 1000);
}

// Returns a new card state; never mutates the input.
export function review(card, { correct, confidence }, todayStr) {
  const q = gradeFor(correct, confidence);
  const prev = { ...newCard(), ...card };
  const ease = nextEase(prev.ease, q);
  let reps;
  let interval;
  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps = prev.reps + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.max(prev.interval + 1, Math.round(prev.interval * ease));
  }
  return {
    reps,
    interval,
    ease,
    due: addDays(todayStr, interval),
    lapses: prev.lapses + (correct ? 0 : 1),
    seen: prev.seen + 1,
    misconception: !correct && confidence === 'sure' ? true : correct ? false : prev.misconception,
    lastReviewed: todayStr,
  };
}

export function isDue(card, todayStr) {
  if (!card || !card.due) return false;
  return daysBetween(card.due, todayStr) >= 0;
}

export function isMastered(card) {
  return Boolean(card) && card.interval >= MASTERED_INTERVAL;
}
