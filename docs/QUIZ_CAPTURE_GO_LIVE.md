# NeuroNourish — Quiz Capture Go-Live Gate

**Purpose:** Block staging/production deploy until quiz conversion + CRM wiring + brand gates pass.  
**Emer review:** Deploy **staging preview first**, then production only on automated P0 pass + Emer sign-off.

**Team:** [freewebguys-projects](https://vercel.com/freewebguys-projects)  
**Vercel project:** `neuro-nourish-clinic` (dedicated — do **not** deploy to `bridging-loans-broker`)  
**Staging / current production URL:** https://neuro-nourish-clinic.vercel.app  
**Quiz for Emer:** https://neuro-nourish-clinic.vercel.app/quiz  
**Workspace:** https://neuro-nourish-clinic.vercel.app/workspace/login (password = `WORKSPACE_SECRET`)  
**Future DNS:** https://neuronourish.clinic *(still WordPress — cut over only after Emer approves)*

---

## Commands

**Pre-deploy gate (required):**

```bash
VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run quiz:go-live
```

**Staging deploy (Emer review):**

```bash
VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run quiz:go-live
npm run deploy:nn-staging
```

**Production deploy (only after Emer approves + gate pass):**

```bash
VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish \
  NN_GO_LIVE_BASE_URL=<staging-url> \
  QUIZ_SOFT_GATE_CONFIRMED=true \
  QUIZ_RESULTS_REVEAL_CONFIRMED=true \
  QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED=true \
  QUIZ_CRM_WIRING_CONFIRMED=true \
  EMER_STAGING_APPROVED=true \
  npm run quiz:go-live

npm run deploy:nn-prod
```

**Print agent prompt:**

```bash
npm run quiz:go-live:prompt
```

---

## What the gate checks

| Layer | Source |
|-------|--------|
| Quiz capture conversion + CRM API | `npm run quiz:post-implementation` |
| NeuroNourish funnel / nurture / SEO / health | `npm run neuronourish:go-live` |
| Brand 39/39 | `npm run neuronourish:brand` |
| Soft gate after Q6, one-click report, phone upsell | Static needles in this audit |
| Live smoke (optional) | `NN_GO_LIVE_BASE_URL` → `/quiz`, health, soft-capture API |

---

## Flow under test (must match staging)

1. Q1–6 uninterrupted  
2. Soft gate: first name + email + consent (Back works)  
3. Q7–18 tap-to-advance  
4. Results: score + archetype immediate  
5. One-click **Email my report** → optional mobile upsell  
6. CRM: soft = nurture only; complete = score/archetype; phone = hot call nextAction  

---

## Emer staging checklist

- [ ] Open staging `/quiz` on mobile + desktop  
- [ ] Soft gate after Q6 feels light (no phone)  
- [ ] Results show without a form wall  
- [ ] Email report works; phone upsell is optional  
- [ ] Workspace shows lead after soft capture (`/workspace/login`)  
- [ ] Approve staging → set `EMER_STAGING_APPROVED=true` for prod gate  

---

## Agent prompt (copy-paste)

```
NEURONOURISH — QUIZ CAPTURE GO-LIVE AUDIT

You are gating NeuroNourish Clinic quiz capture for Emer staging review,
then production. Do not deploy to bridging-loans-broker.

Team:     https://vercel.com/freewebguys-projects
Project:  neuro-nourish-clinic
Staging:  Vercel preview URL from deploy:nn-staging
Prod:     neuro-nourish-clinic production (vercel.app until DNS cutover)

PRE-DEPLOY
────────────────────────────────────────
1. VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run quiz:go-live
2. Fix any P0 failures before deploy
3. npm run deploy:nn-staging → send URL to Emer
4. After Emer approval + manual QUIZ_* flags, npm run deploy:nn-prod

CRITICAL
- Never deploy this vertical to bridging-loans-broker production
- Soft capture must not partner-SMS without a phone
- Report must be one-click email; phone is post-success upsell only
- neuronourish.clinic is still WordPress until DNS cutover is planned

SIGN-OFF
────────────────────────────────────────
Automated P0 pass + Emer staging approval required for production.
```

---

## Related

| Doc / command | Purpose |
|---------------|---------|
| `docs/QUIZ_CAPTURE_POST_IMPLEMENTATION.md` | Conversion post-impl |
| `docs/NEURONOURISH_GO_LIVE.md` | Full August go-live |
| `docs/NEURONOURISH_STAGING_WALKTHROUGH.md` | Local funnel walkthrough |
| `npm run quiz:go-live` | This gate |
| `npm run deploy:nn-staging` | Preview for Emer |
| `npm run deploy:nn-prod` | Production on NN project |
