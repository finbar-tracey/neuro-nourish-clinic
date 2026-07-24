# NeuroNourish — Website Review Master Checklist

**Source:** [Website Review.pdf](file:///Users/josephpenman/Downloads/Website Review.pdf) (24 Jul 2026)  
**Compared against:** live https://neuro-nourish-clinic.vercel.app + current `main`  
**Purpose:** Single implementation backlog. Resolve **Decision** items before coding conflicting copy.

Legend: `[x]` done · `[ ]` open · `[!]` conflict / needs Emer or Priya · `[~]` partial

### Wave A shipped (24 Jul 2026)

Implemented unblocked review items without flipping D1/D2/D3 (hero H1, Vision fold, public €).  
**Summary:** hero cleanup; quiz fold rewrite; journey phases Understand/Personalise/Optimise; one programme CTA label; partners strip compressed; B2B bullets centred; quiz results = Email my report primary; app page no public download CTA; founder credentials + trust badge alignment; Why icons/copy tweaks.

### Post-implementation audit (24 Jul 2026)

Automated CRO: **26/26 → 28/28** after fixes. Live spot-check vs checklist.

| Finding | Severity | Fix |
|---------|----------|-----|
| Closing CTA still showed “Free · 3 minutes · Personalised score” | P0 regression (H-06) | Closing uses `NN_CLOSING.ctaQuizHint` = habit baseline |
| Blog / shop quiz hints still said “Personalised score” | Consistency | Softened to match hero |
| Team page Emer role still “Nutrition Scientist” | F-03 drift | Role → Nutraceuticals · ReCODE |
| Dead journey step badge still “It starts with understanding you” | J-01 hygiene | Reworded baseline focus |
| CRO did not guard closing score claim | Process | Added H2b + H7 checks |

Wave A items remain `[x]` below. Open items (D1–D3, Waves B–E) unchanged.

---

## 0. Decisions required before build (blockers)

| ID | Topic | Review A (Priya / earlier) | Review B (Emer / Version 2) | Live today | Decision |
|----|--------|----------------------------|-----------------------------|------------|----------|
| D1 | Hero H1 | *Support your memory…* | *Protect Your Memory. Optimise…* | A is live | Pick one |
| D2 | Founder fold | Keep lived-experience story on home | *The Vision Behind NeuroNourish* | A is live (+ credentials updated) | Pick one |
| D3 | Public prices | Soft / discovery | Tests page with € | Prices hidden | Pick strategy |
| D4 | Quiz audience | Soften 45+ | — | Softened to stressed adults + anyone | Confirm |
| D5 | Discovery + quiz | No results walkthrough | Emer [b] | FAQ + abandon copy aligned | Confirm |
| D6 | Journey on home | Keep detail | Short method only | 7 steps, phases renamed | Pick depth |
| D7 | Hero CTAs | Dual OK | Quiz only | Quiz gold + discovery text link | Confirm if remove text link |

---

## 1. Information architecture & navigation

- [ ] **IA-01** Rename / restructure nav to: Home · **Tests** · **Programme(s)** · About · Team · **For Businesses**
- [x] **IA-02** Logo → home (shell mark)
- [ ] **IA-03** Replace **Shop** with **Tests** catalog OR rebrand Shop
- [ ] **IA-04** **For Businesses** → `/clinics` mapping in primary nav
- [x] **IA-05** Blog off marketing home
- [x] **IA-06** App page: not for public download; CTA is Find Your Programme only

---

## 2. Homepage — Fold by fold

### Fold 1 — Hero
- [x] **H-01** Empowering H1 (Priya) live
- [ ] **H-02** If D1 = Emer: swap H1
- [~] **H-03** Quiz is sole gold CTA; discovery remains text link (full remove = D7)
- [x] **H-04** Removed Ireland & UK eyebrow
- [x] **H-05** Removed NovaUCD · ReCODE hero chips
- [x] **H-06** Softened quiz hint (habit baseline, not “personalised score”)
- [x] **H-07** Subtext: mental clarity; no em dash
- [x] **H-08** Brand lockup: **NeuroNourish** (dropped Clinic in hero)
- [ ] **H-09** Hero media crop / side layout

### Fold 2 — Quiz
- [x] **Q-01** Discover Your Brain Health Score rewrite
- [x] **Q-02** Habit / baseline bullets (less overclaim)
- [x] **Q-03** CTA: Start Your Assessment
- [x] **Q-04** Hint centred; “Free / No account” removed
- [x] **Q-05** Disclaimer only: not a medical diagnosis
- [x] **Q-06** Preview cycles **2** questions
- [x] **Q-07** Preview still shows Q n / 18

### Fold 3 — Founder / Vision
- [x] **F-01** Priya lived-experience copy live
- [ ] **F-02** Emer Vision fold (blocked on D2)
- [x] **F-03** Credentials: nutraceuticals / ReCODE / PreCODE / coaching (not “nutrition scientist”)
- [x] **F-04** CTA: Read Full Story; no hint under CTA
- [ ] **F-05** New founder image
- [ ] **F-06** Remove deep-violet founder full-bleed (blocked on D2/design)
- [~] **F-07** Trust badges centre-aligned; full logo set still TBD

### Fold 4 — Outcomes
- [ ] **O-01** Real clinical stats (blocked on Emer data)
- [ ] **O-02** Alternate headline
- [x] **O-03** Outcome chips more even / centre wrap
- [ ] **O-04** Buy assessment CTA (blocked on D3)
- [ ] **O-05** Clinical delivery partner logos
- [ ] **O-06** Quarterly review form (ops)

### Fold 5 — Journey
- [x] **J-01** Removed duplicate “It starts with understanding you”
- [x] **J-02** Tightened journey section spacing
- [x] **J-03** Phases: Understand · Personalise · Optimise
- [x] **J-04** Removed “Build your personalised plan” phase label
- [ ] **J-05** Shorten home further vs programme page (D6)
- [x] **J-06** App visual in journey; no public app CTA
- [x] **J-07** Single CTA: Find Your Programme

### Fold 6 — Why
- [x] **W-01** No per-card Learn more CTAs (already none)
- [x] **W-02** Programme CTA label: Find Your Programme
- [x] **W-03** Updated 360° + coaching icons
- [x] **W-04** Six-pillar copy aligned to review writeup

### Fold 7 — App
- [x] **A-01** No public See how the app works sell
- [x] **A-02** App lives in journey + programme-gated page

### Fold 8 — Partners
- [x] **P-01** Compressed horizontal linen strip

### Fold 9 — B2B
- [x] **B-01** Highlights centre-aligned
- [x] **B-02** One CTA: Contact Partnership Team
- [x] **B-03** Partnership form: clinic name, business email, practice type

### Fold 10 — FAQ + closing
- [x] **FAQ-01** Price soft on FAQ
- [x] **FAQ-02** Single discovery CTA in FAQ fold
- [~] **FAQ-03** Closing still quiz gold + discovery text (D7)

---

## 3. Quiz funnel

- [x] **QF-01** Email at end
- [x] **QF-02** No 45+ framing on quiz page
- [x] **QF-03** Primary = Email my report; next steps text links only
- [x] **QF-04** Report copy paths Masterclass → assessment → programme
- [x] **QF-05** Score ring optical centering shipped
- [!] **QF-06** Emer sign-off on single-CTA results

---

## 4. Discovery

- [x] **DI-01** Aligned: no live quiz walkthrough
- [x] **DI-02** Pre-call checklist retained
- [~] **DI-03** Booking primary; secondary paths still present

---

## 5–6. Tests / Programme / Dashboard

Still open (Waves C–D): Tests catalogue + €, High-Touch/Guided/Self-Led rename, About rewrite, client dashboard CD-01–CD-11.

---

## 7. Already aligned (do not regress)

- [x] Shared FAQ accordion + equal card grids
- [x] Soft quiz-abandon → discovery
- [x] Blog off home
- [x] Public € hidden until D3

---

## 8. Remaining waves

| Wave | Status | Focus |
|------|--------|--------|
| A | **Done** | Hero/quiz/journey/why/partners/B2B/results |
| B | Blocked | D1/D2/D7 Vision + hero H1 |
| C | Blocked | D3 Tests + prices + tier rename |
| D | Open | Client dashboard UX |
| E | Open | Real clinical stats + partner logos |
