# BLB — Daniel CRM v2 Post-Implementation Audit (10/10 Gate)

**Covers:** 3-bucket Daniel CRM — New Leads → Follow-Up → Completed, qualified-only broker SMS, follow-up until initial invoice paid, two-box economics, hidden advanced queues.

**Production:** https://loans.bridgingloansbroker.co.uk  
**Vercel:** freewebguys-projects/bridging-loans-broker

**Automated gate:**

```bash
npm run crm-v2:post-implementation
```

**Behavioral deep audit** (queue logic, notifications, completion API — no build):

```bash
npm run crm-v2:deep-audit
```

**Print agent prompt:**

```bash
npm run crm-v2:prompt
```

**Live production:**

```bash
CRM_V2_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run crm-v2:post-implementation
```

**After manual Daniel workflow E2E on production:**

```bash
CRM_V2_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
CRM_V2_UI_CONFIRMED=true \
CRM_V2_NOTIFICATIONS_CONFIRMED=true \
CRM_V2_FOLLOW_UP_CONFIRMED=true \
CRM_V2_COMPLETION_CONFIRMED=true \
npm run crm-v2:post-implementation
```

---

## What shipped

| Feature | Daniel sees |
|---------|-------------|
| Nav | Home · New Leads · Follow-Up · Completed |
| Mobile tabs | Home · New · Follow · Done · More |
| Qualified-only SMS | Daniel SMS on step 3 qualified / Meta HOT-WARM only |
| Silent capture | Google step 2 + Disqualified → no Daniel SMS |
| Follow-Up | Stays until initial invoice paid; overdue badge on Home |
| Box 1 | Initial invoice paid (£) → auto Completed |
| Box 2 | Commission earned (£) → Sources ROI anytime after |
| Hidden | Documents, Applications, At Risk, Re-engagement in More |

---

## Agent prompt (copy-paste)

