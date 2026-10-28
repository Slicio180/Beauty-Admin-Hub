# Identity TEST Event Control inspection — 2026-10-25

Source checkpoint: 8ddc4ef. This is a read-only inspection stage before preparing event reset writes. No Google operation was performed by the assistant.

## Why inspect first

The preserved legacy reset changes Control A2/B2, deletes status rows without both PLAYER and OLD NAME, retains name-correction rows but clears C:E, and clears Tonight's Players C2:C100. Permanent master names and registration responses remain. Retained correction rows keep source column F under the old rule; the popup warns about this if populated. These are substantive changes, so review the actual TEST layout/counts first. The old adapter's bounded snapshot/canonical comparison, numeric date encoding, one batch and independent readback logic remain preserved and have not been enabled or copied blindly into another project.

## Current scope

Both the header Event Control and sidebar Event Control buttons open one modal in the generated TEST Hub. The server checks fixed script and spreadsheet identities, acquires the same project lock, performs bounded read-only inspections, checks headers/date/timezone/formulas/sizes, and reports actual spreadsheet title/locale/timezone plus current Control display values and reset counts. It never calls setters, clears, appends or deletes. Its RPC accepts no client-selected date, spreadsheet or external configuration. There is no event-save action. Status and registration continue as before. Date editing in this modal is local only; Save is always disabled. Close/Escape/backdrop restore focus and ignore late load responses.

This is not a qualified reset preflight: it does not independently capture all formatting/validation, numeric Control serial/token values, dependencies or complete before/after workbook content. Future membership for a chosen date is not predicted. Review any blocker, retained-source warning and the legacy 99-player range before preparing a writer. No false claim of readyForWrites is returned.

## Google upload after successful Mac installer

Only Beauty — Remote Identity TEST, script ID 1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N:

1. Replace HubTestBridge.gs from apps-script/registration-identity-test/remote-app.
2. Add Script file HubTestEventPreview and paste HubTestEventPreview.gs from that folder.
3. Replace HubTest.html with the regenerated file from that folder. Save all three.

Code.gs, HubTestStatus.gs, RemoteRegistration.html and owner-only manifest stay unchanged. No additional service or permission is required for these existing spreadsheet-scope reads. Reload existing /dev?page=hub, then click Event Control.

## Manual inspection to record

Expected baseline: current event 25/10/2026, seven visible players, last response row 161 (unless another authorized action changed it). Capture the popup showing actual test title/timezone, current date/last reset, reset counts and any review blockers/warnings. Save must be disabled. Edit the local date to 26/10/2026, close without saving, reopen; it should reload the actual 25/10/2026. Verify Control A2/B2, player list and response row unchanged. Do not modify Control directly during this check. Preserve screenshots and observed results in audit; do not infer runtime pass from local fixtures.

Event writes will be a later reviewable update with the reset effects and safeguards made concrete. No production access, deployment or concurrent registration testing is authorized by this inspection package.

## Evidence and rollback

Ten new local cases pass; full suite 212 pass, inventory 212 across 12 files. Evidence under evidence/hub-event-inspection-20261025/. Fake-sheet results do not replace Google observations. Installer makes a backup of replaced files/audit/config and commits only named paths after Mac checks. Restore its before files and remove new files marked before:null to roll back locally; Google rollback is separate (restore old bridge/Hub HTML and remove the new preview Script). Preserve evidence. Old Event Control TEST files and gates remain unchanged.
