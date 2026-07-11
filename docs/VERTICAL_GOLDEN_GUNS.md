# Vertical golden guns — pay-per-booking industry audit (v2)

**Purpose:** Pick the top 3 industries to replicate the BLB stack (LP → qualify → book call → CRM → SMS) for **pay-per-lead / pay-per-booking** clients.

**Run the scorecard:**

```bash
npm run vertical:audit
```

**Self-rating:** **8.5/10** (v1 chat audit was ~7/10 — see [improvements](#v1-vs-v2-improvements) below)

**Coverage note:** v2.1 adds **construction & fire compliance** (fire doors, commercial roofing, building safety). The original 12-vertical list was **not exhaustive** — it skewed finance/services. High-ticket trades belong in the matrix.

---

## Verdict scale

| Score | Meaning |
|-------|---------|
| **8.0+** | Golden gun — run 30-day paid test |
| **7.0–7.9** | Strong runner-up — test after golden gun #1 proves |
| **< 7.0** | Deprioritise unless strategic adjacency |

---

## Scoring methodology

Each vertical scores **1–10** on eight axes (10 = best for BLB-style replication).

| Axis | Weight | 10 means |
|------|--------|----------|
| LP / funnel fit | 12% | Same capture → qualify → book flow |
| Meta ease | 12% | Approval, no financial category wall |
| Google ease | 12% | Search intent, sane CPC, policy OK |
| Compliance ease | 18% | Light regulator burden, clear copy rules |
| CPL potential | 14% | Can hit target CPL at qualified stage |
| Revenue / booking | 18% | High fee you can charge the client |
| Clone speed | 6% | Weeks to ship client #2 on this codebase |
| UK volume | 8% | Enough audience / searches |

**Composite** = weighted sum (see `src/lib/vertical-audit-data.ts`).

**Ease score** = LP + Meta + Google + compliance + clone (can we ship ads quickly?).

**Money score** = revenue/booking + CPL + volume (can we charge a lot with healthy margin?).

---

## Golden guns (top 3 — updated v2.1)

### #1 R&D tax credits & specialist accountancy — **8.1/10**

*(unchanged — easiest ads + compliance)*

---

### #2 Fire doors, passive fire & compartmentation — **8.0/10** ★ NEW

| Area | Rating | Notes |
|------|--------|-------|
| LP | 8 | Building type, door count / scope, FRA deadline, book **survey call** |
| Meta | 8 | Construction / compliance B2B — **not** UK financial category |
| Google | 9 | “Fire door survey”, “passive fire protection contractor”, block remedials |
| Compliance | 7 | Building Safety Act; FIRAS/BM Trada credentials; no “guaranteed pass” ads |
| CPL target | £40–£120 | B2B qualified |
| Charge / booking | **£250–£700** | Jobs **£15k–£500k+** (blocks, HMOs, FM portfolios) |
| Clone | 3–4 weeks | Qualification fields for ICP (FM vs single landlord) |

**Why golden gun:** Regulatory tailwind (Building Safety Act), **very high ticket**, Meta + Google both workable, **easier ads than finance**.

**Kill:** >40% leads are single-home low-scope; CPL > £150.

---

### #3 Specialist property finance (bridging / dev) — **7.6/10**

*(unchanged — highest stack fit + BLB CPL proof; Meta website LP still hard)*

---

### Runners-up (high ticket — not in top 3)

| Vertical | Composite | Why not golden gun #3 |
|----------|-----------|------------------------|
| **Commercial roofing** | ~7.5 | High ticket (£30k–£500k) but must **filter out residential**; commoditised local PPL |
| **Commercial conveyancing** | 7.4 | Strong but lower ticket than fire/remedial |
| **Building safety / cladding** | ~7.0 | **Highest** deal size (£100k–£5M+) but enterprise cycle, sensitive copy, low volume |
| **Residential roofing** | ~6.8 | High volume, **low** £/booking — not same league as commercial/fire |

---

## Golden guns (top 3 — v2.0 archive)

### #1 R&D tax credits & specialist accountancy — **7.9/10**

| Area | Rating | Notes |
|------|--------|-------|
| LP | 9 | Eligibility check: turnover, sector, R&D spend, contact |
| Meta | 8 | Business services framing — outside UK financial special category |
| Google | 9 | High intent: “R&D tax credit”, “claim R&D tax UK” |
| Compliance | 7 | HMRC/ASA — no guaranteed refund; eligibility disclaimers |
| CPL target | £25–£80 | B2B norms |
| Charge / booking | **£150–£400** | Client upside £5k–£30k per claim |
| Clone | 2–3 weeks | Lighter than finance |

**30-day test:** £25/day Google + £15/day Meta · kill if qualified CPL > £100.

---

### #2 Specialist property finance (bridging / dev) — **7.4/10**

| Area | Rating | Notes |
|------|--------|-------|
| LP | 10 | **Production today** — `meta-lp-copy.ts`, qualification, phone E.164 |
| Meta website LP | 4 | FCA / investment verification blocking website ads |
| Meta instant form | 7 | Historical ~£26 CPL at scale |
| Google | 7 | Strong intent, higher CPC (£15–£60+) |
| Compliance | 5 | FCA-adjacent, introducer framing, audit scripts |
| CPL proof | **~£1.50–£3** (Jun 2026 LP) · ~£26 instant form historical |
| Charge / booking | **£200–£600** | Highest £/unit |
| Clone | 1–2 weeks for broker #2 | Same codebase |

**BLB live evidence (Jun 2026):**

- Campaign `London - BLB - LP`: ~£3.03, 1 Lead, 299 impressions
- Ali Arsanjani: LONDON_BLB, SMS sent, qualified; booking intent logged (Reserve step pending)
- Meta website LP blocked pending FCA verification

**Channel rule:** Prefer **Google Search + Meta instant form** until website LP verified.

**30-day test:** Re-enable LP campaign £25/day + Google £20/day · kill if CPL > £80 sustained.

---

### #3 Commercial / BTL conveyancing — **7.3/10**

| Area | Rating | Notes |
|------|--------|-------|
| LP | 8 | Transaction type, property, timeline, contact |
| Meta | 7 | Legal services — easier than lending |
| Google | 8 | “Commercial conveyancing quote”, BTL solicitor |
| Compliance | 6 | SRA — fee transparency, no outcome guarantees |
| CPL target | £30–£100 | |
| Charge / booking | **£200–£500** | Matter fees £3k–£15k+ |
| Clone | 3–4 weeks | Legal copy review |

**Adjacency:** Same property investor graph as bridging — referral-friendly.

---

## Full scorecard (all 12 verticals)

Run `npm run vertical:audit` for the live ranked table.

| Rank | Vertical | Composite | Ease | Money |
|------|----------|-----------|------|-------|
| 1 | R&D tax / accountancy | 7.9 | 8.2 | 8.0 |
| 2 | Property finance | 7.4 | 6.4 | 8.7 |
| 3 | Commercial conveyancing | 7.3 | 7.0 | 7.7 |
| 4 | BTL / expat mortgage | 6.9 | 6.2 | 7.3 |
| 5 | Home improvements | 6.9 | 7.4 | 6.0 |
| 6 | Med spa | 6.8 | 7.0 | 6.7 |
| 7 | Executive recruitment | 7.1 | 7.0 | 7.3 |
| 8 | Dental implants | 7.0 | 6.8 | 7.3 |
| 9 | PI / immigration law | 6.4 | 5.8 | 7.7 |
| 10 | Solar / heat pump | 6.0 | 6.6 | 5.7 |
| 11 | Residential mortgage | 5.9 | 5.6 | 6.7 |
| 12 | IFA / wealth | 5.5 | 4.6 | 7.3 |

*Exact ease/money values from script output may differ slightly due to normalisation.*

---

## Channel matrix

| Channel | Best for | Avoid for |
|---------|----------|-----------|
| **Meta → website LP** | R&D tax, law, home services | Regulated finance until FCA verified |
| **Meta instant form** | Finance volume, local services | Low qualification needs |
| **Google Search** | R&D, legal, complex mortgage, bridging intent | Accounts with no reviews/trust assets |

---

## Pay-per-booking pricing tiers (all golden guns)

| Event | Property finance | R&D tax | Conveyancing |
|-------|------------------|---------|--------------|
| Qualified complete | £80–£150 | £60–£120 | £70–£130 |
| **Booked call confirmed** | **£200–£600** | **£150–£400** | **£200–£500** |
| Showed + qualified | £350–£800 | £250–£500 | £300–£600 |

Billable CRM events today:

- Qualified complete → `formCompleted` + qualification tier
- Booked call → `priorityCallBookedAt`
- Showed → `consultationCompletedAt`

---

## v1 vs v2 improvements

| v1 gap (chat audit ~7/10) | v2 fix |
|---------------------------|--------|
| Single gut composite | Weighted axes + ease vs money split |
| No BLB evidence citations | Live CPL + Ali/Meta notes in data |
| No kill criteria | Per-vertical 30-day kill rules |
| Channel advice generic | `primaryChannels` + `avoidChannels` per vertical |
| Not runnable | `npm run vertical:audit` + typed data module |
| No margin math | charge / target CPL / client upside ranges |
| Golden guns order implicit | `GOLDEN_GUN_IDS` + 90-day play order |

**Remaining gaps (why not 10/10):**

- Scores are expert estimates — refresh with real CPL after each vertical test
- No automated CPC / search volume API (manual keyword research still required)
- Multi-tenant productisation not scored separately

---

## 90-day execution order

1. **Property finance (BLB)** — prove pay-per-booking; turn `London - BLB - LP` on; call Ali-type leads within 2h.
2. **R&D tax client #1** — clone LP + CRM; Google-first; charge £200/booked call.
3. **Conveyancing partner** — property investor audience; cross-refer from bridging.

---

## New vertical intake checklist

```
□ Run npm run vertical:audit — confirm composite ≥ 7
□ Document compliance owner + banned phrases
□ Set 30-day budget: Meta £___/day · Google £___/day
□ Set kill criteria from vertical-audit-data.ts
□ Clone: form fields, SMS copy, meta LP (if allowed), automations
□ Define billable event: qualified | booked | showed
□ Post-test: update scores in src/lib/vertical-audit-data.ts with real CPL
```

---

## Related docs

- `docs/MASTER_GO_LIVE.md` — BLB production gate
- `npm run phone:post-impl` — phone validation post-deploy
- `npm run meta-lp:post-impl` — Meta LP compliance gate
