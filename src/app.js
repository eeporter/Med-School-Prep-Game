// Browser UI. All question text is rendered with textContent, never innerHTML.

import { usableQuestions, DISCIPLINES, SYSTEMS } from './bank.js';
import { review, isDue, isMastered, isStruggling, newCard } from './scheduler.js';
import { presentQuestion, isCorrect, xpFor, levelFor, interleave, shuffle, updateStreak, topicKey, matchesFocus } from './quiz.js';
import { load, save } from './storage.js';
import { today, daysBetween } from './dates.js';

const NEW_PER_ROUNDS = 10;
const FOCUS_KEY = 'med-prep-focus';
const SECONDS_PER_BLOCK_QUESTION = 90;

const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};

let storage = null;
try { storage = window.localStorage; } catch { storage = null; }

let state = load(storage);
let questions = [];
let session = null;
let focus = loadFocus();
let focusChecks = [];

function persist() {
  if (!save(storage, state)) console.warn('Progress could not be saved (storage unavailable).');
}

function show(view) {
  for (const v of ['home', 'quiz', 'summary']) $(`view-${v}`).hidden = v !== view;
  window.scrollTo(0, 0);
}

function renderStats() {
  const lvl = levelFor(state.xp);
  $('stat-level').textContent = lvl.name;
  $('stat-xp').textContent = `${state.xp} XP${lvl.next ? ` / ${lvl.next.xp}` : ''}`;
  const t = today();
  const alive = state.streak.lastDay && daysBetween(state.streak.lastDay, t) <= 1;
  $('stat-streak').textContent = `${alive ? state.streak.count : 0}-day streak`;
}

function renderHome() {
  renderStats();
  const t = today();
  const due = questions.filter((q) => isDue(state.cards[q.id], t)).length;
  const unseen = questions.filter((q) => !state.cards[q.id]).length;
  $('due-summary').textContent = `${due} due for review, ${unseen} not yet seen.`;

  if (!focusChecks.length) buildFocusPicker();
  focusChanged();

  const list = $('mastery-list');
  list.replaceChildren();
  for (const sys of SYSTEMS) {
    const qs = questions.filter((q) => q.system === sys);
    if (!qs.length) continue;
    const mastered = qs.filter((q) => isMastered(state.cards[q.id])).length;
    const li = el('li');
    li.appendChild(el('span', sys));
    const bar = document.createElement('progress');
    bar.max = qs.length;
    bar.value = mastered;
    bar.setAttribute('aria-label', `${sys}: ${mastered} of ${qs.length} mastered`);
    li.appendChild(bar);
    li.appendChild(el('span', `${mastered}/${qs.length}`, 'meta'));
    list.appendChild(li);
  }
  const mis = questions.filter((q) => state.cards[q.id]?.misconception).length;
  $('misconception-summary').textContent = mis
    ? `${mis} confident miss${mis === 1 ? '' : 'es'} queued for extra review. These are the facts most worth fixing.`
    : '';
  show('home');
}

// Focus picks are a per-device convenience, kept apart from progress so a bad
// value here can never touch the review schedule.
function loadFocus() {
  const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  try {
    const raw = JSON.parse(storage?.getItem(FOCUS_KEY) || '{}') || {};
    return { subjects: strings(raw.subjects), topics: strings(raw.topics), missed: raw.missed === true };
  } catch {
    return { subjects: [], topics: [], missed: false };
  }
}

function saveFocus() {
  try { storage?.setItem(FOCUS_KEY, JSON.stringify(focus)); } catch { /* not saved; picks reset next visit */ }
}

function focusQuestions() {
  return questions.filter((q) => matchesFocus(q, focus, isStruggling(state.cards[q.id])));
}

function setPick(list, value, on) {
  const i = list.indexOf(value);
  if (on && i === -1) list.push(value);
  if (!on && i !== -1) list.splice(i, 1);
}

// A checkbox row. sync() redraws it from the current picks.
function check(text, sync, onChange) {
  const label = el('label', null, 'check');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.addEventListener('change', () => { onChange(input.checked); focusChanged(); });
  label.append(input, el('span', text));
  focusChecks.push(() => sync(input));
  return label;
}

