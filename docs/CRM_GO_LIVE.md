# CRM & workflow go-live checklist

> **Full master checklist:** [`docs/MASTER_GO_LIVE.md`](./MASTER_GO_LIVE.md)  
> **Single command:** `npm run go-live:master`

**Domain:** `https://loans.bridgingloansbroker.co.uk`  
**Ad destination:** `/lp` (not `/` or `/lp/book` for cold traffic)

---

## Quick start

```bash
# Master gate (recommended — full checklist)
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master

# Shorter CRM-only gate
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run crm:go-live

# Include live production checks
CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master

# Production env keys
npm run go-live:check

# P1 — cron health (needs CRON_SECRET)
CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run cron:check
```

---

## P0 — Ad spend blockers

Complete **all** items before turning on Meta ads.

### Automated (run first)

| Step | Command | Pass |
|------|---------|------|
| CRM go-live gate | `npm run crm:go-live` | All P0 steps ✅ |
| Production keys | `npm run go-live:check` | 14/14 required |
| Live capture (optional) | `CRM_GO_LIVE_BASE_URL=… npm run crm:go-live` | LIVE-CRM ✅ |

If `crm:go-live` passes, **do not** manually re-verify wiring already covered (UTMs, `BOOKED` status, journey triggers, etc.).

### Manual smoke (one real journey)

| # | Check | Evidence |
|---|--------|----------|
| 1 | Open `/lp` with UTMs → complete form → qualify | |
| 2 | Book priority call slot | |
| 3 | Case in workspace with correct name, amount, attribution | Case ID: `____________` |
| 4 | Stage `CONSULTATION_BOOKED`, `teamsMeetingUrl`, slot time | |
| 5 | Timeline: booking + confirmation email entries | |
| 6 | Borrower email with Teams CTA | |
| 7 | Daniel email/SMS alert with Teams link | |
| 8 | Daniel Outlook calendar event | |
| 9 | Meta Events Manager: `Lead` + `Schedule` | |
| 10 | Daniel can log into `/workspace` | |

**Frozen ad URL** (update campaign only from this template):

```
https://loans.bridgingloansbroker.co.uk/lp?utm_source=facebook&utm_medium=paid&utm_campaign=YOUR_CAMPAIGN
```

---

## P1 — Day-1 operations (fix within 24h if fail)

| Check | How |
|--------|-----|
| Cron running | Vercel → Cron → `/api/cron/process-idle` last success, or `npm run cron:check` |
| **Win-back migration** | `npm run db:turso:migrate` on production **before** first deploy with win-back code |
| **Win-back audit** | `npm run workflow:winback:full` — all checks pass |
| Vonage delivery webhook | `npm run sms:test` → delivery status in case timeline |
| `/lp/book?lead=` deep link | Open URL from no-booking SMS copy; booking UI loads |
| Document upload | Request docs on test case → upload PDF via link |
| Email copy signed off | Review journey emails (next task) |
| `NOTIFICATIONS_DRY_RUN` | Must **not** be `true` on Vercel production |

---

## P2 — First week

- Nurture sequence content (long-timeframe leads)
- Weekly source digest to Daniel
- GitHub Actions auto-deploy (`VERCEL_TOKEN`)
- Rotate Microsoft Graph client secret if ever exposed
- Remove or ignore demo cases (`@demo.blb.local`)

---

## Daniel runbook

| Situation | Action |
|-----------|--------|
| **Partial lead** (step 2 only) | Call within **2 hours** — case in New leads queue |
| **Qualified, no booking** | Auto-SMS at 15 min; then call |
| **Consultation booked** | Use Teams link on case; mark **Consultation completed** after call |
| **Documents requested** | Borrower gets upload link; chase from workspace |
| **At risk** (24h+ no contact) | Priority call today |
| **Lost — no response** | Mark lost → tick **Start win-back** → case in **Re-engagement** queue |
| **Win-back reply** | **Re-open enquiry** on case detail; sequence stops automatically |

Ignore demo cases tagged `@demo.blb.local`.

### Win-back go-live (manual smoke)

| # | Check | Evidence |
|---|--------|----------|
| 1 | Mark test case lost with **No response** + win-back | Case in Lost / Disqualified **and** Re-engagement |
| 2 | Case detail shows step badge + next send date | |
| 3 | Timeline: win-back enrolled + day-0 email logged | |
| 4 | Pause win-back → disappears from active re-engagement count | |
| 5 | Resume → count returns | |
| 6 | Re-open enquiry → back in active pipeline, win-back stopped | |
| 7 | Ineligible reason (e.g. Went with another broker) — no win-back checkbox | |

**Deploy order:** apply Turso migration → deploy → run `npm run workflow:winback:full` against prod DB (or re-run locally post-migrate).

---

## Sign-off

```
CRM & WORKFLOW GO / NO-GO
Date:     ____________________
Deploy:   ____________________  (Vercel deployment ID)
Tester:   ____________________
Case ID:  ____________________  (live smoke test)

[ ] npm run workflow:winback:full — win-back audit passed
[ ] Turso migration applied (`npm run db:turso:migrate`)
[ ] npm run crm:go-live — all P0 automated checks passed
[ ] npm run go-live:check — production keys present
[ ] Live smoke — workspace case verified
[ ] Meta Lead + Schedule events confirmed
[ ] Daniel workspace access confirmed
[ ] Email copy acceptable (or known gaps noted: ____________)

Decision:  GO  /  NO-GO
Ads URL:   https://loans.bridgingloansbroker.co.uk/lp?utm_source=...
```

---

## What each audit covers

| Script | Scope |
|--------|--------|
| `crm:go-live` | Master P0 gate for CRM + workflow |
| `form:crm-wiring` | Step 2 partial → step 3 qualified → booking → CRM fields |
| `case:audit` | Stages, documents, upload tokens, risk |
| `crm:audit` | DB, notes, tasks, pipeline, automations |
| `tracking:audit` | Meta Pixel + CAPI |
| `email:audit` / `sms:audit` | Journey triggers |
| `email:cta-audit` | Every CTA href (book, Teams, upload, resume) |
| `lp:routes-audit` | `/lp/book` and resume deep links |
| `graph:audit` | Microsoft Graph + Teams (P1 advisory) |
| `cron:check` | Background jobs endpoint (P1) |
| `workflow:closed` | Lost/disqualified → closed queue wiring |
| `workflow:winback` | Win-back enrollment, tasks, re-open |
| `workflow:winback:full` | Full 10/10 prompt checklist (collisions, pause, opt-out) |
| `workflow:winback:e2e` | Live API E2E (needs `npm run dev`) |

---

## Related docs

- `docs/MASTER_GO_LIVE.md` — **full go-live checklist** (borrower, CRM, win-back, sequence flows, cron, sign-off)
- `docs/POST_LAUNCH.md` — post-deploy monitoring (noindex, SEO)
- `npm run go-live:master` — master automated gate
- `npm run go-live:audit` — shorter release gate including prelaunch + email design
