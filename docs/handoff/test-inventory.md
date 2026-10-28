# Automated test inventory

VERIFIED — generated from actual per-file Node TAP execution on Node v24.22.1. IDs apply to exact test names in JSON. Counts measure assertions, not feature completeness.

| ID | Requirement | Test | File |
|---|---|---|---|
| REC-001 | PROV-001 | qualified Adapter hash is exact | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-002 | PROV-001 | original recovered Drive Hub remains preserved exactly | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-003 | PROV-001 | current TEST Hub contains the read-only Hub data bridge | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-004 | EVT-001 | DateEncoding hash matches recovered script body | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-005 | EVT-001 | DateEncoding round-trips supported dates | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-006 | EVT-001 | DateEncoding rejects impossible and fractional dates | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-007 | ENV-001 | TEST route is pinned and write gate is closed | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-008 | ENV-001 | TEST manifest remains owner-only and Sheets v4 | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-009 | ENV-001 | Preflight remains pinned to TEST identity and bounded reads | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-010 | PROV-001 | Adapter retains all stale diagnostics and no automatic retry | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| REC-011 | PROV-001 | Recovered TEST Hub clearly identifies isolated view | [tests/recovery/event-control-recovery-baseline.test.cjs](../../tests/recovery/event-control-recovery-baseline.test.cjs) |
| READ-001 | HUB-001 | TEST Hub data adapter is pinned to isolated sheet | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-002 | HUB-001 | TEST Hub data adapter contains no write API | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-003 | HUB-001 | TEST Hub data adapter reads bounded ranges only | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-004 | HUB-001 | Route exposes read-only TEST Hub RPC | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-005 | HUB-001 | Hub routes hubdata through TEST RPC | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-006 | HUB-001 | TEST status dropdown remains disabled | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| READ-007 | HUB-001 | Event Control write gate remains closed | [tests/recovery/hub-data-readonly.test.cjs](../../tests/recovery/hub-data-readonly.test.cjs) |
| STATUS-001 | SAFE-002 | status write gate is false by default | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-002 | SAFE-002 | Event Control write gate remains false | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-003 | SAFE-002 | status adapter is pinned to TEST identity | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-004 | SAFE-002 | status adapter only accepts IN OUT STANDBY | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-005 | SAFE-002 | closed gate prevents client access entirely | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-006 | SAFE-002 | Route exposes dedicated TEST status RPC | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| STATUS-007 | SAFE-002 | Hub has TEST status bridge but dropdown stays disabled while gated | [tests/recovery/hub-status-gated.test.cjs](../../tests/recovery/hub-status-gated.test.cjs) |
| HEALTH-001 | NAK-001 | health route returns JSON and uses only one authenticated league GET | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-002 | NAK-001 | league health handles empty readable league | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-003 | NAK-001 | league health handles populated readable league | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-004 | NAK-001 | league health handles missing credentials | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-005 | NAK-001 | league health handles HTTP 401 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-006 | NAK-001 | league health handles HTTP 403 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-007 | NAK-001 | league health handles HTTP 500 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-008 | NAK-001 | league health handles HTTP 429 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-009 | NAK-001 | league health handles HTTP 408 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-010 | NAK-001 | league health handles HTTP 504 | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-011 | NAK-001 | league health handles invalid JSON | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-012 | NAK-001 | league health handles API rejection | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-013 | NAK-001 | league health handles missing API result | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-014 | NAK-001 | league health handles missing list | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-015 | NAK-001 | league health handles non-array list | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-016 | NAK-001 | league health handles null API response | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-017 | NAK-001 | league health handles address unavailable | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-018 | NAK-001 | league health handles network error | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-019 | NAK-001 | league health handles native fetch timeout | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-020 | NAK-001 | health response is cached for 60 seconds across requests | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-021 | NAK-001 | cached degraded result is returned without another Nakka request | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-022 | NAK-001 | an in-flight health probe does not block or trigger a second request | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-023 | NAK-001 | cache failure prevents an unthrottled upstream probe | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-024 | NAK-001 | cache write failure preserves a successful result and releases the lock | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| HEALTH-025 | NAK-001 | failed upstream request also releases the health lock | [tests/nakka-health.test.cjs](../../tests/nakka-health.test.cjs) |
| UI-001 | NAK-002 | initial UI check calls only the read-only endpoint with an abort signal | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-002 | NAK-002 | UI renders OK with a clear indicator and checked time | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-003 | NAK-002 | UI renders DEGRADED with a clear indicator and checked time | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-004 | NAK-002 | UI renders UNAVAILABLE with a clear indicator and checked time | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-005 | NAK-002 | UI handles HTTP failure without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-006 | NAK-002 | UI handles network failure without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-007 | NAK-002 | UI handles invalid JSON without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-008 | NAK-002 | UI handles null response without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-009 | NAK-002 | UI handles unknown status without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-010 | NAK-002 | UI handles blank message without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-011 | NAK-002 | UI handles invalid timestamp without exposing raw errors | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-012 | NAK-002 | UI aborts after 15 seconds and can recover on a later manual refresh | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-013 | NAK-002 | manual refresh is limited to once per minute and resets the old OK indicator | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-014 | NAK-002 | automatic refresh uses five minutes, independent of Beauty polling | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-015 | NAK-002 | an unresolved request does not overlap manual or scheduled requests | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-016 | NAK-002 | hidden tabs skip polling and check overdue health when visible again | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-017 | NAK-002 | a tab initially hidden waits until it becomes visible | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| UI-018 | NAK-002 | missing health markup does not affect the rest of the Hub | [tests/nakka-health-ui.test.cjs](../../tests/nakka-health-ui.test.cjs) |
| GATE-001 | SAFE-002 | status gate rejects non-boolean approval undefined | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-002 | SAFE-002 | status gate rejects non-boolean approval null | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-003 | SAFE-002 | status gate rejects non-boolean approval false | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-004 | SAFE-002 | status gate rejects non-boolean approval 0 | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-005 | SAFE-002 | status gate rejects non-boolean approval 1 | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-006 | SAFE-002 | status gate rejects non-boolean approval true | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-007 | SAFE-002 | status rejects wrong sheetId before accessing client | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-008 | SAFE-002 | status rejects wrong title before accessing client | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-009 | SAFE-002 | status rejects wrong locale before accessing client | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-010 | SAFE-002 | status rejects wrong timeZone before accessing client | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |
| GATE-011 | ENV-001 | all TEST RPCs reject a different script project before service access | [tests/handoff/closed-gates.test.cjs](../../tests/handoff/closed-gates.test.cjs) |

