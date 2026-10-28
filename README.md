# Med School Prep Game

A free, open-source study game for **USMLE Step 1** and **NBME** exams. It runs in the browser with no account and no server. Progress is saved on your own device.

> Study material only. Not patient-care guidance.

## How it works

- **Daily Rounds**: questions due for review plus a few new ones, mixed across organ systems. Do this every day.
- **Focus**: tick any mix of NBME subjects (Pathology, Pharmacology, ...), whole organ systems, single topics (with a "Find a topic" search box), or "questions I have missed", then drill just those. Picks are remembered on that device.
- **Exam Block**: timed, no feedback until the end, like the real test. Then review every answer.

Before you see the answer, you rate your confidence (Guess / Unsure / Sure). That rating sets when the question comes back (spaced repetition, SM-2) and flags confident mistakes, which are the most valuable ones to fix.

A question you miss or only guess right comes back at the end of the same session until you get it right with confidence (successive relearning). Under **My exams**, add each test you are preparing for (USMLE Step 1, NBME CBSE or CBSSA, or an NBME subject exam) and its date. The game aims at the soonest one. New questions come from that exam's content first, Exam Block matches its block length, and review gaps shrink as the date approaches, so every question gets its final passes before the test.

Why these mechanics? See [docs/research.md](docs/research.md).

Want Claude to write new questions, study guides, or audit them? Copy-paste prompts (including a study buddy that logs the topics she struggles with) are in [docs/claude-prompts.md](docs/claude-prompts.md).

Keyboard: `A`–`F` or `1`–`6` pick an answer, `G` / `U` / `S` set confidence, `Enter` goes to the next question.

## Run it

```sh
npm run serve        # or: python3 -m http.server 8000
# open http://localhost:8000
```

It also works on GitHub Pages (Settings → Pages → deploy from `main`).

## Questions

All questions are original, written for this project, in NBME single-best-answer style. Each one has:

- tags: exam (`usmle-step1`, `nbme`), NBME discipline, organ system, topic
- an explanation of the answer and of every wrong option
- at least one source with a link (mostly StatPearls on NCBI Bookshelf, which is free to read)

Nothing is copied from UWorld, NBME, First Aid, or other commercial question banks.

## Develop

```sh
npm run validate   # schema check for data/questions.json
npm test           # unit tests (Node 20+)
```

CI runs both on every push and pull request.

## License

Code: MIT. Question content: CC BY 4.0. See [LICENSE](LICENSE).
