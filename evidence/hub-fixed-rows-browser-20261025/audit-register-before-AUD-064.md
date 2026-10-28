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

### AUD-037
Recorded: 2026-10-25T17:35:05.631Z.
Source checkpoint: e3dbd16.
Scope: Identity TEST Hub rendering, registration and reload persistence.
Expected: five existing players load; one registration creates one response
and a sixth event entry with source HUB.
Actual: PASS for observed checks. Albert Lindblad saved in row 160,
25/10/2026 18:28:42; NEJ; TEST-HUB-001; HUB.
Hub shows six players and Albert IN. User confirmed personal page reloads.
Backend displays TEST CONNECTED; Nakka unavailable as configured.
Evidence: evidence/mac-hub-browser-20261025/manual-review.json; listed chat screenshots.
Screenshot copies in project pending. Dedicated TEST only.

### AUD-038
Recorded: 2026-10-25T17:35:05.631Z.
Source checkpoint: e3dbd16.
Scope: Hub duplicate rejection and preservation of existing registration.
Expected: duplicate rejected; no extra response; original details unchanged.
Actual: PASS. Already-registered popup observed. Hub retains six players;
Albert remains IN, NEJ, TEST-HUB-001, HUB. Response sheet still ends at row 160.
Evidence: evidence/mac-hub-browser-20261025/manual-review.json; screenshots 18.31.45,
18.32.29 and 18.33.34.
No full workbook comparison. Distinct-person Hub flow, concurrency,
status writes and production qualification remain pending.

### AUD-039
Recorded: 2026-10-25T17:45:09.542Z.
Source build: e3dbd16; evidence checkpoint: dfb35df.
Scope: Hub TEST confirmed distinct-person registration with same-name detail.
Expected: one separate response/master/event player; preserve original.
Actual: PASS for observed sequential TEST storage and display. Response row 161,
25/10/2026 18:36:34: Albert Lindblad (Hubtest), JA, TEST-HUB-002., HUB.
Master rows 3/4 store original and distinct names separately; event list has seven
players. Original Albert remains IN, NEJ, TEST-HUB-001, HUB; row 160 unchanged.
Final screenshots supplied after requested reload check show seven players and both
Alberts. Reload action was not separately confirmed in text for this check.
Evidence: evidence/mac-hub-browser-20261025/same-name-review.json and screenshot-manifest.json.
Qualification: dedicated TEST observations only; no full workbook comparison,
concurrency, status-write, shared-computer login or production qualification.

### AUD-040
Recorded: 2026-10-25T17:45:09.542Z.
Scope: preserve fourteen screenshots supporting Hub TEST connection and AUD-037–039.
Actual: 14 files present; PNG signatures, byte sizes and SHA-256 hashes checked.
Original names mapped to stored names in evidence/mac-hub-browser-20261025/screenshot-manifest.json.
Prior AUD-037–038 screenshot-copy requirement resolved. Earlier manual-review.json
preserved unchanged; this entry supersedes its historical pending-copy note.
Backup: backups/hub-browser-evidence-before-2026-10-25T17-45-09-542Z.
No application source change, new runtime test, Google operation or deployment
performed by this evidence installer. TEST provisioning status metadata updated only.

### AUD-041
Recorded: 2026-10-25T17:58:15.768Z. Source checkpoint: 9ac46d4.
Scope: prepare bounded Identity TEST Hub status writes and remaining-stage checklist.
Expected: exact project/sheet, boolean gates, event/previous-status/unique-player/
formula checks before writes; modify only selected existing C cells, verify both
readbacks and Hub snapshot; preserve all other fields; no automatic mutation retry.
Actual: VERIFIED locally with fake services/UI/serialized RPC. 15 new cases PASS;
full suite 202 PASS / 0 FAIL. Initial wrong-cwd bridge invocation and one initial
malformed-input test expectation failure are retained and explained in evidence.
Evidence: evidence/hub-status-20261025/.
Backup: backups/hub-status-before-2026-10-25T17-58-15-768Z. Google upload and actual status cycle/reload checks pending.
Old Event Control TEST gates, production, kiosk/candidate and offline public pages
unchanged. Two cell writes are not transactional; uncertain partial saves require
inspection. Kiosk cross-project concurrency and shared-computer login unresolved.

