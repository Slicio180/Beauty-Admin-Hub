# LIVE workbook repair — 16 November 2026

## Changes already made and verified in the original Google spreadsheet

Workbook: https://docs.google.com/spreadsheets/d/1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM/edit

- The existing BEAUTY EVENT HISTORY tab now shows the 253 historical response rows in H1:M254, including the original six headers. Values match the checksum-verified archive from 21 September through 9 November. Technical archive columns A:F are unchanged; technical columns are hidden.
- All 24 REMOVE and 5 POOL tabs are hidden. Their original contents, notes, validation and formatting were read back and preserved exactly.
- The 29 recovery tabs were reduced from 1,000 by 26 cells each to 20 by 2, after every cell was checked. This frees 752,840 empty grid cells. No recovery tab or saved record was deleted.
- The 94-name master list and current registration data were not modified. No new spreadsheet or tab was created.
- Control!A2 still reads 8 November 2026. The actual Hub selected-event context has not been read or changed: the Hub rejected the secure browser sign-in. Never change Control!A2 alone to simulate an event switch.

`before-readable-history.json`, `before-recovery-tab-compaction.json`, and `direct-sheet-repair-verified.json` preserve the bounded before-state and verified outcome. They contain private registration history and must remain with the owner.

## Permanent source fix — prepared, not published

The owner-run installer is based on the exact version 40 release previously confirmed by the owner. It changes LiveEventSwitch, LivePlanner and LiveRemove and adds LiveWorkbookHistory. The other 27 existing files are preserved.

- Future removal and pool recovery records go in P:U of the existing BEAUTY EVENT HISTORY tab. Those columns stay hidden. No per-operation REMOVE or POOL tab is created.
- All three pool recovery readers support both the new central records and existing hidden legacy tabs. Old receipts remain valid.
- Event switching maintains readable registration history in H:M, preserving original row multiplicity while avoiding repeated copies of the same saved snapshot.
- Record checksums, exact readback, shared locking by the existing callers, and uncertain-write handling are preserved. No Nakka mutation is added by this repair.
- The installer verifies source and published baseline, saves a local backup, preserves unrelated files, uploads once, reads back, and publishes the fixed existing deployment. A changed baseline stops before uploading. No Beauty function is executed by the installer.

Download Beauty-LIVE-Workbook-Repair-20261116.cjs to Downloads, then run:

```sh
cd ~/Downloads && node Beauty-LIVE-Workbook-Repair-20261116.cjs --approve-live
```

Until the owner returns PRODUCTION_DEPLOYED_VERIFIED, the source fix remains PREPARED_NOT_PUBLISHED and version 40 can still create further recovery tabs. The direct spreadsheet repairs above are already applied.

## Focused validation

Eight local history/recovery checks passed, including Unicode/multipart records, old receipt compatibility, corruption rejection, lost-reply readback, original duplicate-row preservation and readable-history header protection. Five release checks passed. No remote test registration, removal, event creation or pool operation was run.

## Remaining live action

In the owner's signed-in Hub, select the existing AIK Monday event for 16 November through League / Tournament, Check for event, Start Event. This uses the normal guarded switch to keep the Hub context and Control date together. Then verify the Hub date and Control!A2 agree. Current sign-in failure is a blocker, not evidence that the date was repaired.

No GitHub sync or canonical Beauty-Handover.zip replacement was performed for this repair. This complete checkpoint preserves the source, installer, before-state and verification results independently.
