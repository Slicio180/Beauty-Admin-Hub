# Seeded Pool Planner — Identity TEST candidate, 28 October 2026

Owner baseline: recovery/2026-10-28 at **86c068e**. This candidate has not been
installed on the owner's Mac or uploaded to Google. Production AIK and JDC are
outside scope. No Nakka mutations were executed while preparing this package.

## Implemented

- Original 5–101 workbook/reference and 3/4 preferences, boards and five-player
  exception retained. Separate manual count is arithmetic planning only.
- Authenticated shared league statistics service: paginated LPID profiles,
  overall weighted three-dart average = 3 × score / darts. Full precision for
  drawing, two decimal display; ranking points separately validated against
  aggregate points. Rank/tie semantics are not invented; Live rank columns remain
  a later task. Nonzero manual-average fields need qualification and stay Unseeded.
- Five-minute data freshness, 60-second refresh limit, manual and visible-panel
  automatic refresh. Chunked durable last-good data survives outages; failed or
  expired data blocks new draws and sending. Credentials remain server-side.
- Name matches propose LPID/event TPID mappings. Organiser must review IDs.
  Duplicate/missing identities are visible, no implicit new player/entry creation.
  Missing identity/average can be planned as Unseeded, but every included IN
  player must have a reviewed LPID and existing TPID before sending. The API's
  unexposed saved league link remains explicitly unverified.
- Server-owned, five-minute, session-bound frozen draw: IN only, exact membership,
  capacities, recorded tie seed, protected first seeds, snake and bounded mean
  balancing. Missing averages evenly spread (counts differ by at most one) and
  excluded from known means. No fake zeros. Manual swaps preserve capacities and
  frozen values, invalidate approval, and warn about seed/unseeded imbalance.
- Optional adjustable seeding bands, pool averages and known/unseeded coverage.
  Original AIK fonts, AIK Siffror averages/counts, shared black/yellow controls.
- IN arrival, withdrawal, rename, date change, source outage/expiry and changed
  Nakka snapshot invalidate approval. No silent redraw.
- Fixed **t_RqC2_2034 / Beauty Hub TEST — DO NOT USE LIVE / 2026-10-27** only,
  status 10/20, single round-robin `lg` format. Existing populated groups,
  brackets/results or fixtures block sending. No overwrite, start, entry mutation,
  league profile mutation, or date movement.
- Preview → optional swaps → handoff review → explicit one-use approval.
  All original settings preserved except division count and maximum pool size;
  groups use rectangular lg_table with empty padding. Durable typed JSON audit
  sheet and ATTEMPTED journal precede the first POST. Tournament CAS protects the
  group update, then native round-robin match cards are generated. Full event
  comparison retains all entries and unrelated fields, then every required pair
  and unique card ID is checked. Verified readback is separately audited.
- Two provider operations are not atomic. A timeout, concurrent change, partial
  save or unexpected readback leaves ATTEMPTED and blocks repeat sends. No blind
  rollback or automatic retry. Even VERIFIED blocks duplicate sending in this
  fixed TEST event. Manual inspection/reconciliation is required for another draw.

## Qualified sources and validation

The owner's read-only snapshot from 2026-10-28T21:55:14.636Z contained 97 league
profiles, 92 aggregate-stat rows, 97 ranking keys (one blank key ignored), and
57 TEST event entries. All 92 aggregate point totals matched event-point sums.
The event is `lg_setting.league=1`, not `rr`; its configured 501, `limit_leg_count=2`
settings and all other fields are copied and checked. Snapshot data was
used only for schema qualification; the runtime always fetches current data.

API primary source: https://push.n01darts.com/api/v1/n01_api_manual_en.html
Relevant sections: league/stats, league/entry/list pagination, tournament/update
CAS, lg_table shape, league/schedule/get and league/schedule/generate. Match cards
are separate from the tournament document; setting groups alone is insufficient.

**503 tests / 39 files PASS**, including 39 new pool tests, original 5–101 scheme,
all valid draw schemes 5–101 at multiple missing-average boundaries, mixed 4/3 and
single-five fixture cases, identity ambiguity, source/session changes, each
provider failure phase, full readback discrepancies, audits, and DOM interactions.
Build and complete inventory PASS. Tests use executable service/DOM fixtures;
they are not native Google/Nakka acceptance.

## Owner sequence and native review

1. Apply guarded installer from clean 86c068e. It checks every before/after hash,
   saves backup/evidence, builds/tests/inventories, then makes a scoped commit.
2. Prepare Google from a fresh clone of the current 17-file TEST project, overlay
   HubTest.html and HubTestBridge.js plus new HubTestPools.js; retain other 15
   files byte-for-byte. Owner pushes the staged 18 files and runs full readback.
3. Refresh DEV Hub, open Pool Planner; set boards and preference, load statistics.
   Compare a few displayed weighted averages to Nakka's overall three-dart view,
   confirm source season/exclusions and rounding, and inspect duplicates/missing
   mappings. This native calculation acceptance is still pending.
4. Generate/review seeded preview, check individual averages and pool coverage,
   swap players, change bands and verify IN changes invalidate approval. OUT and
   STANDBY remain excluded.
5. The earlier Hub-only test registrations are not silently fixed. Resolve each
   missing/ambiguous identity and intended event entry explicitly before sending.
   A reviewed mapping cannot prove a hidden Nakka league link; inspect it natively.
6. For the first controlled handoff, close all Nakka editing pages. Review full
   settings, identities, pools, card count and warnings, then explicitly send.
   Inspect native divisions, padding, ordering and every match card against the
   frozen preview and audit. Do not start the event as part of this validation.
7. Retain the audit before/after sheets and Properties journal. On partial or
   uncertain save, stop; no repeat click, re-registration, journal deletion or
   automatic restoration. Inspect actual provider state before a repair proposal.

Native UI, authenticated fixture-generation subscription/backend support and
actual settings preservation remain pending until this sequence is performed.
No production readiness claim follows from synthetic PASS. Live typography,
rank/points columns and batch divider remain a separate next task.