```
BLB — CRM V2 POST-IMPLEMENTATION AUDIT (10/10 GATE)

You are auditing Bridging Loans Broker after the Daniel CRM v2 simplification
deploy. Production is live at loans.bridgingloansbroker.co.uk. Your job is to
verify Daniel's 3-bucket sales workflow on production — not to re-implement.

Production URL:  https://loans.bridgingloansbroker.co.uk
Vercel project:  freewebguys-projects/bridging-loans-broker
Workspace login: /workspace/login (WORKSPACE_SECRET)

THE MODEL (must match production exactly)
────────────────────────────────────────
  New Leads  →  Follow-Up  →  Completed
                      ↓
              Disqualified (silent archive)

Daniel sees 3 queues + Home. Documents, Applications, At Risk, Re-engagement
are in More — NOT deleted, just hidden from daily nav.

WHAT SHIPPED
────────────────────────────────────────
1. Nav: Home · New Leads · Follow-Up · Completed (not Sale Completed)
2. Qualified-only Daniel SMS — no alert on Google step 2 capture or DQ
3. Google step 3 qualified → New Lead + one broker SMS
4. Meta partial → silent; Meta HOT/WARM after /lp/complete → tier SMS
5. Mark contacted / book call → Follow-Up with calendar date
6. Follow-Up = active deal until initial invoice paid (not date-based exit)
7. Overdue follow-ups show as badge on Home (no separate At Risk queue)
8. Box 1 (Initial invoice paid £) → auto Completed + automations stop
9. Box 2 (Commission earned £) → updates Sources ROI anytime after
10. Booking chase runs in background after 2× no-answer (no manual button)

CRITICAL RULES
- Do NOT sign off from code review alone — verify production UI with Daniel.
- Fix P0 failures before marking GO LIVE.
- Daniel's phone is the acceptance test for notifications.
- Disqualified ≠ Lost. DQ = form rules fail. Lost = Daniel marks dead deal.
- Booking chase ≠ win-back. Never confuse them.
- Deploy via npm run deploy:prod (git author may block Vercel git deploys).

════════════════════════════════════════
PHASE 0 — AUTOMATED PREFLIGHT
════════════════════════════════════════
Local (must exit 0):

  NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master
  npm run crm-v2:post-implementation
  npm run crm-v2:deep-audit
  npm run form:crm-wiring
  npm run workspace:nav
  npm run workspace:mobile
  npm run workspace:audit

Live env:

  CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:verify-live

Key files:
  src/components/workspace/shell-nav.ts
  src/components/workspace/operational-home.tsx
  src/components/workspace/case-detail.tsx
  src/components/workspace/follow-up-picker.tsx
  src/lib/lead-completion.ts
  src/lib/workspace-case.ts
  src/app/api/leads/route.ts
  src/app/api/leads/[id]/route.ts
  src/app/api/workspace/operational/route.ts

════════════════════════════════════════
PHASE 1 — NAV & MOBILE (P0)
════════════════════════════════════════
Log into /workspace. Confirm:

[ ] Desktop sidebar: Home · New Leads · Follow-Up · Completed
[ ] Mobile bottom tabs: Home · New · Follow · Done · More
[ ] More sheet contains: Lost/Disqualified, Documents, Applications,
    At Risk, Re-engagement, Sources, Automations
[ ] "Sale Completed" label is gone everywhere in primary nav
[ ] Documents and Applications still load from More (not 404)

FAIL if Daniel sees Documents or At Risk in primary nav or bottom tabs.

════════════════════════════════════════
PHASE 2 — NOTIFICATIONS (P0 — Daniel's phone)
════════════════════════════════════════
Test on production (or staging with real Vonage):

Google form:
[ ] Step 2 capture (contact only) → borrower SMS/email YES, Daniel SMS NO
[ ] Step 3 qualified submit → Daniel gets ONE broker SMS
[ ] Step 2 abandon (close browser) → Daniel never notified

Disqualified paths:
[ ] Sub-£50k / occupancy fail → Disqualified archive, Daniel SMS NO

Meta:
[ ] Partial webhook lead → Daniel SMS NO
[ ] Complete /lp/complete HOT/WARM → Daniel tier SMS YES

Dedup:
[ ] Same lead within 15 min → no duplicate broker SMS

════════════════════════════════════════
PHASE 3 — NEW LEADS QUEUE (P0)
════════════════════════════════════════
Open /workspace/inbox:

[ ] Only qualified, uncontacted leads appear (formCompleted=true)
[ ] Partial step-2 captures do NOT appear
[ ] Partial Meta leads do NOT appear
[ ] Each card shows name, £ amount, source, Call/SMS actions
[ ] Home "Call now" section matches inbox count

API (authenticated):
  GET /api/workspace/operational
  → pulse.uncontactedNew, priorities.uncontactedNew[]

════════════════════════════════════════
PHASE 4 — FOLLOW-UP LIFECYCLE (P0)
════════════════════════════════════════
Enter Follow-Up when:
[ ] Mark contacted → picker (Today / 1d / 2d / 3d / custom) → Follow-Up queue
[ ] Priority call booked → auto Follow-Up, nextActionAt = call slot

Stay in Follow-Up until:
[ ] Initial invoice paid (box 1) — NOT when follow-up date passes

Overdue behaviour:
[ ] Lead past due date still in Follow-Up queue
[ ] Home shows overdue count (red badge)
[ ] Case card shows overdue label

Reschedule:
[ ] "Reschedule follow-up" on case → new calendar date saved
[ ] Lead stays in Follow-Up after reschedule

API:
  PATCH /api/leads/{id} { "markContacted": true, "followUpPreset": "2d" }
  → operationalQueue AWAITING_CALLBACK, nextActionAt ~2 days out

  PATCH /api/leads/{id} { "rescheduleFollowUp": true, "followUpPreset": "3d" }
  → nextActionAt updated, still AWAITING_CALLBACK

════════════════════════════════════════
PHASE 5 — TWO-BOX ECONOMICS + COMPLETED (P0)
════════════════════════════════════════
On a lead in Follow-Up:

Box 1 — Initial invoice paid (£):
[ ] Enter amount > 0 and blur/save
[ ] Lead moves to Completed queue automatically
[ ] No separate "Mark sale completed" button needed
[ ] Automations cancelled (booking chase stops)
[ ] Home "Invoice this month" KPI updates

Box 2 — Commission earned (£):
[ ] Can be empty at completion
[ ] Can be filled weeks later on Completed case
[ ] Sources report revenue updates
[ ] Lead stays in Completed (does not return to Follow-Up)

Reopen (mistake path):
[ ] "Reopen to follow-up" on completed case → back to Follow-Up, invoice cleared

API:
  PATCH /api/leads/{id} { "initialInvoiceAmount": 2500 }
  → status WON, operationalQueue COMPLETION, saleCompletedAt set

  PATCH /api/leads/{id} { "revenueGenerated": 12000 }
  → revenue updated, queue unchanged

Completed board (/workspace/completions):
[ ] Shows all leads with initial invoice paid
[ ] Label reads "Completed" not "Sale Completed"

════════════════════════════════════════
PHASE 6 — BACKGROUND AUTOMATIONS (P1)
════════════════════════════════════════
[ ] 2× no-answer on qualified lead → booking chase auto-enrolls (no Daniel button)
[ ] Case shows subtle "Auto nudge active — day X/7" badge if enrolled
[ ] Chase stops on: contacted, booked, box 1 paid, Lost
[ ] Win-back still only after manual Lost (in More → Re-engagement)
[ ] DQ nurture OFF — disqualified leads sit silent in archive

════════════════════════════════════════
PHASE 7 — END-TO-END DANIEL WORKFLOW (P0 — 10/10)
════════════════════════════════════════
Run on production with a test lead:

  1. Submit qualified Google form → Daniel gets ONE SMS
  2. Lead in New Leads / Home "Call now"
  3. Mark contacted → pick 2 days → Follow-Up queue
  4. Confirm still in Follow-Up after due date passes (overdue badge)
  5. Enter £2,500 in Initial invoice paid → moves to Completed
  6. Later add £12,000 Commission earned → Sources updates
  7. Separate lead → submit unqualified → Disqualified, Daniel phone silent
  8. Separate qualified lead → 2× no-answer → auto nudge in timeline

Set flags when verified:
  CRM_V2_UI_CONFIRMED=true
  CRM_V2_NOTIFICATIONS_CONFIRMED=true
  CRM_V2_FOLLOW_UP_CONFIRMED=true
  CRM_V2_COMPLETION_CONFIRMED=true

Re-run:
  CRM_V2_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
  CRM_V2_UI_CONFIRMED=true \
  CRM_V2_NOTIFICATIONS_CONFIRMED=true \
  CRM_V2_FOLLOW_UP_CONFIRMED=true \
  CRM_V2_COMPLETION_CONFIRMED=true \
  npm run crm-v2:post-implementation

════════════════════════════════════════
PHASE 8 — REGRESSION (P1)
════════════════════════════════════════
[ ] Google 3-step form still works end-to-end
[ ] Meta instant form funnel unchanged
[ ] /workspace/documents and /workspace/applications still functional
[ ] Win-back v2 still runs after manual Lost
[ ] Cron /api/cron/process-idle healthy (booking chase, win-back, backup)
[ ] Email copy: no "chain breaks", qualified-chase emails OK

════════════════════════════════════════
SIGN-OFF CRITERIA (10/10)
════════════════════════════════════════
Daniel can answer YES to all:

  1. Do I only get texts for leads worth calling?
  2. When I open Home, do I know who to call and who to follow up?
  3. Do leads stay in Follow-Up until they pay the initial invoice?
  4. Does one number in "Initial invoice paid" close the deal?
  5. Can I add commission later without reopening the case?
  6. Is the nav just New Leads · Follow-Up · Completed?

Report format:
  - Deployment ID
  - Each phase: PASS / FAIL with evidence (screenshot or API snippet)
  - P0 blockers (if any) with owner + ETA
  - Final verdict: GO LIVE / GO LIVE WITH FIXES / DO NOT GO LIVE

SCORE GUIDE:
  10/10 — Phases 0–5 + 7 pass + Daniel sign-off
   8/10 — Automated gates pass; manual Daniel walkthrough not done
   <8  — P0 automated failure or notification routing broken on prod
```

---

## Manual flag reference

| Env var | When to set |
|---------|-------------|
| `CRM_V2_UI_CONFIRMED` | 3-queue nav verified on production |
| `CRM_V2_NOTIFICATIONS_CONFIRMED` | Qualified-only SMS tested on Daniel's phone |
| `CRM_V2_FOLLOW_UP_CONFIRMED` | Follow-up until paid + reschedule tested |
| `CRM_V2_COMPLETION_CONFIRMED` | Box 1 auto-complete + box 2 commission tested |
| `CRM_V2_GO_LIVE_SIGNOFF` | Optional Daniel sign-off |

---

## Related gates

| Doc | Command |
|-----|---------|
| `docs/MASTER_POST_IMPLEMENTATION.md` | `npm run go-live:prompt` |
| `docs/CRM_SIMPLIFICATION_POST_IMPLEMENTATION.md` | `npm run crm-simplify:prompt` (v1 — superseded by v2 for daily workflow) |

---

## Deploy note

If Vercel git deploy fails on commit author, use:

```bash
npm run deploy:prod
```
