# Win-back 10/10 implementation checklist

- [x] Auto-pause when Daniel marks contacted or call connected
- [x] Auto-pause when same email submits a new form
- [x] SMS on day 3 and day 30 (standard sequence)
- [x] Long sequence for "Funding no longer needed" (30/90 day emails)
- [x] Purpose-aware email copy (loan purpose in templates)
- [x] Re-engagement metrics (enrolled, active, re-opened, completed)
- [x] Sequence preview on mark-lost / enroll panel
- [x] Enrollment guard (active pipeline case on same email)
- [x] 3-day frequency cap between win-back sends
- [x] Weekly win-back digest to Daniel (Monday 08:00 London)
- [x] Audits updated (`workflow:winback:full`)

Verify: `npm run crm:post-implementation && npm run workflow:winback:e2e`
