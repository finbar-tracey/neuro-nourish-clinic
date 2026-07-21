# NeuroNourish — Branding & Design Checklist

Based on [`docs/NeuroNourish_Brand_Guidelines.pdf`](./NeuroNourish_Brand_Guidelines.pdf) and the codified system in `src/lib/neuronourish-brand.ts` + `src/app/globals.css`.

**Host:** https://neuro-nourish-clinic.vercel.app → https://neuronourish.clinic  
**Scope:** Public NeuroNourish marketing + quiz/shop/discovery (not legacy BLB / healthcare ad LPs / CRM chrome).

**Automated gates:**

```bash
npm run neuronourish:brand
npm run neuronourish:design
```

---

## 1. Colour (P0)

| # | Role | Token | Hex | ☐ |
|---|------|-------|-----|---|
| 1 | Nav / hero / footer | Deep Slate | `#1A3348` | |
| 2 | Headings on light | Slate Blue | `#3D6480` | |
| 3 | Body on dark | Sky Blue | `#6B98B2` | |
| 4 | Light borders | Mist | `#B8D4E2` | |
| 5 | Secondary dark section (≤1/page) | Deep Violet | `#2C1F4A` | |
| 6 | Secondary UI | Plum | `#5C4A8A` | |
| 7 | Badges | Lavender | `#A896CC` | |
| 8 | CTAs & text links | Gold | `#C9A84C` | |
| 9 | Page background | Ivory | `#F5F0E6` | |
| 10 | Card surfaces / dividers | Linen | `#D4C8B8` | |
| 11 | Body on light | Ink | `#2A2830` | |
| 12 | No off-palette on NN marketing | No `emerald-*` / `amber-*` success chrome | |

---

## 2. Typography (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Fonts | Playfair Display (display) + Inter (UI/body) only | |
| 2 | Scale | `.nn-display-hero` / `-section` / `-card`, `.nn-body`, `.nn-eyebrow` | |
| 3 | Light headings | Slate Blue (`text-slate-blue` / section header) | |
| 4 | Body | 16px · 1.75 · ≤65ch | |
| 5 | Buttons | 13px medium | |
| 6 | **Never italic** | No `italic` / `font-style: italic` on NN marketing | |
| 7 | No `!` in headlines | Calm voice | |

---

## 3. Logo (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Dark surfaces | Reversed mark / dark theme | |
| 2 | Footer | Approved lockup PNG (`logoDark` / `logo`) | |
| 3 | Header | Approved brain asset; no drop-shadow / glow | |
| 4 | Min sizes | Icon ≥24px; lockup ≥120px where used | |
| 5 | Clear space | ~¼ icon height around mark | |

---

## 4. Voice & CTA (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Traits | Sophisticated, authentic, modern, calm | |
| 2 | CTAs | Gold primary; `.nn-text-link` for soft links | |
| 3 | Never | Fearmongering, cure claims, hard sell, biohacker hype | |
| 4 | Hero | No “too late” / “risk everything” | |
| 5 | Scripts / long-form | No “too late” / “fear of…” scare framing | |

---

## 5. Surfaces & layout (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Page canvas | Ivory shell (`bg-ivory text-ink`) | |
| 2 | Marketing cards | Linen-tinted surfaces + Mist borders (not clinical pure white) | |
| 3 | Deep Violet | Max one section on homepage | |
| 4 | Section rhythm | Consistent `PageSection` padding | |
| 5 | Print styles | Brand Gold / Deep Slate (not `#d4af37` / `#1a2e3b`) | |

---

## 6. Implementation status

| Item | Status |
|------|--------|
| Brand guidelines PDF + `neuronourish:brand` (39+) | Done |
| Branding & design checklist + `neuronourish:design` | Done |
| NN marketing: no italics | Done |
| NN marketing: no emerald/amber chrome | Done |
| Quiz/results headings → Slate Blue + display scale | Done |
| Card surfaces → linen tint | Done |
| Print CSS → brand hexes | Done |
| Fear phrasing in long-form copy | Done |
| Header lockup (square PNG) | Footer uses lockups; header uses brain + wordmark (documented) |

---

## 7. Sign-off

```
NEURONOURISH — BRANDING & DESIGN SIGN-OFF
Date:     ____________________
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:brand — PASS
[ ] npm run neuronourish:design — PASS

MANUAL (vs PDF)
[ ] Home / quiz / shop / discovery match colour roles
[ ] Headings read Slate Blue on light; Ivory canvas
[ ] Logo clear on dark header; lockup correct in footer
[ ] No italics; gold CTAs only; calm voice

VERDICT: PASS / PASS WITH FIXES / FAIL
Design score: ___/10
```

---

## Related

- [NeuroNourish_Brand_Guidelines.pdf](./NeuroNourish_Brand_Guidelines.pdf)
- [NEURONOURISH_CRO.md](./NEURONOURISH_CRO.md)
- [NEURONOURISH_WEB_DEVELOPMENT.md](./NEURONOURISH_WEB_DEVELOPMENT.md)
- [NEURONOURISH_MOBILE_RESPONSIVE.md](./NEURONOURISH_MOBILE_RESPONSIVE.md)
