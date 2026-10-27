# What the research says, and how the game uses it

Short summary of the evidence behind each mechanic. Every claim below was checked against the cited source.

| Finding | Evidence | Game mechanic |
|---|---|---|
| Practicing retrieval (testing yourself) beats re-reading for long-term retention, including in medical students. | Larsen et al. 2013, *Adv Health Sci Educ* 18:409–425 (doi:10.1007/s10459-012-9379-7): repeated testing beat studying a review sheet at 6 months. | Every activity is a question, never a passive page. |
| Doing more practice questions and more spaced-repetition flashcards is associated with higher Step 1 scores. | Deng, Gluckstein & Larsen 2015, *Perspect Med Educ* 4:308–313 (doi:10.1007/s40037-015-0220-x): question count and unique Anki cards each independently predicted Step 1 score (observational). | Daily Rounds brings back each question on an expanding schedule (SM-2). |
| Mixing related categories (interleaving) beats blocking them, especially when categories look similar and the material is complex. | Brunmair & Richter 2019, *Psychol Bull* (doi:10.1037/bul0000209): meta-analysis, g = 0.42 overall; larger for similar categories. | Daily Rounds and Exam Blocks never show two questions from the same organ system in a row when avoidable. Focus mode exists for weak areas but the UI recommends mixing, and when several topics are picked it mixes them rather than running them in blocks. |
| Gamification has a small-to-medium effect on learning, and the effect holds in rigorous studies. Competition alone is weaker than competition plus collaboration. | Sailer & Homner 2020, *Educ Psychol Rev* 32:77–112 (doi:10.1007/s10648-019-09498-w): cognitive g = 0.49 (0.42 in high-rigor studies). | Points, levels, and a streak, but no speed bonus and no public leaderboard. |
| Gamification studies in medical education mostly measure recall; few show deeper reasoning gains. | Huang, Loid & Sung 2024, *BMC Med Educ* 24:20 (doi:10.1186/s12909-023-04955-1): 18 of 23 studies targeted low-level outcomes. | Questions are clinical vignettes that require two-step reasoning, not bare fact recall. |
| Errors made with high confidence are corrected more readily after feedback (hypercorrection). | Butterfield & Metcalfe 2001, *J Exp Psychol Learn Mem Cogn* 27:1491–1494. | Learners rate confidence before seeing the answer. Confident misses are flagged and come back the next day. |

## Design rules that follow

1. **Feedback right away, with reasons.** After each question (outside Exam Block), show the answer, why it is right, and why each wrong option is wrong, starting with the one the learner picked.
2. **Reward accuracy and spacing, not speed or guessing.** Correct and sure = 10 XP, correct and unsure = 8, correct guess = 4, wrong = 0, plus 5 XP for a question that was due for review.
3. **Low stakes.** Nothing is lost for a wrong answer; the question just comes back sooner.
4. **Exam realism when it matters.** Exam Block mimics the real test (timed, no feedback until the end) so she practices pacing, then reviews everything.
