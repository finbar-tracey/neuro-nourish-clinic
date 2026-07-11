# NeuroNourish — PageSpeed Insights Checklist

Based on [PageSpeed Insights](https://pagespeed.web.dev/), [Core Web Vitals](https://web.dev/vitals/), and [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/).

**Domain:** https://neuronourish.clinic  
**Test strategy:** Mobile first (field + lab), then Desktop  
**Primary URLs:** `/`, `/quiz`, `/discovery`, `/assessment`, `/programme`

**Automated gate:**

```bash
npm run neuronourish:pagespeed
```

**With live HTTP checks:**

```bash
NN_PAGESPEED_BASE_URL=https://neuronourish.clinic npm run neuronourish:pagespeed
```

**Optional — live Lighthouse scores via Google PSI API** (set `NN_PAGESPEED_API_KEY` or `GOOGLE_PAGESPEED_API_KEY`):

```bash
NN_PAGESPEED_API_KEY=your-key NN_PAGESPEED_BASE_URL=https://neuronourish.clinic npm run neuronourish:pagespeed
```

---

## PageSpeed Insights configuration

| Setting | Value |
|---------|--------|
| Tool | https://pagespeed.web.dev/ |
| URLs | `/`, `/quiz`, `/discovery`, `/assessment`, `/programme` |
| Device | Mobile (primary), Desktop (secondary) |
| Connection | Simulated 4G (lab) |
| Compare | Before/after deploy on same URL |

---

## Core Web Vitals targets (P0)

| Metric | Good | Needs improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

**NeuroNourish automated thresholds:** LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 · Performance score ≥ 90 (when API key provided).

---

## 1. Performance score (Lighthouse lab)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Mobile performance ≥ 90 on `/` | Green lab score | |
| 2 | Mobile performance ≥ 85 on `/quiz` | Quiz is interactive — acceptable slightly lower | |
| 3 | Mobile performance ≥ 80 on `/discovery` | Calendly loads on user click only | |
| 4 | Desktop performance ≥ 95 on `/` | Marketing homepage | |
| 5 | No regression vs previous deploy | Compare PSI history | |

---

## 2. Largest Contentful Paint (LCP)

| # | Lighthouse opportunity | Implementation | ☐ |
|---|------------------------|----------------|----|
| 1 | **Preload LCP resource** | Hero H1 uses `next/font` Playfair with `display: swap` | |
| 2 | **Eliminate render-blocking resources** | Tailwind bundled; no blocking external CSS | |
| 3 | **Reduce server response time (TTFB)** | Vercel edge; static prerender for marketing pages | |
| 4 | **Avoid large layout shifts before LCP** | Hero text-first (no hero image); fixed header height | |
| 5 | **Use efficient cache lifetimes** | `/_next/static/*` immutable 1y cache headers | |

---

## 3. Cumulative Layout Shift (CLS)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Logo mark is inline SVG (no image load shift) | `NeuroNourishMark` | |
| 2 | Founder/portrait placeholders have `aspect-square` | Reserved space | |
| 3 | Calendly widget uses click-to-load facade | No 700px iframe injection on first paint | |
| 4 | Font fallbacks via `next/font` | `adjustFontFallback` system fonts | |
| 5 | Sticky header has fixed padding | No jump on scroll | |

---

## 4. Total Blocking Time / JavaScript (TBT & INP)

| # | Lighthouse opportunity | Implementation | ☐ |
|---|------------------------|----------------|----|
| 1 | **Reduce unused JavaScript** | `dynamic()` import for quiz; Calendly facade | |
| 2 | **Defer offscreen JavaScript** | Meta Pixel `strategy="lazyOnload"` | |
| 3 | **Minimize third-party impact** | Calendly only on `/discovery`; Stripe on checkout click | |
| 4 | **Tree-shake icons** | `optimizePackageImports: ["lucide-react"]` | |
| 5 | **Avoid long main-thread tasks** | Below-fold `content-visibility: auto` | |

---

## 5. Fonts

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Self-hosted via `next/font/google` | No Google Fonts `<link>` in HTML | |
| 2 | `font-display: swap` on Inter + Playfair | In layout.tsx | |
| 3 | Only required weights loaded | Inter 400–600; Playfair 400–500 | |
| 4 | No FOUT on hero H1 | Playfair preloaded | |

---

## 6. Images & media

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | No unoptimized hero bitmap | CSS gradient hero, SVG logo | |
| 2 | `next/image` for any future photos | `width` + `height` + `sizes` | |
| 3 | OG image is route-generated | `/opengraph-image` (not on critical path) | |
| 4 | No autoplay video on homepage | — | |

---

## 7. Network & caching

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `Content-Encoding: br` or `gzip` on HTML | Vercel default | |
| 2 | Immutable cache on `/_next/static/*` | `max-age=31536000, immutable` | |
| 3 | `preconnect` for Calendly on discovery only | `discovery/layout.tsx` | |
| 4 | `dns-prefetch` for Meta Pixel when configured | `NeuroNourishResourceHints` | |
| 5 | HTML payload < 100KB on `/` | Measured in automated audit | |

---

## 8. Third-party scripts

| Script | Route | Load strategy | ☐ |
|--------|-------|---------------|---|
| Meta Pixel | All (if `NEXT_PUBLIC_META_PIXEL_ID`) | `lazyOnload` | |
| Calendly widget | `/discovery` only | Click-to-load facade + `lazyOnload` | |
| Stripe.js | `/assessment`, `/programme` | On checkout button click | |

---

## 9. Accessibility & best practices (PSI categories)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Viewport meta | `width=device-width, initial-scale=1` | |
| 2 | Tap targets ≥ 48px on CTAs | Quiz + hero buttons | |
| 3 | Color contrast on gold CTAs | WCAG AA on deep-slate text | |
| 4 | Skip link present | `SkipLink` in root layout | |
| 5 | HTTPS only in production | `NEXT_PUBLIC_SITE_URL` https | |

---

## 10. Post-deploy manual run

1. Open https://pagespeed.web.dev/
2. Test `https://neuronourish.clinic/` (Mobile)
3. Record LCP, INP, CLS from **Field data** (if available) and **Lab data**
4. Repeat for `/quiz` and `/discovery`
5. Fix any **Opportunities** > 500ms savings
6. Re-run until Core Web Vitals are green
7. Submit passing URLs to Google Search Console → Core Web Vitals report

---

## Automated vs manual

| Automated (`npm run neuronourish:pagespeed`) | Manual (PSI web UI) |
|---------------------------------------------|---------------------|
| Font/config patterns | Real LCP/INP/CLS scores |
| Script load strategies | Field data from CrUX |
| Cache headers | Filmstrip / screenshots |
| HTML size & encoding | Opportunities diagnostics |
| Optional PSI API scores | Competitor benchmarking |

---

## Related

- SEO checklist: `docs/NEURONOURISH_SCREAMING_FROG_SEO.md` · `npm run neuronourish:seo`
- Go-live checklist: `docs/NEURONOURISH_GO_LIVE.md` · `npm run neuronourish:go-live`
