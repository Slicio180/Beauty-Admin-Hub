# Beauty Test & Audit Log

VERIFIED entries below describe local work on 2026-10-25, base commit 408fecc, Node v24.22.1. No production/Google/Nakka operation or push was performed. Gate values remain false in source; deployed values unverified.

| ID | Requirement/test scope | Expected | Actual / status | Evidence |
|---|---|---|---|---|
| AUD-001 | Recovery baseline REC/READ/STATUS, 25 cases | Pass current baseline | 25 PASS; VERIFIED current local assertions, reconstructed provenance retained | rec.tap, read.tap, status.tap |
| AUD-002 | Broader existing health suite | All test files load | FAIL; UI file ENOENT due wrong relative path; understood and fixed before continuing | baseline.tap |
| AUD-003 | ISSUE-001 path correction; existing full regression | All 68 actual cases pass | 68 PASS / 0 FAIL; VERIFIED local | after-path-fix.tap |
| AUD-004 | GATE-001–011 isolation regressions | Deny non-boolean gates and wrong identity/project before I/O | 11 PASS / 0 FAIL; VERIFIED local mocked behavior | gate.tap, new-safety.tap |
| AUD-005 | Requirements / inventory / coverage / runbooks | Every real case maps; gaps explicit | RECONSTRUCTED framework with VERIFIED inventory; not a qualified release | docs/handoff/ |
| AUD-006 | Full checkpoint regression | 79 PASS, gates false, inventory matches | See final.tap and checkpoint.json; VERIFIED only when artifacts report success | final.tap |

All evidence paths above are under `evidence/handoff-2026-10-25/`. Each executable case is an audit sub-entry identified by test-inventory.json ID, exact name/file, requirement, expected PASS, TAP artifact and local verification label. Source checkpoint for these entries is the Git commit adding this register; use `git log -- docs/handoff/audit-register.md`. Failure disposition is preserved in AUD-002; no unexplained red result was bypassed.

## EVENT-BEHAVIOR-2026-10-25

Base commit: 54f6f65. Runtime: Node v24.22.1. All new cases are newly authored replacement coverage, not recovered original tests. Evidence below is under `evidence/event-control-2026-10-25/`.

| ID | Scope | Expected | Actual / disposition | Evidence |
|---|---|---|---|---|
| AUD-007 | First fixture-backed event run | Successful reset and downstream readback cases reach verification | 32 PASS / 3 FAIL; understood fixture defect: fake update created holes in cell arrays, causing preflight TypeError before successful readback. Fixed fake response by filling blank cell objects. No production source modified. | initial-fixture-failure.tap |
| AUD-008 | EVBEH-001–035 | Real adapter/preflight satisfy explicit bounded fake reset, isolation, stale and uncertainty assertions | 35 PASS / 0 FAIL; VERIFIED local behavior only | event.tap |
| AUD-009 | Full regression and inventory drift check | All old/new cases pass and map to requirements | 114 PASS / 0 FAIL; inventory check PASS; VERIFIED locally | full-regression.tap, inventory-check.txt |

Each EVBEH inventory item is an audit sub-entry with exact test name, requirement, runnable file and evidence. No application source changes, live reads/writes, deployment or push. Both Route.gs gates remain false. This is not real-write qualification; fake readbacks are not independent remote reads. Red evidence retained and explained before advancement. Commit adding this section identifies the checkpoint.

## MASTER-FOLDER-BASELINE-2026-10-25

Source commit: ec75782832816c6d772b90dfdf564b11f96ed762.
Runtime details: evidence/baseline-20261025-114323/environment.txt.
Completed: 2026-10-25 11:43:35 CET.
Execution: Alessio's Mac, from the iCloud Beauty master project.

| ID | Scope | Expected | Actual / disposition | Evidence |
|---|---|---|---|---|
| AUD-010 | Existing full regression and inventory rerun from master folder | All 114 cases pass and inventory matches | 114 PASS / 0 FAIL / 0 skipped; inventory exit 0; tests exit 0. VERIFIED local automated suite only. | evidence/baseline-20261025-114323/tests.txt; evidence/baseline-20261025-114323/inventory.txt; evidence/baseline-20261025-114323/outcome.txt |

Git checkpoint saved as evidence/baseline-20261025-114323/baseline.bundle.
This run does not establish live Google Sheets/Nakka integration, deployed configuration, or release readiness.

## SOURCE-COMPARISON-2026-10-25

