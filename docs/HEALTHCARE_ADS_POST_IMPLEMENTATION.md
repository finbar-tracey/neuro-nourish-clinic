# Booked Consult — Healthcare Ads Post-Implementation Audit (10/10 Gate)

**Covers:** `/for-clinics` (B2B pilot sales) + `/lp/implants` (Meta ads patient destination)

**Automated gate:**

```bash
npm run healthcare-ads:post-implementation
```

**Print agent prompt:**

```bash
npm run healthcare-ads:prompt
```

---

## Agent prompt (copy-paste)

```
BOOKED CONSULT — HEALTHCARE ADS POST-IMPLEMENTATION AUDIT (10/10 GATE)

You are auditing the Booked Consult healthcare vertical in the bridging-loans-broker monorepo.
Two Vercel projects share one codebase:

  Project A (BLB):  loans.bridgingloansbroker.co.uk  — VERTICAL=bridging (default)
  Project B (BC):   bookedconsult.com               — VERTICAL=healthcare

Two surfaces under audit:
  /for-clinics   — B2B pilot sales (clinic outbound)
  /lp/implants   — Meta ads patient destination

CRITICAL RULES
- Booked Consult routes must NEVER show "Bridging Loans Broker" even when VERTICAL is unset locally.
- Healthcare API is opt-in only: body.vertical === "healthcare".
- Separate KV: bridging-loans-broker:crm (BLB) vs booked-consult:crm (BC).
- Do NOT turn on Meta spend or pilot outbound until this gate returns 10/10 verdict.
- Fix P0 failures in code before re-running. Do NOT set manual compliance flags unless you have verified live.
- Always use NOTIFICATIONS_DRY_RUN=true and META_CAPI_DRY_RUN=true for automated runs.
- Do not re-derive automated results manually — run the script and report its output format exactly.

════════════════════════════════════════
PHASE 0 — PREFLIGHT
════════════════════════════════════════
Confirm:
- node + npm available
- package.json includes healthcare-ads:post-implementation (alias: for-clinics:post-implementation)
- Assets present (run if missing): npm run healthcare:generate-assets
  → public/og/for-clinics.png
  → public/og/implants.png
  → public/images/for-clinics/crm-workspace.webp

════════════════════════════════════════
PHASE 1 — AUTOMATED LOCAL GATE (P0)
════════════════════════════════════════
Run in order:
  npm run vertical:protect          # blb:protect + healthcare:audit + healthcare:comms-audit
  npm run healthcare:post-implementation
  npm run build

All three must PASS. If any FAIL, fix root cause and re-run before continuing.

════════════════════════════════════════
PHASE 2 — STATIC WIRING
════════════════════════════════════════
/for-clinics must compose:
  ForClinicsHero, ForClinicsComparison, ForClinicsCrmSection, ForClinicsPilotOffer,
  ForClinicsHowItWorks, ForClinicsGuarantee, ForClinicsOperator, ForClinicsFaq,
  ForClinicsFooter, MetaViewContent

/lp/implants must compose:
  HealthcareImplantsHeader, HealthcarePatientComplianceStrip, HealthcareImplantsSteps,
  HealthcareImplantsMidCta, HealthcareImplantsFaq, HealthcareImplantsFooter,
  HealthcareStickyCta

Thank-you must have inline Calendly + name/email prefill (healthcare-thank-you.tsx).
Postcode catchment supported via HEALTHCARE_POSTCODE_PREFIXES.

════════════════════════════════════════
PHASE 3 — LOCAL HTML GATES
════════════════════════════════════════
Start dev server, then run:
  npm run dev
  LOCAL_POST_IMPL_URL=http://localhost:3000 npm run healthcare-ads:post-implementation

Verify locally (script does this; confirm if fixing):
- GET /for-clinics — zero "Bridging Loans Broker"
- GET /lp/implants — zero "Bridging Loans Broker"
- GET / (with VERTICAL unset) — BLB home still works

════════════════════════════════════════
PHASE 4 — MANUAL VISUAL QA (score /10 each)
════════════════════════════════════════

/for-clinics — review at 375px AND 1440px (1 point each, need ≥9 to pass):
  1. Navy hero + "For implant clinics" eyebrow
  2. Header: Booked Consult + Patient demo link + desktop CTA
  3. Calendly embed live on desktop (not amber fallback)
  4. Loom section visible and plays (NEXT_PUBLIC_PILOT_LOOM_URL)
  5. Comparison table — Recommended = Booked Consult
  6. CRM section with real screenshot + caption
  7. Pilot offer — included / you-provide checklists
  8. FAQ accordion ≥7 items, first open by default
  9. Navy footer + Privacy link
  10. Mobile sticky CTA appears after hero scroll

/lp/implants — review at 375px (1 point each, need ≥9 to pass):
  1. Ad headline matches H1 promise
  2. Real clinic name in hero (NOT "Private implant clinic")
  3. Form visible above fold on mobile
  4. Step 1 completable in under 60 seconds
  5. Thank-you: inline Calendly on mobile
  6. SMS confirmation mentioned on thank-you
  7. FAQ accordion works on tap
  8. Sticky CTA scrolls to #quote-form
  9. Compliance strip visible (free initial consult, GDC-safe)
  10. Zero BLB branding anywhere on page or thank-you

After visual review:
  FOR_CLINICS_MANUAL_QA_SCORE=9 IMPLANTS_MANUAL_QA_SCORE=9 npm run healthcare-ads:post-implementation

════════════════════════════════════════
PHASE 5 — PROJECT B ENV (strict on live)
════════════════════════════════════════
Required on Vercel Project B (bookedconsult.com):

  VERTICAL=healthcare
  NEXT_PUBLIC_VERTICAL=healthcare
  NEXT_PUBLIC_SITE_URL=https://bookedconsult.com
  BRAND_NAME=Booked Consult
  PARTNER_NAME=<clinic legal/trading name>
  NEXT_PUBLIC_PARTNER_NAME=<same>
  NEXT_PUBLIC_PARTNER_CITY=<e.g. London>
  CRM_KV_KEY=booked-consult:crm
  KV_REST_API_URL=<dedicated BC KV>
  KV_REST_API_TOKEN=<dedicated BC KV>
  NEXT_PUBLIC_SALES_CALENDLY_URL=<10-min pilot call>
  NEXT_PUBLIC_CALENDLY_URL=<patient implant consult>
  SALES_EMAIL=hello@bookedconsult.com
  PARTNER_NOTIFY_EMAIL / PARTNER_NOTIFY_PHONE
  VONAGE_SENDER_ID=BookedConsult
  RESEND_FROM=Booked Consult <hello@bookedconsult.com>
  Resend + Vonage + Meta Pixel keys (BC project)

Optional but recommended (P2):
  NEXT_PUBLIC_PILOT_LOOM_URL=<90s B2B walkthrough>
  HEALTHCARE_POSTCODE_PREFIXES=SW,SE,NW,WC,EC,W,N,E
  NEXT_PUBLIC_CLINIC_TESTIMONIAL_NAME / ROLE / QUOTE / PHOTO

Run strict env gate with live URL set:
  HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com npm run healthcare-ads:post-implementation

════════════════════════════════════════
PHASE 6 — LIVE SMOKE (P0)
════════════════════════════════════════
  BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
  HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com \
  npm run healthcare-ads:post-implementation

Project A (BLB) must:
- GET / → 200, BLB branding present
- NOT redirect to /for-clinics
- NOT show healthcare pilot pricing

Project B (BC) must:
- GET / → redirect to /for-clinics
- GET /for-clinics → 200, zero BLB, pilot price visible, FAQ present
- GET /lp/implants → 200, zero BLB, no FCA strip, form anchor, FAQ accordion, compliance strip

════════════════════════════════════════
PHASE 7 — CROSS-CONTAMINATION (P0)
════════════════════════════════════════
Manual (always):
- Submit test healthcare lead on bookedconsult.com
- Confirm it appears in BC workspace ONLY
- Confirm it does NOT appear in BLB workspace/KV
- Delete test lead after verification

Optional automated API test (creates lead — delete after):
  HEALTHCARE_POST_AUDIT_LIVE=true \
  BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
  HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com \
  npm run healthcare-ads:post-implementation

════════════════════════════════════════
PHASE 8 — LIVE PATIENT E2E (P0 manual)
════════════════════════════════════════
Run once on production bookedconsult.com:

  Meta UTM URL → /lp/implants?utm_source=facebook&utm_medium=paid&utm_campaign=v1-test
  → complete form (Step 1 <60s)
  → thank-you page: inline Calendly loads, name/email prefilled
  → book a slot
  → case appears in BC workspace with correct attribution
  → patient receives SMS + email (Booked Consult branding, clinic name, NOT BLB)
  → clinic receives notify within 5 minutes

Only after verified:
  HEALTHCARE_PATIENT_E2E_CONFIRMED=true

════════════════════════════════════════
PHASE 9 — COMPLIANCE GATES (P0 manual)
════════════════════════════════════════
Confirm on file BEFORE setting flags:

GDC/ASA checklist:
  · No guaranteed outcomes / best dentist / pain-free forever
  · "Free consultation" = initial consult only
  · Booked Consult = booking arranger; treatment by clinic clinicians
  · Ad creative approved by clinic responsible person

  → HEALTHCARE_GDC_SIGNOFF=true

Ad ↔ LP message lock (headline, bullets, FAQ match Meta creative exactly):
  → HEALTHCARE_AD_LP_LOCK_CONFIRMED=true

Meta Test Events on live /lp/implants:
  · ViewContent on page load
  · Lead on form submit
  · Schedule on Calendly booking
  → HEALTHCARE_META_EVENTS_CONFIRMED=true

Clinic Calendly capacity:
  · ≥4 patient slots/week
  · Availability ≥14 days out
  → HEALTHCARE_CLINIC_CALENDLY_CONFIRMED=true (P1)

Pilot terms / LOI agreed with clinic (P1, manual).

════════════════════════════════════════
PHASE 10 — FINAL GATE COMMAND
════════════════════════════════════════
  BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
  HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com \
  FOR_CLINICS_MANUAL_QA_SCORE=9 \
  IMPLANTS_MANUAL_QA_SCORE=9 \
  HEALTHCARE_GDC_SIGNOFF=true \
  HEALTHCARE_AD_LP_LOCK_CONFIRMED=true \
  HEALTHCARE_PATIENT_E2E_CONFIRMED=true \
  HEALTHCARE_META_EVENTS_CONFIRMED=true \
  HEALTHCARE_CLINIC_CALENDLY_CONFIRMED=true \
  npm run healthcare-ads:post-implementation

10/10 PASS criteria:
  · Automated: 96/96 (or all non-skipped checks pass), P0=0, exit 0
  · vertical:protect PASS
  · healthcare:post-implementation PASS
  · build PASS
  · Brand grep: for-clinics PASS · implants PASS · BLB home PASS
  · Live smoke: BLB PASS · BC PASS · cross-contam PASS
  · FOR_CLINICS_MANUAL_QA_SCORE ≥9
  · IMPLANTS_MANUAL_QA_SCORE ≥9
  · All 5 compliance flags = true

════════════════════════════════════════
MANDATORY OUTPUT FORMAT (report exactly this)
════════════════════════════════════════

## Gate
- healthcare-ads:post-implementation: PASS/FAIL (P0=N, P1=N, exit N)

## Automated (from script — do not re-derive manually)
- vertical:protect: PASS/FAIL
- healthcare:post-implementation: PASS/FAIL
- build: PASS/FAIL
- Brand grep local: for-clinics PASS/FAIL · implants PASS/FAIL · BLB home PASS/FAIL
- Qualification unit tests: PASS/FAIL
- Live smoke: BLB PASS/FAIL/NOT RUN · BC PASS/FAIL/NOT RUN · cross-contam PASS/FAIL/SKIPPED

## Manual only
- FOR_CLINICS_MANUAL_QA_SCORE: N/10 or NOT RUN
- IMPLANTS_MANUAL_QA_SCORE: N/10 or NOT RUN
- HEALTHCARE_GDC_SIGNOFF: YES/NO/NOT RUN
- HEALTHCARE_AD_LP_LOCK_CONFIRMED: YES/NO/NOT RUN
- HEALTHCARE_PATIENT_E2E_CONFIRMED: PASS/FAIL/NOT RUN
- HEALTHCARE_META_EVENTS_CONFIRMED: PASS/FAIL/NOT RUN
- HEALTHCARE_CLINIC_CALENDLY_CONFIRMED: YES/NO/NOT RUN

## Findings
P0: [list or "none"]
P1: [list or "none"]
P2: [list or "none"]

## Fixes applied
- [list every file changed this run, or "none (audit only)"]

## Verdict
- Project A (BLB): SHIP / NO-SHIP / NOT RUN
- Project B (Booked Consult): SHIP / NO-SHIP / NOT RUN
- Pilot outbound (/for-clinics): YES / NO
- Meta ads (/lp/implants): YES / NO

## Remaining before 10/10 polish
- [list every open item, or "none"]

════════════════════════════════════════
P0 TRIAGE MAP (fix these first)
════════════════════════════════════════
  BLB on /for-clinics        → vertical-config.ts bookedConsultBrandName()
  BLB on /lp/implants        → healthcareClinicPublicName()
  Inline Calendly missing    → healthcare-thank-you.tsx + NEXT_PUBLIC_CALENDLY_URL
  Live BLB leak on BC        → redeploy Project B with healthcare env
  Cross-KV leak              → separate KV_REST_API_* on Project B
  GDC sign-off missing       → written approval on file, then HEALTHCARE_GDC_SIGNOFF=true
  Ad/LP lock missing         → clinic sign-off, then HEALTHCARE_AD_LP_LOCK_CONFIRMED=true
  E2E not confirmed          → live test, then HEALTHCARE_PATIENT_E2E_CONFIRMED=true
  Meta events missing        → Test Events verified, then HEALTHCARE_META_EVENTS_CONFIRMED=true

════════════════════════════════════════
WEEK 1 META CADENCE (only after 10/10 YES)
════════════════════════════════════════
Destination: /lp/implants?utm_source=facebook&utm_medium=paid&utm_campaign=v1-test
Budget: £20–50/day (~£350 max week 1)

Pause rules:
  · 50 clicks / 0 form starts
  · 20 submits / 0 Calendly opens
  · 10 Calendly opens / 0 bookings
  · DQ rate >40%

Cadence:
  D0 — gate PASS + all sign-offs
  D1 — £20/day live
  D2 — drop-off review (form step 1 vs thank-you)
  D3 — booked consult count vs spend
  D7 — scale / fix / pause decision

DO NOT:
  · Send Meta traffic to /for-clinics (B2B only)
  · Polish /for-clinics further for ads — ad traffic goes to /lp/implants only
  · Set compliance flags without live verification
  · Share KV between BLB and BC projects
```

---

## Quick commands

| Step | Command |
|------|---------|
| Local gate | `LOCAL_POST_IMPL_URL=http://localhost:3000 npm run healthcare-ads:post-implementation` |
| After visual QA | `FOR_CLINICS_MANUAL_QA_SCORE=9 IMPLANTS_MANUAL_QA_SCORE=9 npm run healthcare-ads:post-implementation` |
| Live smoke | `BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com npm run healthcare-ads:post-implementation` |
| Full 10/10 gate | See Phase 10 in agent prompt above |
| Generate assets | `npm run healthcare:generate-assets` |
| Print prompt | `npm run healthcare-ads:prompt` |

---

## Verdict scale

| Verdict | Meaning |
|---------|---------|
| **10/10 YES** | P0=0, manual QA ≥9, all compliance flags true, Pilot outbound YES, Meta ads YES |
| **SHIP (code)** | Automated gate PASS, live not yet verified |
| **NO** | Any P0 fail or missing manual/compliance gates |

| Severity | Definition |
|----------|------------|
| **P0** | Blocks pilot outbound or Meta spend |
| **P1** | Fix before scaling (Calendly env, clinic name, Calendly capacity) |
| **P2** | Polish (Loom URL, OG assets, testimonial photo) |
