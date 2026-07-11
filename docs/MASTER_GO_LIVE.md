# Bridging Loans Broker — Master Go-Live Checklist

**Product:** https://loans.bridgingloansbroker.co.uk  
**Stack:** Next.js CRM · Vercel KV · Resend · Vonage SMS · Vercel Cron · Meta CAPI  
**Ad destination:** `/lp` with UTMs (not `/` for cold traffic)

**Single command (automated gate):**

```bash
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master
```

**With live production checks:**

```bash
CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master
```

**Print post-implementation agent prompt:**

```bash
npm run crm-v2:prompt
```

See also: `docs/CRM_V2_POST_IMPLEMENTATION.md` · `docs/MASTER_POST_IMPLEMENTATION.md`

---

## Verdict scale

| Verdict | Meaning |
|---------|---------|
| **GO LIVE** | All P0 automated + config + manual smoke (§6–8, §10) pass |
| **GO LIVE WITH FIXES** | P0 pass; P1 documented with 24h owners |
| **DO NOT GO LIVE** | Any P0 fail, dry-run on prod, cron broken, or capture broken |

| Severity | Definition |
|----------|------------|
| **P0** | Money/risk — no leads, wrong sends, wrong queue, compliance |
| **P1** | Ops pain — fix within 24h |
| **P2** | Polish — first week |

---

## 1. Scope

### In scope

| Area | Built |
|------|--------|
| Landing & form | `/lp`, angles, capture + complete, qualification |
| CRM pipeline | Stages, queues (inbox, callbacks, docs, apps, completions, at-risk) |
| Case OS | SLA, risk, timeline, documents, upload links |
| Booking | Priority slots, Teams URL, reminders |
| Nurture | 5 emails / 30 days (long timeframe) |
| Win-back v2 | Standard 6-step (email+SMS) + long 3-email (90d) |
| Queues | Lost/Disqualified + Re-engagement |
| Auto-pause | Contacted, call connected, same-email new form |
| Sequence flows | Read-only visual monitor — `/workspace/automations` |
| Cron | `/api/cron/process-idle` every ~15 min |
| Notifications | Email/SMS, unsubscribe, marketing vs transactional |
| Tracking | Meta pixel + CAPI, UTMs |
| **Meta instant form** | Webhook → partial CRM → SMS → `/lp/complete` → HOT/WARM ([gate](./META_INSTANT_FORM_POST_IMPLEMENTATION.md)) |

### Out of scope (don't block launch)

- Sitewide noindex (intentional for paid LP)
- Operational cron in sequence viewer (booking/doc chases)
- Email open/click rates in sequence flows
- In-app sequence editor

---

## 2. Pre-deploy automated (P0)

```bash
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run build
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master
```

`go-live:master` runs:

| Audit | Scope |
|-------|--------|
| `form:audit` | Form fields, steps, consent |
| `form:e2e` | Submit path |
| `form:crm-wiring` | Lead → CRM |
| `case:audit` | Stages, SLA |
| `crm:audit` | Persistence, queues |
| `tracking:audit` | Pixel, CAPI |
| `email:audit` + CTA + assets | Templates, links |
| `sms:audit` | SMS copy |
| `thank-you:audit` | Booking UI |
| `workspace:audit` | Nav, boards |
| `workflow:closed` | Lost/disqualified |
| `workflow:winback` + `full` | Win-back v2 |
| `crm:post-implementation` | Win-back post-ship |
| `sequence:post-implementation` | Sequence flows viewer |
| `lp:routes-audit` + `deep-links:audit` | Deep links |
| `notifications:audit` | Routing |
| `go-live:check` | Production env keys |
| `sequence:funnel` | Funnel unit test |
| `prelaunch:audit` | LP bundle |

**P1 advisory:** `graph:audit`, `workflow:winback:e2e` (needs dev server)

---

## 3. Production configuration (P0)

```bash
npm run go-live:check
```

| Variable | Required | Notes |
|----------|----------|-------|
| `WORKSPACE_SECRET` | ✓ | Workspace auth |
| `CRON_SECRET` | ✓ | Cron auth |
| `KV_REST_API_URL` + token | ✓ | CRM store |
| `RESEND_API_KEY` | ✓ | Email |
| `VONAGE_*` | ✓ | SMS |
| `NOTIFICATIONS_DRY_RUN` | ✓ must **not** be `true` | Real sends |
| `META_CAPI_DRY_RUN` | ✓ must **not** be `true` | Real CAPI |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Link base |
| Microsoft Graph | P1 | Calendar/Teams |