### AUD-011
Recorded at: 2026-10-25T10:51:35.828Z (UTC).
Master source commit: b3a2980cf3c4465618f822feb2d1b17b3759e408.
Scope: compare supplied registration source with master-folder copies.
Expected: identify exact matches and explain differences before integration.
Actual: four files match uploaded source byte-for-byte: automatic-nakka Code.js, Kiosk.html, RemoteRegistration.html; remote-app RemoteRegistration.html.
Remote-app Code.js differs from the supplied live-editor copy only in indentation and blank lines around Nakka health code, as inspected by the assistant.
Status: VERIFIED source comparison only. This does not verify deployed versions or runtime behavior.
Evidence: evidence/baseline-20261025-114323/source-checksums.txt.
Uploaded comparison sources: Pasted text(7).txt, Pasted text (2).txt, Pasted text(8).txt, Pasted text(9).txt, Pasted text (2)(1).txt.
No application source changed, deployed, or pushed.

## LOCAL-PREVIEW-2026-10-25

### AUD-012
Recorded at: 2026-10-25T11:01:01.593863+00:00 (UTC).
Base: supplied integration ZIP from Mac checkpoint 142f55b. Source archive SHA256 and runtime: `evidence/local-preview-2026-10-25/environment.json`.
Scope: prepare isolated desktop preview; route all desktop operations through a closed boundary. Original live Apps Script and Google TEST source unchanged.
Expected: existing 114 cases remain green; new fixture/service/dashboard/server cases pass; no remote fallback.
Actual: 133 PASS / 0 FAIL / 0 skipped; inventory maps 133 cases across 8 files (see final evidence artifacts). VERIFIED assistant-local automated behavior only. Mac rerun PENDING. Browser visual review NOT RUN: Chromium executable missing. No live Google/Nakka operation, deployment or push performed.
Initial prerequisite failure: original recovery fixture omitted from the ZIP, restored unchanged from verified backup; diagnostic summary retained. No production source fix for that failure.
Evidence: `evidence/local-preview-2026-10-25/before.tap`, `preview.tap`, `full-regression.tap`, `inventory.txt`, `browser-check.txt`, `initial-prerequisite-issue.txt`, `environment.json`, `SHA256SUMS.txt`.
Nakka remains explicitly unavailable/uncontacted in preview. In-memory registration/status behavior is not qualification of live registration or status mutations.

## MAC-PREVIEW-VERIFICATION-2026-10-25

### AUD-013
Completed: 2026-10-25 12:20:33 CET.
Environment: Alessio's Mac; runtime and source checkpoint in evidence/mac-preview-20261025-122023/environment.txt.
Scope: installed offline preview regression and inventory check.
Expected: 133 cases pass and map to requirements.
Actual: 133 PASS / 0 FAIL / 0 skipped. Tests exit 0; inventory exit 0.
Status: VERIFIED Mac automated suite. Visual review PENDING.
Evidence: evidence/mac-preview-20261025-122023/tests.txt, inventory.txt, outcome.txt, environment.txt.
No live integration or deployed behavior is qualified by this run.

### AUD-014
Recorded: 2026-10-25T11:29:10.967Z.
Scope: initial browser display, normal-width layout and 10-second mock status retention.
Outcome: PASS for these checks; status retention confirmed by user.
Evidence: evidence/mac-preview-20261025-122023/manual-review.json.
Screenshots reviewed in chat; copies not yet confirmed in the master folder.
Live integration remains unverified.

### AUD-015
Recorded: 2026-10-25T11:31:29.889Z.
Test: MAN-MESSAGE-001 — offline preview message popup.
Expected: LÄS opens the selected player's name/message; × closes it.
Actual: Screenshot confirms Demo Björn and the expected message; user confirmed all steps worked.
Outcome: PASS — screenshot reviewed and user verified.
Evidence: Screenshot 2026-10-25 at 12.30.31.png, supplied in chat; master-folder copy pending.
Scope: offline preview only.

### AUD-016
Recorded: 2026-10-25T11:33:49.588Z.
Test: MAN-REG-001 — register an existing mock master-list player.
Expected: Demo Dani added once, status IN, consent NEJ, message "Demo test", count 4.
Actual: Screenshot confirms all expected values.
Outcome: PASS — screenshot verified.
Evidence: Screenshot 2026-10-25 at 12.32.44.png, supplied in chat; master-folder copy pending.
Scope: offline preview only.

