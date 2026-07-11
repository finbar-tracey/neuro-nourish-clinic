# NeuroNourish Clinic

Custom marketing site, quiz funnel, payments, and CRM workspace for [neuronourish.clinic](https://neuronourish.clinic).

## Funnel

```
Homepage → Quiz (lead capture at Q5) → Results → €90 Assessment → €3,550 Programme
                ↓ drop-off at each step → Resend email + Vonage SMS nurture (CRM tasks)
```

**Secondary paths:** Discovery call · Expression of interest · Contact

## Run locally

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Quiz: http://localhost:3000/quiz
- Workspace: http://localhost:3000/workspace/login (`dev-neuronourish-secret` in `.env.local`)

## Environment

```env
VERTICAL=neuronourish
NEXT_PUBLIC_VERTICAL=neuronourish
NEXT_PUBLIC_SITE_URL=https://neuronourish.clinic
WORKSPACE_SECRET=...
KV_REST_API_URL=...          # production CRM
RESEND_API_KEY=...             # emails
VONAGE_API_KEY=...             # SMS
NEXT_PUBLIC_CALENDLY_URL=...   # discovery calls
STRIPE_SECRET_KEY=...          # €90 assessment + €3,550 programme
STRIPE_WEBHOOK_SECRET=...
```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | 10-fold homepage (quiz primary CTA) |
| `/quiz` | Brain health quiz |
| `/quiz/results` | Score + assessment CTA |
| `/assessment` | €90 cognitive assessment checkout |
| `/programme` | €3,550 12-month programme checkout |
| `/discovery` | Calendly discovery call |
| `/contact` | Expression of interest |
| `/about` | Emer's story |
| `/clinics` | B2B partnerships |
| `/blog` | Blog index (placeholder posts) |
| `/how-the-app-works` | App explainer |
| `/workspace` | CRM |

## Go-live checklist

See **[docs/NEURONOURISH_GO_LIVE.md](docs/NEURONOURISH_GO_LIVE.md)** for the full launch checklist.

```bash
# Automated P0 gate (codebase + env)
VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run neuronourish:go-live

# With live production smoke
NN_GO_LIVE_BASE_URL=https://neuronourish.clinic npm run neuronourish:go-live

# Runtime health API
curl https://neuronourish.clinic/api/health/neuronourish
```

## SEO (Screaming Frog)

See **[docs/NEURONOURISH_SCREAMING_FROG_SEO.md](docs/NEURONOURISH_SCREAMING_FROG_SEO.md)** for the technical SEO crawl checklist.

```bash
npm run neuronourish:seo
NN_SEO_BASE_URL=https://neuronourish.clinic npm run neuronourish:seo
```

## Pending integrations

- [ ] Approved 20-question quiz (replace native quiz in `neuronourish-quiz-data.ts`)
- [ ] CNS Vital Signs API after assessment payment (`api/stripe/webhook`)
- [ ] Partner logos on homepage
- [ ] Stripe products in live mode
- [ ] Blog CMS
- [ ] Emer headshot + partner logo image assets

## Brand

See `docs/NeuroNourish_Brand_Guidelines.pdf`
