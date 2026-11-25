# Further performance research — 25 November 2026

Read-only investigation. No people contacted, no private source shared externally, no deployments or provider mutations. Findings below distinguish code evidence from unmeasured hypotheses.

## New actionable findings

1. **Idle queue polling is an attempted worker start.** LiveHubView.html queueCheck defaults to pump and is scheduled every five seconds while visible/unlocked. LiveRegistrationQueue.gs service calls beautyQueueProcess_ for pump, even before returning its queue list. Each visible idle Hub can therefore attempt roughly 720 pump executions/hour (less when busy); several Hubs multiply this. The browser continuation and owner clock are additional starters. Leases prevent duplicate processing, but lock/property overhead remains. Candidate: use lightweight list polling with adaptive delay when idle, and retain bounded continuation plus a verified clock. Measure multi-Hub load; preserve immediate user recheck and unattended completion.

2. **Queue lookup grows with historical jobs.** beautyQueueRead_ gets every Script Property, parses all registration jobs including COMPLETE, sorts them, then callers filter. The five-second queue route can invoke this more than once. Completed receipts are not deleted by that function. Candidate: measured active-job index and separately archived completed receipts. Preserve fingerprint idempotency and audit retention; never simply delete historical receipts to save time. Benchmark 0/100/500 retained synthetic jobs before choosing complexity.

3. **Context checks repeatedly access PropertiesService.** beautyLiveTarget_ reads switch/restore/context properties on every invocation even after pinning a context. Pinning checks changes rather than eliminating reads. Deep registration call chains invoke it many times; quota accounting adds a read/write per outbound request and a success read. Candidate: count property accesses and time guards; reuse a validated context only inside a bounded phase, retaining fresh checks at mutation/lease boundaries. A global stale cache would weaken event-switch safety.

4. **Separate quota dimensions matter.** Official Sheets REST limits currently show 60 read and 60 write requests per minute per user per project, with 300 per project. Apps Script has separate daily URL Fetch and Properties quotas, runtime and concurrency limits. Beauty counts attempted fetches, not Sheets read/write categories or property calls. A normal full dashboard poll reads both a batch and the master list: two Sheets REST reads per refresh, before other activity. At a 15-second schedule that is nominally eight reads/minute per active Hub; five Hubs could account for 40 before registrations, cast views and monitoring. This is a load-model example, not observed usage. Coalesce redundant dashboard requests, instrument service/category counts, and back off read-only refreshes with jitter. Never automatically replay an uncertain write.

5. **Client/server limits are distinct.** google.script.run permits ten concurrent calls; excess calls wait. Apps Script permits 30 simultaneous executions per user. Owner-executed web apps can concentrate work on that owner; verify each deployment execution identity before load conclusions. Beauty also has its own read-before-write barrier. Add click-to-dispatch, server-start and phase durations before blaming network latency. Do not increase polling or add more triggers as a speed fix.

6. **Nakka endpoint audit.** The current official manual lists https://api.n01darts.com/api/v1, while the inspected candidate sends to https://push.n01darts.com/api/v1 with redirects disabled. That discrepancy does not establish an error or speed difference: current writes succeeded. Compare authorized, read-only requests from the same Apps Script runtime, recording HTTP status, redirect presence, response shape and elapsed time without logging authentication or administrative payloads. Confirm supported host with provider before migration. No host change made.

7. **Provider failure classification.** Nakka documents result -54 / HTTP503 for list queries exceeding ten seconds. This makes provider query latency another measurable category, not proof that it caused tonight’s wait. Log safe route labels, status/result codes and timing. Check applicable endpoint filtering/pagination semantics before requesting less data: removal requires the complete event-entry set and duplicate detection. No numeric request-rate guarantee found in reviewed manual passages.

8. **Smaller Sheets responses, not just fewer calls.** Official field masks/ranges can reduce payload. Benchmark an exact snapshot projection using only needed fields versus native SpreadsheetApp, preserving dates, formulas and formats. Previous replacement ran slower; do not call this a proven win. Avoid blanket whole-grid reads and unbounded historical-response scans where a validated index can preserve exact matching.

## Recommended order

First correct TEST worker-expiry readiness; collect phase and service counters; compare idle versus multiple-Hub operation. Then test adaptive queue/list polling and same-phase read batching. Next evaluate indexed history/receipts and compact snapshots. Consider asynchronous removal only after this, since it changes recovery coordination substantially. Existing elapsed times do not justify a guaranteed new target.

A suitable next bounded experiment records baseline/candidate: receipt time, full completion, preview/removal times, lock wait, property operations, Sheets reads/writes, provider requests and outstanding browser calls. Exercise ordinary and lost-reply cases; verify exact records and no duplicate provider writes. Use current-date TEST fixtures, not production registrations.

## Primary sources reviewed

- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/workspace/sheets/api/limits
- https://developers.google.com/workspace/sheets/api/guides/field-masks
- https://developers.google.com/workspace/sheets/api/guides/performance
- https://push.n01darts.com/api/v1/n01_api_manual_en.html

No paid account upgrade recommended as a shortcut: Apps Script simultaneous executions per user are currently 30 for both account types, although several daily allowances differ. No evidence that a rewrite or new hosting is necessary before the above measured optimizations.
