# NeuroNourish — Web Development Checklist

Based on [web.dev Core Web Vitals](https://web.dev/articles/vitals), [top CWV improvements](https://web.dev/articles/top-cwv), [Learn Responsive Design](https://web.dev/learn/design/), [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and MDN accessibility basics.

**Host:** https://neuro-nourish-clinic.vercel.app → https://neuronourish.clinic  
**Stack:** Next.js App Router · Tailwind · Prisma

**Automated gates:**

```bash
npm run neuronourish:webdev
npm run neuronourish:mobile
npm run neuronourish:seo
npm run neuronourish:brand
```

---

## 1. Document & semantics (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `lang` on `<html>` | `en` | |
| 2 | One landmark `main#main-content` | Skip link target | |
| 3 | Skip link | First focusable control | |
| 4 | Exactly one H1 per page | See SEO checklist | |
| 5 | Logical heading order | h1 → h2 → h3 | |
| 6 | Buttons vs links | Actions = button; navigation = `<a>`/`Link` | |

---

## 2. Accessibility — forms & errors (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Visible `<label>` / `htmlFor` | Every text input | |
| 2 | `aria-invalid` when error | Bound to control | |
| 3 | `aria-describedby` → error id | Screen readers announce | |
| 4 | Error `role="alert"` / `aria-live` | Polite live region | |
| 5 | Consent checkbox labelled | `id` + wrapping/`htmlFor` | |
| 6 | Focus visible | Gold ring / outline on controls | |

---

## 3. Touch targets & mobile (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Primary CTAs | ≥ 48px height | |
| 2 | Header controls | ≥ 44px | |
| 3 | Filter chips / stepper | ≥ 44px | |
| 4 | Inputs | ≥ 48px mobile · 16px font (no iOS zoom) | |
| 5 | No horizontal scroll @ 375px | `overflow-x-clip` on shell | |
| 6 | Viewport meta | `device-width`, `initial-scale=1`, `viewport-fit=cover` | |

---

## 4. Core Web Vitals (P1 — measure in PSI)

| Metric | Target (75th) | Notes | ☐ |
|--------|---------------|-------|---|
| **LCP** | ≤ 2.5s | Discoverable LCP in HTML; prioritize hero/font | |
| **INP** | ≤ 200ms | Avoid long tasks; defer non-critical JS | |
| **CLS** | ≤ 0.1 | Width/height on images; reserve embed space | |

Run: `npm run neuronourish:pagespeed` · [PageSpeed Insights](https://pagespeed.web.dev/)

---

## 5. Performance hygiene (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Images | `next/image` or fixed dimensions | |
| 2 | Fonts | `display: swap` / next/font | |
| 3 | Third parties | Calendly facade / lazy load | |
| 4 | Client JS | Prefer server components; Suspense boundaries | |
| 5 | Prefers-reduced-motion | Honoured on motion (app preview, hero) | |

---

## 6. Security headers (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `X-Content-Type-Options` | `nosniff` | |
| 2 | `X-Frame-Options` | `DENY` / `SAMEORIGIN` | |
| 3 | HTTPS only | No mixed content | |
| 4 | Workspace/API | noindex + auth | |

---

## 7. Funnel engineering (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Quiz capture | End of quiz (not mid) | |
| 2 | `leadId` on results → shop/programme/discovery | Preserved | |
| 3 | Shop cards preserve `leadId` | Query passthrough | |
| 4 | Quiz hydrates `?leadId=` | Discovery → quiz continuity | |
| 5 | Checkout without Stripe | Graceful 503 + discovery | |

---

## 8. HTML quality / robustness (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | No broken internal links | 200 / intentional 3xx | |
| 2 | 404 page | Real 404 + noindex | |
| 3 | Client/server Suspense | `useSearchParams` wrapped | |
| 4 | Env secrets | Never in client bundle | |

---

## 9. Implementation status

| Item | Status |
|------|--------|
| FieldError live region + describedby pattern | Done |
| Consent checkbox labelling | Done |
| Filter chips / funnel stepper ≥ 44px | Done |
| Quiz `leadId` URL hydrate | Done |
| Mobile audit patterns updated for current markup | Done |
| Webdev automated gate script | Done |
| Ops banner off public by default | Done (SEO pass) |

---

## 10. Sign-off

```
NEURONOURISH — WEB DEVELOPMENT SIGN-OFF
Date:     ____________________
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:webdev — PASS
[ ] npm run neuronourish:mobile — PASS
[ ] npm run neuronourish:brand — PASS
[ ] npm run neuronourish:seo — PASS

MANUAL
[ ] iPhone SE 375: /, /quiz, /shop, /discovery — no H-scroll
[ ] Keyboard: skip link → main → CTAs
[ ] PSI mobile on / and /quiz — LCP/INP/CLS noted

VERDICT: PASS / PASS WITH FIXES / FAIL
Webdev score: ___/10
```

---

## Related

- [NEURONOURISH_SCREAMING_FROG_SEO.md](./NEURONOURISH_SCREAMING_FROG_SEO.md)
- [NEURONOURISH_MOBILE_RESPONSIVE.md](./NEURONOURISH_MOBILE_RESPONSIVE.md)
- [NEURONOURISH_PAGE_SPEED_INSIGHTS.md](./NEURONOURISH_PAGE_SPEED_INSIGHTS.md)
- [web.dev Vitals](https://web.dev/articles/vitals)
