# NeuroNourish Funnel Integration: Local Staging Walkthrough Protocol

This playbook outlines the exact codebase-verified procedure for executing an end-to-end integration and smoke test of the NeuroNourish consumer funnel, CRM state queues, and automation engine layers.

---

## ── Pre-Flight Sandbox Environment Setup ──

1. Establish your baseline environment flags in the terminal session:

   ```bash
   export VERTICAL=neuronourish
   export NEXT_PUBLIC_VERTICAL=neuronourish
   export WORKSPACE_SECRET="test-signing-key-32-characters-min"
   export NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

2. Initialize the local development server:

   ```bash
   npm run dev
   ```

3. Configure three browser windows:

   | Window | Purpose | Notes |
   |--------|---------|-------|
   | **A — Patient** | Incognito, cookies cleared | Consumer funnel |
   | **B — CRM** | `http://localhost:3000/workspace/login` | Password = your `WORKSPACE_SECRET` value |
   | **C — Logs** | Terminal running `npm run dev` | Automation diagnostics |

**Optional (Phase 3):** `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, and Stripe CLI for live webhook forwarding.

---

## ── Phase 1: Quiz Execution & Staggered Nurture Validation ──

### Action steps

1. In **Window A**, open `http://localhost:3000/quiz`.
2. Complete Questions 1–4.
3. On the **soft gate after Question 6**, enter:
   - **First name:** Staging Participant
   - **Email:** `test.onboarding.${Date.now()}@yourdomain.com` (use an inbox you control for Resend verification)
   - **Consent:** checked
   - No phone on this step
4. Submit the capture form, then **pause ~10 seconds** without answering remaining questions.
5. Complete the quiz. You should land on:

   ```
   /quiz/results?leadId=LEAD_ID&score=SCORE
   ```

### Verification — `quiz_partial`

In **Window B**:

- **Queue:** **New enquiries** → `/workspace/inbox`
- **Stage:** `quiz_partial`
- **Tasks tab:** Three pending `NN nurture [quiz_abandon]` tasks (delays: **1h, 24h, 72h**)

> There is no dedicated console log for abandon enrollment. Confirm via CRM stage + tasks.

### Verification — `quiz_completed`

After finishing the quiz, refresh **Window B**:

- **Stage:** `quiz_completed`
- **Tasks tab:** Interleaved sequences registered (prior abandon tasks remain but are skipped once stage advances):

  | Sequence | Task prefix | Delays |
  |----------|-------------|--------|
  | Quiz complete | `NN nurture [quiz_complete]` | 2 min, 48h, 96h, 144h |
  | Blood sugar newsletter | `NN nurture [blood_sugar_newsletter]` | 24h, 72h, 120h |
  | Gut-brain newsletter | `NN nurture [gut_brain_newsletter]` | 48h, 96h, 144h |

In **Window C**, expect:

```
[AUTOMATION ENROLLMENT] Initializing blood sugar and gut-brain educational series for: LEAD_ID
```

---

## ── Phase 2: Attributed Results CTAs & Calendly Webhook ──

### Action steps

On the **results page** (**Window A**), confirm CTA hrefs retain attribution:

| UI label (from `NN_QUIZ_RESULTS`) | Expected href |
|-----------------------------------|---------------|
| Start My Assessment / €90 assessment step | `/assessment?leadId=…&score=…` |
| Book Your Discovery Call | `/discovery?leadId=…` |
| Explore the 12-month programme | `/programme?leadId=…` |

Simulate a Calendly booking in a **second terminal** (unsigned webhooks work locally when `CALENDLY_WEBHOOK_SIGNING_KEY` is **unset**):

