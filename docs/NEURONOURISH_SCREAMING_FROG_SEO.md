# NeuroNourish — Screaming Frog SEO Checklist

Based on [Screaming Frog SEO Spider Issues](https://www.screamingfrog.co.uk/seo-spider/issues/), [Quick Start Guide](https://www.screamingfrog.co.uk/seo-spider/tutorials/quick-start-guide/), and [Mastering SEO Audits](https://www.screamingfrog.co.uk/blog/mastering-seo-audits/).

**Domain:** https://neuronourish.clinic  
**Crawl mode:** Spider (not List)  
**Rendering:** HTML default (Next.js SSR — JS rendering optional)  
**Unlike legacy LP verticals:** This site is **indexable** for organic search.

**Automated gate:**

```bash
npm run neuronourish:seo
```

**With live HTTP crawl:**

```bash
NN_SEO_BASE_URL=https://neuronourish.clinic npm run neuronourish:seo
```

---

## Screaming Frog configuration (before crawl)

| Setting | Value |
|---------|--------|
| Start URL | `https://neuronourish.clinic/` |
| Crawl linked XML sitemaps | ✓ Configuration → Spider → Crawl Linked XML Sitemaps |
| Respect robots.txt | ✓ |
| Respect noindex | ✓ |
| Max URI length | 2048 (default) |
| Exclude | `/workspace/*`, `/api/*`, `/lp/*` (legacy) |
| User-Agent | Googlebot Smartphone (optional mobile check) |

---

## 1. Directives (Issues tab — P0)

| # | Screaming Frog issue | Expected | ☐ |
|---|---------------------|----------|---|
| 1 | **Noindex** | Public pages indexable; workspace/api noindex | |
| 2 | **X-Robots-Tag** | No global `noindex` header on marketing pages | |
| 3 | **Canonicals** | Self-referencing canonical on every public URL | |
| 4 | **Canonicalised** | No unintended canonical chains | |
| 5 | **Meta robots** | `index, follow` on public pages | |
| 6 | **404 pages** | Return HTTP 404 + `noindex` | |

---

## 2. XML sitemaps (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `/sitemap.xml` returns 200 | Populated with 12 marketing URLs | |
| 2 | Sitemap URLs only indexable pages | No `/workspace`, `/api`, hash fragments | |
| 3 | Sitemap URLs match canonicals | Same scheme + host | |
| 4 | `robots.txt` references sitemap | `Sitemap: https://neuronourish.clinic/sitemap.xml` | |
| 5 | Submit sitemap in Google Search Console | After go-live | |

---

## 3. Page titles & meta descriptions (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **Missing title** | 0 on public pages | |
| 2 | **Duplicate titles** | 0 — each route unique (`NN_PAGE_SEO`) | |
| 3 | **Title length** | 30–60 characters (warnings if outside) | |
| 4 | **Missing meta description** | 0 on public pages | |
| 5 | **Duplicate meta description** | 0 | |
| 6 | **Meta description length** | 70–160 characters | |

**Public routes (12):** `/`, `/quiz`, `/quiz/results`, `/assessment`, `/assessment/success`, `/programme`, `/programme/success`, `/discovery`, `/contact`, `/about`, `/clinics`, `/blog`, `/how-the-app-works`, `/privacy`

---

## 4. Headings (P0)

| # | Screaming Frog issue | Expected | ☐ |
|---|---------------------|----------|---|
| 1 | **Missing H1** | 0 on public pages | |
| 2 | **Multiple H1** | 0 — exactly one H1 per page | |
| 3 | **H2 structure** | Logical hierarchy under single H1 | |

---

## 5. Response codes & redirects (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **4xx errors** | 0 on internal links | |
| 2 | **5xx errors** | 0 | |
| 3 | **Redirect chains** | None > 1 hop | |
| 4 | **Internal redirects** | `/lp/*` → `/` (legacy routes blocked) | |
| 5 | **HTTPS** | All public URLs HTTPS | |

---

## 6. Structured data (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **JSON-LD on homepage** | Organization, WebSite, FAQPage | |
| 2 | **Schema validation** | [Google Rich Results Test](https://search.google.com/test/rich-results) | |
| 3 | **No conflicting schema** | Single FAQ block on `/` | |

---

## 7. Social & previews (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **Open Graph title** | Matches page title | |
| 2 | **Open Graph description** | Matches meta description | |
| 3 | **og:image** | `/opengraph-image` (1200×630) | |
| 4 | **Twitter card** | `summary_large_image` | |

---

## 8. International & locale (P2)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **HTML lang** | `en` on `<html>` | |
| 2 | **og:locale** | `en_GB` | |
| 3 | **Hreflang** | Not required (single locale) | |

---

## 9. Performance & security (P1)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | **PageSpeed Insights** | Mobile + desktop on `/` and `/quiz` | |
| 2 | **Core Web Vitals** | LCP, CLS, INP in green after traffic | |
| 3 | **Security headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | |
| 4 | **Mixed content** | 0 HTTP resources on HTTPS pages | |

---

## 10. Post-crawl Screaming Frog exports

After crawl, export and review:

1. **Issues** tab — fix all Errors, then Warnings
2. **Page Titles** — filter duplicates / missing
3. **Meta Description** — filter duplicates / missing
4. **H1** — filter multiple / missing
5. **Canonicals** — filter missing / non-indexable
6. **Response Codes** — filter 4xx / 5xx
7. **Structured Data** — validate JSON-LD
8. **Inlinks** — orphan pages (should be 0 for public routes)

---

## 11. Google Search Console (post-launch)

| # | Check | ☐ |
|---|--------|---|
| 1 | Property verified for `neuronourish.clinic` | |
| 2 | Sitemap submitted | |
| 3 | URL Inspection: `/` → "URL is on Google" (after indexing) | |
| 4 | No accidental "Excluded by noindex" on marketing URLs | |
| 5 | Core Web Vitals report clean | |

---

## 12. Sign-off

```
NEURONOURISH — SCREAMING FROG SEO SIGN-OFF
Date:     ____________________
Crawl:    SF v____ · _____ URLs · _____ issues
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:seo — pass
[ ] NN_SEO_BASE_URL=… neuronourish:seo — live pass

SCREAMING FROG MANUAL
[ ] Directives (§1)
[ ] Sitemap (§2)
[ ] Titles & descriptions (§3)
[ ] Headings (§4)
[ ] Response codes (§5)
[ ] Structured data validated (§6)

VERDICT:  PASS / PASS WITH FIXES / FAIL
SEO score: ___/10
```

---

## Related

- [docs/NEURONOURISH_GO_LIVE.md](./NEURONOURISH_GO_LIVE.md) — full launch checklist
- [Screaming Frog Issues Library](https://www.screamingfrog.co.uk/seo-spider/issues/)
- `src/lib/neuronourish-seo.ts` — canonical page SEO source
- `npm run seo:audit` — legacy LP noindex audit (not for NeuroNourish)
