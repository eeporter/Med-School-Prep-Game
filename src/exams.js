// Exam profiles: what each test covers, how long it is, and how it is paced.
// Formats and content weights come from the official pages, checked 2026-10-27:
//   USMLE Step 1 exam content and content outline (usmle.org)
//   NBME Subject Exam Timing Chart, CBSE content outline, CBSSA page (nbme.org)
// Every one of these exams works out to about 90 seconds per question.

import { daysBetween } from './dates.js';
import { shuffle } from './quiz.js';

export const SECONDS_PER_QUESTION = 90;

// USMLE moved Step 1 to fourteen 30-minute blocks of up to 20 questions for
// tests on or after this date (previously seven 60-minute blocks of up to 40).
export const STEP1_NEW_FORMAT_FROM = '2026-05-14';

// NBME basic science subject exams that map onto a discipline in the bank.
// Items and minutes are from the NBME Subject Exam Timing Chart.
export const SUBJECT_EXAMS = Object.freeze({
  'Behavioral Science': { disciplines: ['Behavioral Science'], items: 125, minutes: 188 },
  'Biochemistry': { disciplines: ['Biochemistry'], items: 125, minutes: 188 },
  'Gross Anatomy': { disciplines: ['Anatomy'], items: 125, minutes: 188 },
  'Gross Anatomy & Embryology': { disciplines: ['Anatomy'], items: 145, minutes: 218 },
  'Histology & Cell Biology': { disciplines: ['Histology & Cell Biology'], items: 125, minutes: 188 },
  'Microbiology': { disciplines: ['Microbiology'], items: 125, minutes: 188 },
  'Microbiology & Immunology': { disciplines: ['Microbiology', 'Immunology'], items: 150, minutes: 225 },
  'Neuroscience': { disciplines: ['Neuroscience'], items: 125, minutes: 188 },
  'Pathology': { disciplines: ['Pathology'], items: 125, minutes: 188 },
  'Pharmacology': { disciplines: ['Pharmacology'], items: 125, minutes: 188 },
  'Physiology': { disciplines: ['Physiology'], items: 125, minutes: 188 },
});

// Step 1 system specifications (midpoint of each published % range), mapped
// onto the bank's systems. The CBSE uses the same outline. Combined outline
// categories are split evenly between the bank's systems. The bank tags
// biostatistics, ethics and communication (social sciences) and human
// development as General Principles, so those weights go there.
const STEP1_WEIGHTS = Object.freeze({
  'Blood & Lymphoreticular': 11 / 2,
  'Immune System': 11 / 2,
  'Behavioral Health': 12 / 2,
  'Nervous System & Special Senses': 12 / 2,
  'Musculoskeletal': 10 / 2,
  'Skin & Subcutaneous Tissue': 10 / 2,
  'Cardiovascular': 9,
  'Respiratory': 13 / 2,
  'Renal & Urinary': 13 / 2,
  'Gastrointestinal': 8,
  'Reproductive': 14 / 2,
  'Endocrine': 14 / 2,
  'Multisystem': 10,
  'General Principles': 5 + 7.5 + 2,
});

export const EXAM_TYPES = Object.freeze({
  'usmle-step1': { name: 'USMLE Step 1' },
  'nbme-cbse': { name: 'NBME Comprehensive Basic Science Exam (CBSE)' },
  'nbme-cbssa': { name: 'NBME Comprehensive Basic Science Self-Assessment (CBSSA)' },
  'nbme-subject': { name: 'NBME subject exam' },
});

export function examLabel(exam) {
  if (exam.type === 'nbme-subject') return `NBME ${exam.subject} subject exam`;
  return EXAM_TYPES[exam.type]?.name ?? exam.type;
}

// Format facts for one exam on its test date.
export function examFormat(exam) {
  switch (exam.type) {
    case 'usmle-step1':
      return exam.date >= STEP1_NEW_FORMAT_FROM
        ? { blockSize: 20, blockMinutes: 30, summary: 'fourteen 30-minute blocks of up to 20 questions' }
        : { blockSize: 40, blockMinutes: 60, summary: 'seven 60-minute blocks of up to 40 questions' };
    case 'nbme-cbssa':
      return { blockSize: 50, blockMinutes: 75, summary: 'four 75-minute sections of 50 questions' };
    case 'nbme-cbse':
      return { blockSize: 20, blockMinutes: 30, summary: '200 questions in 5 hours (about 90 seconds each)' };
    case 'nbme-subject': {
      const s = SUBJECT_EXAMS[exam.subject];
      return { blockSize: 20, blockMinutes: 30, summary: `${s.items} questions in ${Math.floor(s.minutes / 60)} h ${s.minutes % 60} min (about 90 seconds each)` };
    }
    default:
      return { blockSize: 20, blockMinutes: 30, summary: '' };
  }
}

// Which questions are in scope, and how much weight each organ system gets.
export function examScope(exam) {
  if (exam.type === 'nbme-subject') {
    const { disciplines } = SUBJECT_EXAMS[exam.subject];
    return { inScope: (q) => disciplines.includes(q.discipline), weight: () => 1, focus: `come from ${disciplines.join(' and ')} first` };
  }
  const tag = exam.type === 'nbme-cbse' ? 'nbme' : 'usmle-step1';
  return {
    inScope: (q) => q.exams.includes(tag),
    weight: (q) => STEP1_WEIGHTS[q.system] ?? 1,
    focus: 'are spread across organ systems in the proportions of the Step 1 content outline',
  };
}

export function isValidExam(e) {
  if (!e || typeof e !== 'object' || !EXAM_TYPES[e.type] || typeof e.date !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return false;
  if (e.type === 'nbme-subject') return Object.hasOwn(SUBJECT_EXAMS, e.subject);
  return true;
}

// The soonest exam that is today or later, or null.
export function nextExam(exams, todayStr) {
  const upcoming = exams.filter((e) => daysBetween(todayStr, e.date) >= 0);
  upcoming.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return upcoming[0] ?? null;
}

// Draw up to n questions without replacement so each system's share follows
// its weight rather than how many questions the bank happens to hold: a
// question's chance is its system's weight divided by the number of questions
// from that system still in the pool.
export function weightedSample(questions, n, weight, rng = Math.random) {
  const pool = shuffle(questions, rng);
  const out = [];
  while (out.length < n && pool.length) {
    const counts = new Map();
    for (const q of pool) counts.set(q.system, (counts.get(q.system) || 0) + 1);
    const w = pool.map((q) => weight(q) / counts.get(q.system));
    let r = rng() * w.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < pool.length - 1 && r >= w[i]) r -= w[i++];
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
