# Biostatistics: risk measures, NNT and Kaplan-Meier curves

Exam focus: USMLE Step 1 and NBME · Study material, not patient care guidance · Auditor: cleared 2026-10-27
From the question log: "formulas for odds ratios, hazard ratios, relative risk, RRR, ARR and NNT" and "interpret Kaplan-Meier survival curves and calculate cumulative incidence".
Based on your notes: the biostatistics PDF (one-page summary PDF p. 1, risk table PDF p. 5, confidence intervals PDF p. 10, risk chapter PDF pp. 27-28; cited by PDF page because the printed numbers change between sections). Your notes do not cover Kaplan-Meier curves, so that section rests on the cited articles. Where a document is wrong, a marked note says so.

## In one line
Set up the 2x2 table the same way every time (exposure on the rows, outcome in the columns), then every measure is one division: risk ratio compares rows, odds ratio cross-multiplies, and NNT is 1 over the absolute difference.

## The 2x2 table
|  | Outcome yes | Outcome no |
| --- | --- | --- |
| Exposed / treated | a | b |
| Unexposed / control | c | d |

## Formula sheet
| Measure | Formula | Meaning | Typical study |
| --- | --- | --- | --- |
| Risk (exposed) | a / (a + b) | Chance of the outcome in the exposed | Cohort, RCT |
| Relative risk (RR) | [a / (a + b)] / [c / (c + d)] | How many times more likely with exposure | Prospective cohort, RCT |
| Absolute risk reduction (ARR) | Control risk − treated risk | Actual risk removed | RCT |
| Relative risk reduction (RRR) | 1 − RR (= ARR / control risk) | Proportion of control risk removed | RCT |
| Number needed to treat (NNT) | 1 / ARR, rounded **up** | Patients treated to prevent one event | RCT |
| Number needed to harm (NNH) | 1 / absolute risk increase | Patients exposed to cause one extra harm | RCT, cohort |
| Odds ratio (OR) | (a / b) / (c / d) = ad / bc | Odds of exposure among cases vs controls | Case-control |
| Hazard ratio (HR) | Hazard in group 1 / hazard in group 2 at any time | Relative event rate over time | Survival analysis (Cox model) |

