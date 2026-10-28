# EVENT-014 QUALIFICATION RECONSTRUCTION

This preserves the qualification history recorded after loss of the temporary Codex working tree.

## Audit identifiers recorded
- HOSTQUAL-024–032 — Apps Script parse fix / preflight
- HOSTQUAL-036 — hosted read-only RPC
- HOSTQUAL-037 — controlled procedure
- HOSTQUAL-038/039 — baseline / backup
- HOSTQUAL-040 — approval
- HOSTQUAL-042/043 — first STALE / closure
- HOSTQUAL-047–065 — supplemental baseline/version/backup evidence
- HOSTQUAL-067 — copy discrepancy
- HOSTQUAL-074 — deployed closure timeline
- HOSTQUAL-075–081 — STALE diagnosis
- HOSTQUAL-082–089 — canonical remediation
- HOSTQUAL-094–097 — corrected package closed-gate
- HOSTQUAL-106–108 — management evidence
- HOSTQUAL-109–110 — second-window approval
- HOSTQUAL-111–116,118 — successful write/final readback
- HOSTQUAL-119 — Hub wiring handoff
- HOSTQUAL-120 — continuation checkpoint

## First write attempt
Baseline:
- event date `2099-01-05`
- A2 `72690`
- B2 `46319.56170721065`
- exact version `["test-event:v1",72690,46319.56170721065]`

Observed:
- Cancel test visually passed
- one Save attempt returned `STALE`
- no retry
- write gate immediately closed and redeployed
- post-closure baseline unchanged exactly
- fresh `/exec` showed writes awaiting approval

Diagnosis: raw object serialization comparison could reject logically identical snapshots because object key insertion order differed.

## Canonical remediation
Recorded automated qualification:
- 34 canonical/guard tests added
- two full Cancel/reopen/Save tests with B2 unchanged/changed
- 451 total
- 450 PASS
- 1 TODO
- 0 failures
- Chromium PASS
- zero external requests
- audit integrity 7/7

## Second controlled write
Write-enabled deployment:
- same deployment
- Version 6
- 24 Oct 2026, 20:20
- owner-only
- execute as user accessing

Cancel flow:
- target changed to `2099-01-12`
- confirmation checked
- Cancel
- reopen
- event date returned `2099-01-05`
- confirmation unchecked
- no Save clicked

Controlled Save:
- target `2099-01-12`
- confirmation checked
- Save clicked exactly once
- UI returned `TEST event date saved; event data reset.`
- current date became `2099-01-12`

Closure:
- write gate restored false
- fresh `/exec` showed writes awaiting approval
- Save disabled

Final guarded read:
- checkedAt `2026-10-24T18:29:36.603Z`
- eventDate `2099-01-12`
- A2 `72697`
- B2 `46319.849867881945`
- version `["test-event:v1",72697,46319.849867881945]`
- writesEnabled false

## Final result
`HOSTQUAL-115: PASS / VERIFIED`
EVENT-014 controlled real TEST write/readback qualification is complete at isolated TEST scope.
Rollback not required. Production not cleared.

## Accepted evidence limits
- Cancel/single-click/RPC/batch counts/deployed closure partly owner-reported/inferred
- no direct network telemetry/raw Save response retained
- final closed deployment exact version/time not recorded
- accepted unexposed Sheet metadata limits
- live deletion and clearing of populated event fields not exercised
- one existing automated TODO remained
- EVENT-014 does not clear production