function buildFocusPicker() {
  const allKeys = new Set(questions.map(topicKey));
  focus.topics = focus.topics.filter((k) => allKeys.has(k));

  $('focus-missed').addEventListener('change', (e) => { focus.missed = e.target.checked; focusChanged(); });
  focusChecks.push(() => { $('focus-missed').checked = focus.missed; });

  const subjects = $('focus-subjects');
  for (const d of DISCIPLINES) {
    const n = questions.filter((q) => q.discipline === d).length;
    if (!n) continue;
    subjects.appendChild(check(`${d} (${n})`, (i) => { i.checked = focus.subjects.includes(d); }, (on) => setPick(focus.subjects, d, on)));
  }

  const systems = $('focus-systems');
  for (const sys of SYSTEMS) {
    const qs = questions.filter((q) => q.system === sys);
    if (!qs.length) continue;
    const keys = [...new Set(qs.map(topicKey))].sort((a, b) => a.localeCompare(b));
    const group = el('details', null, 'sys');
    group.dataset.name = sys.toLowerCase();
    group.appendChild(el('summary', `${sys} (${qs.length})`));
    const all = check(`All of ${sys}`, (i) => {
      const picked = keys.filter((k) => focus.topics.includes(k)).length;
      i.checked = picked === keys.length;
      i.indeterminate = picked > 0 && picked < keys.length;
    }, (on) => { for (const k of keys) setPick(focus.topics, k, on); });
    all.classList.add('all');
    group.appendChild(all);
    for (const k of keys) {
      const topic = k.slice(sys.length + 1);
      const n = qs.filter((q) => topicKey(q) === k).length;
      const row = check(`${topic} (${n})`, (i) => { i.checked = focus.topics.includes(k); }, (on) => setPick(focus.topics, k, on));
      row.dataset.topic = topic.toLowerCase();
      group.appendChild(row);
    }
    systems.appendChild(group);
  }
}

// Typing in "Find a topic" opens the systems that contain a match and hides
// the topics that do not. A system-name match shows that whole system.
function filterTopics() {
  const term = $('focus-search').value.trim().toLowerCase();
  for (const group of $('focus-systems').children) {
    const sysHit = term && group.dataset.name.includes(term);
    let any = false;
    for (const row of group.querySelectorAll('[data-topic]')) {
      const hit = !term || sysHit || row.dataset.topic.includes(term);
      row.hidden = !hit;
      any ||= hit;
    }
    group.hidden = !any;
    if (term) group.open = any;
  }
}

function focusChanged() {
  for (const sync of focusChecks) sync();
  saveFocus();
  const struggling = questions.filter((q) => isStruggling(state.cards[q.id])).length;
  $('focus-missed-label').textContent = `Questions I have missed and not yet mastered (${struggling})`;
  const n = focusQuestions().length;
  $('focus-count').textContent = n ? `${n} question${n === 1 ? '' : 's'} picked.` : 'Nothing picked yet. Tick at least one box above.';
  $('focus-start').disabled = n === 0;
}

function buildQueue(mode) {
  const t = today();
  if (mode === 'rounds') {
    const due = questions.filter((q) => isDue(state.cards[q.id], t));
    const misses = due.filter((q) => state.cards[q.id].misconception);
    const rest = due.filter((q) => !state.cards[q.id].misconception);
    const fresh = shuffle(questions.filter((q) => !state.cards[q.id])).slice(0, NEW_PER_ROUNDS);
    // Confident misses come first (interleaved among themselves), then the rest.
    return [...interleave(misses), ...interleave([...rest, ...fresh])];
  }
  if (mode === 'focus') {
    // Mix the picked topics rather than running them in blocks.
    return interleave(focusQuestions(), (q) => q.topic);
  }
  const exam = $('exam-select').value;
  const size = Number($('block-size').value);
  return interleave(questions.filter((q) => q.exams.includes(exam))).slice(0, size);
}

function startSession(mode) {
  const queue = buildQueue(mode);
  if (!queue.length) {
    alert(mode === 'rounds' ? 'Nothing due right now. Come back tomorrow, or try Focus.' : 'No questions match that choice yet.');
    return;
  }
  session = {
    mode, queue, index: 0, answers: [], xpEarned: 0,
    deadline: mode === 'block' ? Date.now() + queue.length * SECONDS_PER_BLOCK_QUESTION * 1000 : null,
  };
  if (session.deadline) tickTimer();
  showQuestion();
}

