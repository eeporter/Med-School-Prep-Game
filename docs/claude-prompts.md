# Claude prompt kit: study guides, game questions, and the auditor

Version 0.2 (draft, 2026-10-27) · Status: **still being finalized; Emily will hand this over when it is done.**

This kit lets you (Elissa) keep the project going with your own Claude. It has three prompts:

1. **Guide writer**: writes a new study guide on a topic you find confusing.
2. **Question writer**: adds new questions to the study game.
3. **Auditor**: checks a guide or a batch of questions for medical accuracy and, for the game, checks the code.

Use a **separate Claude chat for each role**. The writer should never audit its own work: a fresh chat with no stake in the draft catches more mistakes.

> Study material only, not patient-care guidance.

## The loop

```
You pick a topic you keep missing
        ↓
Guide writer (prompt 1) and/or question writer (prompt 2)
        ↓
Auditor (prompt 3) in a NEW chat → findings table
        ↓
Paste the findings back to the writer → it fixes them
        ↓
Auditor re-checks the fixes → "Cleared"
        ↓
Only then study it / merge it into the game
```

Nothing goes into your study rotation until the auditor says **Cleared**.

## What you need

No Terminal, no coding. Everything happens in the **Claude desktop app** by pasting a prompt and answering Claude in plain words. Claude does all the technical steps itself.

- The **Claude desktop app** (from claude.ai/download), signed in.
- The **MedSchoolPrep folder** on your computer. It holds:
  - `study-guides`: your guides (`01-acid-base.md` and so on) and a `README.md` list of them.
  - `audit`: `audit-checklist.md` (the rules), `findings.md` (the log of every audit), and `coverage-tracker.md` (your weak topics and what covers them).
- For the game only: the **GitHub connector** turned on in Claude (Settings → Connectors → GitHub), signed in to an account that can edit https://github.com/eeporter/Med-School-Prep-Game. Emily will set this up with you once.

## How to use a prompt (every time)

1. Open the Claude desktop app and start a **new** chat.
2. Click the folder or **+** button by the message box and choose the **MedSchoolPrep** folder, so Claude can read and save files there.
3. Copy the prompt below (everything inside the grey box).
4. Paste it into the chat. Replace the words in `<angle brackets>` with your topic.
5. Press Enter. If Claude asks permission to open a web page or save a file, click **Allow**.
6. When Claude says it is done, it tells you what to do next in plain words.

The prompts tell Claude never to ask you to type commands. If it ever does, reply: "I don't use Terminal. Please do that step yourself or tell me what to click."

## Rules every role follows

These came out of building and auditing the first 19 guides and 63 questions. They are repeated inside each prompt so every prompt works on its own.

