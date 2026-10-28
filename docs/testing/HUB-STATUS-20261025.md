# Identity TEST status connection — 2026-10-25

Starting Mac checkpoint: 9ac46d4. No production changes or Google operations by the assistant.

## Scope and behavior

HubTestStatus.gs adds a separately gated private handler to the same Remote Identity TEST project. The main bridge checks exact script and spreadsheet IDs, then routes status to this handler. Inputs must contain only player, status, expectedStatus and eventDate; statuses are IN/OUT/STANDBY. The handler rejects wrong dates, stale current status in either sheet, missing/duplicate player matches, non-STATUS C headers, >1000 rows and formulas in either target C cell. It never creates missing players or replaces formulas.

The same script lock as Remote/Hub registration encloses reads, two target C writes, flush, both readbacks and Hub snapshot verification. It changes no consent, message, source, other-player or registration-response cells. A repeated identical state verifies without writes. Two writes are not transactional: partial failure is SAVE_UNCERTAIN, with no automatic retry or rollback. Reload and inspect both status cells before another attempt. The legacy unbounded status RPC remains private and unused.

The TEST client serializes RPCs, carries event date/previous status, retains a pending value during refresh, disables that player's control during save, then displays only the verified server snapshot. Failure clears pending state, shows the existing message popup and reloads backend truth. The former 12-second optimistic expiry is absent from this TEST handler. This is local fixture coverage until manually checked in Google. Original public/js/app.js, offline preview transport and production/candidate/kiosk source are unchanged.

## Google upload after successful Mac installation

Use only Beauty — Remote Identity TEST, script ID 1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N.

1. Replace existing HubTestBridge.gs with apps-script/registration-identity-test/remote-app/HubTestBridge.gs.
2. Add Script file HubTestStatus; paste HubTestStatus.gs from that folder.
3. Replace existing HubTest.html with that folder's regenerated HubTest.html. Save all files. Code.gs, RemoteRegistration.html and owner-only manifest stay as they are.
4. Reload the existing /dev?page=hub page. The banner should state that status changes save in the test sheet.

## Manual check pending

Use only Albert Lindblad (Hubtest), whose initial state is IN / JA / TEST-HUB-002. / HUB. Record the seven-player/row-161 baseline. Change IN -> STANDBY, wait for completion and a refresh, reload manually, verify both PLAYER STATUS DATA C and TONIGHT'S PLAYERS C show STANDBY. Repeat OUT then IN sequentially. Confirm no flashback, no new Form responses 2 row, unchanged consent/message/source, unchanged original Albert and player count seven. Preserve screenshots and report exact observed results. Do not mark this pass based solely on local tests.

Do not perform simultaneous kiosk/Hub/Remote tests yet: kiosk uses another project lock. Direct Sheets edits also bypass the script lock. Do not edit Control during status testing. Shared-computer login/roles and production deployment are not qualified.

## Rollback

Installer prints backup directory with original replaced files under before/ and original audit/config. Restore those files and remove new files identified by before:null in the installer manifest if needed, preserving evidence. Google rollback separately requires restoring old HubTestBridge/HubTest and removing HubTestStatus. Local rollback alone does not change Google.

## References and evidence

Official APIs: https://developers.google.com/apps-script/reference/lock/lock-service and https://developers.google.com/apps-script/reference/lock/lock and https://developers.google.com/apps-script/reference/spreadsheet/range .

Evidence: evidence/hub-status-20261025/. Fifteen new cases pass; full 202 pass, inventory 202 across 11 files. All remote services are fake in these tests. Initial red results and dispositions are retained.
