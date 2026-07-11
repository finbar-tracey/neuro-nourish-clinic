# BLB — Meta Instant Form + Go-Live Post-Implementation Audit (10/10 Gate)

**Covers:** Meta Lead Ads instant form funnel + parallel Google homepage + existing BLB CRM/go-live stack.

**Production:** https://loans.bridgingloansbroker.co.uk  
**Vercel:** freewebguys-projects/bridging-loans-broker

**Automated gate:**

```bash
npm run meta:post-implementation
```

**Print agent prompt:**

```bash
npm run meta:prompt
```

**Live production (after deploy):**

```bash
META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run meta:post-implementation
```

**After manual E2E on production:**

```bash
META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
META_WEBHOOK_TEST_LEAD_CONFIRMED=true \
META_COMPLETE_E2E_CONFIRMED=true \
META_ADS_READY_CONFIRMED=true \
npm run meta:post-implementation
```

---

## Channel architecture

| Channel | Front door | Daniel gets |
|---------|------------|-------------|
| **Meta** | Instant Form → webhook → SMS → `/lp/complete` | HOT/WARM qualified only |
| **Google** | `/` full 3-step form | Capture at step 2 + qualified at step 3 |

Meta must **not** send traffic to `/` or `/lp` until Meta policy allows website LP.

---

## Agent prompt (copy-paste)

