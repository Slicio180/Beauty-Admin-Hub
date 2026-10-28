# Known issues

| ID | Evidence label | Finding | Impact / next action |
|---|---|---|---|
| ISSUE-001 | VERIFIED | UI test used nested Beauty-Admin-Hub path and failed ENOENT | Fixed path only; retained red and green TAP |
| ISSUE-002 | VERIFIED | Static public Hub points at production | Safe interactive sandbox required; do not launch as TEST |
| ISSUE-003 | VERIFIED | Many recovery assertions inspect source strings | Behavioral qualification still needed |
| ISSUE-004 | VERIFIED | Status adapter chooses first matching name and lacks concurrency lock/version | Duplicate identity/race review required before qualification |
| ISSUE-005 | VERIFIED | Status readback checks sheet ID/title and status, not all initial metadata/player identity | Strengthen contract and regression coverage before real writes |
| ISSUE-006 | UNKNOWN / UNVERIFIED | Deployed versions, gates, trigger inventory and frontend hosting process | Independently map under separately approved scope |
| ISSUE-007 | VERIFIED | TEST dashboard max 99 player rows; master max 999 entries | Define overflow/truncation behavior and add tests |
| ISSUE-008 | HISTORICAL EVIDENCE | 451 suite files lost; record says 450 PASS / 1 TODO | Never count as runnable |

| ISSUE-009 | VERIFIED | Existing recovery manifest describes original preserved bytes; current Hub/Route have later changes | Do not treat old manifest as current deployment artifact; use checkpoint hashes |

This is an initial code review, not an exhaustive security audit. Production parity and clean-machine runtime are unverified.

## Local preview checkpoint, 2026-10-25

ISSUE-002 mitigation: desktop routes now use a closed service boundary; `index.html` is disconnected. `preview.html` explicitly selects loopback-only fixtures. No live adapter has been enabled. Login/session security and real integration remain open.

The supplied integration ZIP omitted original evidence and a preserved Hub fixture required by a recovery hash test. The unchanged prerequisites were restored from the previously uploaded verified ec75782 archive for assistant testing. They are already present in the Mac master and are not overwritten by this update. An initial missing-fixture failure is recorded in preview evidence.

Real browser review is pending: the installed Playwright library has no Chromium executable in this assistant environment. Fake DOM checks are not a visual browser review.

## Identity TEST Hub connection — 2026-10-25

Identity TEST Hub status editing is disabled. Hub/Remote share a project lock; kiosk still has a different project lock, so cross-method concurrency remains unqualified. Google owner-only TEST does not implement shared-computer login/session/roles.

## Identity TEST status — 2026-10-25

Identity TEST status prepared locally; Google upload and actual browser status cycle pending. Two cell writes are not transactional; a partial failure reports SAVE_UNCERTAIN and requires inspection. Direct Sheets edits and kiosk project do not share the Remote lock. A stale/mismatched existing status is rejected rather than repaired automatically. Status header must be STATUS, row counts <=1000, target C cells must not contain formulas. The old disabled-status note is superseded only after this new TEST upload. Login, Event Control, navigation and broader qualification remain incomplete.

## Event Control inspection — 2026-10-25

Event Control is an inspection-only stage. Saving remains disabled; row-count summary is not write qualification. Legacy reset deletes ordinary status rows, clears C:E on retained name-correction rows, and leaves F source on retained rows; this rule needs explicit review before enabling a future reset. Full bounds/format/validation snapshot and independent readbacks from the old adapter must be retained in a future writer. Shared-computer login and cross-project concurrency remain unresolved.

## English Hub decision and date review — 2026-10-25

English Hub and date-review UI are locally tested; actual Google visual/cancel check pending. Checkbox + exact typed date + review are accidental-change safeguards, not authentication. Final SAVE remains unavailable until a server-backed writer with baseline/version/confirmation and access checks is prepared. Password reauthentication and shared-computer sessions remain part of pending login work. Original inspection reported seven players/response row 161; reset plan deletes seven status rows, retains three correction rows, clears nine C:E cells and retains F sources on two rows; F policy still requires review.

## Sidebar and date popup revision — 2026-10-25

Checkbox + confirmation popup replaces exact typed-date input. Simplified sidebar moves Beauty Live below Dashboard and renames Event Control Details. Dashboard retains player table and event action. 227 local regression cases; updated review assertions map to evidence/hub-menu-date-popup-20261025/review.tap. Event saving remains unavailable; browser review and Beauty Live functionality pending. See docs/testing/HUB-MENU-DATE-POPUP-20261025.md. Earlier evidence remains historical.