### AUD-042
Recorded: 2026-10-25T17:58:24.844Z.
Scope: Mac installed status source regression and inventory.
Actual: 202 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-hub-status-2026-10-25T17-58-15-768Z/tests.tap, inventory.txt, outcome.json, environment.json.
Qualification: local automated suite only. No Google operation, deployment or
browser status verification performed by this installer.

### AUD-043
Recorded: 2026-10-25T18:14:13.458Z. Source checkpoint: 1ad8faf.
Scope: dedicated Identity TEST Hub sequential IN -> STANDBY -> OUT -> IN cycle.
Expected: statuses survive waits/manual reloads without flashback, preserving
consent/message/source, original Albert and player count; both stored statuses IN.
Actual: PASS for observed checks. User explicitly confirmed STANDBY survived
30 seconds and manual reload without flashback. User confirmed OUT and return
to IN behaved as expected under the same instructed wait/reload checks.
Final status-storage row 11 and Tonight's Players row 4 both show Albert Lindblad
(Hubtest), IN, JA, TEST-HUB-002., HUB. Seven event players remain visible.
Original Albert remains IN, NEJ, TEST-HUB-001, HUB in both provided views.
Evidence: evidence/mac-hub-status-browser-20261025/manual-review.json and screenshot-manifest.json.
Limitations: OUT/intermediate stored values have no separate screenshot; timing
is user-reported. No complete workbook comparison or response-row-count recheck.
Event Control, cross-project concurrency, shared-computer login and production
qualification remain pending.

### AUD-044
Recorded: 2026-10-25T18:14:13.458Z.
Scope: preserve three screenshots supporting AUD-043.
Actual: three PNG signatures, byte sizes and SHA-256 hashes verified. Original
names mapped in evidence/mac-hub-status-browser-20261025/screenshot-manifest.json.
Backup: backups/hub-status-evidence-before-2026-10-25T18-14-13-458Z.
No application source change, Google operation, deployment or new runtime test
performed by this evidence installer. TEST provisioning status metadata only.

### AUD-045
Recorded: 2026-10-25T18:27:04.740Z. Source checkpoint: 8ddc4ef.
Scope: connect read-only Event Control inspection popup to Identity TEST Hub.
Expected: pinned project/sheet; bounded reads; show current Control and legacy
reset-effect counts; flag layout/date/formula/source caveats; no save action.
Actual: VERIFIED locally with fake sheets/DOM. Ten new cases PASS; full 212 PASS.
Opening, local date editing, cancellation and late responses perform no mutation.
Evidence: evidence/hub-event-inspection-20261025/.
Backup: backups/hub-event-inspection-before-2026-10-25T18-27-04-740Z.
Google summary and cancel review pending. This is inspection only, not qualified
reset preflight or permission to write. Event writes remain unavailable. Older
Event Control TEST source/gates, production, kiosk/candidate and offline pages unchanged.

### AUD-046
Recorded: 2026-10-25T18:27:14.004Z.
Scope: Mac installed Event Control inspection regression and inventory.
Actual: 212 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-hub-event-inspection-2026-10-25T18-27-04-740Z/tests.tap, inventory.txt, outcome.json, environment.json.
Qualification: local automated suite only. No Google operation, deployment or
browser inspection performed by this installer.

### AUD-047
Recorded: 2026-10-25T18:54:24.193Z. Source checkpoint: db42730.
Scope: observed first read-only Event Control inspection popup in Google TEST.
Actual: current date 25/10/2026, last reset 24/10/2026 20:23, Europe/Berlin,
seven players, response row 161; legacy plan deletes seven status rows, retains
three correction rows, clears nine C:E cells and retains F sources on two rows.
Save visibly disabled. Screenshot PNG signatures, sizes/hashes preserved under
evidence/hub-english-date-review-20261025/inspection-screenshots/ and inspection-manifest.json.
Qualification: observed loading/display only. Cancel/full no-write comparison
not performed; no reset or readiness-for-writes qualification.