```
BLB — META INSTANT FORM + GO-LIVE POST-IMPLEMENTATION AUDIT (10/10 GATE)

You are auditing Bridging Loans Broker (BLB) for production launch with the new
Meta instant form funnel. This is Project A in the bridging-loans-broker monorepo.

Production URL: https://loans.bridgingloansbroker.co.uk
Vercel project:  freewebguys-projects/bridging-loans-broker
Vertical:        VERTICAL=bridging (default)

CHANNEL ARCHITECTURE (must hold after audit)
────────────────────────────────────────────
Google Ads  →  /  (full 3-step form)     → Daniel capture alert at step 2
Meta Ads    →  Instant Form ONLY (no /lp)  → partial CRM → SMS → /lp/complete
                                              → Daniel HOT/WARM only after step 3

Meta must NOT send traffic to / or /lp until Meta policy allows website LP.
Google must NOT be changed to /lp for cold traffic.

CRITICAL RULES
- Do NOT turn on Meta ad spend until this gate returns GO LIVE (10/10).
- Fix all P0 failures in code before re-running. Do not hand-wave.
- Automated runs: NOTIFICATIONS_DRY_RUN=true, META_CAPI_DRY_RUN=true locally.
- Production must have NOTIFICATIONS_DRY_RUN≠true and real Vonage/Resend/Meta CAPI.
- Standalone scripts must load .env.local (dotenv) — Next.js dev does this automatically.
- Report script output verbatim. Do not re-derive pass/fail from memory.
- Daniel must NEVER get "call within 15 mins" on Meta partial leads.
- Borrower completion links must use signed tokens (COMPLETION_LINK_SECRET).

════════════════════════════════════════
PHASE 0 — PREFLIGHT
════════════════════════════════════════
Confirm:
[ ] Repo builds: npm run build
[ ] Vercel production deploy succeeded (note deployment ID)
[ ] Git author email matches Vercel team GitHub (freewebguys) OR deploy via CLI
[ ] Production env vars set (see Phase 3)
[ ] loans.bridgingloansbroker.co.uk resolves and serves BLB (not healthcare)

Run local Meta funnel smoke (loads .env.local):
  NOTIFICATIONS_DRY_RUN=false npm run meta:webhook-test

Expected:
  Vonage configured: true
  nextAction: Awaiting qualification
  callbackDueAt: null
  brokerSent: true (Daniel soft alert)
  Borrower SMS: use a real UK mobile in test — 07700900123 fails Vonage

════════════════════════════════════════
PHASE 1 — AUTOMATED LOCAL GATE (P0)
════════════════════════════════════════
Run in order (all must PASS):

  NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master
  npm run meta:post-implementation
  npm run build

If any FAIL → fix root cause → re-run entire phase.

════════════════════════════════════════
PHASE 2 — META INSTANT FORM STATIC WIRING (P0)
════════════════════════════════════════
Verify files exist and are wired:

  src/app/api/meta/leadgen/route.ts       GET verify + POST ingest
  src/lib/meta-leadgen.ts                 Graph API fetch + field mapping
  src/lib/completion-link.ts              HMAC sign/verify (7-day expiry)
  src/lib/meta-capture-notifications.ts   ingest SMS/email (NOT capture bundle)
  src/lib/meta-complete-chase.ts          2h / 24h / 72h / 7d tasks
  src/app/lp/complete/page.tsx            token gate, noindex, step 3 only
  src/components/forms/meta-complete-form.tsx

Verify behaviour in code:
[ ] Meta webhook creates lead: source=meta_instant_form, formCompleted=false,
    qualificationTier=partial, metaLeadgenId dedupe
[ ] Meta ingest does NOT call sendBrokerNewLeadAlert or LEAD_CAPTURED automations
[ ] Meta ingest DOES call sendMetaIngestNotifications (soft Daniel alert only)
[ ] /lp/complete rejects invalid/expired tokens
[ ] Complete submit requires completionToken for meta leads
[ ] On qualified complete: cancelMetaCompleteChaseTasks, broker HOT/WARM SMS,
    CAPI CompleteRegistration (not Lead only)
[ ] On researching complete: nurture enroll, Daniel silent
[ ] Chase tasks wired in /api/cron/process-idle

Field mapping sanity (Meta custom questions → CRM enums):
  Amount bands  → 150k / 250k / 500k / 1m
  Purpose       → auction, purchase, chain_break (Business/Investment), etc.
  Timeline      → urgent / 30_days / 90_days / researching

════════════════════════════════════════
PHASE 3 — PRODUCTION ENV (P0)
════════════════════════════════════════
Run: npm run go-live:check (against production pulled env if available)

Required on Vercel production:

  KV_REST_API_URL + KV_REST_API_TOKEN
  WORKSPACE_SECRET
  CRON_SECRET
  RESEND_API_KEY + RESEND_FROM
  VONAGE_API_KEY + VONAGE_API_SECRET (or _B64) + VONAGE_FROM_NUMBER
  BROKER_NOTIFY_EMAIL + broker phone for SMS alerts
  NEXT_PUBLIC_SITE_URL=https://loans.bridgingloansbroker.co.uk
  NEXT_PUBLIC_META_PIXEL_ID
  META_CAPI_ACCESS_TOKEN
  NOTIFICATIONS_DRY_RUN          must NOT be "true"
  META_CAPI_DRY_RUN              must NOT be "true"

Meta instant form (P0 before webhook live):
  META_INSTANT_FORM_ENABLED=true
  META_PAGE_ACCESS_TOKEN
  META_LEADGEN_VERIFY_TOKEN
  META_APP_SECRET
  COMPLETION_LINK_SECRET         openssl rand -hex 32

P0 FAIL if any Meta webhook var missing when META_INSTANT_FORM_ENABLED=true.

════════════════════════════════════════
PHASE 4 — POST-DEPLOY AUTOMATED (P0)
════════════════════════════════════════
  CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master
  META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run meta:post-implementation
  CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run cron:check

Cron must return 200 with metaChase in response body.

════════════════════════════════════════
PHASE 5 — MANUAL E2E: META INSTANT FORM (P0)
════════════════════════════════════════
NO AD SPEND. Use Meta Business Manager "Test lead" tool OR manual webhook POST.

Case ID: ____________

Step A — Ingest (partial)
[ ] POST /api/meta/leadgen receives test leadgen event → 200
[ ] CRM: source=meta_instant_form, formCompleted=false, qualificationTier=partial
[ ] nextAction = "Awaiting qualification", callbackDueAt = null
[ ] Daniel SMS = soft "Awaiting qualification" (NOT "call within 15 mins")
[ ] Borrower SMS within 60s with /lp/complete?lead=&token= link
[ ] Borrower email "Finish your property finance review" with same CTA
[ ] Meta Events Manager: Lead event (Test Events tab)
[ ] Chase tasks created: 2h, 24h, 72h, 7d

Step B — Completion (/lp/complete)
[ ] Open signed link → pre-filled chips (amount, purpose, timeline)
[ ] Step 3 only: investment screening + property type/value/location
[ ] Occupancy DQ → FCA mortgage adviser message (no Daniel call)
[ ] Loan < £50k → DQ
[ ] Researching timeline → nurture, Daniel silent
[ ] Qualified submit → thank-you + booking slots

Step C — Daniel tiers (qualified)
[ ] Urgent (7-day) → Daniel HOT SMS "call within 2h" + callbackDueAt ~2h
[ ] 30/90 day → Daniel WARM SMS "call same day"
[ ] Chase tasks cancelled on formCompleted=true
[ ] Meta CAPI: CompleteRegistration on qualified
[ ] Workspace: fully_qualified, operational queue updated

Step D — Chase (can simulate with backdated task or wait)
[ ] 2h SMS if still incomplete
[ ] 24h email reminder
[ ] 72h winback SMS
[ ] Complete → all chase tasks marked completed

Set after verifying on production:
  META_WEBHOOK_TEST_LEAD_CONFIRMED=true
  META_COMPLETE_E2E_CONFIRMED=true

════════════════════════════════════════
PHASE 6 — MANUAL E2E: GOOGLE HOMEPAGE (P0)
════════════════════════════════════════
[ ] / full 3-step form submits
[ ] Step 2 capture → Daniel "call within 15 mins" alert (acceptable for Google)
[ ] Step 3 qualified → booking + confirmation
[ ] source tagged google_lp or utm_source=google
[ ] Compare attribution in /workspace/sources

Frozen Google test URL:
  https://loans.bridgingloansbroker.co.uk/?utm_source=google&utm_medium=cpc&utm_campaign=launch-test

════════════════════════════════════════
PHASE 7 — META ADS READINESS (P0 before spend)
════════════════════════════════════════
Instant Form config (Business Manager):
[ ] Form copy: specialist broker · property finance · introducer only · business & investment
[ ] NO "bridging loan", rates, or FCA-regulated claims in form
[ ] 3 custom questions max: amount, purpose, timeline
[ ] Webhook URL: https://loans.bridgingloansbroker.co.uk/api/meta/leadgen
[ ] Subscribed to leadgen events
[ ] Test lead passes Phase 5 Step A on PRODUCTION

Campaign (Week 2 — after Phase 5 passes):
[ ] CBO £20–30/day · Optimise for Leads · No website URL on ad

Launch metrics (first 7 days):
  Instant CPL ≤ £30 · SMS click ≥ 45% · Complete ≥ 70% · Qualified ≥ 75% · Qualified CPL ≤ £60

Set after sign-off:
  META_ADS_READY_CONFIRMED=true

════════════════════════════════════════
PHASE 8 — DANIEL QUEUE & WORKSPACE (P1)
════════════════════════════════════════
[ ] Partial Meta leads: "Awaiting qualification" — not in call-now queue
[ ] HOT: meta_instant_form + fully_qualified + urgent
[ ] WARM: meta_instant_form + fully_qualified + 30/90 days

════════════════════════════════════════
PHASE 9 — COMPLIANCE (P0)
════════════════════════════════════════
[ ] meta-lp:audit PASS
[ ] /lp/complete is noindex
[ ] Instant form ad copy vs META_LP_BANNED_PATTERNS
[ ] Step 3 occupancy screening on /lp/complete

════════════════════════════════════════
PHASE 10 — SIGN-OFF
════════════════════════════════════════
VERDICT:
  GO LIVE             — All P0 pass, Meta E2E on production, Google E2E pass
  GO LIVE WITH FIXES  — P0 pass; P1 documented with 24h owners
  DO NOT GO LIVE      — Daniel calling partial Meta, webhook broken, dry-run on prod

DO NOT GO LIVE IF:
- Daniel receives "call within 15 mins" on Meta partial ingest
- /lp/complete accepts lead ID without valid token
- COMPLETION_LINK_SECRET missing on production
- NOTIFICATIONS_DRY_RUN=true on Vercel production
```

---

## Manual confirmation flags

| Env flag | When to set |
|----------|-------------|
| `META_WEBHOOK_TEST_LEAD_CONFIRMED` | Meta test lead ingested on production; Daniel soft alert only |
| `META_COMPLETE_E2E_CONFIRMED` | Signed `/lp/complete` → qualified → HOT/WARM on production |
| `META_ADS_READY_CONFIRMED` | Instant form + webhook verified; ready for £20–30/day test |
| `META_GO_LIVE_SIGNOFF` | Daniel sign-off to turn on ad spend |

---

## Week 1 cadence

| Day | Action |
|-----|--------|
| D0 | Gate PASS + production Meta test lead (no ad spend) |
| D1–D3 | Fix completion rate if SMS click < 45% |
| D4–D7 | Meta ads £20–30/day only if Phase 5 passed |
| D7+ | Scale if qualified CPL ≤ £60 for 5 consecutive days |

**Pause Meta ads if:** qualified CPL > £80 after £100 spend, or complete rate < 45% after 20 partial leads.

---

## Related docs

- [MASTER_GO_LIVE.md](./MASTER_GO_LIVE.md) — full BLB CRM + borrower stack
- [CRM_GO_LIVE.md](./CRM_GO_LIVE.md) — workspace ops