Sources: RR and its interpretation ([StatPearls: Relative Risk](https://www.ncbi.nlm.nih.gov/books/NBK430824/), [Monaghan 2021, PMC8198228](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198228/)); OR = ad/bc ([StatPearls: Odds Ratio](https://www.ncbi.nlm.nih.gov/books/NBK431098/), [Szumilas 2010, PMC2938757](https://pmc.ncbi.nlm.nih.gov/articles/PMC2938757/)); ARR, RRR and NNT = 1/ARR ([Guthrie et al., NIHR 2017](https://www.ncbi.nlm.nih.gov/books/NBK426103/), [Monaghan 2021, PMC8198228](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198228/); rounding NNT up is standard teaching); HR ([Goel et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)). NNH = 1/absolute risk increase is the mirror of NNT (Monaghan 2021 defines it: [Monaghan 2021, PMC8198228](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198228/)).

Your notes use the same formulas: OR = ad/bc, RR = [a/(a+b)] / [c/(c+d)], ARR = control risk − treated risk, RRR = 1 − RR, NNT = 1/ARR, NNH = 1/attributable risk, and attributable risk = exposed risk − unexposed risk, with AR% = (RR − 1)/RR × 100 (biostatistics notes, PDF pp. 1, 5). Their worked examples: smokers among 20 of 30 lung cancer cases and 5 of 25 controls gives OR = (20 × 20)/(5 × 10) = 8; flu in 2% of vaccinated vs 8% of unvaccinated gives RR 0.25, RRR 0.75 and ARR 0.06, so NNT = 1/0.06 ≈ 16.7, rounded up to 17 (PDF p. 5).

**Correction (RR below 1):** the risk table on PDF p. 5 says "RR < 1 exposure associated with disease occurrence", the same words it uses for RR above 1. An RR below 1 means the event is **less** likely in the exposed group (a protective exposure), as the same notes say on PDF p. 27 and as StatPearls says. [StatPearls: Relative Risk](https://www.ncbi.nlm.nih.gov/books/NBK430824/)

**Correction (RRR formula and the worked example):** PDF p. 28 writes RRR = (control rate − experimental rate) "plus" the control rate; it should be **divided by** the control rate, which is what its own worked example does ((0.01 − 0.004)/0.01 = 0.6). That example then calls the risk 0.01% vs 0.004% and gives NNT 167. With percentages that small, ARR = 0.006% = 0.00006 and NNT = 1/0.00006 ≈ 16,667. NNT 167 is right only if the risks are 1% and 0.4% (ARR 0.006), which is the example in the guide below. [Guthrie et al.](https://www.ncbi.nlm.nih.gov/books/NBK426103/)

**Correction (cohort studies and causation):** the one-page summary says a cohort study "proves cause-effect" (PDF p. 1). A cohort study shows that exposure came before disease and measures relative risk, but confounding means an observational study cannot prove causation by itself; a randomized trial comes closest (standard teaching).

## High-yield facts
- RR = 1: no difference; above 1: more likely with exposure; below 1: less likely. [StatPearls: Relative Risk](https://www.ncbi.nlm.nih.gov/books/NBK430824/)
- A confidence interval for an OR (or RR, or HR) that includes 1 means the result is not statistically significant. [StatPearls: Odds Ratio](https://www.ncbi.nlm.nih.gov/books/NBK431098/) Your notes say the same (biostatistics notes, PDF pp. 10, 28).
- OR approximates RR only when the outcome is rare; when the outcome is common, OR overstates the risk. [StatPearls: Odds Ratio](https://www.ncbi.nlm.nih.gov/books/NBK431098/) Your notes: "For rare diseases (low prevalence), OR approximates RR" (PDF p. 5); cohort studies give RR ("what will happen?"), case-control studies give OR ("what happened?") (PDF p. 1).
- A big RRR can hide a tiny ARR: a drug that cuts deaths from 10 to 4 per 1000 has RRR 60% but ARR only 0.006, so NNT = 167. [Guthrie et al.](https://www.ncbi.nlm.nih.gov/books/NBK426103/) Your notes make the same point: ARR is the better measure of benefit, and RRR "can look deceptively large", so watch drug advertising that quotes RRR (PDF p. 28).
- Lower NNT = better treatment; higher NNH = safer exposure (biostatistics notes, PDF p. 5).

## Kaplan-Meier curves
1. The y-axis is the estimated probability (or percent) surviving; the x-axis is time since entry. [Goel et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
2. The curve is a **step function**: it drops only when an event happens and stays flat between events. Do not join points with sloped lines. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
3. Patients lost to follow-up or still event-free at the end are **censored**: they leave the at-risk denominator without counting as events. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
4. Cumulative survival at a time = the product of the survival probabilities of every earlier interval. Each interval's probability = those surviving / those at risk. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
5. Median survival = the time where the curve crosses 0.50. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
6. The log-rank test compares two curves; the hazard ratio summarizes the difference, and the hazard ratio (Cox model) assumes it is constant over time (proportional hazards); the log-rank test works best under the same condition. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
7. Cumulative incidence (of the event) is 1 − cumulative survival, when there are no competing risks (standard teaching, not on the cited page).

## Clinical vignette
In an RCT, 20 of 200 patients on placebo and 10 of 200 patients on a new drug have a stroke in 5 years. Calculate RR, RRR, ARR and NNT.

**Answer:** RR 0.5, RRR 50%, ARR 5%, NNT 20.
**Why:** treated risk = 10/200 = 0.05; control risk = 20/200 = 0.10. RR = 0.05 / 0.10 = 0.5. RRR = 1 − 0.5 = 0.5. ARR = 0.10 − 0.05 = 0.05. NNT = 1 / 0.05 = 20. [StatPearls: Relative Risk](https://www.ncbi.nlm.nih.gov/books/NBK430824/), [Guthrie et al.](https://www.ncbi.nlm.nih.gov/books/NBK426103/)
**Trap:** NNT = 1/ARR, not 1/RRR (which would give 2).

## Common traps
- Use ARR as a decimal (5% = 0.05) before dividing.
- Always round NNT **up** (16.2 becomes 17).
- RR below 1 = protective, not "associated with disease" (see the Correction above).
- RRR = (control − treated) **divided by** control, never "plus".
- Case-control studies start from the outcome, so they cannot give a risk; report an OR.
- A censored patient is not a death; the curve does not drop at a censoring mark.

## Practice questions
1. A case-control study: 40 of 100 lung cancer cases smoked and 10 of 100 controls smoked. What is the odds ratio?
   - **Answer:** 6.
   - **Why:** smokers: a = 40 cases, b = 10 controls. Non-smokers: c = 60 cases, d = 90 controls. OR = ad / bc = (40 × 90) / (10 × 60) = 3600 / 600 = 6. [StatPearls: Odds Ratio](https://www.ncbi.nlm.nih.gov/books/NBK431098/)
   - **Trap:** calculating a relative risk from a case-control study.
2. Mortality falls from 8% to 6% with a drug. NNT?
   - **Answer:** 50.
   - **Why:** ARR = 0.08 − 0.06 = 0.02; NNT = 1 / 0.02 = 50. [Guthrie et al.](https://www.ncbi.nlm.nih.gov/books/NBK426103/)
   - **Trap:** dividing by 2 instead of 0.02.
3. A trial reports HR 0.75 (95% CI 0.60-0.94) for death with a new drug. Interpret it.
   - **Answer:** at any given time, the treated group's hazard of death is 25% lower, and the result is statistically significant.
   - **Why:** HR below 1 favors treatment; the interval does not include 1. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/), [StatPearls: Odds Ratio](https://www.ncbi.nlm.nih.gov/books/NBK431098/)
   - **Trap:** calling it a 75% reduction.
4. A Kaplan-Meier study starts with 10 patients. At month 1, 2 die (8 left). At month 2, 1 patient is censored (7 at risk). At month 3, 1 of the 7 dies. What is cumulative survival at month 3?
   - **Answer:** about 0.69 (69%).
   - **Why:** month 1: 8/10 = 0.80. Month 3: 6/7 = 0.857. Cumulative = 0.80 × 0.857 = 0.686. The censored patient leaves the denominator without a drop. [Goel et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
   - **Trap:** counting the censored patient as a death (6/10 = 0.60).
   - **Follow-up: cumulative incidence of death by month 3?** 1 − 0.686 = 0.314, about 31% (no competing risks assumed; standard teaching).

## Sources (opened 2026-10-27)
- [Relative Risk (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK430824/)
- [Odds Ratio (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK431098/)
- [Guthrie B et al. Comparing treatments in terms of absolute benefit. In: Better guidelines for better care. NIHR Journals Library; 2017](https://www.ncbi.nlm.nih.gov/books/NBK426103/)
- [Goel MK, Khanna P, Kishore J. Understanding survival analysis: Kaplan-Meier estimate. Int J Ayurveda Res. 2010;1(4):274-278](https://pmc.ncbi.nlm.nih.gov/articles/PMC3059453/)
- [Szumilas 2010, PMC2938757](https://pmc.ncbi.nlm.nih.gov/articles/PMC2938757/)
- [Monaghan 2021, PMC8198228](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198228/)
- Your notes: the biostatistics PDF (PDF pp. 1, 5, 10, 27-28)

Accuracy notes for the auditor: NNH now cites Monaghan 2021; "cumulative incidence = 1 − survival" is labeled standard teaching, with a worked example added to Q4. I could not open two PMC tutorials (bot check), so hazard-ratio interpretation rests on Goel et al. plus the general CI rule from StatPearls.

Accuracy notes for the auditor: document alignment (2026-10-27, Emily's rule that her documents set the content). Added from the biostatistics PDF (cited by PDF page): matching formulas including AR% = (RR − 1)/RR, the OR = 8 and flu examples (NNT 16.7 → 17 is my arithmetic from the PDF's ARR 0.06), rare-disease OR ≈ RR, CI including 1, ARR vs RRR warning, NNT/NNH direction. Corrections: PDF p. 5 "RR < 1 exposure associated with disease occurrence" (contradicted by PDF p. 27 and StatPearls); PDF p. 28 RRR "plus" typo and the 0.01%/0.004% example's NNT of 167 (arithmetic shown); PDF p. 1 "proves cause-effect" for cohort studies (labeled standard teaching). The notes have no Kaplan-Meier content. No register items apply.