### AUD-048
Recorded: 2026-10-25T18:54:24.193Z. Source checkpoint: db42730.
Scope: user-requested English Hub, Swedish remote/kiosk preservation, simplified
Event Control and separate Event Details sidebar, accidental-date review guards.
Actual: VERIFIED locally. Checkbox, changed valid date, exact typed date and final
review required; editing/back/reopen clear confirmation. Save remains disabled;
no event-write handler exists. Password reauthentication/session security pending.
Protected source hashes verified; canonical JA/NEJ/MOBIL and player data retained.
Prior Swedish-copy assertion failure preserved and explained; full suite 227 PASS.
Evidence: evidence/hub-english-date-review-20261025/. Backup: backups/hub-english-review-before-2026-10-25T18-54-24-193Z.
Google English visual/review/cancel verification pending. No application changes
to Swedish remote/kiosk sources or qualified status server; no production operation.

### AUD-049
Recorded: 2026-10-25T18:54:33.724Z.
Scope: Mac English Hub/date-review regression and inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-hub-english-review-2026-10-25T18-54-24-193Z/tests.tap, inventory.txt, outcome.json, environment.json.
Qualification: local automated checks only. No Google upload, date change,
password check, deployment or browser verification performed by this installer.

### AUD-050
Recorded: 2026-10-25T20:55:58.718Z. Source checkpoint: e23ce9c.
Scope: simplify Hub sidebar and replace typed-date input with checkbox + confirmation popup.
Actual: VERIFIED local checks; 227 PASS / 0 FAIL. Popup identifies old/new dates
and reset consequences. Cancel/edit/reopen clears acknowledgement. Confirmation
remains disabled; no event-save RPC was added. Dashboard player table/Event Control
remain, sidebar uses Event Control Details and places Beauty Live below Dashboard.
Beauty Live names-only, auto-refresh, sort modes and optional Nakka statistics
recorded as requirements, not implemented casting functionality.
Evidence: evidence/hub-menu-date-popup-20261025/; initial label-assertion failure
retained and explained in disposition.txt. Backup: backups/hub-menu-date-popup-before-2026-10-25T20-55-58-718Z.
Protected Swedish remote/kiosk, status and event inspection server sources unchanged.
No Google operation performed; browser review pending.

### AUD-051
Recorded: 2026-10-25T20:56:09.917Z.
Scope: Mac sidebar/date-popup regression and inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-hub-menu-date-popup-2026-10-25T20-55-58-718Z/tests.tap, inventory.txt, outcome.json, environment.json.
Qualification: local automated checks only; Google upload and browser review pending.
No date save, production write, deployment or push performed by this installer.

### AUD-052
Recorded: 2026-10-25T21:04:41.976Z. Source checkpoint: 8de8e42.
Scope: Google Identity TEST Hub date confirmation, cancellation/reopen and English Event Control Details.
Actual: PASS for observed UI states. Confirmation names 25 to 26 October and warns of reset; confirm disabled.
Cancel clears acknowledgement and disables review while retaining proposed 26 October.
Reopen restores 25 October, unchecked acknowledgement and disabled review.
Event Control Details shows correct TEST sheet, Europe/Berlin, en_GB, current date 25 October,
last reset 24/10/2026 20:23, 7 players and response row 161; legacy effects 7 delete,
3 retain, 9 C:E clear and source-F warning on 2 rows, matching prior inspection.
Evidence: evidence/mac-hub-date-review-20261025/manual-review.json and screenshots.
Qualification: observed screenshots only; no full workbook before/after comparison.
Sidebar order obscured, not independently visually verified. No date save performed;
legacy F-source policy, login, concurrency, Beauty Live and production qualification pending.

### AUD-053
Recorded: 2026-10-25T21:04:41.976Z.
Scope: preserve four screenshots supporting AUD-052.
Actual: PNG signatures checked during packaging; all four file sizes and SHA-256 hashes
recorded and verified during installation. Evidence: evidence/mac-hub-date-review-20261025/screenshot-manifest.json.
Backup: backups/hub-date-review-evidence-before-2026-10-25T21-04-41-976Z. Application source and Google apps unchanged by this installer.

