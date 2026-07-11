# NeuroNourish — Quiz Capture Post-Implementation (10/10 Conversion Gate)

**Covers:** Mid-quiz soft capture (name + email after Q6), immediate results reveal, optional mobile on “Email my report”, CRM wiring (nurture, partner alerts, next actions).

**Local:** http://localhost:3000/quiz  
**Production:** https://neuronourish.clinic/quiz

**Automated gate:**

```bash
npm run quiz:post-implementation
```

**Print agent prompt:**

```bash
npm run quiz:prompt
```

**Live production:**

```bash
QUIZ_POST_IMPL_URL=https://neuronourish.clinic npm run quiz:post-implementation
```

**After manual conversion E2E on production:**

```bash
QUIZ_POST_IMPL_URL=https://neuronourish.clinic \
QUIZ_SOFT_GATE_CONFIRMED=true \
QUIZ_RESULTS_REVEAL_CONFIRMED=true \
QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED=true \
QUIZ_CRM_WIRING_CONFIRMED=true \
npm run quiz:post-implementation
```

---

## What shipped

| Step | What happens |
|------|----------------|
| Q1–6 | Uninterrupted tap-to-advance (ends at cognition — peak curiosity) |
| After Q6 | Soft gate: first name + email + consent only (quiz chrome + progress + Back) |
| Q7–18 | Continue tap-to-advance |
| Results | Score + archetype shown immediately (no hostage form) |
| After reveal | One-click “Email my report” → then optional mobile upsell |

**Why this converts**

- Low friction while commitment is still forming
- Abandon nurture still works after Q6 soft capture
- Score isn’t locked behind a form
- Phone captured when they’re most motivated (ops can call)

---

## CRM / ops wiring

| Event | CRM behaviour |
|-------|----------------|
| Soft capture (`quiz_partial`) | Lead upserted · abandon nurture enrolled · **no partner alert** (nurture covers abandon) · next action: follow up if abandoned |
| Quiz complete (`quiz_completed`) | Score + archetype appended to notes · abandon nurture cancelled · complete nurture + newsletters · partner alert |
| Report — email only | Report emailed · soft partner note · `phoneCaptured: false` |
| Report — with mobile (post-upsell) | Phone saved · next action **Call client — quiz report requested** · callback SLA · **hot** partner SMS |

---

## Agent prompt (copy-paste)

```
NEURONOURISH — QUIZ CAPTURE POST-IMPLEMENTATION AUDIT (10/10 GATE)

You are auditing NeuroNourish Clinic after the quiz conversion capture
deploy. Your job is to verify the funnel and CRM wiring on the live site —
not to re-implement features.

Local URL:       http://localhost:3000/quiz
Production URL:  https://neuronourish.clinic/quiz
Workspace login: /workspace/login (WORKSPACE_SECRET)

THE MODEL (must match production exactly)
────────────────────────────────────────
  Q1–6 → soft gate (name + email + consent) → Q7–18 → results reveal
       → one-click “Email my report” → optional mobile upsell

WHAT SHIPPED
────────────────────────────────────────
1. Soft gate after Q6 — no phone, no last name mid-quiz
2. Soft gate stays in quiz chrome with progress (“6 of 18 answered”) + Back
3. Results show score + archetype immediately
4. Report CTA: one-click “Email my report” (no fields)
5. After email success: optional mobile upsell + call consent
6. Soft capture: abandon nurture only — no partner alert mid-quiz
7. Complete: score + archetype appended in additionalInfo; abandon cancelled
8. Report + phone: nextAction “Call client — quiz report requested” + hot SMS

CRITICAL RULES
- Do NOT sign off from code review alone — walk the quiz on production.
- Soft capture must NOT fire partner SMS without a callable number.
- Report must succeed with email only (phone optional).
- Fix P0 failures before marking GO LIVE.

MANUAL E2E CHECKLIST
────────────────────────────────────────
[ ] Complete Q1–6 → soft gate appears (name + email + consent only)
[ ] Soft capture → continue Q7–18 without friction
[ ] Finish quiz → score + archetype visible without another form
[ ] “Email my report” one-click (no phone field on first step)
[ ] After success → mobile upsell appears; skip works
[ ] Soft-capture lead appears in workspace New enquiries
[ ] Soft capture does NOT alert Emer (nurture only)
[ ] Abandon after soft capture → nurture tasks scheduled
[ ] Complete quiz → abandon nurture cancelled
[ ] Add mobile after report → CRM next action is call / report requested

SIGN-OFF
────────────────────────────────────────
Set QUIZ_*_CONFIRMED=true env flags after manual checks, then re-run:
  npm run quiz:post-implementation

Exit 0 = automated gate pass. Manual flags required for full 10/10.
```

---

## Automated checks (script)

| Phase | Checks |
|-------|--------|
| Static | Capture after Q6 · soft gate copy · optional phone report CTA · lead-submit soft SMS off · hot nextAction · archetype on complete |
| API | Soft capture → complete (with archetype) → report email-only → report with phone |
| Live (optional) | `GET /quiz` 200 when `QUIZ_POST_IMPL_URL` set |
| Manual flags | Soft gate / results / optional phone / CRM wiring confirmed |

---

## Manual QA checklist

- [ ] `npm run quiz:post-implementation` passes (automated static + API gate)
- [ ] Soft gate after Q6 — name + email + consent only
- [ ] Results reveal without a blocking form
- [ ] Email report works without phone
- [ ] Phone + consent updates CRM next action to call
- [ ] Soft capture does not SMS Emer with a blank number
- [ ] Workspace shows lead with score/archetype after complete

---

## Related

| Doc / command | Purpose |
|---------------|---------|
| `docs/NEURONOURISH_GO_LIVE.md` | Full August go-live |
| `npm run neuronourish:go-live` | Broader NN gate |
| `npm run neuronourish:smoke-test` | Funnel smoke (assessment path) |
| `npm run quiz:post-implementation` | This gate |
| `npm run quiz:prompt` | Print agent prompt |