**P0 fail if `NOTIFICATIONS_DRY_RUN=true` on Vercel production.**

---

## 4. Deploy (P0)

```bash
npm run deploy:prod
```

- [ ] Vercel deployment succeeded — ID: `____________`
- [ ] Site loads at production URL
- [ ] `/workspace/login` reachable
- [ ] No runtime errors in Vercel logs

---

## 5. Post-deploy automated (P0 with live URL)

```bash
CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master
```

Includes:

- `postlaunch:audit` — live site smoke
- `cron:check` — cron health
- `CRM_POST_AUDIT_LIVE=true` — win-back prod config
- `SEQUENCE_POST_AUDIT_LIVE=true` — sequence flows prod config

---

## 6. Manual smoke — borrower journey (P0)

Case ID: `____________`

| # | Check | ☐ |
|---|--------|---|
| 1 | Open `/lp` with UTMs → complete form → qualify | |
| 2 | Book priority call slot | |
| 3 | Case in workspace with name, amount, attribution | |
| 4 | Stage `CONSULTATION_BOOKED`, `teamsMeetingUrl`, slot | |
| 5 | Timeline: booking + confirmation | |
| 6 | Borrower confirmation email (Teams CTA) | |
| 7 | Daniel alert email/SMS with Teams link | |
| 8 | Daniel Outlook calendar event (if Graph) | |
| 9 | Meta Events Manager: `Lead` + `Schedule` | |
| 10 | Daniel logs into `/workspace` | |

**Frozen ad URL:**

```
https://loans.bridgingloansbroker.co.uk/lp?utm_source=facebook&utm_medium=paid&utm_campaign=YOUR_CAMPAIGN
```

### Secondary paths (P1 — 24h)

| # | Check | ☐ |
|---|--------|---|
| 11 | Partial capture (step 2) → New leads, 2hr task | |
| 12 | No booking → SMS at 15 min | |
| 13 | `/lp/book?lead=` loads booking UI | |
| 14 | Long timeframe → nurture (`FOLLOW_UP`) | |
| 15 | Document request → upload works | |
| 16 | Unsubscribe stops marketing | |

---

## 7. Manual smoke — CRM & queues (P0)

| # | Check | ☐ |
|---|--------|---|
| 1 | Nav counts match boards | |
| 2 | Mark contacted → timeline updates | |
| 3 | Consultation completed → stage advances | |
| 4 | Request documents → email + upload | |
| 5 | Mark lost → **Lost / Disqualified** | |
| 6 | Mark lost + win-back → **Re-engagement** too | |
| 7 | Sequence preview on mark-lost | |
| 8 | Re-engagement metrics (active, due today, paused) | |

---

## 8. Manual smoke — win-back v2 (P0)

| # | Check | ☐ |
|---|--------|---|
| 1 | **No response** + enroll → standard (6 steps) | |
| 2 | **Funding no longer needed** → long (3 emails) | |
| 3 | Day-0 email in timeline immediately | |
| 4 | Pending tasks (email + SMS for standard) | |
| 5 | Pause → paused on re-engagement board | |
| 6 | Resume → `winbackNextAt` restored | |
| 7 | Mark contacted → auto-pause (`re_engaged`) | |
| 8 | Same email new form → auto-pause | |
| 9 | Re-open → pipeline restored, win-back stopped | |
| 10 | Ineligible lost reason → no win-back checkbox | |
| 11 | DISQUALIFIED → cannot enroll | |
| 12 | Unsubscribe → win-back stopped | |
| 13 | Cron / process-idle sends due step | |
| 14 | Paused tasks not sent by cron | |

**Standard:** D0 email → D3 SMS → D7 → D14 → D30 SMS + D30 email  
**Long:** D0 → D30 → D90 emails

---

## 9. Manual smoke — sequence flows (P1)

`/workspace/automations` → **Sequence flows**

| # | Check | ☐ |
|---|--------|---|
| 1 | Three flow cards | |
| 2 | Global overview sensible | |
| 3 | Win-back lead on correct step (waiting) | |
| 4 | Passed count on earlier steps | |
| 5 | Paused shows paused, not waiting | |
| 6 | Due today badge | |
| 7 | Lead link opens correct case | |
| 8 | Completed / Stopped exits | |
| 9 | Auto-refresh (~60s) | |
| 10 | Event rules tab works | |