### AUD-054
Recorded: 2026-10-25T21:15:46.116Z. Source checkpoint: b8fde18.
Scope: original AIK Dart top logo + EVENT HUB title; full Måndagsdartarna/GoDartsPro artwork between date and Event Control; system dot beside sidebar System Status and enlarged player counter at far right.
Actual: source-order/embedded-image checks and 227 local regression cases PASS.
Original uploaded AIK Dart logo preserved byte-for-byte; supplied event logo matches existing artwork exactly.
CSS frames original transparent padding and provides responsive wrapping. Grey sidebar dot is explicitly not checked and has no monitoring logic yet. Count/PLAYERS type enlarged and aligned right. No pixel-level visual claim.
Evidence: evidence/hub-header-20261025/validation.json, full-regression.tap and inventory.txt.
Backup: backups/event-hub-header-before-2026-10-25T21-15-46-116Z. Google upload and browser size/layout review pending.
No backend, Swedish remote/kiosk, registration/status server or production change; event saving still disabled.

### AUD-055
Recorded: 2026-10-25T21:15:58.238Z.
Scope: Mac Event Hub header regression/inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0, inventory exit 0.
Evidence: evidence/mac-event-hub-header-2026-10-25T21-15-46-116Z/tests.tap, inventory.txt, outcome.json and environment.json.
Qualification: local checks only; Google HTML upload and browser review pending.

### AUD-056
Recorded: 2026-10-25T21:22:18.943Z. Source checkpoint: 64976db.
Scope: full Dashboard header/sidebar review and user-requested branding-size refinement.
Observed screenshot 22.17.49: original AIK Dart top logo + EVENT HUB, full event artwork
between date and Event Control, player tile right and correct simplified sidebar;
Beauty Live directly under Dashboard, Event Control Details and grey System Status dot visible.
User requested larger top branding and slightly larger/more centred event logo.
Change: CSS sizing and grid spacing; original images and backend untouched.
227 local regression cases and inventory PASS. Revised visual rendering pending.
Evidence: evidence/hub-header-size-20261025/ including screenshot hash/size, original screenshot,
full-regression.tap and inventory.txt. Backup: backups/event-hub-branding-size-before-2026-10-25T21-22-18-943Z.
Qualification: source/local checks plus prior screenshot only; no revised browser qualification,
date saving, production changes, deployment or push by this installer.

### AUD-057
Recorded: 2026-10-25T21:22:27.028Z.
Scope: Mac branding-size regression and inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-event-hub-branding-size-2026-10-25T21-22-18-943Z/tests.tap, inventory.txt, outcome.json and environment.json.
Google HubTest.html upload and browser visual review pending.

### AUD-058
Recorded: 2026-10-25T21:36:05.881Z. Source checkpoint: 6db0dc1.
Scope: user-requested enlargement of EVENT HUB as primary title plus compact event-date row.
Change: CSS title scales from 68px to 110px on wider screens; 68px at working widths
up to 900px and 58px on narrow screens. Small branding gap adjustment preserves room.
Event logo CSS frames original transparent margins to reduce row height and bottom gap; complete Måndagsdartarna/GoDartsPro artwork is preserved. Original PNGs, player tile and backend unchanged. Screenshot 22.32.17 and geometry/review notes preserved in this evidence folder.
Actual: 227 local regression cases and inventory PASS; no new mirror tests for CSS.
Evidence: evidence/event-hub-compact-header-20261025/full-regression.tap and inventory.txt.
Backup: backups/event-hub-title-before-2026-10-25T21-36-05-881Z. Google upload and actual title rendering/fit review pending.
No claim of completed visual verification, no date save or production operation.

### AUD-059
Recorded: 2026-10-25T21:36:17.395Z.
Scope: Mac primary-title regression and inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-event-hub-title-2026-10-25T21-36-05-881Z/tests.tap, inventory.txt, outcome.json and environment.json.
Google HubTest.html upload and browser visual review pending.

