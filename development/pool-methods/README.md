# Pool draw options — PD001, 25 November 2026

Status: locally tested development candidate. NOT installed in Google TEST or LIVE.
Baseline: closed LIVE v46 source checkpoint 56e3fa1ffc9889fc708c67e00e6e10e5d60b5f90. Existing checkpoints are unchanged.

## What changed

Main Hub: Equal/Fair (existing default), Similar strength, Random selector. Selection is stored with draft choices and the frozen draw, restored on reopen, and shown on the preview. Changing it invalidates approval and requires an explicit new draw. Existing board settings, swaps, roster/event checks and fresh-statistics checks are retained. Old saved drafts default to Fair.

Fair preserves the previous protected-seed/mean-balancing algorithm. Similar strength allocates descending verified averages into consecutive groups with the selected capacities; missing averages are spread evenly and never replaced with zero. Random shuffles identities independently of averages using the recorded seed. Missing averages still display as unknown.

AIK Internal already implemented Fair/Similar/Random doubles PAIRING and Fair/Random pool draws. Its separate candidate adds Similar-strength POOLS, using whole entries (singles players or fixed doubles pairs). Pair average is the mean of its two recorded player averages. Fair/Similar retain Internal's existing requirement for valid rating provenance for every player. Random works with unrated entries. No Monday roster/workbook/credentials are reused.

## Candidate files

`application/LivePlanner.gs` and `application/LiveHubView.html` are an overlay on the complete private v46 artifact, not a complete deployment package. Public baseline excludes two private files. Do not deploy this folder alone. The shared algorithm is embedded identically in the browser and server; edit both together until the original generator source is restored.

`aik-internal/PoolPlanner.js` and `aik-internal/AIKInternal.html` are a separate overlay on the saved Internal CP006 development source. This is not evidence that CP006 is installed or that the running Hub is connected to Internal's rating adapter. Main Hub standalone tournament statistics currently return unknown averages; do not advertise rated Internal draws through that route until its isolated rating integration is verified.

## Validation

Source is stored as a reproducible patch against the immutable baseline. In a fresh checkout, reconstruct and verify the four candidate files first:

```sh
python3 development/pool-methods/prepare.py
```

Run tests from repository root:

```sh
node development/pool-methods/tests/draw.cjs
node development/pool-methods/tests/internal-regression.cjs
```

PASS: 108 Hub draw scenarios; legacy Fair allocation equivalence; reproducible seeds; random independence from averages; exact capacities; missing averages; manual swaps; excluded players; invalid methods; legacy saved choices; identical browser/server algorithm; all embedded JavaScript syntax. Internal singles/doubles tests verify capacities, similar ordering and intact pairs. Existing Internal regression: 11 planner checks and 14 ratings/pairing checks pass.

The public Internal source lacks Branding.json. Nonvisual legacy tests use an explicit empty branding fixture. Initial runs failed on missing preview dependencies/branding; the test runner now assembles the full available fixture and labels the branding stub. No visual acceptance is claimed.

## Proposed operator procedure (TEST only after installation)

1. Check TEST and the intended event. Open Pool Planner and review current players/statistics.
2. Choose pool sizes, boards and Pool draw / Poollottning.
3. Choose Equal/Fair for similar group averages, Similar strength for comparable players together, or Random to ignore averages.
4. Generate preview, acknowledge player identity review, then inspect the displayed method and groups. Manual swaps remain available.
5. Close/reopen and confirm pools, method, swaps and board settings restore.
6. Changing method requires a new preview. Do not send until that new preview is reviewed.
7. On stale data, changed event/roster, another-tab conflict or a failed save, follow the existing error and reopen/review; do not bypass the gate.

Internal: open its local event planner, choose Group draw, select a method and Generate new draw. Review fixed couples and rating provenance before saving the local plan. A saved local plan does not create/start Nakka matches.

## Handover / next acceptance

Install complete candidate into isolated TEST only after verifying the current installed baseline. Exercise actual UI selection, method-change invalidation, reopen, concurrent-tab rejection, late roster changes, failed saves and provider preview/send gates. Verify Internal installation and its rating/workbook adapter separately. Native TEST and physical-device checks remain pending. LIVE promotion requires the exact accepted artifact; no LIVE application, workbook, Nakka event or credentials changed here.
