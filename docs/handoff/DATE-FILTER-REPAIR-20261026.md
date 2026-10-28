# TEST date transition: native failure, bounded repair and preflight guard

Owner code checkpoint: 335369d / AUD-074. Native date save returned SAVE_UNCERTAIN with backup BKP-20261026-094215-63fa2fcb. This remains a failed verification, not a successful reset qualification.

Direct reads of the exact Identity TEST workbook confirmed Control A2 = 26/10/2026 and B2 = 26/10/2026 09:42, three retained A/B name corrections and Jonathan's IN/JA/message/HUB status record. Tonight list was empty. Immutable backup SNAPSHOT preserved the prior formula: its lower timestamp bound was Control!B2 (LAST RESET), not Control!A2 (selected calendar day). Jonathan's 09:12 registration was therefore excluded after resetting B2 to 09:42. The previous fake membership fixture modeled selected-day semantics and failed to represent this real formula dependency; local 263 PASS did not qualify that native behavior.

Repair applied directly to TEST only, without repeating the reset: TONIGHT'S PLAYERS A2 formula changed only its lower-bound reference from Control!B2 to Control!A2. C2 set IN for the sole verified target-day player, Jonathan. Field masks changed only userEnteredValue, preserving formatting/validation. Control A2/B2, backup tabs, status store, master list and response history were not rewritten by the repair. Full master A1:A990 and response A1:F162 reads matched the corresponding backup copies before repair and remained unchanged afterward.

Native readback: Jonathan Niemi / IN / JA / original 101-character message / HUB now appears in Tonight's Players. Original source message compared exactly with backup target. This confirms data-level recovery; full Hub long-message browser acceptance and subsequent complete date-save verification remain pending.

Code fix: private HubTestEventSave.gs snapshot preparation now requires the exact reviewed day-based spill formula. A workbook with the former B2 cutoff or an unknown formula is rejected before backup/reset, rather than modifying an unreviewed formula. No automatic formula migration or mutation retry is introduced.

Evidence: evidence/date-filter-fix-20261026/native-repair.json with actual native operation/readback, plus native failure/control screenshots. Real formula recorded in tests/fixtures/tonight-event-formula.json. The new legacy-formula regression failed before the guard (retained guard-before.tap) and passes afterward. All 264 tests and inventory pass. Upload only HubTestEventSave.gs after installation. No reset/re-save of the current event is needed.

Production untouched. Backup restoration rehearsal and cross-project concurrency remain unqualified.