### AUD-060
Recorded: 2026-10-25T21:44:40.448Z. Source checkpoint: 565d11f.
Scope: user screenshot 22.40.28 review and Hub operational typography enlargement.
Observed: full dashboard shows requested branding/compact row; user identifies operational text as too small.
Change: player cells 22px, sidebar/status/consent/main actions 20px, table headings 17px,
section heading 28px, date 32px, labels 16px and health text 18px.
Original AIK fonts, logos, title, tile, sidebar dot, server sources and stored data unchanged.
Long cells wrap; table retains horizontal scrolling at narrow widths with min-width 1050px.
Actual: 227 local regression cases and inventory PASS. Revised readability/wrapping/fit review pending.
Evidence: evidence/hub-readability-20261025/ including screenshot/hash, review.json,
full-regression.tap and inventory.txt. Backup: backups/hub-readability-before-2026-10-25T21-44-40-448Z.
Qualification: prior screenshot plus local checks only; no revised browser verification,
backend write, event reset, production operation, deployment or push by installer.

### AUD-061
Recorded: 2026-10-25T21:44:49.687Z.
Scope: Mac Hub readability regression and inventory.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Evidence: evidence/mac-hub-readability-2026-10-25T21-44-40-448Z/tests.tap, inventory.txt, outcome.json and environment.json.
Google HubTest.html upload and browser readability review pending.


### AUD-062
Recorded: 2026-10-25T22:15:12.146Z. Source checkpoint: 25c5a7a8064f9e5e691b6262c084e207674c8af4.
Scope: TEST Hub white 24px column headings and independently scrolling player list.
Expected: Register Player controls remain above the scrolling list; column headings
remain visible at the top of that list. Original AIK fonts and logos retained.
Installation: PASS; before/after SHA-256 and backup path recorded in installation.json.
Actual local checks: 227 PASS / 0 FAIL / 0 skipped; retry exit 0; inventory exit 0.
Initial test capture failed with ENOBUFS; incomplete output and failure retained.
Retry streamed output directly to file and completed successfully.
Environment: Node v22.23.2.
Evidence: evidence/hub-fixed-rows-2026-10-25T22-07-51-966Z/installation.json, checks.json, tests.tap,
inventory.txt, tests-retry-1.tap and tests-retry-1.json.
Qualification: automated regression only; sticky-row behaviour, wrapping, STANDBY fit,
Google TEST upload and browser visual review PENDING.
Preparation browser check could not run because its Chromium executable was unavailable.
No production changes or deployment performed by the installer. Git checkpoint pending.


AUD-062 correction — 2026-10-25T22:20:23.524Z
Post-test hash check found HubTest.html restored to its pre-update hash;
the fixed-row marker was absent. Inspection identified the reproducibility
test rebuilding HubTest.html from shared source. Earlier 227 PASS therefore
does not verify the proposed CSS update. Original evidence retained.
Correction: move prepared CSS into public/css/hub-test-event-control.css and regenerate apps-script/registration-identity-test/remote-app/HubTest.html.
Backup: backups/hub-fixed-rows-source-before-2026-10-25T22-20-22-707Z.
Evidence: evidence/hub-fixed-rows-source-2026-10-25T22-20-22-707Z/build.txt.
Build exit: 0. Regression, inventory and browser review PENDING.
No Google upload, production change or deployment performed by this command.

### AUD-063
Recorded: 2026-10-25T22:22:20.790Z.
Scope: corrected fixed-row CSS source and regenerated TEST Hub.
Actual: 227 PASS / 0 FAIL / 0 skipped; tests exit 0; inventory exit 0.
Generated HTML SHA-256 unchanged across both checks:
1f0d6b0b9b3000a74b1ff97c3e3c112539d55485de383b23d0f6c572c5df1ac0
Fixed-row CSS marker remains present after rebuilding.
Environment: Node v22.23.2.
Evidence: evidence/hub-fixed-rows-source-2026-10-25T22-20-22-707Z/build.txt, tests.tap, inventory.txt and verification.json.
Backup: backups/hub-fixed-rows-source-before-2026-10-25T22-20-22-707Z.
Qualification: local regression and build reproducibility PASS.
Google TEST upload, browser scrolling/layout review and Git checkpoint pending.
Earlier incomplete verification and correction remain recorded under AUD-062.
No production operation or deployment performed.
