# Identity TEST event-date saving

Baseline: owner Mac checkpoint 2ed561f. This block builds TEST functionality; no Google write or deployment has been performed by preparation/installer.

## Behavior

Event Control loads the current date. A changed calendar date and acknowledgement unlock review. TEST review calls a read-only preparation function and displays how many registrations belong to the target calendar date. A second, explicit confirmation saves against the exact reviewed snapshot. Offline demo stays read-only.

Only the approved Identity TEST script and spreadsheet may be used. A server boolean and existing identity-registration gate must both be true. No spreadsheet/project/write-mode selection comes from the browser. The operation uses the same script lock as Hub/remote TEST registration and status changes. Other TEST kiosk projects/manual editors do not share that lock: close those pages and do not edit the spreadsheet during a date transition. Rechecks detect observed drift, but simultaneous external writers are not qualified.

Before changing event data, five complete sheet copies are made in the same TEST workbook (Control, PLAYER STATUS DATA, TONIGHT'S PLAYERS, PLAYER'S MASTER LIST, Form responses 2). A sixth backup tab stores an immutable JSON snapshot in text chunks, because copied formulas may recalculate. Backup names begin BKP- plus timestamp and random suffix. No Drive API/scope is added. A backup failure stops event mutation.

Status rows retain permanent A/B name corrections; old C:F event metadata is cleared, including source column F. Status rows for the target date are reconstructed from unchanged registration history. Target rows already in the store retain manual IN/OUT/STANDBY only if consent, message and source agree with that registration. Exact original response/master records are untouched. No rows/formulas/formats are deleted; clearContent/setValues touch only status-store A:F, Tonight C2:C100 and Control A2/B2. Messages beginning '=' are written as literal text.

Selected-day membership is calculated in the pinned Europe/Berlin timezone. Five players follow existing registration logic; duplicates for the same normalized identity/date block saving rather than choosing silently. Current reset bound is 99 visible players, 1,000 status/tonight rows and 10,000 response/master rows, 2000–2099 dates. Unknown headers, layouts, invalid timestamps, consent values or protected formulas block before event changes.

After changing the date and store, formula membership is polled read-only (up to five reads); only then are Tonight C cells populated. Two readbacks verify target membership/status/consent/message/source, master/history preservation and unchanged formulas/number formats. No mutation is automatically retried. A partially applied or unverifiable save returns SAVE_UNCERTAIN with backup information, keeps confirmation disabled, and requires inspection. Native Google rollback restoration remains untested; do not interpret local fake-service tests as release qualification.

## Google TEST upload — three files

1. Create Script file HubTestEventSave and paste local HubTestEventSave.gs.
2. Replace existing HubTestBridge.gs.
3. Replace HubTest.html; refresh TEST /dev?page=hub.

No changes to Code.gs, kiosk, production, OAuth scopes or app manifest. Do not upload this module into production.

## Controlled browser check

Close other TEST remote/kiosk pages and avoid spreadsheet edits during saving. In Hub Event Control, select 26 October from 25 October and acknowledge. Review must show the target-day player count (expected Jonathan based on supplied evidence). Inspect the count before confirming. Save, then inspect BKP tabs and preserved master/response data, Control date, Jonathan's status/consent/source and full message. Verify list refresh and Pool Planner/Beauty Live follow the selected event. No new duplicate registration is needed.

If SAVE_UNCERTAIN: do not retry. Record the result and backup prefix. Inspect original/current sheets against backup values and immutable SNAPSHOT tab, including formulas before any restoration. The installer does not restore Google data.

## Evidence

263 local tests PASS, inventory PASS; 15 added tests cover prepare/save, identity/gates, input dates, timezone boundary, backups, drift, preservation/long messages, literal formula-like text, duplicate names, readback corruption, UI confirmation/cancel/no-retry. Initial historical assertion failure retained (old test expected no confirmation listener). A fake Hub readback initially omitted the production reader's existing trim behavior; fixture corrected while asserting full message remains intact in the store. Both failures preserved. Native Google execution, backup copies, selected-day formula behavior and browser acceptance remain PENDING.

Supplied screenshots are retained as historical context for compact layout and the date mismatch; they do not qualify the new event save.
