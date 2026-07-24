# NeuroNourish — Website Review Master Checklist

**Source:** [Website Review.pdf](file:///Users/josephpenman/Downloads/Website Review.pdf) (24 Jul 2026)  
**Compared against:** live https://neuro-nourish-clinic.vercel.app + current `main`  
**Purpose:** Single implementation backlog. **Later document wins** (Emer Version 2 / homepage corrections).

Legend: `[x]` done · `[ ]` open · `[!]` conflict / needs Emer or Priya · `[~]` partial

### Decision rule (24 Jul 2026)

Where Priya (earlier) and Emer Version 2 (later) conflict, **implement Emer / lower in the document**.

| ID | Decision locked |
|----|-----------------|
| D1 | Emer H1: *Protect Your Memory. Optimise Brain Performance. Strengthen Your Future.* |
| D2 | Vision fold on home (no personal story / no deep violet) |
| D3 | Tests page with public € |
| D7 | Hero quiz CTA only (discovery stays in header) |
| D4–D6 | Softened audience live; discovery = no quiz walkthrough; journey stays on home with phases |

### Waves B+C shipped (24 Jul 2026)

Hero Emer H1 + quiz-only; Vision Behind NeuroNourish; nav Tests · Programme · About · Team · For Businesses; `/tests` catalog with €; High-Touch / Guided / Self-Led rename; outcomes clinical stats + buy assessment + delivery partners; About rewrite with assessment CTA.

### No-blocker polish (24 Jul 2026)

- [x] About credential logos + accreditations strip
- [x] Programme High-Touch / Guided / Self-Led comparison table
- [x] Home journey → Emer 3-step Method (Understand · Personalise · Optimise)
- [x] PT257 + Blood Work Review hidden from Tests catalog
- [x] Brand mark `aria-label` → NeuroNourish; closing chip drop Ireland & UK → Habit baseline first

### Post-implementation audit — Emer Version 2 (24 Jul 2026)

Automated: CRO **28/28 → 30/30** after fixes · Brand **45/45**. Live spot-check vs PDF.

| Finding | Severity | Fix |
|---------|----------|-----|
| OG image still Priya H1 + “NeuroNourish Clinic” + Ireland & UK | P0 regression (D1/H-08) | OG matches Emer H1; brand NeuroNourish |
| Why fold missing Find Your Programme CTA (W-02) | P1 gap | Restored programme CTA |
| Catalog links still said “shop” (`/programme`, product detail, success) | Consistency (IA-03) | Point to `/tests` |
| PageSpeed / mobile audit URL lists still `/shop` | Process | Updated to `/tests` |

**Pass (unchanged):** Emer hero H1; quiz-only hero; Vision fold (no deep violet); nav Tests + For Businesses; Tests € prices; High-Touch/Guided/Self-Led; outcomes buy assessment; About assessment CTA; CRO/brand green.

**Still open:** Wave F logo/Clinics polish; founder photo; hero media; finger-prick prices; dashboard Wave D; quarterly review form.  
**Next implement:** §9 Wave F (F1–F3 no Emer; F4 blocked on assets).

---

## 0. Decisions required before build (blockers)

| ID | Topic | Live today | Decision |
|----|--------|------------|----------|
| D1 | Hero H1 | Emer Version 2 | **Locked** |
| D2 | Founder fold | Vision fold | **Locked** |
| D3 | Public prices | Tests + € | **Locked** |
| D4 | Quiz audience | Softened | Locked (soft) |
| D5 | Discovery + quiz | No walkthrough | Locked |
| D6 | Journey on home | Emer 3-step Method | **Locked** (detail on `/programme`) |
| D7 | Hero CTAs | Quiz only | **Locked** |

---

## 1. Information architecture & navigation

- [x] **IA-01** Nav: Tests · Programme · About · Team · For Businesses
- [x] **IA-02** Logo → home (shell mark)
- [x] **IA-03** Shop catalog rebranded as **Tests** (`/tests`; `/shop` redirects)
- [x] **IA-04** **For Businesses** → `/clinics`
- [x] **IA-05** Blog off marketing home
- [x] **IA-06** App page: not for public download; CTA is Find Your Programme only

---

## 2. Homepage — Fold by fold

### Fold 1 — Hero
- [x] **H-01 / H-02** Emer H1 live
- [x] **H-03** Quiz sole gold CTA on hero (discovery in header)
- [x] **H-04** Removed Ireland & UK eyebrow
- [x] **H-05** Removed NovaUCD · ReCODE hero chips
- [x] **H-06** Softened quiz hint (habit baseline)
- [x] **H-07** Subtext: protect memory + mental performance
- [x] **H-08** Brand lockup: **NeuroNourish**
- [ ] **H-09** Hero media crop / side layout

### Fold 2 — Quiz
- [x] **Q-01–Q-07** Discover Your Brain Health Score rewrite + 2-Q preview

### Fold 3 — Vision
- [x] **F-02** Emer Vision fold on home
- [x] **F-03** Credentials: nutraceuticals / ReCODE / PreCODE / coaching
- [x] **F-04** CTA: Read Full Story
- [ ] **F-05** New founder image
- [x] **F-06** Deep-violet full-bleed removed (light vision fold)
- [x] **F-07** Trust / featured logos from Emer pack (Sunday Times, EI, LEO, DkIT, TU Dublin, IINH, etc.)

### Fold 4 — Outcomes
- [x] **O-01** Clinical stats from review (pending real quarterly form later)
- [x] **O-02** Headline: Let the numbers speak for themselves
- [x] **O-03** Outcome chips centred
- [x] **O-04** Buy Cognitive Assessment CTA (€89.99)
- [x] **O-05** Clinical delivery partner logos (Head Diagnostics, Apollo, Genova, BrainHQ, Kenko, CNS, MoCA)
- [ ] **O-06** Quarterly review form (ops / Ishan)

### Fold 5–10
- [x] Journey = Emer 3-step Method + Find Your Programme
- [x] Why / Partners / B2B / FAQ soft price / Closing quiz + soft discovery (Habit baseline first chip)

---

## 3. Quiz funnel

- [x] **QF-01–QF-05** Email at end; Email my report primary; score ring
- [!] **QF-06** Emer sign-off on single-CTA results (soft links remain)

---

## 4. Discovery

- [x] **DI-01–DI-02** No live quiz walkthrough; pre-call checklist

---

## 5–6. Tests / Programme / About

- [x] Tests catalog + public € for listed cognitive/blood/consultations
- [x] High-Touch / Guided / Self-Led (no Premium/Medium/Light labels)
- [x] Programme comparison table (High-Touch / Guided / Self-Led)
- [x] PT257 + Blood Work Review not listed on Tests (SKU still in registry)
- [x] About vision rewrite + assessment CTA + credential logos strip
- [ ] At-home finger-prick prices (Emer to confirm)
- [ ] Programme vs Tests blurbs Emer [d]
- [ ] Client dashboard CD-01–CD-11 (Wave D)

---

## 7. Already aligned (do not regress)

- [x] Shared FAQ accordion + equal card grids
- [x] Soft quiz-abandon → discovery
- [x] Blog off home
- [x] CRO + brand audits green after Emer flip

---

## 8. Remaining waves

| Wave | Status | Focus |
|------|--------|--------|
| A–C | **Done** | Emer Version 2 marketing surfaces |
| F | **Done (F1–F3)** | Logo marquee + Clinics lift + quick wins |
| D | Open | Client dashboard UX |
| E | Partial | Quarterly stats form; Randox + Cavan Digital Hub logos if supplied |
| — | Open | New founder photo; hero media; finger-prick prices |

---

## 9. Wave F — Implementation checklist (next ship)

Score-driven polish after live audit (Clinics ~6.5; logos hard to read). **Do F1–F3 first** — highest lift, no Emer.

### F1 — Logo band (fix)

- [x] **F1-01** Shared `LogoMarquee` component: one full-bleed row, logos ~48–64px tall, **no white cards**
- [x] **F1-02** Band surface: soft Mist/Linen (colour logos read clearly; assets have light backgrounds)
- [x] **F1-03** Slow infinite scroll (~42s loop); pause on hover; respect `prefers-reduced-motion` (static row)
- [x] **F1-04** Wire on **Home** — partner strip + clinical outcomes logos
- [x] **F1-05** Wire on **Clinics** — clinical + research partners under hero
- [x] **F1-06** Keep **About credentials** as static grid (do not marquee accreditations)
- [x] **F1-07** Drop / avoid: stock-ticker chrome, bounce, dual-speed lanes, grayscale wash

### F2 — Clinics page lift (`/clinics`)

- [x] **F2-01** Add logo marquee under hero (F1-05)
- [x] **F2-02** Add one “How referral works” beat (3 short steps: identify → refer → we report back)
- [x] **F2-03** Soften pillar card chrome → gold border-l scannable blocks
- [x] **F2-04** Hero: primary CTA only above the fold (referral card secondary text link)
- [x] **F2-05** Ensure form H2 / single H1 stays SEO-clean

### F3 — Quick wins elsewhere (same PR ok)

- [x] **F3-01** Home Vision trust tiles: larger marks, lighter frames on light tone
- [x] **F3-02** About credential tiles: larger logos, less border noise
- [x] **F3-03** Team page: tighter roster copy until bios land
- [x] **F3-04** Quiz results: single soft discovery link after report (QF-06 direction)

### F4 — Needs Emer / assets (block before coding)

- [ ] **F4-01** New founder headshot (F-05)
- [ ] **F4-02** Hero media crop / side layout (H-09)
- [ ] **F4-03** At-home finger-prick SKU prices + show on Tests
- [ ] **F4-04** Confirm consult public € (€150 / €180) if changing
- [ ] **F4-05** Retests: web vs app messaging
- [ ] **F4-06** Randox + Cavan Digital Hub logo files
- [ ] **F4-07** Programme vs Tests blurbs Emer [d]
- [ ] **F4-08** Quiz “Free / no account” hint — Emer yes/no
- [ ] **F4-09** Blog in nav — only when ≥ posts exist

### F5 — Later / other surface

- [ ] **F5-01** Client dashboard diary UX (Wave D / CD-01–CD-11)
- [ ] **F5-02** Quarterly biomarker / outcomes review form (O-06)
- [ ] **F5-03** Unhide PT257 + Blood Work when assets + copy signed
- [ ] **F5-04** Brand + CRO audits green after Wave F deploy

### Suggested ship order

1. F1 (shared marquee) → F2 (Clinics) → F3 (quick wins) → commit / deploy  
2. Ping Emer for F4 assets while F1–F3 builds  
3. Wave D / F5 after marketing polish locked
