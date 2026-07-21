# NeuroNourish — Final August Go-Live Deployment Checklist

**Live domain:** https://neuronourish.clinic  
**Stack:** Next.js · Vercel KV · Resend · Vonage · Stripe · Calendly · CNS Vital Signs · Meta Pixel/CAPI · Vercel Cron

This blueprint consolidates environment variables, webhooks, database migration, asset checks, and funnel verification built across the repository.

**Automated gates (run before deploy):**

```bash
VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run build
npm run quiz:go-live
```

Staging for Emer (Vercel preview on `neuro-nourish-clinic`):

```bash
npm run deploy:nn-staging
```

See also: [QUIZ_CAPTURE_GO_LIVE.md](./QUIZ_CAPTURE_GO_LIVE.md).

Legacy individual gates:

```bash
npm run neuronourish:go-live
npm run neuronourish:brand
npm run quiz:post-implementation
```

**Live production check:**

```bash
NN_GO_LIVE_BASE_URL=https://neuronourish.clinic npm run neuronourish:go-live
curl -s https://neuronourish.clinic/api/health/neuronourish | jq
```

**Expected health response (when production-ready):**

```json
{
  "status": "healthy",
  "ok": true,
  "integrations": "verified",
  "brand_audit": "39/39 passed automatically via build artifact",
  "brand_report": {
    "status": "COMPLIANT",
    "passedChecks": 39,
    "totalChecks": 39,
    "buildGatePass": true
  },
  "webhooks": {
    "stripe": "https://neuronourish.clinic/api/stripe/webhook",
    "calendly": "https://neuronourish.clinic/api/webhooks/calendly"
  }
}
```

The `brand_audit` line is populated from `.neuronourish-brand-report.json`, written during `npm run build` / Vercel `vercel-build` by `scripts/neuronourish-brand-check.ts`. Deploys fail if brand compliance drops below 39/39 or build-gate checks fail.

---

## Phase 1: Environment variables (production control panel)

Configure these in your production host (e.g. Vercel). **Never commit live keys to git.**

### Core architecture & workspace

| Variable | Value / notes |
|----------|----------------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://neuronourish.clinic` |
| `VERTICAL` | `neuronourish` |
| `NEXT_PUBLIC_VERTICAL` | `neuronourish` |
| `WORKSPACE_SECRET` | Secure random string — CRM staff login |
| `CRON_SECRET` | Secure random string — cron job auth |

### Automated communication

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Nurture sequences, transactional, assessment instructions |
| `RESEND_FROM` | Verified sender (e.g. `Emer Sexton <care@neuronourish.clinic>`) |
| `VONAGE_API_KEY` | Partner SMS alerts |
| `VONAGE_API_SECRET` | Vonage auth |
| `KV_REST_API_URL` | Background task / CRM persistence |
| `KV_REST_API_TOKEN` | KV auth |
| `PARTNER_NOTIFY_EMAIL` | Care-team inbound alerts (e.g. `care@neuronourish.clinic`) |
| `PARTNER_NOTIFY_PHONE` | Emer SMS for B2B / urgent leads |

**Critical:** `NOTIFICATIONS_DRY_RUN` must **not** be `true` in production.

### Payments & diagnostics

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Live key (`sk_live_…`) — €90 + €3,550 checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` — verifies async payment events |
| `CNS_VITAL_SIGNS_API_KEY` | Automated cognitive test link creation |
| `CNS_VITAL_SIGNS_TEST_URL` | Optional fallback test URL in patient email |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | HMAC verification for Calendly hooks |
| `NEXT_PUBLIC_CALENDLY_URL` | Discovery booking embed URL |

### Meta ads (P1 — recommended at launch)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser pixel |
| `META_CAPI_ACCESS_TOKEN` | Server-side Lead / CompleteRegistration events |

---

## Phase 2: Live webhook subscriptions

Register these URLs in **Stripe Dashboard** and **Calendly** (not in code).

```
[ User actions ]
   ┌──────────────────────┬──────────────────────┐
   ▼                      ▼                      ▼
 Stripe checkout      Calendly booking      CNS test finished
   │                      │                      │
   ▼                      ▼                      ▼
 POST /api/stripe/    POST /api/webhooks/    [ Future hook ]
      webhook               calendly
   │                      │
   └──────────┬───────────┘
              ▼
     [ CRM queue auto-updates ]
