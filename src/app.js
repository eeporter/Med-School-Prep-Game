// Browser UI. All question text is rendered with textContent, never innerHTML.

import { usableQuestions, DISCIPLINES, SYSTEMS } from './bank.js';
import { review, isDue, isMastered, isStruggling, newCard, reviewedOn } from './scheduler.js';
import { presentQuestion, isCorrect, xpFor, levelFor, interleave, shuffle, updateStreak, needsRelearning, sureAccuracy, topicKey, matchesFocus } from './quiz.js';
import { load, save, isDayString, emptyState } from './storage.js';
import { EXAM_TYPES, SUBJECT_EXAMS, SECONDS_PER_QUESTION, examLabel, examFormat, examScope, nextExam, weightedSample } from './exams.js';
import { today, daysBetween, parseDayString } from './dates.js';
import { REPORT_REASONS, weakSpots, weakSpotsText, describeSpot, addReport, reportsText } from './insights.js';
import {
  addXp, mergeStates, backupText, backupFileName, readBackup, makeSyncCode,
  syncOnce, pullRemote, pushRemote, docUrl, accountPath, handoverPath, hasProgress, SyncError,
  examKey, reportKey, markRemoved, markAdded,
} from './sync.js';
import { OLD_HOST, MOVED_TO, HANDOVER_PROJECT } from './sync-config.js';
import { loadFirebaseSettings, readHandoverCode, signInProblem, startAccount } from './account.js';
import { SECTIONS_KEY, closedSections, sectionsValue } from './sections.js';

const NEW_PER_ROUNDS = 10;
const FOCUS_KEY = 'med-prep-focus';
const DEVICE_KEY = 'med-study-game:device';
// After a change, wait this long before syncing, so a run of answers goes up together.
const SYNC_DELAY_MS = 3000;
// If Google's sign-in check has not answered by then, offer the sign-in button anyway.
const GATE_WAIT_MS = 10000;
// A question missed again and again is re-asked at most this many extra times
// per session, so one stubborn item cannot trap the learner.
const MAX_RELEARN_TRIES = 3;

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
const deviceId = loadDeviceId();
let settings = null; // Firebase settings, when this site has them
let account = null; // signed-in helpers from startAccount
let user = null; // the signed-in Google user, or null
// The sign-in screen: 'checking' (waiting for Google), 'ready' (show the
// button) or 'unreachable' (Google cannot be reached; she may study offline).
let gateMode = 'checking';
let skipped = false; // studying on this device without signing in, this visit only
let refused = null; // the email of an account the rules turned away
let lastSynced = null;
let syncTimer = null;
let syncing = null;
let changes = 0; // counts saved changes, so a sync can tell if more came in meanwhile
let questions = [];
let session = null;
let focus = loadFocus();
let focusChecks = [];

function persist() {
  if (!save(storage, state)) console.warn('Progress could not be saved (storage unavailable).');
  changes += 1;
  scheduleSync();
}

function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// A random id for this browser, so XP earned here is counted once when merged.
function loadDeviceId() {
  try {
    let id = storage?.getItem(DEVICE_KEY);
    if (!id) {
      id = `d-${makeSyncCode(randomBytes).slice(0, 12)}`;
      storage?.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `d-${makeSyncCode(randomBytes).slice(0, 12)}`;
  }
}

// Replaces progress with a merged copy and redraws whatever is on screen.
function adoptState(next) {
  state = next;
  save(storage, state);
  if ($('view-home').hidden) renderStats();
  else renderHome();
}

function scheduleSync() {
  if (!user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), SYNC_DELAY_MS);
}

