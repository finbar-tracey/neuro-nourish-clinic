# NeuroNourish — Mobile Responsiveness Checklist

Based on [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly), [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [web.dev responsive design](https://web.dev/learn/design/).

**Domain:** https://neuronourish.clinic  
**Test widths:** 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel 7), 768px (tablet)  
**Stack:** Tailwind 4 responsive utilities · Next.js App Router

**Automated gate:**

```bash
npm run neuronourish:mobile
```

**With live HTML checks:**

```bash
NN_MOBILE_BASE_URL=https://neuronourish.clinic npm run neuronourish:mobile
```

---

## Chrome DevTools setup

| Setting | Value |
|---------|--------|
| Device toolbar | `Cmd+Shift+M` / `Ctrl+Shift+M` |
| Throttling | No throttling (layout) · Fast 3G (optional UX) |
| Devices | iPhone SE 375 · iPhone 14 Pro 393 · Pixel 7 412 |
| Zoom | 100% |

---

## 1. Viewport & document (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `viewport` meta | `width=device-width, initial-scale=1` | |
| 2 | `viewport-fit=cover` | Safe-area support on notched phones | |
| 3 | No horizontal scroll at 375px | `overflow-x` clipped on shell | |
| 4 | `lang="en"` on `<html>` | Screen reader + SEO | |
| 5 | Skip link targets `#main-content` | Keyboard navigation | |

---

## 2. Navigation (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **Mobile menu** below `lg` (1024px) | Hamburger opens full nav + CTAs | |
| 2 | Menu button `aria-expanded` + `aria-controls` | Accessible toggle | |
| 3 | Body scroll locked when menu open | No background scroll | |
| 4 | Sticky header with safe-area padding | Notch doesn't clip logo | |
| 5 | Footer links reachable on mobile | Consumers + Clinics columns stack | |

---

## 3. Typography & layout (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Hero H1 scales | `text-4xl` → `sm:text-5xl` | |
| 2 | Section headlines scale | `text-3xl` → `sm:text-4xl` | |
| 3 | Body text ≥ 16px on mobile | Readable without pinch-zoom | |
| 4 | Line height ≥ 1.75 on paragraphs | Scannable copy | |
| 5 | Grids stack on mobile | `grid-cols-1` / single column default | |

---

## 4. Touch targets (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Primary CTAs ≥ 48px height | Gold buttons, quiz pills | |
| 2 | Header quiz + menu buttons ≥ 44px | Thumb-reachable | |
| 3 | Quiz option pills ≥ 48px | Full-width stack on narrow screens | |
| 4 | Form inputs ≥ 48px height | `touch-input` 16px font (no iOS zoom) | |
| 5 | FAQ `<summary>` tap area full width | Entire row tappable | |

---

## 5. Forms & funnel (P0)

| # | Route | Check | ☐ |
|---|-------|--------|---|
| 1 | `/quiz` | Capture form stacks single column on mobile | |
| 2 | `/quiz` | Option pills single column < 640px | |
| 3 | `/contact` | Expression form full width, no overflow | |
| 4 | `/discovery` | Calendly facade button ≥ 48px | |
| 5 | `/assessment`, `/programme` | Checkout CTAs stack vertically | |

---

## 6. Media & embeds (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Calendly widget `width: 100%` | No iframe overflow | |
| 2 | Partner logos grid `grid-cols-2` on mobile | Readable labels | |
| 3 | Blog cards single column → 2 → 3 | `sm:grid-cols-2 lg:grid-cols-3` | |
| 4 | Founder portrait `max-h-80` on mobile | Doesn't dominate viewport | |
| 5 | No fixed-width elements > 100vw | Audit HTML | |

---

## 7. Anchor links & scroll (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `#journey`, `#faq` scroll-margin | Clears sticky header | |
| 2 | Smooth scroll enabled | `scroll-smooth` on html | |
| 3 | Mobile menu closes on nav click | No trapped overlay | |

---

## 8. Manual device pass (post-deploy)

1. iPhone Safari — homepage hero + quiz funnel
2. Android Chrome — discovery Calendly load
3. Rotate to landscape on quiz page — no layout break
4. Zoom to 200% — content reflows (WCAG 1.4.10)
5. VoiceOver / TalkBack — header menu + skip link

---

## Automated vs manual

| Automated (`npm run neuronourish:mobile`) | Manual (DevTools + devices) |
|------------------------------------------|----------------------------|
| Mobile nav component + ARIA | Real thumb reachability |
| Touch target CSS patterns | Landscape orientation |
| Viewport + overflow guards | VoiceOver/TalkBack |
| Responsive class usage | Calendly iframe behaviour |
| Live viewport meta in HTML | Google Mobile-Friendly Test |

---

## Related

- PageSpeed: `docs/NEURONOURISH_PAGE_SPEED_INSIGHTS.md` · `npm run neuronourish:pagespeed`
- SEO: `docs/NEURONOURISH_SCREAMING_FROG_SEO.md` · `npm run neuronourish:seo`
- Go-live: `docs/NEURONOURISH_GO_LIVE.md` · `npm run neuronourish:go-live`