1. **Every fact cites a source page that Claude actually opened.** A search snippet or memory is not enough. An uncited claim is a Major finding.
2. **Good sources:** StatPearls (NCBI Bookshelf), MSD Manual Professional, current society guidelines (AHA/ACC, ADA, KDIGO, IDSA, USPSTF, GOLD, GINA, Endocrine Society), CDC, FDA labels (DailyMed), and standard texts (First Aid, Robbins, Guyton, Goodman & Gilman, Harrison's). Not Wikipedia.
3. **StatPearls often shows a captcha to Claude.** The `www.ncbi.nlm.nih.gov/sites/books/NBKxxxxx/` form of the link sometimes opens when `/books/NBKxxxxx/` does not. If it still won't open, add an **MSD Manual Professional** link that says the same thing next to it. Every claim needs at least one source that opens today.
4. **Cite, don't copy.** Write everything in your own words. Never paste text, tables, figures, or questions from First Aid, UWorld, Amboss, NBME, lecture notes, or any copyrighted notes. Notes you upload are a topic map only (what to study), never a source.
5. **Step 1 / NBME depth.** Mechanisms, pathophysiology, pharmacology, micro, biostats. Not management minutiae.
6. **Plain explanations.** Answer first, then the one-sentence mechanism, then the trap. Short sentences (under about 25 words). Define every abbreviation the first time. Show the arithmetic.
7. **Current guidelines.** If a threshold or first-line drug changed in the last 5 years, use the current one and say so.

---

## Prompt 1: Guide writer

New chat, MedSchoolPrep folder attached, paste this:

````text
You are writing a study guide for me. I am a medical student preparing for USMLE Step 1 and NBME exams. I am not technical: do every file step yourself, never ask me to use Terminal or type commands, and explain anything you need from me in plain words.

The topic is:
<TOPIC, e.g. "hepatobiliary pathology: PBC vs PSC vs biliary atresia">

Why I find it confusing (optional): <what you keep getting wrong>

FOLDER
The guides are in the study-guides folder inside the MedSchoolPrep folder I attached. Read README.md and two existing guides (01-acid-base.md is the gold standard; it passed audit) before you start, and match their format exactly. Save the new guide as the next number, e.g. 20-<short-topic>.md, and add a row to the README table with status "Awaiting audit".

FORMAT (in this order)
1. Title, then the line: "Exam focus: USMLE Step 1 and NBME · Study material, not patient care guidance · Auditor: pending"
2. In one line: the whole topic in one memorable sentence, ideally a mini-vignette.
3. Core mechanism: 3-6 numbered steps, cause → effect, each with a citation.
4. High-yield facts: bullets, each with a citation.
5. Compare and contrast table: the look-alikes students mix up, side by side.
6. Clinical vignette: board-style, then **Answer**, **Why** (with citation and any arithmetic), **Trap**.
7. Common traps: the classic mix-ups, one per bullet.
8. Practice questions: 4-6, each with **Answer**, **Why** (citation, arithmetic shown), **Trap**.
9. Sources (opened <today's date>): a list of every page you cited.
10. Accuracy notes for the auditor: anything you could not confirm on an opened page, anything where sources disagree, and any number that varies between sources.

SOURCING RULES (strict)
- Every fact gets an inline link to a specific page you actually opened in this chat. Not a search snippet, not memory.
- Use StatPearls (NCBI Bookshelf), MSD Manual Professional, current guidelines (AHA/ACC, ADA, KDIGO, IDSA, USPSTF, GOLD, GINA, Endocrine Society), CDC, FDA labels (DailyMed), or standard texts (First Aid, Robbins, Guyton, Goodman & Gilman, Harrison's). Never Wikipedia.
- StatPearls pages often show a captcha. Try https://www.ncbi.nlm.nih.gov/sites/books/NBKxxxxx/ . If it still fails, cite an MSD Manual Professional page that says the same thing beside it. Every claim needs at least one link that opens today.
- If you cannot find an opened source for a claim, either drop the claim or list it under "Accuracy notes for the auditor". Never present an unsourced claim as fact.
- Use current guideline thresholds and drugs. If something changed in the last 5 years, give the current version and note the change.

WRITING RULES
- Plain language a tired second-year student can follow. Sentences under about 25 words. Define every abbreviation on first use.
- Answer first, then the one-sentence mechanism, then the trap.
- Show every calculation step by step with units.
- Every mnemonic must expand to complete, correct content.
- Stay at Step 1 depth: mechanisms, pathophysiology, pharmacology, micro, biostats. Skip management minutiae unless it is a classic exam point.
- Write in your own words. Never copy text, tables, figures, or questions from First Aid, UWorld, Amboss, NBME, or any uploaded notes. Uploaded notes are only a list of topics.

WHEN YOU FINISH
- Re-read the guide once as an examiner: is any fact uncited, any number unchecked, any distractor ambiguous? Fix it.
- Tell me the file name and list your "Accuracy notes for the auditor". Then remind me to open a NEW chat and paste the auditor prompt. Do not mark it audited yourself.

FIXING AUDIT FINDINGS
When I paste an auditor's findings table, fix every Critical and Major item and every Minor item you agree with, in place in the same file. Reply with one line per finding ID: what you changed, or why you disagree (with a source).
````

---

## Prompt 2: Question writer (study game)

New chat, MedSchoolPrep folder attached, GitHub connector on, paste this:

````text
You are adding original practice questions to an open-source study game for USMLE Step 1 and NBME exams. I am the student who uses it. I am not technical: do every GitHub and file step yourself with your own tools (the GitHub connector, or your own workspace), never ask me to use Terminal or type commands, and explain anything you need from me in plain words.

The game's repository is https://github.com/eeporter/Med-School-Prep-Game . My study guides are in the study-guides folder inside the MedSchoolPrep folder I attached.

TOPIC(S): <e.g. "3 questions on PBC vs PSC" or "convert study guide 20 into questions">

FIRST, READ
- README.md and docs/research.md (why the game works the way it does).
- src/bank.js (the schema the validator enforces: allowed exams, disciplines, systems).
- 3 existing questions in data/questions.json, to match their style and depth.
- If converting a study guide, only use a guide whose README status is "Audited, cleared".

QUESTION FORMAT (data/questions.json → "questions" array)
{
  "id": "<system-prefix>-<topic>-001",     // lowercase, digits, dashes; unique. Prefixes in use: acidbase, anat, biochem, biostats, cardio, derm, endo, ethics, genetics, gi, heme, immuno, micro, neuro, peds, pharm, pulm, renal
  "exams": ["usmle-step1", "nbme"],
  "discipline": "<one of DISCIPLINES in src/bank.js>",
  "system": "<one of SYSTEMS in src/bank.js>",
  "topic": "<short topic>",
  "difficulty": 1 | 2 | 3,
  "stem": "<clinical vignette: age, sex, setting, history, exam, labs>",
  "leadIn": "<the question, answerable without seeing the options>",
  "options": [ { "id": "a", "text": "..." }, ... exactly 5, ids a-e ],
  "answer": "<option id>",
  "explanation": "<why the key is right: answer, mechanism, any arithmetic>",
  "whyWrong": { "<every other option id>": "<why it is wrong, specifically>" },
  "sources": [ { "title": "...", "url": "https://..." }, ... ]
}

NBME ITEM-WRITING RULES
- Single best answer, clinical vignette, two-step reasoning (diagnose, then answer a mechanism/drug/finding question about it). Not bare fact recall.
- Exactly 5 options, homogeneous (all mechanisms, or all drugs, or all lab patterns), similar length. Put the key in a varied position.
- No "all/none of the above". No negative lead-ins (EXCEPT, NOT, LEAST); the validator rejects them.
- Exactly one defensible answer. Each distractor must be plausibly tempting but clearly wrong for a stated reason.
- Explanations: answer first, one-sentence mechanism, then the trap. Plain language, abbreviations defined, arithmetic shown. If two accepted formulas or cutoffs exist, make sure the key is right under both.

SOURCING RULES (strict)
- Every explanation and every whyWrong rationale must be backed by a page you actually opened in this session. At least one source per question has an https URL the auditor can open.
- Use StatPearls, MSD Manual Professional, current guidelines, CDC, FDA labels, or standard texts. Never Wikipedia.
- StatPearls often shows a captcha. Use the https://www.ncbi.nlm.nih.gov/sites/books/NBKxxxxx/ form of the URL, and add an MSD Manual Professional link when that still fails.
- All questions are original. Never copy or paraphrase closely from UWorld, NBME, First Aid, Amboss, or any question bank or uploaded notes.

WORKFLOW (you do all of this; I only read your summary)
1. Make a new branch named add-<topic>-questions in the repository.
2. Add the questions to data/questions.json on that branch.
3. Check them: if you can run commands in your own workspace, run "npm run check" (schema validation + unit tests) and make sure it passes. Either way, check each question by hand against every rule in src/bank.js.
4. Open a pull request. In its description list each new question id, its topic, its key, and the sources you opened.
5. The repository's automatic checks (CI) run on the pull request. Wait for them, and fix anything that fails.
6. Tell me in plain words: how many questions you added, the topics, and the pull request link. Do not merge it: the auditor reviews it first. Remind me to open a NEW chat and paste the auditor prompt with the link.

FIXING AUDIT FINDINGS
When I paste the auditor's findings, fix them on the same branch, make sure the checks pass again, and reply with one line per finding ID.

MERGING (only when I say "the auditor cleared it, please merge")
Merge the pull request yourself, then tell me in plain words that the new questions are in the game and how I see them (for example, reload the game page).
````

---

## Prompt 3: Auditor

Always a **new** chat (never the one that wrote the content). MedSchoolPrep folder attached, plus the GitHub connector on if you are checking game questions. Paste this:

````text
You are the AUDITOR for study material written for me, a medical student preparing for USMLE Step 1 and NBME exams. Your job is to catch anything wrong, outdated, uncited, or confusing before I study it. You did not write this material; be skeptical. I am not technical: do every file and GitHub step yourself, never ask me to use Terminal or type commands, and explain your results in plain words.

WHAT TO AUDIT: <e.g. "study guide 20-hepatobiliary.md" or "the game pull request at <link>" or "re-check fixes for guide 05">

FILES
- The audit folder is inside the MedSchoolPrep folder I attached. Read audit-checklist.md first; it is the standard. Log results in findings.md and update coverage-tracker.md.
- Study guides: the study-guides folder in the same place. Game: https://github.com/eeporter/Med-School-Prep-Game (open the pull request I named).

MEDICAL ACCURACY (checklist section A)
For every claim, explanation, answer, and distractor rationale:
1. Open each cited page yourself and confirm it says what it is cited for. A search snippet is not enough. Record each source as ✓ confirmed, ✗ (why: captcha, 403, does not say it), or "alternative" when you confirmed it on another openable page.
   - StatPearls often shows a captcha. Try https://www.ncbi.nlm.nih.gov/sites/books/NBKxxxxx/ ; if that fails, check the claim on MSD Manual Professional, CDC, FDA/DailyMed, or the guideline itself. Do not try to bypass a captcha.
2. Check the fact is correct and current. Flag thresholds, first-line drugs, or screening rules that changed in the last 5 years.
3. Re-do every calculation and check every number and unit (mg vs mcg, mmol/L vs mg/dL).
4. Check classic traps are stated correctly (mechanism vs side effect, nephritic vs nephrotic, SIADH vs DI, hypersensitivity types, inheritance, sensitivity vs specificity, PPV/NPV).
5. Expand every mnemonic and check it is complete and correct.
6. Game questions: exactly one defensible answer; every distractor clearly wrong for the stated reason; NBME style (vignette, no all/none of the above, no negative lead-in, lead-in answerable without options); Step 1 depth.
7. Clarity: answer first, then mechanism, then trap; abbreviations defined; arithmetic shown. Correct but hard to follow is Minor, with a suggested rewrite.
8. Originality: nothing copied from First Aid, UWorld, Amboss, NBME, or uploaded notes. Labeled as study material, not patient care guidance.
9. Missing key nuance counts. If a student would pick the wrong answer on a classic look-alike because the material leaves it out, that is Major.

CODE (game PRs only; checklist section C)
- Confirm the pull request's automatic checks (CI: validator + tests) passed. If you can run commands in your own workspace, also run npm run check yourself.
- If the PR touches src/: scoring correct, shuffled options keep the key mapped, spaced-repetition dates correct, corrupt saved state does not crash, no secrets, safe rendering (no innerHTML with question text), tests cover the change, still works on a phone and with the keyboard.
- Game mechanics still follow docs/research.md: rewards accuracy and spacing, never speed or guessing.

SEVERITY
- Critical: a wrong medical fact that could cost exam points or teach unsafe practice; a bug that breaks the game or marks a right answer wrong.
- Major: outdated, misleading, missing key nuance, or an uncited claim (uncited = Major, blocked until cited); a bug affecting scoring or progress.
- Minor: wording, typo, style, small UX issue.

OUTPUT
Append one section to findings.md, in this exact shape:

## <date> · <Study guide NN: topic | Game PR #N: topic>
**Verdict:** Cleared | Cleared with minor fixes | Fixes required (Major) | Blocked (Critical)
Sources opened: <each source with ✓ / ✗ and what it confirmed>
Arithmetic: <each calculation re-done, with ✓ or the error>
| # | Severity | Location | Finding | Fix |
|---|---|---|---|---|
| <NN-1> | Major | <section / line / question id> | <what is wrong and the evidence> | <exact fix, with the source to cite> |

Then update the material's status in coverage-tracker.md and (for guides) the README table: "Audited, cleared" or "Audited, fixes pending".
Do NOT edit the guide or the questions yourself. The writer fixes; you re-check.
Finally, give me a short summary: the verdict, counts of Critical/Major/Minor, and each Critical or Major finding in one line.

RE-CHECKS
When asked to re-check fixes, verify each finding ID one by one against the updated file, mark it fixed or still open in findings.md, and only then change the verdict to Cleared and write **Closed.** at the end of the section.
````

---

## Quick tips

- **Pick topics from your misses.** After a practice block, list the questions you got wrong *with high confidence*. Those make the best guides and game questions (confident mistakes are the ones feedback fixes best).
- **Keep the coverage tracker honest.** When you add a weak topic, add a row to `coverage-tracker.md` so the auditor can check it gets covered.
- **Short batches audit better.** One guide, or 5-10 questions, per audit.
- **If the writer and auditor disagree,** ask the auditor to cite the page that supports its view, then decide with the source in front of you.

## Changelog

- 0.2 (2026-10-27): rewritten for use without Terminal: Claude desktop app, folder attach, and the GitHub connector. Claude does all technical steps.
- 0.1 (2026-10-27): first draft, based on the standards used for guides 01-19, the 63 game questions, and the audit checklist.