```

### Calendly

| Setting | Value |
|---------|--------|
| Event | `invitee.created` |
| URL | `https://neuronourish.clinic/api/webhooks/calendly` |
| Signing key | Must match `CALENDLY_WEBHOOK_SIGNING_KEY` |

### Stripe

| Setting | Value |
|---------|--------|
| Events | `checkout.session.completed` |
| URL | `https://neuronourish.clinic/api/stripe/webhook` |
| Signing secret | Must match `STRIPE_WEBHOOK_SECRET` |

---

## Phase 3: Database & pipeline verification

### 1. Schema alignment

If using Prisma against a live database (not JSON CRM store):

```bash
npx prisma migrate deploy
npx prisma generate
```

Confirm `Lead` exposes clinical fields: `funnelStage`, `quizScore`, `revenueEur`, `creditExpiryDate`, `pipelineValueEur`, `discoveryBookedAt`, `assessmentPaidAt`, `enrolledAt`.

> **Note:** Local/dev may use `.neuronourish-crm.json` with runtime `migrateClinicalFields()` — production Vercel should use KV-backed persistence.

### 2. Post-deploy health ping

```bash
curl -s https://neuronourish.clinic/api/health/neuronourish | jq
```

Resolve all `issues[]` before opening paid traffic. Review `warnings[]` within 24h.

### 3. Cron verification

Confirm Vercel Cron hits `/api/cron/process-idle` and response includes `nnNurture` processing.

---

## Phase 4: Creative asset deployment

Replace development placeholders before full brand polish:

| Asset | Location | Action |
|-------|----------|--------|
| Founder portrait | Founder fold / `founder-section.tsx` | Emer official clinical headshot |
| Quiz UI graphic | Quiz fold / homepage | Mobile app mockup or animation |
| App screenshots | `/how-the-app-works` | Real UI dashboard captures |
| Partner logos | Partner strip (Fold 6) | NovaUCD, DkIT, InterTradeIreland vectors |
| Logo mark | `neuronourish-mark.tsx` | Approved SVG (not text fallback) |

Run brand audit until all checks pass:

```bash
npm run neuronourish:brand
```

---

## Phase 5: Complete operational funnel verification

Execute end-to-end before Meta ads or waitlist traffic. Use Stripe test mode first, then one live micro-transaction.

## ──────────────────────────────────────────────────────────────────────────────
## PRE-LAUNCH QA RUNNER REFERENCE
## ──────────────────────────────────────────────────────────────────────────────

Prior to connecting live Meta tracking links or broadcasting your prioritized waitlist email sequences, engineers and care staff must execute a full manual test run.

Follow the exact, codebase-accurate sandbox script instructions detailed inside our primary staging protocol document:
[NeuroNourish Staging Walkthrough Protocol](./NEURONOURISH_STAGING_WALKTHROUGH.md)

This walkthrough verifies active Stripe CLI listeners, data-secure `/dashboard` session cookies, and clinical CRM queue transitions under live testing environments.

## ──────────────────────────────────────────────────────────────────────────────

```
1. Landing /quiz ──► 2. Quiz to Q5 ──► 3. Drop off
                                              │
                         Check CRM: quiz_partial + quiz_abandon nurture (1h/24h/72h)
                                              │
4. Finish quiz ◄──────────────────────────────┘
    ├── Meta Pixel: Lead + quiz_completed
    └── /quiz/results
         ├── Book discovery ──► Calendly webhook ──► discovery_requested
         │                      Mark consultation completed ──► discovery_post_call nurture
         └── Purchase €90 assessment
              ├── Stripe ──► assessment_purchased
              ├── revenueEur = 90
              ├── creditExpiryDate = today + 30 days
              ├── Patient email: Cognitive Baseline Instructions
              └── Partner SMS + email alert

B2B paths:
  /clinics partnership form ──► clinician_b2b nurture + briefing alert
  Employer OH selection ──► employer auto-response email

CRM workspace:
  /workspace/cases/[id] ──► Clinical dashboard grid + Print progress dossier
```

### Sign-off checklist

| # | Check | ☐ |
|---|--------|---|
| 1 | `npm run neuronourish:go-live` — P0 pass | |
| 2 | `npm run neuronourish:brand` — all checks pass | |
| 3 | `GET /api/health/neuronourish` — `status: healthy` | |
| 4 | Stripe + Calendly webhooks registered on live domain | |
| 5 | Full funnel run (Phase 5 diagram + [staging walkthrough](./NEURONOURISH_STAGING_WALKTHROUGH.md)) | |
| 6 | `NOTIFICATIONS_DRY_RUN` is not true on Vercel | |

