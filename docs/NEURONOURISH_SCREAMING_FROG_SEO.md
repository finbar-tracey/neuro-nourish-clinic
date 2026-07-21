# NeuroNourish — Screaming Frog SEO Checklist

Based on the [Screaming Frog SEO Spider Issues library](https://www.screamingfrog.co.uk/seo-spider/issues/), [Quick Start](https://www.screamingfrog.co.uk/seo-spider/tutorials/quick-start-guide/), and [Mastering SEO Audits](https://www.screamingfrog.co.uk/blog/mastering-seo-audits/).

**Crawl host (current):** https://neuro-nourish-clinic.vercel.app  
**Target host (cutover):** https://neuronourish.clinic  
**Mode:** Spider · HTML (Next.js SSR) · Respect robots.txt + noindex  
**Indexable:** Yes (marketing). Auth / transactional / stubs: noindex.

**Automated gate:**

```bash
npm run neuronourish:seo
NN_SEO_BASE_URL=https://neuro-nourish-clinic.vercel.app npm run neuronourish:seo
```

---

## Screaming Frog configuration

| Setting | Value | ☐ |
|---------|--------|---|
| Start URL | Production / staging root | |
| Crawl linked XML sitemaps | On | |
| Respect robots.txt | On | |
| Respect noindex | On | |
| Exclude | `/workspace/*`, `/api/*`, `/lp/*`, `/login`, `/onboarding`, `/dashboard` | |
| Optional UA | Googlebot Smartphone | |

---

## 1. Response codes (SF: Response Codes)

| # | Issue / check | Expected | ☐ |
|---|---------------|----------|---|
| 1 | Internal Client Error (4XX) | 0 on internal links | |
| 2 | Internal Server Error (5XX) | 0 | |
| 3 | Internal Redirect Loop | 0 | |
| 4 | Internal Redirect Chain | ≤1 hop (`/blog`→`/`, `/assessment`→shop) | |
| 5 | HTTPS | All public URLs HTTPS | |
| 6 | Soft 404 | Custom 404 returns HTTP 404 + noindex | |

---

## 2. Directives (SF: Directives)

| # | Issue / check | Expected | ☐ |
|---|---------------|----------|---|
| 1 | Noindex (public) | Marketing pages `index,follow` | |
| 2 | Noindex (private) | `/login`, `/onboarding`, `/dashboard`, `/workspace/*`, `/quiz/results`, `/shop/success`, stub SKUs | |
| 3 | X-Robots-Tag | No global noindex on marketing | |
| 4 | Canonicals | Self-referencing on every indexable URL | |
| 5 | Canonicalised | No accidental chains to wrong host | |

---

## 3. Sitemaps (SF: Sitemaps)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | `/sitemap.xml` 200 | Populated | |
| 2 | Only indexable URLs | No workspace/api/hash; no stubs (`pt257`, `blood-work`); no `/quiz/results` or `/shop/success` | |
| 3 | URLs match canonical host | Same scheme + host as `NEXT_PUBLIC_SITE_URL` | |
| 4 | `robots.txt` lists Sitemap | Present | |
| 5 | Orphan pages | 0 for indexable marketing URLs (Inlinks) | |

**Indexable set (target):** `/`, `/quiz`, `/shop`, shop SKUs (assessment, consults, 3 tiers), `/programme`, `/team`, `/discovery`, `/contact`, `/about`, `/clinics`, `/privacy`

---

## 4. Page titles (SF: Page Titles)

| # | Issue | Expected | ☐ |
|---|-------|----------|---|
| 1 | Missing | 0 | |
| 2 | Duplicate | 0 unique routes | |
| 3 | Over 60 / below 30 chars | Opportunity — review | |
| 4 | Same as H1 | Opportunity OK if close | |

---

## 5. Meta description (SF: Meta Description)

| # | Issue | Expected | ☐ |
|---|-------|----------|---|
| 1 | Missing | 0 on indexable pages | |
| 2 | Duplicate | 0 | |
| 3 | Over 155 / below 70 | Opportunity — review | |

---

## 6. H1 / H2 (SF: H1, H2)

| # | Issue | Expected | ☐ |
|---|-------|----------|---|
| 1 | **Missing H1** | 0 — exactly one H1 on every indexable page | |
| 2 | **Multiple H1** | 0 (clinics form section must be H2) | |
| 3 | Non-sequential | Avoid H3 before H2 | |
| 4 | H2 structure | Sections under single H1 | |

**Implemented:** `SectionHeader` supports `as="h1"` on shop / programme / team; clinics partnership block uses `as="h2"`; quiz results has SSR-friendly H1; team member names are H3.

---

## 7. Canonicals & URLs (SF: Canonicals, URL)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Missing canonical | 0 on indexable | |
| 2 | Canonical ≠ crawl URL | Fix host / trailing slash | |
| 3 | Uppercase / spaces / params | Avoid GA params on canonicals | |
| 4 | Stub products | Reachable but **noindex** + out of sitemap until content ready | |

---

## 8. Content & index quality (SF: Content)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Thin / near-duplicate | Avoid indexing transactional success/results | |
| 2 | Placeholder SKUs | noindex until Emer assets | |
| 3 | Blog | Redirect + noindex until posts exist | |
| 4 | App explainer | noindex until public app | |

---

## 9. Structured data (SF: Structured Data)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Homepage JSON-LD | Organization (MedicalBusiness), WebSite, FAQPage | |
| 2 | Rich Results Test | Validate `/` | |
| 3 | Product schema | Only when `showPublicPrice` true | |

---

## 10. Social (SF: related / Open Graph)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | og:title / og:description | Present | |
| 2 | og:image | `/opengraph-image` 1200×630 | |
| 3 | twitter:card | `summary_large_image` | |

---

## 11. Security / mobile / accessibility (SF tabs)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Mixed content | 0 | |
| 2 | Security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy | |
| 3 | Viewport | Present | |
| 4 | Skip link / main landmark | Present | |
| 5 | PageSpeed | Separate `npm run neuronourish:pagespeed` | |

---

## 12. Post-crawl export order

1. Issues → Errors first, then Warnings  
2. H1 → Missing / Multiple  
3. Page Titles / Meta Description  
4. Canonicals  
5. Response Codes  
6. Sitemaps → Non-indexable URLs in sitemap  
7. Directives → Indexable pages with noindex (and reverse)  
8. Structured Data  
9. Inlinks → orphans  

---

## 13. Implementation status (code)

| Item | Status |
|------|--------|
| Missing H1 on shop / programme / team | Fixed (`SectionHeader as="h1"`) |
| Multiple H1 on clinics | Fixed (form `as="h2"`) |
| Quiz results H1 | Fixed |
| Sitemap excludes stubs + transactional | Fixed |
| Stub products noindex | Fixed (`placeholderNote`) |
| Results / success noindex | Fixed |
| Auth pages noindex + robots disallow | Fixed |
| Ops CNS banner off public by default | Fixed (`NN_SHOW_OPS_BANNER`) |
| Shop cards preserve `leadId` | Fixed |

---

## 14. Sign-off

```
NEURONOURISH — SCREAMING FROG SEO SIGN-OFF
Date:     ____________________
Crawl:    SF v____ · host ____________________
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:seo — PASS
[ ] NN_SEO_BASE_URL=… neuronourish:seo — live PASS

MANUAL SF
[ ] Response codes (§1)
[ ] Directives (§2)
[ ] Sitemaps (§3)
[ ] Titles & descriptions (§4–5)
[ ] H1/H2 (§6)
[ ] Canonicals / stubs (§7–8)
[ ] Structured data (§9)

VERDICT:  PASS / PASS WITH FIXES / FAIL
SEO score: ___/10
```

---

## Related

- [NEURONOURISH_GO_LIVE.md](./NEURONOURISH_GO_LIVE.md)
- [Screaming Frog Issues](https://www.screamingfrog.co.uk/seo-spider/issues/)
- `src/lib/neuronourish-seo.ts` — paths + metadata
- `npm run neuronourish:seo`
