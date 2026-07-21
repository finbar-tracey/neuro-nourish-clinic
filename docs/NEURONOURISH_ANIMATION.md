# NeuroNourish — Animation & Motion Checklist

Premium, calm motion for the public NeuroNourish funnel — presence and hierarchy, not noise.

**Constraints (do not regress):**

- No framer-motion / GSAP / Lottie on marketing routes
- Hero stays text/CSS (protect LCP)
- Keep `.nn-defer-section` `content-visibility: auto`
- Honour `prefers-reduced-motion: reduce`
- Prefer CSS transitions ≤ ~0.55s; one-shot scroll reveals only

**Host:** https://neuro-nourish-clinic.vercel.app  

**Automated gate:**

```bash
npm run neuronourish:animation
```

---

## 1. Principles (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Motion budget | ≥ 2–3 intentional motions on home (hero + reveal + CTA) | |
| 2 | No heavy libs | No framer-motion / lottie / gsap in marketing deps | |
| 3 | Reduced motion | Hero, quiz fade, reveal, sticky, previews gated | |
| 4 | No infinite GPU loops on home | No live `nn-app-streak` pulse in viewport | |
| 5 | LCP path | Hero animation CSS-only; no image LCP | |

---

## 2. Home & marketing (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Hero enter | `.nn-hero-enter` stagger (brand → H1 → lead → CTA) | |
| 2 | Hero trust bar | Included in stagger | |
| 3 | Below-fold reveal | `.nn-reveal` + one-shot IntersectionObserver | |
| 4 | Gold CTA hover | Subtle lift / brightness (`.nn-gold-cta`) | |
| 5 | Card hover | 1–2px lift on why / journey / b2b / outcomes / shop | |
| 6 | Sticky quiz CTA | Slide-up (mounted; not hard remount) | |

---

## 3. Funnel surfaces (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Quiz question change | `.nn-quiz-question` fade on step | |
| 2 | Quiz progress bar | Width transition | |
| 3 | App / quiz previews | Interval cycles respect reduced motion | |
| 4 | FAQ open | Toggle rotate only (cheap) | |

---

## 4. Performance hygiene (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Transform + opacity only | No layout-animating width/height on scroll | |
| 2 | Unobserve after reveal | One-shot IO | |
| 3 | Passive scroll | Sticky uses passive listeners / IO | |
| 4 | PageSpeed gate still green | `npm run neuronourish:pagespeed` | |

---

## 5. Implementation status

| Item | Status |
|------|--------|
| Animation checklist + `neuronourish:animation` | Done |
| Hero trust-bar stagger | Done |
| Scroll reveal (`.nn-reveal`) | Done |
| Sticky CTA slide | Done |
| Gold CTA + card lifts | Done |
| Quiz step fade + reduced-motion | Done |
| No new animation libraries | Done |

---

## 6. Sign-off

```
NEURONOURISH — ANIMATION SIGN-OFF
Date:     ____________________
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:animation — PASS
[ ] npm run neuronourish:pagespeed — PASS (or note deltas)

MANUAL
[ ] Home: hero stagger feels calm; sections reveal once
[ ] Mobile: sticky CTA slides; hides at closing
[ ] OS reduced-motion: no rise/fade/sticky slide
[ ] Quiz: question change soft fade; no jank

VERDICT: PASS / PASS WITH FIXES / FAIL
Motion score: ___/10
```

---

## Related

- [NEURONOURISH_BRANDING_DESIGN.md](./NEURONOURISH_BRANDING_DESIGN.md)
- [NEURONOURISH_PAGE_SPEED_INSIGHTS.md](./NEURONOURISH_PAGE_SPEED_INSIGHTS.md)
- [NEURONOURISH_CRO.md](./NEURONOURISH_CRO.md)