**Verdict:** GO LIVE / GO LIVE WITH FIXES / DO NOT GO LIVE

```
Date:     ____________________
Deploy:   ____________________  (Vercel deployment ID)
Tester:   ____________________
Lead ID:  ____________________  (smoke test lead)

Residual risks:
1.
2.
3.
```

---

## Meta ad destination URLs (August launch)

Pre-built UTM links — see `src/lib/meta-ad-tracking.ts`:

```bash
# Example angles (programmatic):
# buildMetaQuizLandingUrl("brain-planning-analogy")
# → https://neuronourish.clinic/quiz?utm_source=meta&utm_medium=paid_social&utm_campaign=nn-quiz-august-launch&utm_content=angle-brain-planning-analogy
```

Copy matrix: `NN_META_AD_MATRIX` in `src/lib/neuronourish-copy.ts`.

---

## Remaining tracks (July 2026 — after page polish)

Marketing page polish is live. Finish in this order. **Do not invent** prices, team bios, blog posts, or clinical claims.

### Track 0 — Sync
- [x] Page-polish deployed to Vercel
- [ ] Commit + push polish to `origin/main` (this repo)
- [ ] Confirm git SHA ≈ production after next deploy

### Track A — Ops / prove commerce (current Vercel gap)
As of July 2026, production Vercel env has KV / workspace / dry-run flags but **not** Stripe, Resend, Calendly, or CNSVS keys.

- [ ] Add `STRIPE_SECRET_KEY`, publishable key, `STRIPE_WEBHOOK_SECRET`
- [ ] Stripe webhook → `https://neuro-nourish-clinic.vercel.app/api/stripe/webhook` (or custom domain)
- [ ] Add `RESEND_API_KEY` + `RESEND_FROM`; verify `neuronourish.clinic`
- [ ] Set `NOTIFICATIONS_DRY_RUN=false` in production
- [ ] Add `NEXT_PUBLIC_CALENDLY_URL`
- [ ] Apply Turso migration `20260721230000_add_cns_pipeline_fields`
- [ ] Staging CNSVS prove (`CNSVS_*`, then `CNSVS_LIVE=true`)
- [ ] **E2E:** pay assessment → `NN-{leadId}` → CNS email → CRM status

### Track B — Emer content pack (blocked on client)
- [ ] Price sheet per SKU / tier
- [ ] Team names + photos
- [ ] PT257 + blood-work copy/imagery
- [ ] Hero + partner logos
- [ ] Blog drafts (≥4) or defer

### Track C — Site updates after B
- [ ] Hero image, partners, team, shop placeholders removed
- [ ] Flip `showPublicPrice` where locked
- [ ] Blog routes only when posts exist

### Track D — Optional polish
- [x] Quiz resume + time estimate
- [x] Shop category filters
- [x] App page real screenshot preview
- [ ] GitHub → Vercel auto-deploy
- [ ] Rotate any Resend keys pastedin chat

### Track E — Demo path (Friday / VC)
1. `/quiz` → complete → email report → next steps → `/shop/cognitive-assessment`
2. `/programme` compare tiers → discovery CTA
3. `/shop` filters + featured
4. Workspace CNS panel (even if `CNSVS_LIVE` off)
5. Label Stripe test mode clearly

**Cut line if Track A incomplete:** demo UI funnel only; say CNS/Stripe are staging.

---

## Related docs

- [QUIZ_CAPTURE_POST_IMPLEMENTATION.md](./QUIZ_CAPTURE_POST_IMPLEMENTATION.md) — quiz soft-gate + report CTA + CRM wiring gate (`npm run quiz:post-implementation`)
- [NEURONOURISH_STAGING_WALKTHROUGH.md](./NEURONOURISH_STAGING_WALKTHROUGH.md) — local end-to-end QA protocol
- `README.md` — local dev env reference
- `docs/NeuroNourish_Brand_Guidelines.pdf` — brand tokens
- `docs/NEURONOURISH_PAGE_SPEED_INSIGHTS.md` — performance
- `docs/NEURONOURISH_SCREAMING_FROG_SEO.md` — SEO crawl notes
- `docs/POST_LAUNCH.md` — monitoring after deploy
