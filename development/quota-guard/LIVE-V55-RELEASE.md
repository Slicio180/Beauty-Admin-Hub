# Beauty LIVE v55 — release accepted

Deployed and accepted on 28 November 2026 at the existing LIVE Hub address. All 43 installed files match the frozen release exactly. Existing LIVE permissions and the public web-app address are unchanged; the full v54 rollback is retained privately.

## Changes

- Consolidated registration workbook writes with durable intent and lost-response reconciliation; existing recovery paths remain.
- Backup Google Form name-list updates run after registration work. System Status shows the saved update state; the handbook explains delayed or failed updates without resubmitting saved players.
- Fresh event-context checks use one property snapshot per check.
- Verified no-play provisional averages in a finished sole event wait ten minutes before another external check. A late correction to that same event may therefore take longer to appear; context changes and manual estimate edits invalidate the delay.
- The existing clock can admit up to six queued jobs within its two-minute admission budget. The native acceptance run exercised two clock jobs, so no six-job speed gain is claimed.
- The accepted compact layout and v54 average formatting are preserved: manual estimates are whole numbers; Nakka averages retain two decimals in the averages dialog. Stored calculations are unchanged.

## Evidence

Both recorded registration acceptance runs passed 53 independent checks on their respective TEST versions. The current scheduler passed 25 focused local checks. Backup-Form status passed 20 local checks and signed-in TEST/LIVE visual inspection. Final freeze validation parsed 37 server files and 60 inline scripts and passed 12 deployment-specific checks. The diagnostic wrapper is inactive on LIVE and its TEST-window helpers reject LIVE.

The existing worker was paused for installation, then resumed on its original single trigger. Its first resumed scheduled execution completed normally. Signed-in LIVE acceptance confirmed Monday 30 November 2026, zero registered players, zero Needs Attention items, no Nakka list differences, Google Sheets connected and no pending backup-Form update. LIVE reports project usage without the private TEST 2,000-request cap; this count is not Google's remaining account allowance.

No synthetic production registrations, removals, scores, draws or event changes were submitted. All temporary TEST allowances are closed, and TEST remains paused. The operator handbook update is included in the deployed Hub.

## Scope and rollback

This incremental Hub release is closed. It does not certify combined 64-player capacity or complete Mobile Player Hub or AIK Internal acceptance. Full source, native evidence and rollback remain in the private checkpoint; this public note contains no player records or credentials.

Rollback must restore both Apps Script HEAD (used by the trigger) and web deployment v54, while preserving durable queue receipts. Restoring only the web deployment does not restore the worker source.