### AUD-017
Recorded: 2026-10-25T12:01:44.654Z.
Scope: registration feedback popup requested after duplicate attempt.
Observation: Screenshot 2026-10-25 at 12.34.43.png shows duplicate rejection inline. Player count after that attempt was not visible in the supplied screenshot. User requested feedback in a popup like player messages.
Change: registration validation/server errors use the existing dismissible message popup titled Anmälan. Form input remains underneath.
Expected: popup opens, closes via ×, preserves input, and duplicate rejection does not add a player.
Actual: 134 PASS / 0 FAIL in assistant automated regression; inventory maps 134 cases across 8 files. Verified automated scope only. Mac rerun and browser retest PENDING.
Evidence: evidence/registration-popup-2026-10-25/full-regression.tap, inventory.txt and provenance.json. Request screenshot supplied in chat; master-folder copy pending.
No live backend changes, deployment or push.

### AUD-018
Recorded: 2026-10-25T12:01:44.654Z.
Decision: user approved conditional same-name popup across remote, kiosk and Hub. Reveal middle-name/nickname/other-detail field only for a different person; confirm distinct displayed name before saving.
Implementation: shared pure rules and dialog; offline Hub integration; owner-only, write-disabled remote/kiosk candidate copies. Original live source snapshots preserved. Display example: Demo Anna (Karla).
Expected: identity conflict resolved before mutation, no duplicate for the same person, original player unchanged, explicit confirmation, safe cancellation.
Actual: 175 PASS / 0 FAIL, inventory 175 cases across 9 files in assistant-local tests, including actual Hub/remote/kiosk submit handlers with mocked services.
Status: VERIFIED assistant-local automated behavior; Mac rerun/browser retest and real Apps Script TEST qualification PENDING. Candidate registration gates false; no TEST project provisioned for candidates.
Evidence: evidence/identity-flow-2026-10-25/full-regression.tap, inventory.txt and provenance.json; docs/testing/IDENTITY-FLOW-2026-10-25.md.
No live deployment, remote write or push. Permanent player IDs and cross-project write coordination remain separate work.

### AUD-019
Completed: 2026-10-25 13:02:55 CET.
Scope: Mac regression and inventory after name-conflict update.
Expected: 175 passing cases across nine files.
Actual: 175 PASS / 0 FAIL / 0 skipped; both exit codes 0.
Status: VERIFIED Mac automated suite. Browser review and real Apps Script TEST qualification pending.
Evidence: evidence/mac-name-flow-20261025-130232/tests.txt, inventory.txt, environment.txt and outcome.txt.
Live apps unchanged; candidate registration writes remain disabled.

### AUD-020
Recorded: 2026-10-25T12:09:04.676Z.
Scope: identity-popup typography, requested after Screenshot 2026-10-25 at 13.05.48.png.
Initial observation: FAIL visual font match; popup requested an undeclared Hub family, causing Arial fallback. Screenshot reviewed in chat; master-folder image copy pending.
Change: use registered AIK font family/weights for explanatory text, bold headings and condensed bold buttons; remote/kiosk candidate CSS selects its registered Light family.
Automated retest: 175 PASS / 0 FAIL; inventory 175 cases across 9 files in assistant environment. Font rendering is not qualified by those tests.
Status: correction implemented; Mac visual retest PENDING.
Evidence: evidence/identity-font-2026-10-25/full-regression.tap, inventory.txt and provenance.json; docs/testing/IDENTITY-FONT-2026-10-25.md.
No font asset, live Apps Script deployment or Cloudflare changes.

### AUD-021
Recorded: 2026-10-25T12:16:20.623Z.
Scope: Mac visual font review and manual same-name registration checks.
Actual: PASS — distinct Demo Anna (Karla) added after confirmation;
existing Demo Anna duplicate blocked; final count remained 4.
Evidence: evidence/mac-identity-review-20261025/manual-review.json.
Screenshots reviewed in chat; master-folder copies pending.
Qualification: offline Hub only; live integration remains unverified.

### AUD-022
Recorded: 2026-10-25T12:37:35.436Z.
Scope: preserve the five screenshots supporting AUD-021.
Actual: all five files present; PNG signatures checked; SHA-256 hashes recorded.
Evidence: evidence/mac-identity-review-20261025/screenshot-manifest.json and its listed images.
AUD-021 screenshot-copy requirement resolved.
No additional runtime testing or live operation performed.

### AUD-023
Recorded: 2026-10-25T12:42:26.325Z.
Scope: cancel same-name registration before final confirmation.
Expected: no player added; count stays 3.
Actual: PASS, user confirmed count remained 3 after closing the
Demo Anna (Karla) confirmation and registration form.
Verification: user-reported manual check; no screenshot captured.
Environment: Mac browser, offline Hub preview.
Live integration remains unverified.

