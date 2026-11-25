# Registration and removal latency investigation

25 November 2026. Read-only source investigation after the acceptance backup. No Google project, trigger, Nakka event or LIVE source changed. This report is additional to the earlier complete ZIP, not part of it.

## Main finding: compare the same clocks

The isolated acceptance project deliberately has no background trigger. LiveRegistrationQueue.gs:79–81 checks beautyQueueBackgroundReady_ and processes inline if false. That predicate requires ENABLED config, matching project/owner and exactly one matching trigger. Therefore tonight's 42.178-second registration call includes processing rather than only the saved receipt. This is a source/configuration deduction; the native dispatchMode log has not been retrieved in this investigation.

The earlier accepted v46 measurements were 3.226/4.346-second receipt medians, and 26.117/32.664-second full-completion medians. Tonight's single full call does not establish a regression in receipt speed. Actual full completion remains worth improving. Removal's roughly 46 seconds is an observation bound, not an exact server timer.

## Findings and proposed experiments

| Priority | Evidence in current acceptance source | Proposed experiment | Required protection |
|---|---|---|---|
| 1 | Registration uses inline fallback without a verified worker. | Measure identical new/existing-player flows with a properly bounded TEST worker, and distinguish receipt from completion. | Never pretend background is ready; prove completion with clients closed. |
| 1 | LiveRemove.gs:62 measurement hook simply runs its callback. | Add TEST-only phase timings before changing removal logic. | Log durations/counts, not credentials, names, messages or full snapshots. |
| 1 | Removal holds ScriptLock across snapshots, backup, Nakka mutation and all verification. BeautyQuota.gs:8 waits up to 30 seconds on the same lock before a fetch. | Measure lock acquisition separately from network time, including a simultaneous read-only refresh. | Atomic request accounting and write exclusion must remain intact. |
| 2 | LiveHubView.html:3291 waits for outstanding reads before starting a mutation; the 60-second timer starts only after that barrier. | Record click-to-dispatch as well as RPC latency; suppress unnecessary scheduled refreshes while a user action is waiting. | Preserve session/context binding and uncertain-write protection; do not arbitrarily parallelize saves. |
| 2 | A successful removal save takes four full snapshots of five sheets; each snapshot obtains values, displayed values, formulas and formats (80 accessor invocations total, excluding metadata). Preview takes a fifth snapshot. | Benchmark a compact, equivalent snapshot reader against the native baseline, including a populated history. | Preserve typed dates, formulas, number formats, layout, exact identity and unrelated rows. Accessor count is NOT measured network request count. |
| 2 | Removal makes two 3-request provider reads before mutation and two 2-request verification reads after, plus one write when entry exists: 11 provider requests during save; preview adds 3. Reads already use fetchAll. | Time each batch and investigate overlap only between independent snapshot/provider reads. | Keep post-backup stale check, bracket exclusion and fresh post-write provider verification. No parallel write/read dependency. |
| 2 | Recovery backup reads history dimensions/index and writes/verifies JSON chunks. First-use setup can add work. | Measure warm vs first-use removal; reuse validated dimensions within one safe phase and explicitly invalidate on growth. | Backup must be durable and verified before deletion; never move it after the effect. |
| 2 | Registration worker preflight reads event, league and event entries sequentially. | Batch independent provider preflight reads through the existing metered adapter. | Validate every response and same context; event-open check immediately before entry write remains. fetchAll does not reduce number of fetched URLs. |
| 2 | Final registration readback separately reads dashboard, response history, master and status. | Batch same-workbook compatible ranges; keep master separate when its workbook differs. | Fresh post-write readback, strict returned-range validation, RAW append semantics and duplicate detection. |
| 3 | New players synchronously rebuild backup Google Form choices between master and status steps. | Add a dedicated timer first; consider a separately journaled derived-projection job only if material. | Changes completion semantics: cannot silently call all work complete while backup form is stale. Preserve routing and reconcile before fallback use. |
| 3 | Registration sync has adjacent flushes (outer loop and batch helper), then a write, flush and another batch flush. | Remove only demonstrated redundant flushes in TEST after testing both SpreadsheetApp and REST visibility. | Do not remove the flush that commits an outstanding write or the verification read. |
| Later | Removal's final dashboard read includes rankings/ratings/master list although verification compares registration fields only. | Verify a minimal roster first and refresh display metadata separately. | UI must correctly merge/refresh data; do not return a partial dashboard that clears good fields. |

