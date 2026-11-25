# QG009 / QG010 TEST acceptance checkpoint

25 November 2026, Europe/Stockholm. LIVE remains unchanged.

## QG009 deployed and verified

Private Release TEST deployment version 13, confirmed by Google at 21:11.
Only the legacy Instructions placeholder blocker was removed.
Google saved LiveHubView.html SHA256 matches local candidate:
1415da33d77b66cceab7ab71a42ef83382d62e078c940b261ea6f96f806a599b

Native authenticated checks after sign-in:
- Instructions opens; 16 chapters. Searching `paused` selects the correct request-limit chapter.
- Recovery overview has no outstanding issues. Opening the existing verified synthetic issue returns `Issue solved`.
- Audience launcher opens the private TEST display, shows 54 synthetic players, the two existing saved groups, and both unpopulated knockout stages with waiting-for-winner state.
- Registration rejects submission without a YES/NO consent selection.
- Selecting an existing synthetic name and NO reaches the duplicate identity dialog. Cancelled before identity confirmation; no new player requested.
- Request Usage loads; 453 attempts observed, TEST budget 2000, background work paused. This is not the Google account allowance.
- Intermittent failed dashboard/monitor reads retain last-good data. Event header later recovers on its normal schedule.

## Concrete blocker and QG010 correction

Google execution log: version 13, beautyLiveCastData at 21:16:46, failed after 2.688 seconds.
Error: QUOTA_METER_BUSY at beautyQuotaUpdate_ -> beautyQuotaReserve_ -> beautyQuotaFetch_ -> beautyLiveSheetsRead_ -> beautyCastRoster_ -> beautyLiveCastData.
The meter shares the script lock with event operations but waited only one second.
QG010 changes only that bounded wait to 30 seconds, retaining atomic accounting, the TEST cap, cooldown and caller-owned-lock behavior. It does not retry requests or bypass the meter. Longer contention still fails closed.
BeautyQuota.gs SHA256: 8a8448c915cbfb7c9f31cf1604584b71e2eaf8a85eacf3678e87a8d36db4c19c.

Local QG010 checks pass: 16 quota checks plus asynchronous dashboard backoff/dedup/stale-session checks; 30 ratings checks; cast refresh; monitor retry; recovery detail; status card; login error mapping. Entire candidate scripts parse. The new contention cases simulate a 12-second lock holder and a wait exceeding 30 seconds; they are not native concurrency proof.

QG010 Google source update submitted; save/readback/deployment and native contention validation still pending at this checkpoint. No all-pass claim and no LIVE promotion.
Pool-method save/reopen tests and bounded worker native tests still pending; the TEST fixture already has sent groups and a changed roster. No overwrite/start was performed.

## Deployment completion

Google confirmed version 14 successfully deployed at 21:21 to the same private TEST URL. Execute-as owner and Only myself access remained unchanged. Reloaded the editor and copied saved BeautyQuota.gs: exact equality and SHA256 match to local QG010. Reloaded Hub now requires fresh Beauty sign-in; native QG010 validation pending authentication.

## Native v14 follow-up

After user sign-in, the dashboard showed the correct synthetic event, 54 IN, attention 0, and no list differences. Audience roster and both existing groups rendered. Concurrent Hub, cast, stage and monitoring reads were observed in Google Executions around 21:25–21:28 Stockholm: finished v14 calls displayed Completed, including calls lasting over 20 seconds; no Failed execution was observed in this bounded window. This does not prove every payload successful or eliminate contention beyond the 30-second bound. Closed the temporary audience tab after the check to stop its polling.

108 pool regression scenarios passed against the candidate using the prepared internal harness: Fair equivalence, browser/server parity, supported sizes, rating cases, saved choices/swaps, singles and doubles. These are local checks, not native save/reopen acceptance.

Native fresh-draw acceptance remains blocked: poolload sees an existing sent journal and enters beautyPoolWorkflow_; the roster signature differs from the approved sent draw. The UI correctly refuses preview/send/start. Advanced settings contains only an estimate control and scheme reference, no reset. No journal deletion, draw replacement, event start, fixture switching, or isolation bypass was performed. Need a deliberate test-fixture decision before completing this acceptance. LIVE remains unchanged; full release approval is pending.

## Approved disposable fixture reset