Full purpose, method, expected result, origin, evidence and limitations: [test-inventory.json](test-inventory.json).

## Event Control behavioral checkpoint

VERIFIED locally: the following new cases execute recovered application code with synthetic fixtures. They do not open real write gates.

| ID | Requirement | Test | File |
|---|---|---|---|
| EVBEH-001 | EVT-002 | event load returns exact date/version with gate closed and no mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-002 | SAFE-001 | event save denies non-boolean approval false before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-003 | SAFE-001 | event save denies non-boolean approval 1 before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-004 | SAFE-001 | event save denies non-boolean approval true before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-005 | ENV-001 | event config rejects extra property before lock or reads | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-006 | EVT-002 | event rejects missing confirmation before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-007 | EVT-002 | event rejects impossible date before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-008 | EVT-002 | event rejects noncanonical version before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-009 | EVT-002 | event rejects version date mismatch before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-010 | EVT-002 | event rejects unexpected field before I/O | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-011 | EVT-002 | event lock contention returns BUSY without reading or releasing another lock | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-012 | EVT-002 | event stale baseline date releases lock without write | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-013 | EVT-002 | event B2 token drift rejects stale caller without write | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-014 | EVT-002 | event same date is no-op with no clock or write call | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-015 | ENV-001 | event capture rejects wrong spreadsheetId before mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-016 | ENV-001 | event capture rejects wrong title before mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-017 | ENV-001 | event capture rejects wrong locale before mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-018 | ENV-001 | event capture rejects wrong timeZone before mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-019 | EVT-002 | event rejects external formula reference before mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-020 | EVT-002 | event rejects over-limit preflight before cell read | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-021 | EVT-002 | event successful fake reset emits exact bounded requests and preserves unrelated data | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-022 | EVT-002 | event canonical comparison accepts reordered object keys through all readbacks | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-023 | EVT-002 | event prewrite snapshot detects primitive type difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-024 | EVT-002 | event prewrite snapshot detects array order difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-025 | EVT-002 | event prewrite snapshot detects explicit undefined difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-026 | EVT-002 | event prewrite snapshot detects sparse array slot difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-027 | EVT-002 | event prewrite snapshot detects negative zero difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-028 | EVT-002 | event prewrite snapshot detects array length difference | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-029 | EVT-002 | event prewrite detects unrelated validation drift without mutation | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-030 | EVT-002 | event thrown writer returns SAVE_UNCERTAIN once and releases lock | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-031 | EVT-002 | event readback detects changed control value and never retries | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-032 | EVT-002 | event readback detects changed unrelated formula and never retries | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-033 | EVT-002 | event readback detects changed validation and never retries | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-034 | EVT-002 | event readback detects changed grid size and never retries | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |
| EVBEH-035 | EVT-002 | event unstable second readback returns SAVE_UNCERTAIN without retry | [tests/handoff/event-control-behavior.test.cjs](../../tests/handoff/event-control-behavior.test.cjs) |

## Offline desktop preview coverage

19 new cases in `tests/hub-preview.test.cjs`; 133 total runnable cases across 8 files. Exact names, IDs and evidence paths are in `test-inventory.json`. Mock registration assertions qualify only this preview.

## Conditional name-conflict registration

NAME-001: 41 additional cases (40 shared-rule/dialog/remote-kiosk candidate tests plus one Hub form integration case). Current total: 175 executable cases across 9 files. Exact names and evidence are in test-inventory.json.

## Identity TEST Hub connection

HUBTEST-001–012: 12 cases in tests/hub-test-connection.test.cjs, requirement HUBTEST-001. Local bridge and generated-page checks only. Total 187 cases across 10 files.

## Identity TEST status — 2026-10-25

HUBSTATUS-001–015: 15 new cases; total 202 cases across 11 files. The existing 12 connection checks now reflect status capability, with evidence in evidence/hub-status-20261025/connection.tap. Historical test evidence remains preserved.

## Event Control inspection — 2026-10-25

EVENTINSPECT-001–010: ten read-only server/popup cases. Total 212 cases across 12 files. Google runtime inspection remains pending; no event save action exists in this update.

## English Hub and date-review safeguards — 2026-10-25

HUBENGLISH-001–015: 15 new cases. Total 227 cases across 13 files. Existing UI assertions now expect English Hub copy; Swedish remote/kiosk cases remain unchanged. Historical red/passing artifacts retained.

## Sidebar and date popup revision — 2026-10-25

Checkbox + confirmation popup replaces exact typed-date input. Simplified sidebar moves Beauty Live below Dashboard and renames Event Control Details. Dashboard retains player table and event action. 227 local regression cases; updated review assertions map to evidence/hub-menu-date-popup-20261025/review.tap. Event saving remains unavailable; browser review and Beauty Live functionality pending. See docs/testing/HUB-MENU-DATE-POPUP-20261025.md. Earlier evidence remains historical.
