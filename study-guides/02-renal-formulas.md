# Renal formulas: osmolal gap, clearance, GFR, FENa, corrected sodium

Exam focus: USMLE Step 1 and NBME · Study material, not patient care guidance · Auditor: cleared 2026-10-27
From the question log: "essential nephrology formulas for anion gap, osmolar gap, renal clearance, and corrected sodium". The anion gap is covered in [01-acid-base.md](01-acid-base.md).
Based on your notes: El-Husseiny's Essentials of Nephrology (osmolality p. 23, filtration and clearance pp. 27-36 and 44, acute kidney injury pp. 112-114, ethylene glycol p. 119) and Osmosis HY Pathology Vol. 2 (hyponatremia, p. 810). Each fact is also checked against StatPearls and the MSD Manual; where a different source disagrees with your notes, a marked note says so.

## In one line
Most renal formulas are one idea, clearance = how much plasma is cleaned of a substance per minute (C = U × V / P); the rest are ratios or corrections built on it.

## Core mechanism
1. **Clearance (C)** = U × V / P, where U is the urine concentration, V the urine flow rate and P the plasma concentration. [StatPearls: GFR](https://www.ncbi.nlm.nih.gov/books/NBK500032/)
2. **Glomerular filtration rate (GFR)** equals the clearance of a substance that is freely filtered and neither reabsorbed nor secreted. Inulin is the reference; normal GFR is about 120 mL/min (180 L/day). [StatPearls: GFR](https://www.ncbi.nlm.nih.gov/books/NBK500032/)
3. Creatinine is the practical marker, but it is also secreted by the tubules, so creatinine clearance **overestimates** GFR by about 10-20%. [StatPearls: Renal Function Tests](https://www.ncbi.nlm.nih.gov/books/NBK507821/) Your notes: creatinine is freely filtered, not reabsorbed and **slightly** secreted, so it **slightly** overestimates GFR. Serum creatinine only starts to rise noticeably once GFR falls below about **60 mL/min**, so it misses early loss of function, and muscle injury raises it without any change in GFR (El-Husseiny Nephrology, p. 34).
4. **Renal plasma flow (RPF)** is measured by the clearance of para-aminohippuric acid (PAH). **Filtration fraction (FF)** = GFR / RPF, normally about 20%. [StatPearls: Renal Blood Flow and Filtration](https://www.ncbi.nlm.nih.gov/books/NBK482248/)
5. Afferent arteriole constriction lowers GFR and RPF (FF unchanged). Efferent arteriole constriction raises GFR, lowers RPF and so raises FF. Angiotensin II preferentially constricts the efferent arteriole. [StatPearls: Renal Blood Flow and Filtration](https://www.ncbi.nlm.nih.gov/books/NBK482248/)
6. **Starling forces at the glomerulus (your notes):** glomerular capillary hydrostatic pressure (PGC) 55 mmHg pushes fluid out; glomerular oncotic pressure (πGC) 27 and Bowman space pressure (PBS) 18 push back; Bowman space oncotic pressure is about 0. Net filtration pressure = (55 + 0) − (18 + 27) = **10 mmHg**, and GFR = filtration coefficient × net pressure (El-Husseiny Nephrology, pp. 27-28).
7. **Filtered load** = GFR × plasma concentration (mg/min), valid only for a freely filtered substance (El-Husseiny Nephrology, p. 32).
8. **Renal blood flow (RBF)** = RPF / (1 − hematocrit), because plasma is the part of blood that is not red cells (El-Husseiny Nephrology, p. 44).
9. **Sympathetic nerves** constrict both arterioles but mainly the afferent, so RPF falls a lot, GFR falls and FF rises. The kidney has **no parasympathetic** supply (El-Husseiny Nephrology, p. 31).

## Your notes' table: what changes GFR, RPF and FF (El-Husseiny Nephrology, p. 30)
| Change | GFR | RPF | FF |
| --- | --- | --- | --- |
| Afferent arteriole constriction | ↓ | ↓ | No change |
| Efferent arteriole constriction | ↑ | ↓ | ↑ |
| Plasma protein up | ↓ | No change | ↓ |
| Plasma protein down | ↑ | No change | ↑ |
| Ureter constriction | ↓ | No change | ↓ |
| Dehydration | ↓ | ↓↓ | ↑ |

- Ureter blockage raises the pressure in Bowman space, which pushes against filtration and lowers GFR (p. 31).
- Mnemonics in your notes: **PDA**, Prostaglandins Dilate the Afferent arteriole; **ACE** for the efferent arteriole (p. 30).
- **Correction:** your notes spell ACE out as "Angiotensin II **inhibitors** Constrict Efferent". It is angiotensin II itself that constricts the efferent arteriole (your own notes say so on p. 31, and so does [StatPearls: Renal Blood Flow and Filtration](https://www.ncbi.nlm.nih.gov/books/NBK482248/)); ACE inhibitors take that squeeze away and **dilate** the efferent arteriole, which is why they lower GFR (standard teaching). Remember it as **A**ngiotensin II **C**onstricts **E**fferent.

## Your notes' clearance categories (El-Husseiny Nephrology, pp. 35-36)
| What the tubule does | Clearance | Examples |
| --- | --- | --- |
| Filtered, then fully reabsorbed | 0 | Glucose, amino acids (until glucose passes its threshold) |
| Filtered, partly reabsorbed | Less than GFR | Sodium, potassium, urea |
| Filtered, no net reabsorption or secretion | Equal to GFR | Inulin, mannitol |
| Filtered, partly secreted | More than GFR | Creatinine |
| Filtered and fully secreted | Equal to RPF | PAH (at low plasma levels, before carriers saturate) |

## Formula sheet
| Formula | Equation | Normal / cutoff | What it tells you |
| --- | --- | --- | --- |
| Clearance | C = U × V / P | — | Plasma volume cleared per minute |
| GFR | Inulin clearance (creatinine in practice) | About 120 mL/min | Filtering capacity; creatinine overestimates by 10-20% |
| Filtration fraction | FF = GFR / RPF | About 20% | Rises with efferent constriction (angiotensin II) |
| Calculated serum osmolality | 2 × Na + glucose / 18 + BUN / 2.8 (mg/dL units) | Measured normal 275-295 mOsm/kg (your notes: 285-295) | Expected osmoles |
| Osmolal gap | Measured − calculated osmolality | Above 10 is abnormal | Unmeasured osmole, e.g. methanol or ethylene glycol |
| Fractional excretion of sodium (FENa) | 100 × (U-Na × P-Cr) / (P-Na × U-Cr) | Below 1% prerenal; above 2% intrinsic | Are the tubules still saving sodium? |
| BUN : creatinine ratio | BUN / creatinine | Your notes: above 20 prerenal, below 15 intrinsic (MSD: above 20 and below 10) | Same question, cruder |
| Renal blood flow | RPF / (1 − hematocrit) | — | Blood, not just plasma, through the kidney |
| Filtered load | GFR × plasma concentration | — | Amount filtered per minute |
| Corrected sodium (hyperglycemia) | Measured Na + 1.6 × (glucose − 100) / 100 | — | Sodium once glucose is accounted for |

Sources for the table: calculated osmolality and gap above 10 ([MSD Manual: Metabolic Acidosis](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis)); normal osmolality ([StatPearls: Serum Osmolality](https://www.ncbi.nlm.nih.gov/books/NBK567764/)); FENa and BUN:Cr ([StatPearls: Renal Function Tests](https://www.ncbi.nlm.nih.gov/books/NBK507821/), [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki)); sodium falls about 1.6 mEq/L per 100 mg/dL glucose rise ([MSD Manual: Hyponatremia](https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hyponatremia)). Your notes give the same osmolality formula (El-Husseiny Nephrology, p. 23), the RBF formula (p. 44), filtered load (p. 32) and the BUN:Cr cutoffs (pp. 112-114).

**Other source (normal osmolality):** your notes give a normal serum osmolality of 285-295 mOsm/kg (El-Husseiny Nephrology, p. 23); StatPearls gives 275-295. Either way, values above 295 are high.

## High-yield facts
- Prerenal injury (low perfusion, healthy tubules) gives FENa below 1% and BUN:Cr about 20:1, because working tubules reabsorb sodium and urea avidly. [StatPearls: Renal Function Tests](https://www.ncbi.nlm.nih.gov/books/NBK507821/), [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki). FENa is unreliable in a patient on diuretics (standard teaching).
- An osmolal gap above 10 plus a high anion gap acidosis points to methanol or ethylene glycol. [MSD Manual](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis)
- Ethylene glycol: glycolic acid causes the acidosis, oxalic acid causes kidney injury, and urine shows calcium oxalate crystals. [StatPearls: Ethylene Glycol Toxicity](https://www.ncbi.nlm.nih.gov/books/NBK537009/) Your notes: ethylene glycol (antifreeze) is broken down to **oxalic acid**, which precipitates as calcium oxalate crystals in the tubules, and **glycolic acid**, which is toxic to the tubules; the classic triad is anion gap acidosis, a raised osmolal gap and calcium oxalate crystals in urine (El-Husseiny Nephrology, p. 119). **Other source:** your notes blame both acids for the tubular damage, while StatPearls ties the acidosis mainly to glycolic acid; both agree the crystals come from oxalic acid.
- Early after a toxic alcohol ingestion the osmolal gap is high; as the parent alcohol is metabolized, the osmolal gap falls and the anion gap rises. [StatPearls: Ethylene Glycol Toxicity](https://www.ncbi.nlm.nih.gov/books/NBK537009/)
- High glucose pulls water out of cells and dilutes sodium (translocational hyponatremia), so the sodium is "falsely" low relative to body sodium. [MSD Manual: Hyponatremia](https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hyponatremia)
- Pseudohyponatremia is a lab artifact from very high triglycerides or protein (for example multiple myeloma); measured osmolality is normal. [StatPearls: Hyponatremia](https://www.ncbi.nlm.nih.gov/books/NBK470386/), [MSD Manual](https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hyponatremia) Your notes list the same two causes (Osmosis HY Pathology Vol. 2, p. 810).

## Your notes' acute kidney injury table (El-Husseiny Nephrology, pp. 112-114)
| | Prerenal | Postrenal | Intrinsic (for example acute tubular necrosis, ATN) |
| --- | --- | --- | --- |
| Problem | Low blood flow to the kidney | Blockage below both kidneys | Damage inside the kidney |
| Urine osmolality (mOsm/kg) | Above 500 | Varies | Below 350 |
| Urine sodium (mEq/L) | Below 20 | Varies | Above 40 |
| FENa | Below 1% | Varies | Above 2% |
| BUN:Cr | Above 20 | Varies | Below 15 |
| Examples | Hypovolemia, low cardiac output, heart failure, liver failure | Stones, BPH, tumor | ATN, interstitial nephritis, glomerulonephritis, vasculitis |

- **Prerenal:** the tubules still work, so they soak up sodium, water and urea (BUN); creatinine is not reabsorbed, so the ratio climbs above 20 (p. 112).
- **Postrenal changes with time:** early on, back-pressure pushes BUN into the blood and the picture looks **prerenal** (BUN:Cr above 20, FENa below 1%); with long-standing blockage the tubules are damaged and it looks **intrinsic** (BUN:Cr below 15, FENa above 2%, urine osmolality below 500) (p. 113).
- **ATN:** dead tubule cells cannot concentrate or dilute urine, so the urine osmolality sits low; the urine shows epithelial or granular casts (pp. 113-114). MSD describes "many granular casts (often with brown pigmentation)". [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki)
- **Other source (cutoffs):** your notes use **FENa above 2%** and **BUN:Cr below 15** for intrinsic injury, although p. 114 also says "above 1%" for ATN. MSD's table uses FENa above 1% and BUN:Cr below 10 for tubular injury, and urine sodium below 10 (not 20) for prerenal; it also warns that these urine indices "are not reliable in nonoliguric states". On an exam, FENa below 1% means prerenal and a clearly high FENa means the tubules are damaged; the 1-2% range is the gray zone. [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki)

## Compare and contrast: low sodium with three different osmolalities
| Type | Serum osmolality | Mechanism | Example |
| --- | --- | --- | --- |
| Pseudohyponatremia | Normal | Lipid or protein takes up sample volume | Severe hypertriglyceridemia, myeloma |
| Hypertonic (translocational) | High, above 295 | Glucose or mannitol pulls water out of cells | Uncontrolled hyperglycemia |
| True (hypotonic) | Low | Excess water relative to sodium | SIADH, heart failure, thiazides |

[StatPearls: Hyponatremia](https://www.ncbi.nlm.nih.gov/books/NBK470386/)

## Clinical vignette
A 45-year-old man is found confused. Labs: Na 138, glucose 90 mg/dL, BUN 14 mg/dL, measured osmolality 320 mOsm/kg, HCO3 8 mEq/L, Cl 100. Urinalysis shows envelope-shaped crystals. What did he most likely ingest?

**Answer:** ethylene glycol.
**Why:** calculated osmolality = 2 × 138 + 90/18 + 14/2.8 = 276 + 5 + 5 = 286, so the osmolal gap is 320 − 286 = 34 (above 10). AG = 138 − (100 + 8) = 30, a high anion gap acidosis. A high osmolal gap with a high anion gap and calcium oxalate crystals points to ethylene glycol. [MSD Manual](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis), [StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK537009/)
**Trap:** a normal osmolal gap late after ingestion does not rule it out, since the alcohol has already been converted to acids.

## Common traps
- Creatinine clearance overestimates GFR (secretion adds to what is filtered); do not say it underestimates.
- A normal serum creatinine does not mean a normal GFR: it barely moves until GFR is below about 60 (El-Husseiny Nephrology, p. 34).
- Afferent constriction leaves FF unchanged; a **ureter** blockage or a **rise in plasma protein** lowers FF; dehydration raises it (El-Husseiny Nephrology, p. 30).
- Early postrenal failure looks prerenal on the numbers; only with long-standing blockage does it look intrinsic (El-Husseiny Nephrology, p. 113).
- FENa below 1% means the tubules are working (prerenal). Acute tubular necrosis (ATN) breaks the tubules, so FENa rises above 2% (1-2% is indeterminate; MSD uses above 1%).
- Glucose and BUN are divided (18 and 2.8) to convert mg/dL to mmol/L; sodium is doubled to count its paired anion (standard teaching). The formula is "based on conventional units". [MSD Manual: Metabolic Acidosis](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis)
- Ethanol also raises the osmolal gap; MSD adds a blood alcohol/5 term, and ethanol alone should not explain a large acidosis. [MSD Manual: Metabolic Acidosis](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis) Isopropyl alcohol gives an osmolal gap with ketosis but **no** anion gap acidosis (standard teaching).
- Correct the sodium for glucose before calling hyperglycemic hyponatremia "true" hyponatremia.

## Practice questions
1. Urine inulin 30 mg/mL, urine flow 2 mL/min, plasma inulin 0.5 mg/mL. What is the GFR?
   - **Answer:** 120 mL/min.
   - **Why:** C = U × V / P = 30 × 2 / 0.5 = 120. Inulin clearance equals GFR. [StatPearls: GFR](https://www.ncbi.nlm.nih.gov/books/NBK500032/)
   - **Trap:** keep U and P in the same units; mixing mg/mL and mg/dL gives a 100-fold error.
2. GFR 120 mL/min and RPF 600 mL/min. What is the filtration fraction, and what happens to it with angiotensin II?
   - **Answer:** 20%; it rises.
   - **Why:** FF = 120 / 600 = 0.20. Angiotensin II constricts the efferent arteriole, which raises GFR and lowers RPF. [StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK482248/)
   - **Trap:** afferent constriction lowers both GFR and RPF, so FF stays the same.
3. Oliguric patient after vomiting: urine Na 10, plasma Na 140, urine creatinine 100, plasma creatinine 2 (same units). FENa and category?
   - **Answer:** FENa about 0.14%, prerenal.
   - **Why:** FENa = 100 × (10 × 2) / (140 × 100) = 2000 / 14000 = 0.14%, below 1%. [StatPearls: Renal Function Tests](https://www.ncbi.nlm.nih.gov/books/NBK507821/), [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki)
   - **Trap:** a recent loop diuretic would raise FENa and make prerenal injury look intrinsic.
4. Measured Na 128 mEq/L with glucose 600 mg/dL. What is the corrected sodium?
   - **Answer:** about 136 mEq/L.
   - **Why:** glucose is 500 above 100, so add 1.6 × 5 = 8: 128 + 8 = 136. [MSD Manual: Hyponatremia](https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hyponatremia)
   - **Trap:** treating this as SIADH-type hyponatremia; the low sodium is from water pulled out of cells by glucose.

## Sources (opened 2026-10-27)
- [Physiology, Glomerular Filtration Rate (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK500032/)
- [Physiology, Renal Blood Flow and Filtration (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK482248/)
- [Renal Function Tests (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK507821/)
- [Serum Osmolality (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK567764/)
- [Hyponatremia (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK470386/)
- [Ethylene Glycol Toxicity (StatPearls)](https://www.ncbi.nlm.nih.gov/books/NBK537009/)
- [Metabolic Acidosis (MSD Manual Professional)](https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/metabolic-acidosis)
- [Hyponatremia (MSD Manual Professional)](https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hyponatremia)
- [MSD Manual: Acute Kidney Injury](https://www.msdmanuals.com/professional/nephrology/acute-kidney-injury/acute-kidney-injury-aki)
- Your notes: El-Husseiny's Essentials for USMLE Step 1 Nephrology (pp. 23, 27-36, 44, 112-114, 119); Osmosis High-Yield Notes Pathology Vol. 2 (p. 810)

Accuracy notes for the auditor: the StatPearls ethylene glycol page writes BUN/1.6 in its osmolality formula; the MSD Manual's BUN/2.8 (conventional mg/dL units) is used here. The StatPearls ethylene glycol page gives a baseline gap range of −9 to 19; the >10 cutoff is MSD's. "Envelope-shaped" crystals describe calcium oxalate dihydrate; the cited page names calcium oxalate (monohydrate) only.

Accuracy notes for the auditor: document alignment (2026-10-27, Emily's rule that her documents set the content). Added from El-Husseiny Nephrology: osmolality formula and the 285-295 normal (p. 23, Other source vs StatPearls 275-295), Starling numbers and net filtration pressure (pp. 27-28), the GFR/RPF/FF table and PDA mnemonic (p. 30), sympathetic effects and no parasympathetic supply (p. 31), filtered load (p. 32), creatinine details including the GFR-below-60 rule (p. 34), the five clearance categories (pp. 35-36), RBF = RPF/(1 − Hct) (p. 44), the AKI table and postrenal time course (pp. 112-114), ethylene glycol (p. 119). Correction: p. 30 expands ACE as "Angiotensin II inhibitors Constrict Efferent"; p. 31 and StatPearls say angiotensin II constricts the efferent arteriole, and the ACE inhibitor dilation line is labeled standard teaching. Casts: notes say epithelial/granular; MSD quote on brown-pigmented granular casts added ("muddy brown" not used). Other source notes: AKI cutoffs (notes FENa >2%, BUN:Cr <15 and urine Na <20, with >1% on p. 114; MSD table FENa >1%, BUN:Cr <10, urine Na <10, rechecked 2026-10-28) and ethylene glycol acid roles. Pseudohyponatremia causes match Osmosis Vol. 2 p. 810. No Recent change items from the register apply.
