# Post-launch checklist — Bridging Loans Broker (paid LP)

**Domain:** `https://loans.bridgingloansbroker.co.uk`  
**Purpose:** Facebook / paid conversion landing — **intentionally noindex**  
**Do not remove noindex** until you deliberately launch this subdomain for organic search (separate decision).

References:

- [SEO Handbook — Go-live checklist](https://seohandbook.co.uk/resources/go-live-checklist/)
- [SEOJuice — Post-launch SEO triage](https://seojuice.com/blog/post-launch-seo-checklist/)
- In-repo: `npm run prelaunch:audit`, `npm run seo:audit`

Automated run:

```bash
npm run postlaunch:audit
POSTLAUNCH_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run postlaunch:audit
```

---

## Critical: keep noindex

This subdomain is a **paid traffic LP**, not the main organic site (`bridgingloansbroker.co.uk`).

| Signal | Expected | Action if wrong |
|--------|----------|-----------------|
| `meta name="robots"` | `noindex, nofollow` | **Do not** change to index — fix accidental removal |
| `X-Robots-Tag` header | `noindex, nofollow, noarchive` | Keep in `next.config.ts` |
| `/sitemap.xml` | Empty (no `<loc>` URLs) | Correct while noindex |
| Google Search Console URL Inspection | “Excluded by noindex” | **Expected** — do not request indexing |

When you *eventually* want organic indexing, follow the “Future index launch” section at the bottom.

---

## Hour 0 — Immediately after deploy

### Access & security

- [ ] Site loads on HTTPS with valid certificate
- [ ] HSTS header present (Vercel)
- [ ] Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] `/workspace/` and `/api/` not publicly useful without auth
- [ ] Custom 404 returns 404 (not soft 200)

### Noindex verification

- [ ] Homepage: `curl -sI https://loans.bridgingloansbroker.co.uk | grep -i x-robots`
- [ ] View page source → `robots` meta contains `noindex`
- [ ] `/sitemap.xml` has no indexable URLs
- [ ] Screaming Frog / GSC URL Inspection confirms **noindex** (not an error)

### Branding & PWA

- [ ] Favicon visible in browser tab (`/favicon.svg`, `/icon`, `/apple-icon`)
- [ ] `site.webmanifest` loads
- [ ] Theme colour `#1c1c55` on mobile browser chrome

### Forms & CRM (highest priority for paid traffic)

- [ ] Submit test lead on `/lp` — step 2 creates **partial** lead in `/workspace`
- [ ] Step 3 completes same `leadId` as fully qualified
- [ ] UTM params + `fbclid` appear on lead in workspace
- [ ] Run `npm run form:all` and `npm run crm:audit`

### Analytics

- [ ] Meta Pixel fires `PageView` on load
- [ ] Step 1 → `InitiateCheckout`
- [ ] Step 2 capture → `InitiateCheckout` (contact captured)
- [ ] Step 3 submit → `Lead`
- [ ] Facebook Events Manager shows test events (Test Events tool)

### Email

- [ ] `RESEND_API_KEY` set on Vercel production
- [ ] `RESEND_FROM` = `hello@bridgingloansbroker.co.uk` (or verified domain)
- [ ] Send test follow-up from workspace lead detail

---

## Day 1 — Monitoring window

- [ ] Check `/workspace` for real leads from ads
- [ ] Review partial (step 2 only) leads — call within 2 hours
- [ ] PageSpeed Insights on `/lp` (mobile + desktop)
- [ ] No spike in 5xx in Vercel logs
- [ ] Re-run `POSTLAUNCH_BASE_URL=… npm run postlaunch:audit`

### Google Search Console (optional for noindex site)

Add property for `loans.bridgingloansbroker.co.uk` **for monitoring only**:

- [ ] Verify domain / URL prefix
- [ ] Confirm pages show as **Excluded by noindex tag** (expected)
- [ ] **Do not** submit sitemap for indexing while noindex is intentional
- [ ] **Do not** use “Request indexing” on LP URLs

### Bing Webmaster Tools (optional)

Same as GSC — verify property, expect noindex exclusion.

---

## Days 2–7 — Conversion optimisation

- [ ] Compare Facebook CPL to form completion rate (step 1 → 2 → 3)
- [ ] Check drop-off at step 2 (CRM partial captures still valuable)
- [ ] Review disqualified / nurture leads in pipeline
- [ ] Confirm no duplicate Google review bars on mobile
- [ ] Spot-check form on iOS Safari + Android Chrome

---

## Weeks 2–4 — Stability

- [ ] Organic traffic should stay **near zero** (noindex working)
- [ ] Paid traffic and lead volume stable
- [ ] Core Web Vitals field data in PageSpeed (if enough traffic)
- [ ] Rotate `WORKSPACE_SECRET` if shared externally
- [ ] Audit Resend deliverability / bounce rate

---

## Automated audit commands

```bash
npm run crm:go-live           # CRM + workflow P0 gate (see docs/CRM_GO_LIVE.md)
npm run postlaunch:audit      # This checklist (static + optional live)
npm run prelaunch:audit       # Pre-launch baseline
npm run seo:audit             # Confirms noindex config
npm run form:all              # Form + CRM wiring
npm run crm:audit             # CRM + email smoke test
npm run audit:all             # Full release gate
```

---

## Future index launch (when you choose organic)

Only if you **deliberately** want this subdomain in Google:

1. Remove `NOINDEX_ROBOTS` from `src/lib/seo.ts` and page metadata
2. Remove `X-Robots-Tag` noindex from `next.config.ts`
3. Populate `src/app/sitemap.ts` with canonical URLs
4. Add JSON-LD / OG images if needed
5. Submit sitemap in GSC
6. Request indexing for `/` and `/lp` only after QA
7. Run Screaming Frog crawl — confirm 200, canonicals, no redirect chains

Until then: **keep noindex**.