User confirmed the old TEST draw need not be preserved. Owner-editor temporary maintenance was restricted to the exact private Release TEST script and event. Inspection verified status 20, 54 synthetic entries, two existing RR groups, empty results/rankings/knockout participants. First reset guard stopped before mutation because a prior VERIFIED start journal existed. Inspection confirmed that old start journal was VERIFIED (not pending); the reset then archived both verified journals plus event data in four checked property chunks. One revision-checked provider update cleared only rr_table/rr_seq/rr_order/rr_board/rr_disable. Readback verified unchanged entries and match settings before clearing the old active journal keys. Original audit records remain. Reset receipt TEST_DRAW_RESET_VERIFIED at 21:38:51 Stockholm; LIVE unchanged. Backup/receipt prefix BEAUTY_DISPOSABLE_RESET_20261125 remains inside the private TEST project. Temporary maintenance code was removed; editor reload and full-source clipboard readback exactly matched original QG010 BeautyQuota.gs. No new deployment was made.

After reset the native planner loaded current league averages, with all 54 players mapped to both league and event identities (108 resolved identity selectors). Boards 5 and 6 selected, balanced draw preview submitted. Native save/reopen acceptance in progress.

## Native pool preview acceptance

Balanced/Fair preview: 54 players, 18 groups of three, shared boards 5 and 6. Frozen timestamp 20:40:21.779Z, statistics 20:39:17.947Z, seed 1587914690. Navigated to Dashboard and reopened Pool Planner: server restoration completed and all 54 player placements plus frozen metadata exactly matched the pre-navigation UI snapshot.

Similar strength selection saved; old preview correctly marked invalid and sending disabled. Regeneration succeeded (seed 2265100783, frozen 20:42:38.007Z). Random selection and regeneration also succeeded (seed 2464825980, frozen 20:43:48.542Z). Random also survived Dashboard→Planner server restoration with all 54 placements and frozen metadata exactly equal. All fixture averages are unseeded, so these native cases prove integration/persistence, not distribution quality for mixed ratings (covered by local scenarios). No fresh draw has yet been sent. Nakka handoff review in progress.

## Native expiry and pool send

Owner-editor TEST-only expiry check exercised the actual beautyCombinedBackgroundClock entry with a missing lease and an expired lease. Both returned without changing the run record; two-hour lease calculation passed. Original PAUSED configuration restored exactly in finally. No trigger was created and no valid worker lease enabled. Receipt TEST_EXPIRY_GATE_PASS at 21:47:35 Stockholm. Temporary code removed; reloaded editor clipboard exactly equalled original QG010 source. This is native entry-path validation, not an elapsed two-hour clock observation.

Handoff initially rejected the old four-player-only top-two/bottom-two preset for groups of three. Selected and saved First 2 up / remaining down. Review: 54 players, 18 pools of three, 54 native RR pairings; Knockout 1 has 36 qualifiers/64 slots/28 byes; Knockout 2 has 18 qualifiers/32 slots/14 byes; third places off, existing 501 first-to-two rules retained. No Nakka editing tabs open. Confirmed the reviewed synthetic TEST handoff and sent once. Native UI returned: knockout format and qualifier rules verified; Native Round Robin groups and placement-state readback verified; Entries and other event settings preserved; Event remains pre-start. No retry and no Start action. Post-send saved-competition loading in progress at checkpoint. LIVE unchanged.

## Post-send restoration and registration fixture blocker

Post-send server restoration subsequently completed with boards saved and Start Event available. Start was not clicked.

One synthetic registration, Beauty Combined Quota Native, consent NO, was submitted through the Hub. It returned saved/request requires review. Owner-editor read-only inspection found response, master, backup-form and status VERIFIED; processing stopped at display. No duplicate submission. The normal Resolve issue control was invoked once against the original request; subsequent diagnostic still showed REVIEW.

Native date inspection at 21:56:55 Stockholm established Control A2 = 2026-11-24, queued event date = 2026-11-24, response serial = 46351.910104166665 (2026-11-25). Tonight A2 filters response timestamps below Control A2 + 1; therefore this response is excluded. Display remains 54 players. Registration/removal acceptance is NOT passed: this fixed-date fixture cannot exercise today's registration without a deliberate fixture/date strategy. No timestamps, event dates or date guards were changed to manufacture a pass. Original saved request is retained for reconciliation; provider entry is not claimed verified.

Both temporary read-only diagnostics were removed, saved and reloaded. Clipboard readback exactly matched original QG010 BeautyQuota.gs. Deployment remains private TEST v14, workers paused, LIVE unchanged. Outstanding: resolve fixture/date mismatch, finish registration/removal regression and remaining release acceptance before promotion.
