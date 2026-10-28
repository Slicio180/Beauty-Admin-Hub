# Coverage map and missing coverage

VERIFIED local coverage classification; RECONSTRUCTED proposed work. A green source regex is not behavioral or real-write qualification. No percentage or count target is used.

| Requirement | Current protection | Missing / release significance |
|---|---|---|
| SAFE-001 / ENV-001 | False constants, project RPC rejection, identity source checks | Behavioral event gate paths, doGet access boundaries, deployed permissions |
| SAFE-002 | Input validation, false/non-boolean gates, identity rejection before client access | Full status path and adversarial clients |
| EVT-001 | Date round trips, invalid date rejection, hash | Systematic boundary/property cases, all input types |
| EVT-002 | 35 new event cases (including isolation cases mapped to SAFE/ENV): real adapter/preflight; fake reset and exact requests; canonical key-order acceptance and array/type/undefined/hole/-0 drift rejection; stale caller and prewrite drift; lock contention/release; no-op; formula/limit blockers; readback corruption/instability and no-retry uncertainty | Broader malformed grid/control/version cases, clock/lock failures, multi-row reset boundaries, full metadata/preservation adversaries, service quotas and independently approved native qualification remain |
| HUB-001 | Static bounds/no-write assertions | Fixture-driven response mapping, malformed layouts, identity failure and truncation visibility |
| STA-001 | Input enum/closed gate only | Unique matching, duplicate/alternate names, concurrency, exact C-cell request, independent full readback |
| NAK-001 / NAK-002 | Server mocks and DOM/clock tests | Native Apps Script smoke, real browser, access failure and quota rehearsal |
| REG-001 | No dedicated suite in uploaded repo | Duplicates, same-name identities, consent, repeated submits and transactional failures |
| DATA-001 | No dedicated suite | Schema/formula/validation/identity integrity, event pools and migration |
| LIVE-001 | No dedicated suite | Cast refresh, ranking/points/unranked/ties, all sorting modes |
| SEC-001 | Limited pinning and health redaction tests | Threat model, auth/session/role checks, XSS, CSRF, privacy, retention |
| OPS-001 / QUAL-001 | Documented gates and procedure | Backup restoration rehearsal, triggers, build/deploy identity checks and all write controls |
| I18N-001 | No dedicated suite | Swedish defaults, fallback, label consistency |
| PROV-001 | Recovered Adapter/DateEncoding/Hub hashes | Verify all source provenance; historical claims remain historical |
| HAND-001 | Inventory and runnable commands | Independent clean-machine programmer rehearsal and qualified release |

No current end-to-end production qualification. Most modules remain unqualified for handoff. Full original 451 runnable tests are absent; no individual lost test cases are invented here.

## PREVIEW-001

19 behavioral cases cover the closed default, loopback-only mock selection, external-route rejection, defensive copies, fictional data, status changes, duplicate/invalid registrations, Swedish consent payloads, Nakka uncontacted state, abort handling, public-only HTTP server and the actual dashboard/form handlers in a minimal fake DOM. Full suite: 133 cases. Real browser layout, login, remote TEST RPC and live workflows remain pending.

## Identity TEST Hub connection — 2026-10-25

Added 12 local bridge, rejection, gate/lock and generated-page checks. Total 187 cases across 10 files. Google runtime/browser and actual Hub registrations remain pending.

## Identity TEST status — 2026-10-25

Added 15 local fake-service/UI/queue cases. Full suite 202 PASS / 0 FAIL and inventory 202 across 11 files. Red evidence retained with dispositions for an initial wrong-cwd command and an initial test expectation mismatch. Google browser status changes remain pending.

## Event Control inspection — 2026-10-25

Added ten Event Control read-only server/popup cases; full suite 212 PASS, inventory 212 across 12 files. UI date editing/cancel and late-response closure covered with fake DOM. Actual Google summary, cancel and later reset remain unqualified.

## English Hub decision and date review — 2026-10-25

Fifteen new English/calendar/review/source-preservation cases pass. Full regression 227 PASS / 0 FAIL, inventory 227 across 13 files. One initial expected-Swedish-copy failure is retained and explained. English identity decisions preserve canonical behavior; remote/kiosk/status-server source hashes checked. Google visual review and any event save remain pending.

## Sidebar and date popup revision — 2026-10-25

Checkbox + confirmation popup replaces exact typed-date input. Simplified sidebar moves Beauty Live below Dashboard and renames Event Control Details. Dashboard retains player table and event action. 227 local regression cases; updated review assertions map to evidence/hub-menu-date-popup-20261025/review.tap. Event saving remains unavailable; browser review and Beauty Live functionality pending. See docs/testing/HUB-MENU-DATE-POPUP-20261025.md. Earlier evidence remains historical.

## Pool Planner — 2026-10-26
Seven local cases cover all supplied 5–101 arrangements for both preferences, board capacity, player conservation through 600 players, invalid counts, IN-only event snapshots, actual panel input/refresh/outage handling, and reference download wiring. 244 total local cases PASS. Native Google TEST browser layout/download still pending. No backend mutation added.

## Health menu — 26 October 2026
Nakka and Google Sheets health details removed from dashboard into their own labelled dialogs, opened by Nakka and System Status. Sidebar dots mirror actual check states and include accessible text/title; TEST mock connections never claim live success. Backend success/failure/recovery verified locally. Existing Nakka health state tests now also assert sidebar indicators. Duplicate sidebar Register Player removed; main registration button preserved. Three additional local cases; 248 tests total. Original regression red due to a syntax typo in new test harness retained, corrected before final pass. Native Google browser review still pending. No Nakka integration or server change.

## Identity TEST event save — 26 October 2026

263 local cases PASS; 15 added cases qualify bounded fake-service/DOM behavior for prepare/confirmed save, snapshot backup and drift guards, selected-day restoration, long messages, timezone boundary, literal cell content, UI cancellation and uncertainty/no retry. Original separate event adapter stays unchanged. Native Identity TEST reset/formula recalculation, parallel kiosk behavior, backup restoration and production release remain unqualified. See EVENT-SAVE-20261026.md.

## Native TEST date-filter regression — 26 October 2026

Native save failed membership verification because the real spill formula filtered from LAST RESET (B2), which excluded existing target-day registrations. Native TEST formula A2 was narrowly repaired to use START DATE (A2), with C2 restored to verified IN status; master/history matched backups. New preflight guard requires the exact reviewed formula before future reset attempts. 264 local cases PASS, including a red-before/green-after regression from the actual workbook formula. Data-level repair verified through connector; Hub browser acceptance and subsequent full native transition still pending. See DATE-FILTER-REPAIR-20261026.md.

## Identity TEST native round trip — AUD-076
26 -> 27 -> 26 October passed sequential browser/native checks. Empty selected
date and restored Jonathan/status/consent/message/source verified; original
master/history unchanged and backups present. Evidence: evidence/event-roundtrip-browser-2026-10-26T09-02-32-407Z/.
Native backup restoration, simultaneous kiosk use, large events and production
release remain pending. No application changes in this evidence checkpoint.

## Pool reference browser acceptance — AUD-078
Owner screenshot verifies readable scheme and original-file download control; owner confirms download succeeds.
Evidence: evidence/pool-tab-browser-2026-10-26T10-49-24-088Z/. Prior AUD-077 local 268/268 PASS retained.
Login page remains disconnected and is not a deployed security boundary.
