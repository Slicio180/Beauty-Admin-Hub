Beauty recovery — import recovered natively; readback comparison and display test,15 November2026

NEW OWNER NATIVE EVIDENCE (Stockholm)
07:26:54: STANDALONE_IMPORT_PREVIEW_READY, t_xeWf_2939, BEAUTY TEST TRANSFER 1411, provider entry HQzG. Two planned fixture source rows, IN/N/A/NAKKA. No provider writes; original event tabs/Hub binding unchanged.
07:29:37 CONFIRM: STANDALONE_IMPORT_REVIEW, job6fb2c0b826c645db8c9edcf48e62f797. sheetsWriteAttempts1,providerWrites0,displayFailureInjected=false. Error: The saved result is not yet verified. Use RECHECK after inspecting it. Original event tabs/transfer fixtures/Hub binding/production unchanged. This was EARLIER than intended display failure; not counted as planned display-fault test success.
07:31:15 RECHECK: STANDALONE_IMPORT_VERIFIED, same job, sheetsWriteAttempts still1,providerWrites0,displayFailureInjected=false. Imported source/display verified, consent N/A, original Nakka registration time unknown. Original event tabs/transfer fixtures/Hub binding/production unchanged. No repeated append.
Conclusion: real-Nakka-read/native-Sheets-fixture import recovery PASS. First readback cause UNDETERMINED; deliberate display-failure scenario NOT YET TESTED natively. Full production Hub integration remains open.

INVESTIGATION
Code path: discarded Sheets response throws inside beautyEventSheets_ adapter before the core's following SpreadsheetApp.flush() call. A cached/stale SpreadsheetApp read is plausible; the available native logs do not capture the first response or row values and cannot prove that cause. Google documents flush as applying pending spreadsheet changes, not a guarantee to invalidate every external-API read cache: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#flush(). No production fix or cache diagnosis is claimed.
Next diagnostic compares CURRENT completed source rows through SpreadsheetApp and Sheets values:batchGet (UNFORMATTED_VALUE/SERIAL_NUMBER), reporting only mismatch column numbers. It cannot reconstruct the historical first readback or prove why it failed.

NEW DELIVERABLE (NOT INSTALLED)
Beauty-TEST-Import-Display-Check-20261115.cjs adds BeautyImportDisplayTest20261115.gs against exact32-file TEST baseline. Preserves existing source/deployment; backup/readback/no automatic repeat upload. No functions run by installer.
Uses the existing BSI1511 import fixture. Creates no extra fixture tabs, appends no source rows, makes no Nakka changes. Requires completed existing import of HQzG and keeps its receipt byte-for-byte unchanged. Separate BID1511 diagnostic ticket/fault/job/result properties preserve test evidence.

OWNER STEPS
1. Run node "$HOME/Downloads/Beauty-TEST-Import-Display-Check-20261115.cjs".
2. After successful installation refresh TEST editor, select BeautyImportDisplayTest20261115.gs, run beautyTestImportDisplayPreview20261115. Return both IMPORT_READBACK_COMPARISON and IMPORT_DISPLAY_PREVIEW_READY logs. Current readers must both match expected source values. Preview writes only its ticket, no cell/provider changes.
3. After review, run beautyTestImportDisplayConfirm20261115 within10 minutes. Only the synthetic player's IN status cell in BSI1511_Display is cleared after durable intent. Production import core then encounters deliberate refresh failure using a copied diagnostic receipt. Expected IMPORT_DISPLAY_RECOVERY_REVIEW with displayFailureInjectedThisRun=true and displayFaultWasApplied=true. sourceWriteAttemptsDuringThisTest0,providerWrites0. Return log.
4. Run beautyTestImportDisplayRecheck20261115. Expected IMPORT_DISPLAY_RECOVERY_VERIFIED; displayFaultWasApplied=true; no source append or provider write. The fixture display is rebuilt using existing native import adapter. Original import receipt remains unchanged. A missing/changed receipt/source or failed preservation check stops; never delete receipts to retry.

LOCAL EVIDENCE
19 local diagnostic/native-adapter simulations PASS;8 installer tests PASS;combined TEST source syntax PASS. Tests include both-reader match/mismatch/HTTP/layout failures, actual deliberate display interruption and restore, no extra source batch/provider write, repeated confirmation, auth/project/context/lock, expiry, original-receipt/source/event changes, journal failure and missing receipt. Native run pending.

SCOPE / REMAINING
Standalone transfer and recheck native PASS. Standalone import recovery native PASS, first readback cause OPEN, controlled display fault native PENDING. These use production core through isolated fixture adapters; actual Hub UI/authenticated routing, form/formula adapter, after-start import, league recovery, remaining partial/legacy/competition operations and production speed are OPEN. Production last verified Hub34/Mobile34/Kiosk61 with eight matched players; no production change or GitHub push. Latest verified GitHub checkpoint53076ac4789135fc353ad1ec39de825b310a8c41.