### AUD-024
Recorded: 2026-10-25T15:37:13.177Z.
Scope: prepare dedicated remote identity TEST configuration.
Script ID: 1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N.
Spreadsheet ID: 1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU.
Actual: separate TEST source created; JavaScript syntax and JSON parse checks passed.
Registration writes remain disabled. Original candidate source preserved.
Control A2 visually reviewed as 25/10/2026; B2 unchanged.
Evidence: apps-script/registration-identity-test/remote-app/PROVISIONING.json.
Updated server code upload, deployment and runtime verification pending.

### AUD-025
Recorded: 2026-10-25T15:53:36.921Z.
Scope: dedicated remote identity TEST page, with registration writes disabled.
Expected: page and master-player list load; submission returns BLOCKED.
Actual: PASS for page rendering and AIK font appearance, screenshot reviewed.
Player names displayed; full scrolling confirmed by user.
Blocked message confirmed by user after submitting Alessio Tampella.
Post-attempt response-sheet screenshot shows last visible entry dated
22/10/2026, with no new 25/10/2026 registration shown.
Evidence: chat screenshots at 16.41.23, 16.42.39, 16.45.45,
16.45.57, 16.46.08, 16.47.10 and 16.52.29 on 2026-10-25.
Screenshot copies in master folder pending.
Limitation: no full before/after sheet comparison; real registration writes
and remote name-conflict behavior remain unverified.

### AUD-026
Recorded: 2026-10-25T16:00:59.458Z.
Scope: prepare registration writes for the dedicated remote TEST project.
Verified starting source hash and configured project/spreadsheet IDs.
Change: registration write setting false to true; syntax check passed.
Backup: backups/remote-identity-before-writes-2026-10-25T16-00-59-458Z.
Updated source SHA-256: 7a7d37825c5abf42caab493b0a39b9a92964708af5720e9e8fe8d59acbc522df.
Google code upload and actual registration verification remain pending.
Original candidate, live projects and earlier Event Control TEST source unchanged.

### AUD-027
Recorded: 2026-10-25T16:19:17.848Z.
Scope: first actual remote registration in the dedicated Identity TEST spreadsheet.
Expected: existing player saved once and displayed in Tonight's Players.
Actual: PASS for the observed registration and downstream display.
Response row: 25/10/2026 17:03:29; Alessio Tampella;
NEJ, JAG GODKÄNNER INTE; TEST-REMOTE-001; MOBIL.
Tonight's Players: Alessio Tampella; new-player field blank;
IN; NEJ; TEST-REMOTE-001; MOBIL.
User confirmed return to registration page.
Evidence: chat screenshots 17.04.49 and 17.18.27 on 2026-10-25.
Screenshot copies in master folder pending.
Qualification: dedicated remote TEST only. Duplicate/conflict checks,
kiosk integration and production qualification remain pending.

### AUD-028
Recorded: 2026-10-25T16:31:55.095Z.
Scope: remote TEST duplicate rejection and distinct-person registration.
Expected: duplicate adds no response or changes to original;
confirmed distinguishing detail creates a separate player.
Actual: PASS for observed checks.
Duplicate attempt: response row 155 remained last; original event row
retained IN, NEJ and TEST-REMOTE-001.
Distinct-person flow: event list shows Alessio Tampella (Karla)
separately with IN, JA and TEST-REMOTE-002. Original unchanged.
Evidence: chat screenshots 17.20.48, 17.22.38, 17.23.26
and 17.30.28 on 2026-10-25. Master-folder copies pending.
Limitation: second response row and master-list entry not yet independently
reviewed. Kiosk, concurrency and production qualification remain pending.

### AUD-029
Recorded: 2026-10-25T16:34:35.784Z.
Scope: independently review remote TEST response storage and master names.
Actual: PASS. Row 155 retains original Alessio Tampella, NEJ,
TEST-REMOTE-001 and MOBIL.
Row 156: 25/10/2026 17:29:42; new-player option;
Alessio Tampella (Karla); JA; TEST-REMOTE-002.; MOBIL.
Master list rows 4 and 5 contain original and distinct names separately.
Resolves AUD-028 pending second-response and master-entry review.
Evidence: chat screenshots 17.33.11 and 17.33.33 on 2026-10-25.
Screenshot copies in master folder pending.
Dedicated remote TEST only; kiosk and concurrency remain unverified.