const timeNow = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Pull, merge, push. Only one sync runs at a time; a failure leaves this
// device's progress untouched and the next change or visit tries again.
async function syncNow() {
  if (!user) return null;
  if (syncing) {
    // A change made while a sync is on its way goes up in the next one.
    scheduleSync();
    return syncing;
  }
  clearTimeout(syncTimer);
  const status = $('sync-status');
  const before = changes;
  syncing = (async () => {
    try {
      const token = await account.token();
      const merged = await syncOnce(fetch, docUrl(settings.projectId, accountPath(user.uid)), state, token);
      // Answers given while the sync was on its way are merged in, never
      // overwritten by the copy that left before them.
      adoptState(mergeStates(state, merged));
      if (changes !== before) scheduleSync();
      lastSynced = timeNow();
      status.textContent = '';
      renderSync();
    } catch (err) {
      console.warn(err);
      if (err instanceof SyncError && err.status === 403) {
        // Only the accounts listed in the Firestore rules can sync. Send anyone else back to
        // the sign-in screen with a plain reason.
        refused = user?.email || 'That Google account';
        clearTimeout(syncTimer);
        await account.signOut().catch((e) => console.warn(e));
      } else {
        status.textContent = navigator.onLine === false
          ? 'Offline. Your progress is saved on this device and will sync when you are back online.'
          : 'Could not reach the sync service just now. Your progress is safe on this device; it will try again.';
      }
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

function renderSync() {
  $('sync-elsewhere').hidden = Boolean(settings);
  $('sync-off').hidden = !settings || Boolean(user);
  $('sync-on').hidden = !settings || !user;
  $('sync-user').textContent = user ? (user.email || 'your Google account') : '';
  $('sync-when').textContent = lastSynced ? ` Last synced at ${lastSynced}.` : '';
}

// On the game's own address, nothing shows until she is signed in (or chose
// to study offline because Google could not be reached).
const gateOn = () => Boolean(settings) && !user && !skipped;

function renderGate() {
  $('gate-checking').hidden = gateMode !== 'checking';
  $('gate-ready').hidden = gateMode === 'checking';
  $('gate-offline').hidden = gateMode !== 'unreachable';
  if (refused) {
    $('gate-status').textContent = `${refused} is not one of the accounts set up for this game. Sign in with the Google account this game is set up for.`;
  }
}

function setGate(mode) {
  gateMode = mode;
  renderGate();
}

async function signIn(status) {
  status.textContent = '';
  if (!account) return;
  try {
    await account.signIn();
    refused = null;
  } catch (err) {
    console.warn(err);
    const msg = signInProblem(err?.code);
    if (msg) status.textContent = msg;
    if (err?.code === 'auth/network-request-failed' && gateOn()) setGate('unreachable');
  }
}

async function startSync() {
  if (!settings) return renderSync();
  renderGate();
  const wait = setTimeout(() => { if (gateMode === 'checking') setGate(account ? 'ready' : 'unreachable'); }, GATE_WAIT_MS);
  try {
    account = await startAccount(settings, (u) => {
      const was = user?.uid;
      user = u;
      clearTimeout(wait);
      if (u) {
        refused = null;
        $('gate-status').textContent = '';
        if (!$('view-signin').hidden) renderHome();
        if (u.uid !== was) syncNow();
      } else {
        clearTimeout(syncTimer);
        lastSynced = null;
        setGate('ready');
        if (!session) renderHome();
      }
      renderSync();
    });
  } catch (err) {
    console.warn(err);
    clearTimeout(wait);
    setGate('unreachable');
  }
  return renderSync();
}

// The old address hands this device's progress to the new one: a copy goes up
// under a random one-time code, and the new address picks it up and merges it.
async function moveToNewSite() {
  if (location.hostname !== OLD_HOST || !MOVED_TO) return false;
  const note = $('move-note');
  note.hidden = false;
  note.textContent = 'The game has a new address. Taking your progress there...';
  let target = MOVED_TO;
  if (hasProgress(state)) {
    const code = makeSyncCode(randomBytes);
    try {
      await pushRemote(fetch, docUrl(HANDOVER_PROJECT, handoverPath(code)), state);
      target = `${MOVED_TO}#move=${code}`;
    } catch (err) {
      console.warn(err);
      note.replaceChildren(
        'The game has a new address, but your progress could not be carried over just now. Check your internet connection and reload this page, or save a backup file below and restore it at ',
        Object.assign(el('a', MOVED_TO), { href: MOVED_TO }),
        '.',
      );
      return true;
    }
  }
  location.replace(target);
  return true;
}

// The new address picks up progress handed over from the old one.
async function receiveHandover() {
  const code = readHandoverCode(location.hash);
  if (!code) return;
  history.replaceState(null, '', location.pathname + location.search);
  const note = $('move-note');
  note.hidden = false;
  try {
    const url = docUrl(HANDOVER_PROJECT, handoverPath(code));
    const moved = await pullRemote(fetch, url);
    if (moved) {
      adoptState(mergeStates(state, moved));
      persist();
      // The one-time copy is no longer needed; blank it out.
      await pushRemote(fetch, url, emptyState()).catch((err) => console.warn(err));
    }
    note.textContent = 'Welcome to the game\'s new address. Your progress from the old one is here. Bookmark this page.';
  } catch (err) {
    console.warn(err);
    note.textContent = 'Your progress from the old address could not be brought over just now. Open the old address again to retry, or use a backup file.';
  }
}

function show(view) {
  for (const v of ['signin', 'home', 'quiz', 'summary']) $(`view-${v}`).hidden = v !== view;
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

  renderExams(t);

  // Built once the bank has loaded, so a failed load never prunes saved picks.
  if (!focusChecks.length && questions.length) buildFocusPicker();
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
  const cal = sureAccuracy(state.history);
  $('calibration-summary').textContent = cal && cal.total >= 10
    ? `When you answer "sure", you are right ${Math.round((100 * cal.right) / cal.total)}% of the time (last ${cal.total} sure answers). Aim for close to 100%; if it is lower, slow down on questions you feel sure about.`
    : '';
  $('misconception-summary').textContent = mis
    ? `${mis} confident miss${mis === 1 ? '' : 'es'} queued for extra review. These are the facts most worth fixing.`
    : '';
  renderWeakSpots();
  renderReports();
  renderSync();
  show(gateOn() ? 'signin' : 'home');
}

const WEAK_SHOWN = 10;

function renderWeakSpots() {
  const spots = weakSpots(state.history, questions);
  const list = $('weak-list');
  list.replaceChildren();
  for (const s of spots.slice(0, WEAK_SHOWN)) {
    const li = el('li');
    li.appendChild(el('span', `${s.topic} `));
    li.appendChild(el('span', `(${s.system}): ${describeSpot(s)}`, 'meta'));
    list.appendChild(li);
  }
  $('weak-summary').textContent = spots.length
    ? `The topics you miss most, weakest first${spots.length > WEAK_SHOWN ? ` (top ${WEAK_SHOWN} of ${spots.length})` : ''}. Copy them for your Claude: it adds them to your struggle log, offers study guides, and gets new questions written.`
    : 'Nothing yet. Topics you miss, or only get right by guessing, will show up here.';
  $('weak-actions').hidden = !spots.length;
  $('weak-status').textContent = '';
  $('weak-fallback').hidden = true;
}

function renderReports() {
  const n = state.reports.length;
  $('reports-box').hidden = n === 0;
  $('reports-summary').textContent = `${n} question report${n === 1 ? '' : 's'} saved on this device. Tap Copy for my Claude and paste it into your Claude chat. Your Claude checks each one and fixes the question if you are right. Clear them once they are sent.`;
  $('reports-status').textContent = '';
  $('reports-fallback').hidden = true;
}

// Copies text, or shows it selected in a box when the browser blocks copying.
async function copyText(text, status, fallback, done) {
  try {
    await navigator.clipboard.writeText(text);
    fallback.hidden = true;
    status.textContent = done;
  } catch {
    fallback.value = text;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
    status.textContent = 'Copy the selected text below (press and hold on a phone, then Copy).';
  }
}

// The soonest upcoming exam whose content includes this question, so each
// question's reviews are aimed at the test it will appear on.
function examFor(q, t) {
  const upcoming = state.exams.filter((e) => daysBetween(t, e.date) >= 0).sort((a, b) => (a.date < b.date ? -1 : 1));
  return upcoming.find((e) => examScope(e).inScope(q)) ?? null;
}

function renderExams(t) {
  const list = $('exam-list');
  list.replaceChildren();
  const sorted = [...state.exams].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const e of sorted) {
    const left = daysBetween(t, e.date);
    const li = el('li');
    const when = parseDayString(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    li.appendChild(el('span', `${examLabel(e)}, ${when}`));
    li.appendChild(el('span', left > 0 ? `${left} day${left === 1 ? '' : 's'}` : left === 0 ? 'today' : 'done', 'meta'));
    const rm = el('button', 'Remove', 'small');
    rm.setAttribute('aria-label', `Remove ${examLabel(e)} on ${e.date}`);
    rm.addEventListener('click', () => {
      state.exams = state.exams.filter((x) => x !== e);
      markRemoved(state, examKey(e));
      persist();
      renderHome();
    });
    li.appendChild(rm);
    list.appendChild(li);
  }

  const target = nextExam(state.exams, t);
  // Safari ignores `hidden` on <option>, so the option is added and removed.
  const sel = $('exam-select');
  let blockOpt = sel.querySelector('option[value="next"]');
  if (target && !blockOpt) {
    blockOpt = el('option');
    blockOpt.value = 'next';
    sel.prepend(blockOpt);
  } else if (!target && blockOpt) {
    const wasNext = sel.value === 'next';
    blockOpt.remove();
    if (wasNext) sel.value = 'usmle-step1';
  }
  if (target) {
    const f = examFormat(target);
    const scope = examScope(target);
    $('exam-focus').textContent = `Next up: ${examLabel(target)}. The real test is ${f.summary}. New questions in Daily Rounds ${scope.focus}, and Exam Block practices its pace.`;
    blockOpt.textContent = `My next exam (${examLabel(target)})`;
  } else {
    $('exam-focus').textContent = 'Add the exams you are preparing for. The game aims new questions, practice blocks, and review timing at the next one.';
  }
  $('exam-subject-row').hidden = $('exam-type').value !== 'nbme-subject';
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
  const allSubjects = new Set(questions.map((q) => q.discipline));
  focus.topics = focus.topics.filter((k) => allKeys.has(k));
  focus.subjects = focus.subjects.filter((d) => allSubjects.has(d));

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
  if (questions.length) saveFocus();
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
    const unseen = questions.filter((q) => !state.cards[q.id]);
    const target = nextExam(state.exams, t);
    let fresh;
    if (target) {
      // New material for the next exam first, weighted like its content outline.
      const scope = examScope(target);
      fresh = weightedSample(unseen.filter(scope.inScope), NEW_PER_ROUNDS, scope.weight);
      fresh.push(...shuffle(unseen.filter((q) => !scope.inScope(q))).slice(0, NEW_PER_ROUNDS - fresh.length));
    } else {
      fresh = shuffle(unseen).slice(0, NEW_PER_ROUNDS);
    }
    // Confident misses come first (interleaved among themselves), then the rest.
    return [...interleave(misses), ...interleave([...rest, ...fresh])];
  }
  if (mode === 'focus') {
    // Mix the picked topics rather than running them in blocks.
    return interleave(focusQuestions(), (q) => q.topic);
  }
  const choice = $('exam-select').value;
  const size = Number($('block-size').value);
  const target = choice === 'next' ? nextExam(state.exams, t) : null;
  if (target) {
    const scope = examScope(target);
    return interleave(weightedSample(questions.filter(scope.inScope), size, scope.weight));
  }
  return interleave(questions.filter((q) => q.exams.includes(choice))).slice(0, size);
}

// When Exam Block targets the next exam, default its length to that exam's
// real block or section size.
function syncBlockSize() {
  const target = $('exam-select').value === 'next' ? nextExam(state.exams, today()) : null;
  if (target) $('block-size').value = String(examFormat(target).blockSize);
}

function startSession(mode) {
  const queue = buildQueue(mode);
  if (!queue.length) {
    alert(mode === 'rounds' ? 'Nothing due right now. Come back tomorrow, or try Focus.' : 'No questions match that choice yet.');
    return;
  }
  session = {
    mode, queue, index: 0, answers: [], xpEarned: 0, tries: new Map(), relearned: new Set(),
    deadline: mode === 'block' ? Date.now() + queue.length * SECONDS_PER_QUESTION * 1000 : null,
  };
  pushSessionEntry();
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
  const relearning = session.tries.has(q.id);
  $('quiz-progress').textContent = relearning
    ? `Relearning a missed question (${session.index + 1} of ${session.queue.length})`
    : `Question ${session.index + 1} of ${session.queue.length}`;
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
      $('confidence').scrollIntoView({ block: 'nearest' });
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
  const correct = isCorrect(cur.q, cur.choice);
  const tries = session.tries.get(cur.q.id);
  let gained = 0;

  if (tries === undefined && !reviewedOn(state.cards[cur.q.id], t)) {
    // First answer today: this one sets the schedule and earns XP.
    const card = state.cards[cur.q.id] || newCard();
    // A first exposure is not a review, so it earns no review bonus.
    const wasDueReview = Boolean(state.cards[cur.q.id]) && isDue(card, t);
    gained = xpFor({ correct, confidence, wasDueReview });
    state.cards[cur.q.id] = review(card, { correct, confidence }, t, { examDate: examFor(cur.q, t)?.date ?? null });
    addXp(state, deviceId, gained);
    state.streak = updateStreak(state.streak, t, daysBetween);
    state.history.push({ id: cur.q.id, day: t, correct, confidence });
    persist();
    session.xpEarned += gained;
    session.answers.push({ q: cur.q, presented: cur.presented, choice: cur.choice, correct, confidence });
  } else {
    if (tries === undefined) session.answers.push({ q: cur.q, presented: cur.presented, choice: cur.choice, correct, confidence });
    if (tries !== undefined && !needsRelearning(correct, confidence)) session.relearned.add(cur.q.id);
  }

  // Missed or guessed questions come back at the end of this session until
  // they are answered right with confidence (not in Exam Block).
  let note = '';
  if (session.mode !== 'block' && needsRelearning(correct, confidence)) {
    const used = tries ?? 0;
    if (used < MAX_RELEARN_TRIES) {
      session.tries.set(cur.q.id, used + 1);
      session.queue.push(cur.q);
      note = 'It will come back at the end of this session.';
    }
  } else if (tries !== undefined) {
    note = 'Relearned. Your review schedule was set by your first answer today.';
  } else if (!gained && correct) {
    note = 'Practice only: you already answered this today, so the schedule stays as set.';
  }

  $('q-options').disabled = true;
  $('confidence').hidden = true;

  if (session.mode === 'block') return advance();
  renderFeedback(cur.q, cur.presented, cur.choice, correct, confidence, gained, note);
  renderStats();
}

function labelOf(presented, id) {
  return presented.options.find((o) => o.id === id)?.label;
}

function renderFeedback(q, presented, choice, correct, confidence, gained, note = '') {
  const key = labelOf(presented, q.answer);
  const keyText = q.options.find((o) => o.id === q.answer).text;
  let msg = correct ? `Correct: ${key}. ${keyText}` : `Not quite. The answer is ${key}. ${keyText}`;
  if (correct && gained) msg += `  (+${gained} XP)`;
  if (!correct && confidence === 'sure') msg += '. You were sure, so it is flagged for extra review.';
  if (note) msg += `${/[.)]$/.test(msg) ? '' : '.'} ${note}`;
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

  $('fb-report').open = false;
  $('report-note').value = '';
  $('report-reason').value = 'unclear';
  $('report-status').textContent = '';

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

  const more = $('fb-readmore');
  more.replaceChildren();
  for (const r of q.readMore || []) {
    const li = el('li');
    const a = el('a', r.title);
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.appendChild(a);
    more.appendChild(li);
  }
  more.hidden = more.children.length === 0;
  $('fb-readmore-head').hidden = more.hidden;

  for (const label of $('q-options').querySelectorAll('label')) {
    const id = label.querySelector('input').value;
    if (id === q.answer) label.classList.add('key');
    else if (id === choice) label.classList.add('wrong');
  }
  $('feedback').hidden = false;
  // Show the right/wrong line first; Next keeps the keyboard focus without
  // scrolling the result off a phone screen.
  $('next-btn').focus({ preventScroll: true });
  $('feedback').scrollIntoView({ block: 'start' });
}

function advance() {
  session.index += 1;
  if (session.index >= session.queue.length) return finishSession();
  showQuestion();
}

// Home, from any question (the Home buttons, the title, or the phone's Back).
// Every answer is saved the moment it is given, so leaving loses nothing. A
// timed block asks first, then shows the review of what was answered.
function leaveSession() {
  if (session?.mode === 'block' && session.answers.length) {
    if (!window.confirm('End this exam block now? Your answers are saved, and you will see the review of the ones you answered.')) return false;
    finishSession();
    return true;
  }
  if (session) clearTimeout(session.timer);
  session = null;
  renderHome();
  return true;
}

// The phone's Back button returns to home instead of leaving the game: a
// session adds one history entry, and going back from it ends the session.
function pushSessionEntry() {
  if (history.state?.session) return;
  history.pushState({ session: true }, '');
}

function leaveViaButton() {
  if (!leaveSession()) return;
  // Back to home: drop the session's history entry too. (A block's review
  // keeps it, so Back from the review also goes home.)
  if (history.state?.session && $('view-summary').hidden) history.back();
}

function finishSession() {
  clearTimeout(session.timer);
  const n = session.answers.length;
  const right = session.answers.filter((a) => a.correct).length;
  $('sum-score').textContent = n ? `${right} / ${n} correct (${Math.round((100 * right) / n)}%)` : 'No questions answered.';
  $('sum-xp').textContent = `+${session.xpEarned} XP this session`;
  const r = session.relearned.size;
  $('sum-relearn').textContent = r
    ? `You relearned ${r} missed question${r === 1 ? '' : 's'} until you got ${r === 1 ? 'it' : 'them'} right. Retrieving each fact to criterion, then again on later days, is one of the strongest ways to make it last.`
    : '';

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

function wireHowTo() {
  const box = $('howto');
  $('howto-hide').addEventListener('click', () => {
    box.open = false;
    box.querySelector('summary').focus();
  });
}

// Each home section can fold away, and this device remembers which are closed.
function wireSections() {
  const boxes = [...document.querySelectorAll('details.section[data-section]')];
  let stored = null;
  try { stored = storage?.getItem(SECTIONS_KEY) ?? null; } catch { stored = null; }
  const closed = closedSections(stored);
  for (const box of boxes) box.open = !closed.has(box.dataset.section);
  for (const box of boxes) {
    box.addEventListener('toggle', () => {
      const now = boxes.filter((b) => !b.open).map((b) => b.dataset.section);
      try { storage?.setItem(SECTIONS_KEY, sectionsValue(now)); } catch { /* not saved; all open next visit */ }
    });
  }
}

function wire() {
  wireHowTo();
  wireSections();
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => startSession(b.dataset.mode));
  for (const b of document.querySelectorAll('[data-confidence]')) b.addEventListener('click', () => answer(b.dataset.confidence));
  $('next-btn').addEventListener('click', advance);
  const reasonSel = $('report-reason');
  for (const [id, label] of Object.entries(REPORT_REASONS)) {
    const o = el('option', label);
    o.value = id;
    reasonSel.appendChild(o);
  }
  $('report-save').addEventListener('click', () => {
    const q = session?.current?.q;
    if (!q) return;
    state.reports = addReport(state.reports, {
      id: q.id, day: today(), reason: reasonSel.value, note: $('report-note').value.trim(), choice: session.current.choice,
    });
    markAdded(state, reportKey(state.reports[state.reports.length - 1]));
    persist();
    $('report-status').textContent = 'Thanks, saved. On the home screen, tap Copy for my Claude and paste it into your Claude chat.';
    $('report-note').value = '';
  });
  $('weak-copy').addEventListener('click', () => copyText(
    weakSpotsText(weakSpots(state.history, questions), questions, today()),
    $('weak-status'), $('weak-fallback'), 'Copied. Paste it into your Claude chat.'));
  $('reports-copy').addEventListener('click', () => copyText(reportsText(state.reports, questions),
    $('reports-status'), $('reports-fallback'), 'Copied. Paste it into your Claude chat.'));
  $('reports-clear').addEventListener('click', () => {
    if (!window.confirm(`Clear ${state.reports.length} saved report(s)? Do this after you have sent them.`)) return;
    for (const r of state.reports) markRemoved(state, reportKey(r));
    state.reports = [];
    persist();
    renderReports();
  });
  $('sum-home').addEventListener('click', () => {
    renderHome();
    if (history.state?.session) history.back();
  });
  wireProgress();
  const typeSel = $('exam-type');
  for (const [id, { name }] of Object.entries(EXAM_TYPES)) {
    const o = el('option', name);
    o.value = id;
    typeSel.appendChild(o);
  }
  for (const s of Object.keys(SUBJECT_EXAMS)) {
    const o = el('option', s);
    o.value = s;
    $('exam-subject').appendChild(o);
  }
  typeSel.addEventListener('change', () => { $('exam-subject-row').hidden = typeSel.value !== 'nbme-subject'; });
  $('exam-add').addEventListener('click', () => {
    const date = $('exam-date').value;
    if (!isDayString(date)) {
      $('exam-date').focus();
      $('exam-focus').textContent = 'Pick the test date first.';
      return;
    }
    const exam = typeSel.value === 'nbme-subject'
      ? { type: 'nbme-subject', subject: $('exam-subject').value, date }
      : { type: typeSel.value, date };
    state.exams.push(exam);
    markAdded(state, examKey(exam));
    persist();
    $('exam-date').value = '';
    renderHome();
    if (nextExam(state.exams, today())) {
      $('exam-select').value = 'next';
      syncBlockSize();
    }
  });
  $('exam-select').addEventListener('change', syncBlockSize);
  $('focus-search').addEventListener('input', filterTopics);
  $('focus-clear').addEventListener('click', () => {
    focus = { subjects: [], topics: [], missed: false };
    $('focus-search').value = '';
    filterTopics();
    focusChanged();
  });
  $('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (session) leaveViaButton();
    else if (!gateOn()) renderHome();
  });
  for (const id of ['quiz-home', 'fb-home']) $(id).addEventListener('click', leaveViaButton);
  window.addEventListener('popstate', () => {
    if (!session) {
      if (!$('view-summary').hidden) renderHome();
      return;
    }
    // Cancelled: stay in the session, and put its history entry back.
    if (!leaveSession()) pushSessionEntry();
  });
  document.addEventListener('keydown', (e) => {
    // Typing a report note (or toggling the report box) must not answer or advance.
    if (!session || ['SELECT', 'TEXTAREA', 'SUMMARY'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    // Enter on a link, a button other than Next, or inside the report box
    // keeps its normal meaning (open the link, save the report).
    if (k === 'enter' && e.target.closest?.('#fb-report, a, button:not(#next-btn):not([data-confidence])')) return;
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

function wireProgress() {
  $('backup-save').addEventListener('click', () => {
    const blob = new Blob([backupText(state, new Date().toISOString())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = backupFileName(today());
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    $('backup-status').textContent = `Saved ${a.download}. Keep it somewhere safe, like iCloud Drive or Google Drive.`;
  });
  $('backup-restore').addEventListener('click', () => $('backup-file').click());
  $('backup-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const got = readBackup(await file.text());
    if (got.error) {
      $('backup-status').textContent = got.error;
      return;
    }
    const before = Object.keys(state.cards).length;
    adoptState(mergeStates(state, got.state));
    persist();
    const added = Object.keys(state.cards).length - before;
    $('backup-status').textContent = `Restored. The backup was added to this device's progress${added > 0 ? ` (${added} more question${added === 1 ? '' : 's'} with saved progress)` : ''}.`;
  });

  $('gate-signin').addEventListener('click', () => signIn($('gate-status')));
  $('gate-skip').addEventListener('click', () => {
    skipped = true;
    renderHome();
  });
  $('sync-signin').addEventListener('click', () => signIn($('sync-status')));
  $('sync-signout').addEventListener('click', async () => {
    if (!window.confirm('Sign out on this device? Progress already here stays here, but it stops syncing until you sign in again.')) return;
    await syncNow();
    skipped = false;
    await account.signOut();
  });
  // Sync when she comes back to the game, and straight away when she leaves
  // it (switches app, locks the phone, closes the tab), so the other device
  // has her latest answers.
  document.addEventListener('visibilitychange', () => syncNow());
  window.addEventListener('online', () => syncNow());
}

async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json', { cache: 'no-cache' });
    questions = usableQuestions(await res.json());
  } catch (err) {
    console.error(err);
    $('due-summary').textContent = 'Could not load the question bank. If you opened this file directly, serve it over HTTP (see README).';
  }
}

async function main() {
  wire();
  // Firebase settings first, so the game's own address opens on the sign-in
  // screen and never flashes the home screen before it.
  [settings] = await Promise.all([loadFirebaseSettings(fetch, location.hostname), loadQuestions()]);
  renderHome();
  if (nextExam(state.exams, today())) {
    $('exam-select').value = 'next';
    syncBlockSize();
  }
  if (await moveToNewSite()) return;
  await receiveHandover();
  await startSync();
}

main();