## Additional correctness finding

beautyQueueBackgroundReady_ checks ENABLED/owner/project/trigger, but does not call beautyQuotaBackgroundAllowed_. The clock does check the TEST expiry. Thus an expired TEST worker can still be classified as ready for deferred acceptance, even though the clock will decline work. Browser continuation might complete it, but the closed-client fallback is not assured. Fix readiness to include the same expiry eligibility and test expired/missing/paused/valid configurations before further speed claims. This is a static finding, not an observed production incident.

## Constraints from previous experiments

The v46 RESULTS.md explicitly says an earlier removal experiment ran slower and was excluded. Five projection comparisons established equivalence and fewer API requests but no elapsed-time improvement. Do not reintroduce that experiment as a proven speed fix. Retrieve its original measurements before repeating it. Google recommends fewer service round trips and batching, but that is a reason to test, not a measured Beauty result.

The registration sync loop has at most four explicit one-second sleeps; the removal recalculation loop has at most four 250ms sleeps. These alone cannot explain 42–46 seconds. Network/service operations, repeated snapshots, lock waits and client barriers need measurement. There is no evidence yet assigning the delay to Nakka, Google throttling, the user's device or a specific phase.

## Measurement plan for the next TEST session

1. Keep the accepted baseline immutable; instrument a separate candidate. Prepare a current-date isolated fixture rather than changing timestamps on the past event.
2. Recover existing BEAUTY_QUEUE_REQUEST_TIMING, SUBMIT_TIMING and WORKER_TIMING records. Worker logs already expose preflight/response/master/status/display/league/event/readback; add backup-form and lock-wait durations. COMPLETE job objects may not persist the final phase timing because its update occurs in finally after a save; use the emitted worker log, not an incomplete property receipt.
3. Record click, dispatch, durable receipt, worker start, verified completion and UI confirmation separately. Do not add overlapping phase totals to claim end-to-end savings.
4. For removal record preview separately, then lock wait, first snapshot/provider batch, recovery backup, second stale check, delete, provider verification, sheet prewrite validation, mutation/recalculation, preservation check, minimal/full dashboard and final provider check.
5. Start with a small paired baseline/candidate run (new/existing player, warm/cold history). Expand to 10 per scenario only within the remaining TEST request budget; report sample size, median and maximum. No p95 claims from tiny samples.
6. Include ordinary burst use, simultaneous Hub refresh, clients closed after receipt, expired TEST background permission, provider read failure, lost write reply, duplicate submission and changed context. Compare exact consent/message/source/status, one registration/entry, preserved rows/formulas and no replay of uncertain effects.
7. Promote an optimization only if equivalent verification passes and actual elapsed times improve without more request usage or worse tails. Preserve old v46 evidence; this investigation is not release acceptance.

## Architectural option if local improvements are insufficient

A durable removal receipt plus leased background worker would shorten the visible blocking interval, as registration already does. It would not itself shorten deletion completion. It requires auditing every mutation guard, recovery authority, lease expiry, and UI pending state. Releasing the existing removal lock around external writes without that work is unsafe. A separate durable job backend/database is a longer-term option for higher throughput, not a prerequisite or a quick fix for tomorrow.

## Official references reviewed

- https://developers.google.com/apps-script/guides/support/best-practices — minimize service calls and batch compatible operations.
- https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app — fetchAll for multiple requests.
- https://developers.google.com/apps-script/reference/lock/lock-service — mutual-exclusion scopes.
- https://developers.google.com/workspace/sheets/api/guides/batch — batch update request behavior and atomic application within Sheets; this is not a transaction across Sheets and Nakka.

## Decision

First establish worker eligibility and phase timings; then benchmark provider preflight batching and snapshot/history improvements. Keep removal correctness guarantees. No duration promise is justified yet. No live operations or performance tests were run tonight during this investigation.