function tickTimer() {
  if (!session || !session.deadline) return;
  const left = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
  $('quiz-timer').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  if (left === 0) return finishSession();
  session.timer = setTimeout(tickTimer, 1000);
}

function showQuestion() {
  const q = session.queue[session.index];
  session.current = { q, presented: presentQuestion(q), choice: null };
  $('quiz-progress').textContent = `Question ${session.index + 1} of ${session.queue.length}`;
  $('quiz-tags').textContent = session.mode === 'block' ? '' : `${q.discipline} · ${q.system}`;
  if (!session.deadline) $('quiz-timer').textContent = '';
  $('q-stem').textContent = q.stem;
  $('q-leadin').textContent = q.leadIn;

  const box = $('q-options');
  box.replaceChildren(box.querySelector('legend'));
  for (const opt of session.current.presented.options) {
    const label = el('label', null, 'option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = opt.id;
    input.addEventListener('change', () => {
      session.current.choice = opt.id;
      $('confidence').hidden = false;
    });
    label.appendChild(input);
    label.appendChild(el('span', `${opt.label}. `, 'opt-label'));
    label.appendChild(el('span', opt.text));
    box.appendChild(label);
  }
  box.disabled = false;
  $('confidence').hidden = true;
  $('feedback').hidden = true;
  show('quiz');
  box.querySelector('input')?.focus();
}

function answer(confidence) {
  const cur = session.current;
  if (!cur || !cur.choice || cur.confidence) return;
  cur.confidence = confidence;
  const t = today();
  const card = state.cards[cur.q.id] || newCard();
  const wasDueReview = isDue(card, t);
  const correct = isCorrect(cur.q, cur.choice);
  const gained = xpFor({ correct, confidence, wasDueReview });

  state.cards[cur.q.id] = review(card, { correct, confidence }, t);
  state.xp += gained;
  state.streak = updateStreak(state.streak, t, daysBetween);
  state.history.push({ id: cur.q.id, day: t, correct, confidence });
  persist();

  session.xpEarned += gained;
  session.answers.push({ q: cur.q, presented: cur.presented, choice: cur.choice, correct, confidence });
  $('q-options').disabled = true;
  $('confidence').hidden = true;

  if (session.mode === 'block') return advance();
  renderFeedback(cur.q, cur.presented, cur.choice, correct, confidence, gained);
  renderStats();
}

function labelOf(presented, id) {
  return presented.options.find((o) => o.id === id)?.label;
}

function renderFeedback(q, presented, choice, correct, confidence, gained) {
  const key = labelOf(presented, q.answer);
  const keyText = q.options.find((o) => o.id === q.answer).text;
  let msg = correct ? `Correct: ${key}. ${keyText}` : `Not quite. The answer is ${key}. ${keyText}`;
  if (correct && gained) msg += `  (+${gained} XP)`;
  if (!correct && confidence === 'sure') msg += '. You were sure, so this one comes back tomorrow.';
  const res = $('fb-result');
  res.textContent = msg;
  res.className = `result ${correct ? 'ok' : 'bad'}`;
  $('fb-explanation').textContent = q.explanation;

  const ww = $('fb-whywrong');
  ww.replaceChildren();
  // The option the learner picked is explained first.
  const order = presented.options.filter((o) => o.id !== q.answer)
    .sort((a, b) => (b.id === choice) - (a.id === choice));
  for (const o of order) {
    const li = el('li', null, o.id === choice ? 'picked' : '');
    li.appendChild(el('strong', `${o.label}. ${o.text}: `));
    li.appendChild(el('span', q.whyWrong[o.id]));
    ww.appendChild(li);
  }

  const src = $('fb-sources');
  src.replaceChildren();
  for (const s of q.sources) {
    const li = el('li');
    if (s.url && /^https:\/\//.test(s.url)) {
      const a = el('a', s.title);
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      li.appendChild(a);
    } else {
      li.textContent = s.title;
    }
    src.appendChild(li);
  }

  for (const label of $('q-options').querySelectorAll('label')) {
    const id = label.querySelector('input').value;
    if (id === q.answer) label.classList.add('key');
    else if (id === choice) label.classList.add('wrong');
  }
  $('feedback').hidden = false;
  $('next-btn').focus();
}

function advance() {
  session.index += 1;
  if (session.index >= session.queue.length) return finishSession();
  showQuestion();
}

function finishSession() {
  clearTimeout(session.timer);
  const n = session.answers.length;
  const right = session.answers.filter((a) => a.correct).length;
  $('sum-score').textContent = n ? `${right} / ${n} correct (${Math.round((100 * right) / n)}%)` : 'No questions answered.';
  $('sum-xp').textContent = `+${session.xpEarned} XP this session`;

  const sure = session.answers.filter((a) => a.confidence === 'sure');
  const sureRight = sure.filter((a) => a.correct).length;
  $('sum-calibration').textContent = sure.length
    ? `When you said "sure" you were right ${sureRight} of ${sure.length} times. Well-calibrated confidence is a skill the exam rewards.`
    : '';

  const box = $('sum-review');
  box.replaceChildren();
  if (session.mode === 'block' && n) {
    box.appendChild(el('h3', 'Review your block'));
    for (const a of session.answers) {
      const d = document.createElement('details');
      const s = el('summary', `${a.correct ? '✓' : '✗'} ${a.q.topic} (${a.q.system})`);
      d.appendChild(s);
      d.appendChild(el('p', a.q.stem));
      d.appendChild(el('p', a.q.leadIn, 'leadin'));
      const key = a.q.options.find((o) => o.id === a.q.answer).text;
      const mine = a.q.options.find((o) => o.id === a.choice).text;
      d.appendChild(el('p', `Your answer: ${mine}`));
      d.appendChild(el('p', `Correct answer: ${key}`, 'ok'));
      d.appendChild(el('p', a.q.explanation));
      if (!a.correct) d.appendChild(el('p', `Why not "${mine}": ${a.q.whyWrong[a.choice]}`));
      d.appendChild(el('p', `Sources: ${a.q.sources.map((x) => x.title).join('; ')}`, 'meta'));
      box.appendChild(d);
    }
  }
  session = null;
  renderStats();
  show('summary');
}

function wire() {
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => startSession(b.dataset.mode));
  for (const b of document.querySelectorAll('[data-confidence]')) b.addEventListener('click', () => answer(b.dataset.confidence));
  $('next-btn').addEventListener('click', advance);
  $('sum-home').addEventListener('click', renderHome);
  $('focus-search').addEventListener('input', filterTopics);
  $('focus-clear').addEventListener('click', () => {
    focus = { subjects: [], topics: [], missed: false };
    $('focus-search').value = '';
    filterTopics();
    focusChanged();
  });
  $('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (session && !confirm('Leave this session? Answers so far are saved.')) return;
    if (session) clearTimeout(session.timer);
    session = null;
    renderHome();
  });
  document.addEventListener('keydown', (e) => {
    if (!session || e.target.tagName === 'SELECT') return;
    const k = e.key.toLowerCase();
    const cur = session.current;
    if (!cur.confidence && /^[a-f1-6]$/.test(k)) {
      const idx = /\d/.test(k) ? Number(k) - 1 : k.charCodeAt(0) - 97;
      const input = $('q-options').querySelectorAll('input')[idx];
      if (input) { input.checked = true; input.dispatchEvent(new Event('change')); }
    } else if (cur.choice && !cur.confidence && ['g', 'u', 's'].includes(k)) {
      answer({ g: 'guess', u: 'unsure', s: 'sure' }[k]);
    } else if (k === 'enter' && !$('feedback').hidden) {
      e.preventDefault();
      advance();
    }
  });
}

async function main() {
  wire();
  try {
    const res = await fetch('data/questions.json', { cache: 'no-cache' });
    questions = usableQuestions(await res.json());
  } catch (err) {
    console.error(err);
    $('due-summary').textContent = 'Could not load the question bank. If you opened this file directly, serve it over HTTP (see README).';
  }
  renderHome();
}

main();
