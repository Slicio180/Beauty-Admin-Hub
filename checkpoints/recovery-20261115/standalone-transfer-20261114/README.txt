Beauty recovery — standalone native transfer candidate, 14 November 2026

VERIFIED EVIDENCE
Owner21:56:27 log: TEST_NAKKA_EVENT_READ_ONLY_VERIFIED for league lg_M2wQ_4189 (Beauty TEST — DO NOT USE LIVE), event t_gINp_8026 (AIK Hub TEST 2026-11-07), status40. Two provider GETs; admin league access confirmed; original binding unchanged before/after; no writes. The binding subreports show providerEventVerified=false because each checks only Sheets; final aggregate provider result is true.
Current transfer core allows only status10/20, so status40 is ineligible.
Owner created new event URL https://n01darts.com/n01/tournament/comp.php?id=t_xeWf_2939 and explicitly confirmed STANDALONE. Screenshots22:09–22:10 show exact title 'Beauty Recovery TEST 2026-11-14.' (trailing full stop), Accepting entries, empty list, Start Date2026-11-14 23:06 as displayed. No league membership is assumed from URL shape. New event API verification PENDING; installer never changes active Hub binding.

NEW INSTALLER (NOT DEPLOYED)
Beauty-TEST-Standalone-Transfer-20261114.cjs adds BeautyStandaloneTransferTest20261114.gs. Exact30-file TEST baseline, existing deployment preserved, full backup/readback, no function execution or player mutation by installer.
Native package uses unchanged selected Hub34 LiveRecovery functions (state, step and run, plus dependencies) inside a closed factory with isolated adapters. Core hash/function list in source-evidence.json. No route replacement, no production change, no claim that Hub UI/import are implemented or tested by this package.

OWNER STEPS
1. Run node "$HOME/Downloads/Beauty-TEST-Standalone-Transfer-20261114.cjs".
2. On TEST_LAB_INSTALLED or ALREADY_INSTALLED refresh TEST editor, select BeautyStandaloneTransferTest20261114.gs, run beautyTestStandaloneTransferPreview20261114.
3. Send preview log. Expected STANDALONE_TRANSFER_PREVIEW_READY. Preview checks actual provider identity, standalone lgid empty, exact title/date, owner access, singles and status10/20; requires empty provider entries. Creates five marked BST1411 fixture tabs in existing TEST workbook plus scoped receipts. No provider POST, original event row changes or binding change.
4. After reviewing that preview, owner may run beautyTestStandaloneTransferConfirm20261114 within10 minutes. It adds exactly one synthetic entry 'BEAUTY TEST TRANSFER 1411' to t_xeWf_2939. It deliberately discards the POST reply (even success); the existing transfer core must verify by GET. Expected STANDALONE_TRANSFER_VERIFIED,providerWriteAttempts1. This is a REAL Nakka TEST entry, intentionally retained. No league player or deletion.
5. Run beautyTestStandaloneTransferRecheck20261114 to verify the same saved entry with providerWriteAttempts remaining1. Never re-register the synthetic name. Absent/uncertain save remains REVIEW with durable single-attempt barrier; no automatic repeat POST. If confirmation expires before any job/attempt exists, preview can be run again. Do not delete tabs/properties to bypass a stop.

SAFETY / SCOPE
Owner-only fixed TEST project and unchanged original test context/revision; actual ScriptLock; exact standalone provider pin; only two approved GET endpoints and one exact synthetic add payload. No caller-provided targets or names, no league writes, no removal, no import, no original event tab writes. Credential values never logged. Separate BST1411 properties preserve old receipts. Preview expiry and one-use consumption, write-ahead job/attempt records, readback, original and fixture hash preservation. Existing/partial fixture setup is not overwritten. Started/changed event or workbook stops. Recheck cannot initiate a new write when no provider intent was recorded.
Fixture snapshots use actual Sheets data through isolated adapter; production schema/formula adapter and UI are NOT tested here. The native preview/confirm/recheck runs are PENDING.

LOCAL EVIDENCE
27 native-adapter simulations PASS, including provider saved/lost/absent responses, delayed readback recovery, original data preservation, changed targets/date/status, auth/lock, stale preview, interrupted journal, repeat confirmation and recheck.8 installer tests PASS, including changed source/access, concurrent edits, lost upload reply with readback and absent upload. Combined30-file baseline plus candidate server syntax PASS. These35 checks are local simulations, not native Nakka result evidence.

CURRENT STATUS
Prior native Sheets fixture suite9/9 PASS; partial-removal containment proven, repair still pending. Old real TEST Nakka event identity PASS. New standalone provider identity and transfer: PENDING. Real import, TEST Hub UI integration, remaining partial/legacy/competition recovery and production speed remain OPEN. Production last verified Hub34/Mobile34/Kiosk61, eight matched players untouched. Last GitHub checkpoint remains53076ac4789135fc353ad1ec39de825b310a8c41; no push this turn.