```bash
curl -X POST http://localhost:3000/api/webhooks/calendly \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invitee.created",
    "payload": {
      "email": "YOUR_EXACT_TEST_EMAIL_FROM_PHASE_1@domain.com",
      "name": "Staging Participant",
      "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

### Verification — discovery conversion

Refresh **Window B**:

- **Queue:** **Follow-up** → `/workspace/callbacks`
- **Stage:** `discovery_requested`
- **Status:** `BOOKED`
- **Pipeline value:** **€3,550**

**Task suppression:** Educational tracks (`blood_sugar_newsletter`, `gut_brain_newsletter`) are cancelled on webhook receipt. All other pending `NN nurture` tasks are suppressed on the next cron pass because `shouldSkipNurture()` treats `BOOKED` leads as ineligible (tasks marked completed without send).

---

## ── Phase 3: Stripe CLI & CNS Token Provisioning ──

> **Do not** POST raw JSON to `/api/stripe/webhook` — the route requires a valid `stripe-signature` header.

### Action steps

1. In a separate terminal, start Stripe forwarding:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Copy the webhook signing secret into `.env.local`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Restart `npm run dev` if needed so the secret loads.

4. In **Window A**, open `/assessment?leadId=YOUR_LEAD_ID`, click checkout, and pay with test card **`4242 4242 4242 4242`**.

### Verification — payment sync

**Stripe session metadata** (set by `/api/checkout`):

```json
{ "product": "assessment", "leadId": "YOUR_ACTIVE_LEAD_ID" }
```

Refresh **Window B**:

- **Queue:** **Assessment** → `/workspace/applications`
- **Stage:** `assessment_purchased`
- **Revenue:** **€90.00**
- **Credit expiry:** ~30 days from purchase

In **Window C**:

```
[AUTOMATION] Dispatching CNS credential creation for lead: LEAD_ID
[AUTOMATION COMPLETE] Assessment token delivery loop executed.
```

Check Resend logs or your test inbox for the **Scientific Cognitive Baseline Assessment Instructions** email with the CNS launcher URL.

---

## ── Phase 4: Onboarding & Automatic Session Login ──

### Action steps

Open `http://localhost:3000/onboarding?leadId=YOUR_ACTIVE_LEAD_ID` in **Window A**.

| Screen | Action |
|--------|--------|
| **1 — Account setup** | Short password (`123`) → submit disabled. Valid 8+ char password → **Activate My Portal** |
| **2 — Personalisation** | Select **Clear Afternoon Brain Fog & Improve Focus** (`brain_fog`) → **Save and Continue** |
| **3 — Ecosystem sync** | Toggle sleep / movement / messaging → **Enter My Daily Dashboard** |

### Verification — seamless portal access

- Redirect lands on **`/dashboard`** with **no `?leadId=`** in the URL bar
- HttpOnly cookie **`neuronourish_session`** is set (inspect in DevTools → Application → Cookies)
- No manual re-login required

In **Window B** (case detail → credential panel):

```
Credentials: Provisioned (Encrypted PBKDF2_SHA512)
```

**Post-onboarding nurture tasks** registered:

| Sequence | Delays |
|----------|--------|
| `onboarding_welcome` | 5 min, 48h, 5 days |
| `programme_nurture` | Day 7 intro · 7 days before credit expiry · 48h before credit expiry |

Terminal enrollment lines:

```
[AUTOMATION ENROLLMENT] Initializing 12-month upgrade and credit expiry tracking for: LEAD_ID
[AUTOMATION ENROLLMENT] Initializing post-onboarding welcome sequence for: LEAD_ID
```

---

## ── Phase 5: Security Perimeter Interception ──

### Action steps

1. Copy `http://localhost:3000/dashboard` from **Window A**.
2. Open a **fresh incognito window** with no shared cookies.
3. Paste the URL and navigate.

### Verification — data isolation

| Test | Expected result |
|------|-----------------|
| Incognito `/dashboard` | Redirect → `/login?error=session_expired` |
| **Sign out** in Window A | POST `/api/onboarding/logout` → cookie cleared → `/login` |
| Revisit `/dashboard` after logout | Blocked → login redirect |

---

## ── Pre-Launch Quality Assurance Commands ──

Run before staging deployments or live traffic:

```bash
# Programmatic funnel smoke test (CRM + CNS path, no HTTP)
npm run neuronourish:smoke-test

# 39-check brand compliance gate + production build
npm run vercel-build
```

Both must pass before August launch traffic.

---

## Production environment checklist

| Variable | Purpose |
|----------|---------|
| `WORKSPACE_SECRET` | CRM login **and** patient JWT signing (use a strong production secret) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Live checkout |
| `RESEND_API_KEY` | Transactional email |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Signed Calendly webhooks |
| `CNS_VITAL_SIGNS_API_KEY` | Live assessment token registration |
| Meta Pixel + CAPI tokens | Paid social attribution |

Run `npm run neuronourish:go-live` against production env bindings before flipping DNS.

---

## Related files

| Area | Path |
|------|------|
| Session auth | `src/lib/neuronourish-auth-session.ts` |
| Patient login | `src/app/api/onboarding/login/route.ts` |
| Protected dashboard | `src/app/dashboard/page.tsx` |
| Nurture processor | `src/lib/process-neuronourish-nurture.ts` |
| Smoke test | `scripts/neuronourish-smoke-test.ts` |
| Go-live audit | `scripts/neuronourish-go-live-audit.ts` |