### AUD-030
Recorded: 2026-10-25T16:38:07.154Z.
Scope: prepare dedicated kiosk Identity TEST source.
Script ID: 1m4H1l36CL4YFl8GwcZ2tC3pbrkefol9Zg8gJvhyzcQA49xbAWmljaPSN.
Spreadsheet ID: 1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU.
Actual: configured source created; JavaScript syntax and JSON parse checks passed.
Writes disabled. Google upload and runtime checks pending.
Evidence: apps-script/registration-identity-test/automatic-nakka/PROVISIONING.json.
Cross-project concurrency remains unverified; tests will run sequentially.

### AUD-031
Recorded: 2026-10-25T16:43:30.640Z.
Scope: kiosk TEST blocked submission and preparation for controlled writes.
Observed: selected Alessio Tampella and message
"TEST-kandidaten är inte aktiverad." AIK font appearance reviewed.
PASS for observed blocked-message behavior; no independent sheet comparison.
Evidence: chat screenshot 2026-10-25 at 17.42.25; master copy pending.
Prepared change: TEST write setting false to true; source hash and
configured IDs checked; JavaScript syntax check passed.
Backup: backups/kiosk-identity-before-writes-2026-10-25T16-43-30-640Z.
Updated Google code upload and actual kiosk write checks pending.
Cross-project concurrency remains unverified; testing sequentially.

### AUD-032
Recorded: 2026-10-25T17:03:35.093Z.
Scope: source-label discrepancy and bounded kiosk retest.
Actual: FAIL for initial intended kiosk attempt: row 157, 17:45:44,
Alessio Tampella (kiosk), source MOBIL. Original evidence retained.
After opening the exact kiosk /dev URL, Adam Pettersson at 17:52:15
saved NEJ, TEST-KIOSK-SOURCE-001, KIOSK; bounded retest PASS.
Possible tab mix-up remains an inference, not an established root cause.
Evidence: evidence/registration-browser-20261025/manual-review.json and screenshot-manifest.json.

### AUD-033
Recorded: 2026-10-25T17:03:35.093Z.
Scope: sequential kiosk TEST duplicate rejection and distinct-person flow.
Actual: PASS for observed checks. Already-registered message displayed.
Only one response after Adam: row 159, 25/10/2026 17:55:16,
Alessio Tampella (tablet), JA, TEST-KIOSK-003, KIOSK.
Distinct name appears in master and Tonight's Players.
Original Alessio retains IN, NEJ and TEST-REMOTE-001.
Kiosk form reset visible; automatic return timing remains unverified.
Evidence: evidence/registration-browser-20261025/manual-review.json; screenshots at 17.54.22,
17.55.27, 17.55.59, 17.56.13 and 17.56.36.
Dedicated TEST only; concurrency, kiosk cancel/reused-detail and
production qualification remain pending.

### AUD-034
Recorded: 2026-10-25T17:03:35.093Z.
Scope: preserve supplied registration setup and browser screenshots.
Actual: 28 screenshots copied into master evidence; PNG signatures,
file sizes and SHA-256 hashes verified against supplied bundle.
Original filenames retained in screenshot-manifest.json.
Resolves pending screenshot-copy references for AUD-025 and AUD-027-033;
also preserves setup/date screenshots supporting AUD-024.
Evidence: evidence/registration-browser-20261025/screenshot-manifest.json.
Audit and provisioning metadata backed up at backups/registration-evidence-before-2026-10-25T17-03-35-093Z.
No new Google, Nakka, deployment or registration operation performed by installer.

### AUD-035
Recorded: 2026-10-25T17:16:58.341Z.
Scope: prepare owner-only Identity TEST Hub from source checkpoint 23a0b93.
Actual: pinned RPC read/register bridge added to existing Remote TEST, server-set HUB source, existing registration gate/lock reused. Status editing disabled; legacy status RPC private. Original live/candidate/kiosk/Event Control TEST source and offline preview unchanged.
Assistant local evidence: evidence/hub-test-connection-20261025/. Baseline 175 PASS; new bridge 12 PASS; full regression 187 PASS; inventory PASS. Local mocked behavior and generated HTML syntax only.
Backup: backups/hub-test-before-2026-10-25T17-16-58-341Z.
Google upload, actual Hub reads/writes and browser review pending. Kiosk cross-project concurrency and shared-computer login remain unresolved.

### AUD-036
Recorded: 2026-10-25T17:17:06.284Z.
Scope: Mac installer hash verification, full automated regression and inventory.
Actual: 187 PASS / 0 FAIL / 0 skipped; tests exit 0 and inventory exit 0. VERIFIED local automated run only.
Evidence: evidence/mac-hub-test-2026-10-25T17-16-58-341Z/tests.tap, inventory.txt, outcome.json, environment.json.
No Google operation, deployment, live read/write or browser verification performed by this installer.
