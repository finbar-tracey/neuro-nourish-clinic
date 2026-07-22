# NeuroNourish — CRO Checklist

Conversion Rate Optimisation for the public NeuroNourish funnel (quiz → assessment → programme / discovery).

**Principles (product constraints — do not regress):**

- Email capture at **end of quiz** (not mid-quiz)
- No fear / dementia scare hero copy
- Public € prices stay hidden until checkout / discovery
- Blog index redirects home (no nav blog; no “view all articles” dead-end)

**Host:** https://neuro-nourish-clinic.vercel.app → https://neuronourish.clinic

**Automated gate:**

```bash
npm run neuronourish:cro
```

---

## 1. Funnel continuity (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Primary ladder | Quiz → Cognitive assessment → Programme; Discovery soft alternate | |
| 2 | End-of-quiz capture | `NN_QUIZ_CAPTURE_AFTER = NN_QUIZ_QUESTIONS.length` | |
| 3 | Capture field count | ≤ 3 controls (name, email, consent) | |
| 4 | `leadId` passthrough | Results → shop / programme / discovery | |
| 5 | Shop cards preserve `leadId` | Query on PDP links | |
| 6 | Quiz hydrates `?leadId=` | Resume continuity | |
| 7 | Funnel stepper on results | Quiz → Assessment → Programme | |
| 8 | No dead-end CTAs | Blog CTA must not send users to redirect-only `/blog` | |

---

## 2. CTA hierarchy (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Hero | One gold primary (quiz); discovery = text link | |
| 2 | Closing | One gold primary (quiz); discovery = text link | |
| 3 | Quiz fold | One gold primary (quiz) | |
| 4 | Results next steps | One gold primary (assessment); programme + discovery = text | |
| 5 | Header | Quiz + discovery present; quiz is primary gold | |
| 6 | Sticky mobile CTA (home) | Quiz after scroll; hides near closing CTA | |

---

## 3. Friction & forms (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Quiz progress | “Question X of N” + capture “18 of 18” | |
| 2 | Capture microcopy | Reassurance (“Takes 10 seconds” / answered every question) | |
| 3 | Discovery soft escape | Present on capture gate (talk instead) | |
| 4 | Checkout without Stripe | Graceful path to discovery (not blank fail) | |

---

## 4. Trust near conversion (P0)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Hero trust bar | Credentials under primary CTA | |
| 2 | Results trust bar | `FunnelTrustBar` near next steps | |
| 3 | Closing trust chips | Present above / beside CTA | |
| 4 | No prohibited fear terms in hero | Brand gate | |

---

## 5. Value clarity (P1 — measure)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Assessment credit hint | “Credited toward enrolment…” near assessment CTA | |
| 2 | Price policy | Hidden public € is intentional; FAQ/shop explain | |
| 3 | Shop entry path | Unsure users offered quiz and/or discovery | |
| 4 | Report email upsell | Optional phone after report — not blocking | |
| 5 | Quiz abandon recovery | Idle ≥100s after ≥3 answers → soft discovery sheet (session + 7-day cap) | |

---

## 6. Measurement (P1 — ops)

| # | Check | Expected | ☐ |
|---|--------|----------|---|
| 1 | Funnel stages on Lead | `quiz_started` → `quiz_completed` → purchase / discovery | |
| 2 | Stripe / Resend / Calendly on Vercel | Required for paid conversion E2E | |
| 3 | Analytics events | Quiz start/complete, checkout start (when wired) | |
| 4 | Abandon events | `nn:quiz-abandon` custom events + Meta ViewContent/Lead | |

---

## 7. Implementation status

| Item | Status |
|------|--------|
| CRO checklist + `neuronourish:cro` gate | Done |
| Home sticky mobile quiz CTA | Done |
| Results single gold primary (assessment) | Done |
| Shop unsure path includes quiz | Done |
| Blog section CTA retargeted off `/blog` | Done |
| End capture / leadId / trust bar (prior) | Done |
| Quiz abandon idle sheet + discovery banner | Done |
| Kill switch `NEXT_PUBLIC_NN_QUIZ_ABANDON=false` | Done |

---

## 8. Sign-off

```
NEURONOURISH — CRO SIGN-OFF
Date:     ____________________
Tester:   ____________________

AUTOMATED
[ ] npm run neuronourish:cro — PASS
[ ] npm run neuronourish:webdev — PASS
[ ] npm run neuronourish:brand — PASS

MANUAL
[ ] Home mobile: sticky quiz appears after scroll, hides at closing
[ ] Quiz end → results → assessment CTA is obvious primary
[ ] Shop: unsure users see quiz + discovery
[ ] No fear language in hero; prices still not public € on cards

VERDICT: PASS / PASS WITH FIXES / FAIL
CRO score: ___/10
```

---

## Related

- [NEURONOURISH_WEB_DEVELOPMENT.md](./NEURONOURISH_WEB_DEVELOPMENT.md) — funnel engineering
- [NEURONOURISH_GO_LIVE.md](./NEURONOURISH_GO_LIVE.md) — ops / Stripe / CNS
- [NEURONOURISH_SCREAMING_FROG_SEO.md](./NEURONOURISH_SCREAMING_FROG_SEO.md)
