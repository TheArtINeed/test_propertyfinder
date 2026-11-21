# Measurement plan (template)

Fill on task day. Principle: **holdout, not before/after**. Markets move (seasonality, rent cycle, campaigns); only a randomised control shows what the feature caused.

## 1. Hypothesis
If we **[change]** for **[user segment]**, then **[behaviour]** will change by **[X%]**, because **[reason from evidence]**.

## 2. Metrics
| Type | Metric | Why |
|---|---|---|
| Primary (one) | e.g. qualified leads per user | Closest to value for payer and user |
| Secondary | e.g. time to first contact, saved searches | Explains the primary |
| Guardrails | e.g. agent response rate, lead complaints, empty-result rate, revenue per user | Must not get worse |
| Long-term / lagging | e.g. signed lease / closed deal (DLD / Ejari match) | Real business outcome, arrives later |

## 3. Design
- **Randomisation unit**: user / session / agency / community (geo). Pick the unit where effects don't leak between arms.
  - Users -> consumer features.
  - Agencies or communities (geo holdout) -> anything that changes what agents receive or pay, so control agents are not affected.
- **Split**: e.g. 90/10 holdout for a launch, 50/50 for a pure test.
- **Eligibility**: who enters (e.g. Dubai renters who open Scout).
- **Duration**: at least 2 full weeks (weekday/weekend cycle), longer if the primary metric lags.
- **Pricing tests**: separate agency pilot (paid tier vs matched control agencies), not on consumers.

## 4. Sample size (users per arm)
Two-sided test, alpha 0.05, power 0.8. Relative MDE = smallest lift worth detecting.

| Baseline rate | MDE +5% | +10% | +20% | +30% |
|---|---|---|---|---|
| 1% | 637,008 | 163,092 | 42,691 | 19,824 |
| 2% | 315,204 | 80,679 | 21,106 | 9,795 |
| 5% | 122,121 | 31,231 | 8,155 | 3,778 |
| 10% | 57,760 | 14,749 | 3,839 | 1,772 |
| 20% | 25,580 | 6,507 | 1,680 | 769 |

Duration (weeks) = 2 x n per arm / eligible users per week (for a 50/50 split).

## 5. Decision rule (write before launch)
- **Ship**: primary up significantly, no guardrail down beyond its threshold.
- **Iterate**: primary flat, secondary signals positive.
- **Kill**: primary flat or down, or a guardrail broken.

## 6. Risks to validity
- Novelty effect -> look at week 2 vs week 1.
- Network effects between arms (agents serve both) -> geo or agency randomisation.
- Metric gaming (more leads, lower quality) -> lead quality guardrail.
- Lagging outcomes -> keep a small long-running holdout (e.g. 5% for 3 months).
