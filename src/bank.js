// Question bank schema validation. Used by the app at load time (invalid
// questions are skipped) and by scripts/validate-bank.mjs in CI (any error
// fails the build).

export const EXAMS = Object.freeze(['usmle-step1', 'nbme']);

// NBME basic science subject exams, used as the "discipline" tag.
export const DISCIPLINES = Object.freeze([
  'Anatomy', 'Behavioral Science', 'Biochemistry', 'Histology & Cell Biology',
  'Microbiology', 'Neuroscience', 'Pathology', 'Pharmacology', 'Physiology',
  'Immunology', 'Genetics', 'Biostatistics & Epidemiology',
]);

// USMLE Step 1 organ systems.
export const SYSTEMS = Object.freeze([
  'General Principles', 'Cardiovascular', 'Respiratory', 'Renal & Urinary',
  'Gastrointestinal', 'Endocrine', 'Reproductive', 'Musculoskeletal',
  'Nervous System & Special Senses', 'Behavioral Health', 'Blood & Lymphoreticular',
  'Immune System', 'Skin & Subcutaneous Tissue', 'Multisystem',
]);

const BANNED_OPTION_TEXT = /\b(all|none) of the above\b/i;
const NEGATIVE_LEAD_IN = /\b(EXCEPT|NOT|LEAST)\b/;
// A leftover template slot such as {emi} from the batch build scripts.
const PLACEHOLDER = /\{[\w-]+\}/;

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

export function validateQuestion(q) {
  const errors = [];
  const where = q && q.id ? q.id : '(no id)';
  const err = (m) => errors.push(`${where}: ${m}`);

  if (!q || typeof q !== 'object') return ['question is not an object'];
  if (!/^[a-z0-9-]+$/.test(q.id || '')) err('id must be lowercase letters, digits, and dashes');
  if (!nonEmpty(q.stem)) err('stem is empty');
  if (!nonEmpty(q.leadIn)) err('leadIn is empty');
  else if (NEGATIVE_LEAD_IN.test(q.leadIn)) err('leadIn is negatively phrased (EXCEPT/NOT/LEAST)');
  if (!Array.isArray(q.exams) || q.exams.length === 0 || !q.exams.every((e) => EXAMS.includes(e))) {
    err(`exams must be a non-empty subset of ${EXAMS.join(', ')}`);
  }
  if (!DISCIPLINES.includes(q.discipline)) err(`unknown discipline "${q.discipline}"`);
  if (!SYSTEMS.includes(q.system)) err(`unknown system "${q.system}"`);
  if (!nonEmpty(q.topic)) err('topic is empty');
  if (![1, 2, 3].includes(q.difficulty)) err('difficulty must be 1, 2, or 3');

  // Every item has exactly 5 options, matching the bank standard and the prompt kit.
  if (!Array.isArray(q.options) || q.options.length !== 5) {
    err('options must have exactly 5 entries');
  } else {
    const ids = q.options.map((o) => o && o.id);
    if (new Set(ids).size !== ids.length) err('option ids must be unique');
    const texts = q.options.map((o) => (o && o.text ? o.text.trim().toLowerCase() : ''));
    if (new Set(texts).size !== texts.length) err('option texts must be unique');
    for (const o of q.options) {
      if (!o || !nonEmpty(o.id) || !nonEmpty(o.text)) err('every option needs an id and text');
      else if (BANNED_OPTION_TEXT.test(o.text)) err(`option ${o.id} uses all/none of the above`);
    }
    const matches = q.options.filter((o) => o && o.id === q.answer).length;
    if (matches !== 1) err('answer must match exactly one option id');
    if (!q.whyWrong || typeof q.whyWrong !== 'object') {
      err('whyWrong must explain every distractor');
    } else {
      for (const o of q.options) {
        if (o && o.id !== q.answer && !nonEmpty(q.whyWrong[o.id])) err(`whyWrong missing for option ${o.id}`);
      }
    }
  }

  if (!nonEmpty(q.explanation)) err('explanation is empty');

  const texts = [q.stem, q.leadIn, q.topic, q.explanation,
    ...(Array.isArray(q.options) ? q.options.map((o) => o && o.text) : []),
    ...(q.whyWrong && typeof q.whyWrong === 'object' ? Object.values(q.whyWrong) : []),
    ...(Array.isArray(q.sources) ? q.sources.map((s) => s && s.title) : [])];
  if (texts.some((t) => typeof t === 'string' && PLACEHOLDER.test(t))) err('text contains an unfilled {placeholder}');
  if (!Array.isArray(q.sources) || q.sources.length === 0 || !q.sources.every((s) => s && nonEmpty(s.title))) {
    err('sources must list at least one source with a title');
  } else {
    if (!q.sources.some((s) => typeof s.url === 'string' && /^https:\/\/\S+$/.test(s.url))) {
      err('at least one source needs an https url the auditor can open');
    }
    for (const s of q.sources) {
      if (s.url !== undefined && !/^https:\/\/\S+$/.test(s.url)) err(`source url must be https: ${s.url}`);
    }
  }
  // Optional "Read more" links for the student. These are not sources: the
  // facts in the question must still be backed by `sources`.
  if (q.readMore !== undefined) {
    if (!Array.isArray(q.readMore) || !q.readMore.every((r) => r && nonEmpty(r.title) && typeof r.url === 'string' && /^https:\/\/\S+$/.test(r.url))) {
      err('readMore must list links with a title and an https url');
    }
  }
  return errors;
}

export function validateBank(bank) {
  const errors = [];
  if (!bank || !Array.isArray(bank.questions)) return ['bank.questions must be an array'];
  const seen = new Set();
  for (const q of bank.questions) {
    errors.push(...validateQuestion(q));
    if (q && q.id) {
      if (seen.has(q.id)) errors.push(`${q.id}: duplicate id`);
      seen.add(q.id);
    }
  }
  return errors;
}

// Keep only valid, uniquely-identified questions (used by the browser app).
export function usableQuestions(bank) {
  const seen = new Set();
  const out = [];
  for (const q of (bank && bank.questions) || []) {
    if (validateQuestion(q).length === 0 && !seen.has(q.id)) {
      seen.add(q.id);
      out.push(q);
    }
  }
  return out;
}