---

## 10. Cron & background jobs (P0)

| # | Check | ☐ |
|---|--------|---|
| 1 | Vercel cron last success | |
| 2 | Response includes `winback`, `nurture`, `winbackDigest` | |
| 3 | Unauthenticated cron → 401 | |
| 4 | Workspace process-idle works (auth'd) | |

**Cron bundle:** idle, nurture, win-back, operational follow-ups, case sync, retries, weekly digests.

---

## 11. Daniel runbook

| Situation | Action |
|-----------|--------|
| Partial lead (step 2) | Call within **2 hours** |
| Qualified, no booking | Auto-SMS 15 min; call |
| Consultation booked | Teams link; mark **Consultation completed** |
| Documents outstanding | Chase from Documents queue |
| At risk | Priority call today |
| Lost — no response | Close + **Start win-back** |
| Lost — funding not needed | Long win-back sequence |
| Win-back reply | **Re-open enquiry** or resume |
| Re-submit form | Win-back auto-pauses |
| Monitor flows | Automations → Sequence flows |
| Demo data | Ignore `@demo.blb.local` |

**Two buckets:** **Lost / Disqualified** (all closed) vs **Re-engagement** (active/paused win-back only).

---

## 12. Compliance (P0)

| # | Check | ☐ |
|---|--------|---|
| 1 | Unsubscribe on marketing emails | |
| 2 | Nurture + win-back = marketing | |
| 3 | Unsubscribe stops sequences | |
| 4 | Form consent before marketing | |
| 5 | Workspace behind auth | |
| 6 | Noindex retained | |

---

## 13. First 24h monitoring (P1)

| Signal | Where |
|--------|--------|
| Form submissions | Workspace inbox |
| Cron failures | Vercel logs |
| Email bounces | Resend |
| SMS failures | Vonage |
| Meta events | Events Manager |
| Win-back sends | Timelines + Sequence flows |
| Weekly digests | Monday email to Daniel |

---

## 14. First week (P2)

- [ ] Nurture copy signed off
- [ ] Win-back copy signed off
- [ ] Weekly source digest received
- [ ] Weekly win-back digest received (first Monday)
- [ ] Demo cases cleaned up
- [ ] Secrets rotated if exposed
- [ ] CI/CD auto-deploy configured

---

## 15. Sign-off

```
BRIDGING LOANS BROKER — GO LIVE SIGN-OFF
Date:     ____________________
Deploy:   ____________________  (Vercel ID)
Tester:   ____________________
Case ID:  ____________________  (live smoke)

AUTOMATED
[ ] npm run go-live:master — pass
[ ] npm run go-live:check — production keys
[ ] CRM_GO_LIVE_BASE_URL=… go-live:master — live pass

PRODUCTION CONFIG
[ ] NOTIFICATIONS_DRY_RUN is NOT true on Vercel
[ ] CRON_SECRET set; cron firing
[ ] KV bound

MANUAL
[ ] Borrower journey (§6)
[ ] CRM queues (§7)
[ ] Win-back v2 (§8)
[ ] Cron (§10)

VERDICT:  GO LIVE / GO LIVE WITH FIXES / DO NOT GO LIVE
Score: ___/10

Residual risks:
1.
2.
3.
```

---

## 16. Command reference

```bash
# Full master gate (pre-deploy)
NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master

# Deploy
npm run deploy:prod

# Post-deploy
CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master

# Deep dives
npm run workflow:winback:full
npm run workflow:winback:e2e      # dev server required
npm run crm:post-implementation
npm run sequence:post-implementation
npm run cron:check
```

---

## 17. Top 5 production risks

1. **`NOTIFICATIONS_DRY_RUN=true`** — sequences run but nothing is delivered
2. **Cron not firing** — nurture/win-back stall silently
3. **KV misconfiguration** — leads or win-back fields lost
4. **Wrong ad URL** — attribution broken
5. **No ops monitoring** — Re-engagement / Sequence flows ignored

---

## Related

- `docs/MASTER_POST_IMPLEMENTATION.md` — full post-impl agent prompt + manual E2E phases
- `docs/CRM_GO_LIVE.md` — shorter CRM-focused checklist
- `docs/WINBACK_10_CHECKLIST.md` — win-back v2 implementation
- `docs/POST_LAUNCH.md` — post-deploy monitoring
