# Identity TEST acceptance — 6 November 2026

Event: AIK Hub TEST 2026-11-06, t_MGCo_7732, AIK league lg_tM2v_3523.
Owner evidence: screenshots and reports in this conversation. Production untouched.

## Observed

- Date selection, reviewed creation, empty event and preserved November 2 completed event verified by owner.
- Hub/Mobile/Kiosk registration and five native League entries verified.
- One pool of five, ten native Round Robin matches, reviewed transfer and start verified.
- Results entered through scorer and Nakka Control appeared in Live.
- Manual tied ranking resolved by owner. Top two to Slutspel 1; three remaining to Slutspel 2.
- Slutspel 1: Alessio Tampella defeated Thomas Wågberg 3–0, correct Live score and trophy.
- Slutspel 2: Jerrimi Hedblad defeated Christian Jonsson 2–0. Native Nakka confirmed result; Live stayed LIVE/0–0 after reload and showed champion early. FAIL.
- Board 1 present in both final displays, but styling unclear. Earlier Slutspel 2 semifinal badge absence not yet diagnosed against a native badge readback.
- Native third-place setting unnecessarily enabled for two-player Slutspel 1 final.
- Partial scoring data caused player/NU averages to disappear.

## This update — local verification only

797 tests passed; inventory tracked. Google TEST upload and device retest pending.

- Saved unequal bracket result overrides stale active scorer data.
- Champion display waits for unequal final result and no active Live flag; name still comes from Nakka's champion slot.
- Bye/pending player names blank; advancement preserved.
- Empty bronze section hidden; bronze section suppressed for two-slot-only bracket.
- Yellow/black board badge and smaller final-only card.
- Known point/dart averages preserved when other result-only matches lack stats. Partial coverage visibly marked; missing points/darts never invented. Malformed/ambiguous totals remain blocked.
- New TEST event defaults: join password AIK, common_join=1, individual_pass=0, game_type=5 (local scoring + submit results).
- Running competition hides Save Boards & Match Plan.
- Pool explanatory text wraps; mobile Tonight's Players digits embed AIK Siffror.

## Remaining authorised work

- Compact one-window Event Control: date lookup → connect existing or configure missing event → review → confirm.
- Custom event title; Round Robin only / knockout only / combined; group sizes including six or more; independent Slutspel brackets, qualifiers and third-place switch.
- First-to legs or sets per stage, plus round/final/third-place overrides; optional rounds/dart limit using native Nakka winner/draw/cancel prompt.
- Back buttons with preserved draft and invalidated approvals after edits.
- Clear inline errors and expired-review recovery; date-saved heading, separate action row, collapsed diagnostics, compact handoff.
- Retest Live against mixed manually entered averages and complete native stats; keep definitions and coverage explicit.
- Keep native Nakka admin/qualifier editing/automatic progression; explain autopilot window must remain open.
- Cleanup TEST events and dummy league players later, after review. Original November 2 TEST is still the creation template: decouple it before deleting.

## Required retest

Reload current completed TEST in Live: Slutspel 1 0–3 and Alessio winner; Slutspel 2 2–0 and Jerrimi winner, no LIVE highlight. Check badges, blank slots, hidden empty bronze, partial averages, mobile digits, and post-start button. No need to resend pools, repeat Start or recreate event.

## Owner readback and acceptance updates — 6 November, Stockholm time

- 20:57:19 Google TEST full readback verified 20 files / 5 changed, after local Live Fixes installation.
- 20:58 owner screenshots: Slutspel 2 final Jerrimi 2–0 Christian, no LIVE highlight, correct champion and yellow board badge. Slutspel 1 Alessio 3–0 Thomas, no empty third-place section. PASS.
- 20:59 screenshot: known player averages and NU 141.67 restored, partial markers visible; owner requested visible explanation removed.
- 21:05:38 text-removal Google TEST full readback verified 20 files / 2 changed, 797 tests passing.
- 21:13:31 headings/connectors Google TEST full readback verified 20 files / 2 changed, 797 tests passing.
- 21:15 owner screenshots: equal-sized centered round titles, yellow bracket/winner connectors and no visible average explanation accepted.
- Follow-up request: hide Bana badges on completed matches, including finals; apply gold outline to confirmed winner card. Implemented in local badge update; Google upload/device retest pending.

Production and deployment settings unchanged in all owner upload receipts. New-event defaults still need a future creation acceptance test. Larger Event Control/setup redesign and cleanup remain pending.


## Workflow review update — 6 November 2026

- Owner accepted completed-match board badge removal and gold confirmed-winner outline (“perfect”).
- Event Control now checks the selected date’s Nakka TEST event inside the same dialog, including missing-event creation review. The Nakka sidebar check no longer opens Advanced.
- Back to Event Setup preserves the title and discards approval; Back to Pools retains frozen draw/board choices and discards send approval; Back to Boards discards Start approval. Each requires a fresh review and unchecked acknowledgement. No Back path after an uncertain creation/send/start.
- Unsaved date edits suspend Nakka lookup. Closing Event Control cancels late UI responses. A verified date save says DATE SAVED and moves the backup receipt into collapsed details.
- Compact pool handoff shows counts, qualifier summary, collapsed match order/settings and one acknowledgement. Native Automatic progress instructions explicitly say to keep the window open.
- Safe expected creation failures now return actionable reasons; expired reviews offer REVIEW AGAIN without automatically repeating a write. Unexpected backend details remain private.
- This batch changes workflow only. Custom event formats, larger groups, editable legs/sets/dart limits and native third-place configuration remain outstanding. Existing template and provider game settings are unchanged.
- Validation: 805 local tests, including seven new executable regressions; deterministic TEST build and inventory checked by installer. Google upload and owner device acceptance pending.


## Create Nakka Event match controls — 6 November 2026

- Previous workflow release: owner supplied GOOGLE_TEST_READBACK_VERIFIED at 20:46:25Z (20 files, two changed), local 805/805 and inventory PASS. Owner screenshot at 21:48 local confirms inline matched-event lookup in Event Control.
- Owner clarified match controls belong in CREATE NAKKA EVENT, before creation review, rather than Pool Planner setup.
- Missing-event creation form now provides Groups / Slutspel 1 / Slutspel 2: legs to win, optional per-player per-leg dart limit in multiples of three (39 darts = 13 rounds); each Slutspel also has final legs, third-place on/off and third-place legs. Defaults: group 2, Slutspel 1 2/final 3, Slutspel 2 2/final 2, all dart limits off, both third-place off.
- Form Back preserves all choices, discards approval and requires reviewing and acknowledging again. Server review returns human-readable rules. Confirm accepts only the frozen ticket, never replacement client settings. The reviewed rule summary is retained in before/readback audits and the durable creation journal without the join password.
- Server strictly validates option fields/types/ranges, copies full native setting objects, replaces inherited per-block/per-round overrides with the chosen final/third-place rules, and verifies all three complete setting objects after the single creation POST. Unexpected outcome remains blocked from automatic retry. Public TEST visibility, AIK play-screen password, common join, no personal password, local play plus Submit results remain as before.
- Native round settings use limit_rounds/rounds on stage settings and roundLimit/maxRound in game_setting overrides. A dart limit is expressed as whole three-dart visits. Nakka retains its native limit decision UI; Beauty does not implement a scorer prompt.
- Pool handoff retains configured game rules, limits and final overrides. A bracket sized to two qualifiers sets t3=0 and clears any old empty third-place table; larger brackets retain the chosen switch. Pool review states the computed switches.
- Reference checked: https://api.n01darts.com/api/v1/n01_api_manual_en.html — complete setting replacement, required legs/draw fields, t3 and game_setting round -1 final / -3 third place.
- Local validation: 813 tests, eight new executable configuration/transport/handoff regressions, inventory and installer rehearsal. Google TEST upload and real new-event/scoring acceptance pending. Existing tournaments are not rewritten by installing this update.
- Still outstanding: custom event format modes, larger groups, independent Slutspel qualification/bracket controls, sets, per-round/semifinal overrides and separate per-round dart limits. The old TEST creation template remains required; cleanup deferred.


## Independent event format modes — 6 November 2026

- Previous release: owner supplied GOOGLE_TEST_READBACK_VERIFIED at 21:04:54Z, 20 files/three changed, local 813/813 and inventory PASS. Owner changed Hub date to November 7, created the TEST event once (22:19 local screenshot), and confirmed native legs, dart-limit and third-place settings match. Native scoring limit prompt has not been exercised in this acceptance.
- Owner identified missing ability to create Round Robin only or Slutspel only. Creator now offers Round Robin only / Slutspel only / Round Robin + Slutspel, with independent Slutspel 1 and 2 switches. Only chosen stage fields are visible and enabled. At least one format is required.
- Slutspel-only mode includes bracket capacity (2–128 power-of-two slots) per enabled stage. Two-slot brackets suppress bronze. Native Nakka Control is explicitly used for assigning players to those brackets and starting, consistent with the owner's retained native bracket workflow. Pool Planner shows this guidance and a link instead of group controls. No new Hub knockout-only draw/start mutation is introduced.
- Review freezes chosen flags, settings and capacities; Back preserves mode, switches and field values while clearing approval. Creation turns off the other native formats and verifies all three complete settings after its one acknowledged POST.
- Round Robin-only pool handoff leaves both knockouts off and can start without qualifier rules. With one enabled Slutspel, the top two from each group advance to that stage. With both enabled, existing top-two/rest rules remain unchanged. Pool review and tournament control show only enabled stages. Assignment never writes disabled bracket tables.
- Live projection omits disabled knockout data, supplies enabled-view flags and hides unavailable competition tabs. If the displayed stage becomes disabled, it returns to the player list. Public-only data and TEST target guards remain.
- Corrected the TEST title error and added a visible hint: names must start with AIK Hub TEST, maximum 60 characters. Guard remains unchanged.
- Official schema checked: https://api.n01darts.com/api/v1/n01_api_manual_en.html — enabled format flags/sizes, complete settings replacement, assignment defaults and bracket shapes.
- Validation: 824 local cases including 11 new executable regressions, inventory, deterministic builds, guarded installer rehearsal and uploader mocks. Real native mode creation/qualification/Live acceptance pending. Production and deployment unchanged; existing November 7 event is not rewritten by installing source.
- Still outstanding: configurable group sizes including 6+, custom qualification counts, sets, per-round/semifinal overrides and separate round limits. TEST cleanup remains deferred; original template still required.


## Native disabled-format readback defect — 6 November 2026

- Event Formats release installed by owner: 824/824, inventory PASS; GOOGLE_TEST_READBACK_VERIFIED at 21:40:14Z, 20 files/five changed; production and deployment unchanged.
- Owner selected November 8, Round Robin only, first to 1 leg, 39 darts (13 rounds), both Slutspel off. Review screenshot at 22:48:58 local shows these options; creation returned unverified. Native event list confirms accepting entries. Event URL supplied by owner: https://n01darts.com/n01/league/season.php?id=t_G2r0_6084 . Do not recreate or delete it.
- Read-only public API response observed directly: tdid t_G2r0_6084, title AIK Hub TEST 2026-11-08, lgid lg_tM2v_3523, status20, t_date1794139200, empty entries and RR tables/results/rank, RR enabled/501/01/first-to1/drawMode0/limit_rounds1/rounds13. Both t_setting and s2_setting are OMITTED. This identifies the mismatch: the verifier required exact disabled objects returned after sending tournament0. Public GET cannot qualify join password/private admin fields.
- Fixed creation comparison: enabled format settings remain exact; a requested disabled format may be omitted or explicitly flag0, but may not be enabled or ambiguously flagless. Pool loading, qualifier planning and Start now treat absent knockout settings as off, matching native serialization. Existing synthetic default fixtures now explicitly declare their intended enabled stages.
- Future before-creation audits retain all three public format setting objects, excluding top-level join_pass/credentials, for complete future recovery comparison.
- Added staff-only VERIFY EXISTING EVENT to a matched date with an unreviewed attempted creation. It performs provider GETs only, verifies unique target/date/title/creator, security defaults, empty entries/play data and immutable original audit/journal binding, then records a separate receipt. Original ATTEMPTED journal is retained byte-for-byte; creation remains blocked.
- If the original audit has full settings, recovery checks complete native formats using the corrected disabled comparison. Older RR-only audits (including November 8) support REVIEWED_OPTIONS_ONLY: exact reviewed legs/dart limits/disabled stages plus 501/01 and security/empty-registration guards. The UI explicitly states the older audit cannot prove every inherited setting. It does not retroactively claim complete original POST attribution or full inherited-settings verification.
- Local validation: 829 tests, five new regressions, inventory and guarded installer/uploader rehearsal. Authenticated owner recovery and RR-only pool-send/Start acceptance pending. No provider mutation, production change or automatic creation retry during diagnosis/development.

## Evening Setup — 6 November 2026

Owner request: one discoverable window showing the saved evening format and rules, with a way to review changes. TEST sidebar Event Control is now Evening Setup. Opening it reads the selected native event, rather than recalling creation form defaults. It shows title/date/status, Round Robin and Slutspel on/off, first-to legs, finals, dart limits, bronze rules and bracket capacity, registration count, and saved groups. Pool Planner, date changes, native event and reload are available from that same window.

Changes are allowed before play and before pools/brackets are sent, with native revision binding, a fresh reviewed ticket and explicit save acknowledgement, one compare-and-set update, audit, and full readback. Started events, extra native match rules, sent draws, unresolved creation and uncertain saves remain readable with an explicit reason editing is unavailable. An existing uncertain creation can be verified here without recreation. No silent retry of any save.

Existing November 8 event t_G2r0_6084 was observed as Round Robin only, first to 1 leg, 39 darts (13 rounds), both Slutspel stages off. Do not recreate it. This package includes the preceding disabled-format readback repair and accepts the owner's 824-test format release or the 829-test readback release. Owner has supplied upload verification for the 824 release; the 829 readback release has not yet received an owner upload receipt.

Local validation: 840 tests passed (829 prior + 11 Evening Setup cases), including real JS UI event flows, native snapshot, reviewed single update, format switch, stale/session/expiry rejection, blocked states, uncertain outcome and unrelated native fields preservation. Test inventory checked separately. Physical device appearance and authenticated Nakka settings update still require owner acceptance. Google upload and production deployment have not been performed by this local validation. Production and deployment unchanged.

Owner acceptance: upload this bundle, reload TEST Hub, click Evening Setup in the sidebar. Confirm November 8 shows the actual RR-only 1-leg/39-dart choices. If offered, Verify Existing Event checks the existing creation without recreating it. Change Settings then Review Changes shows the complete proposed rules; Save requires a fresh acknowledgement. Do not save unless the desired choices are correct. After sending pools, confirm the overview remains available and explains later edits belong in Nakka Control.


## Evening Setup direct editing correction — 6 November 2026

Owner accepted the saved overview visually and uploaded Evening Setup successfully: local 829 -> 840 tests; Google full readback VERIFIED 2026-11-06T22:31:45.513Z, 20 files verified / 3 changed. Production and deployment unchanged. Owner rejected the manual Verify Existing Event step. The overview now performs the existing provider-read-only check automatically if an old creation journal requires it, refreshes the saved view once and enables Change Settings without another user action. No Verify button is displayed. A failed check keeps actual saved choices visible with the reason; it does not silently recreate the event or retry. Review and explicit Save still apply to settings writes. Local validation: 841 tests; owner upload of this correction pending.


## Monday preset and universal editable dart-limit defaults — 7 November 2026

Owner Google receipt for Direct Settings: 2026-11-06T22:43:29.230Z, 20 files verified/one changed, local 840 -> 841 PASS and inventory PASS. Screenshot 2026-11-07 00:10:31 Stockholm shows saved native November 8 settings after editing: RR first-to2/39 darts; Slutspel1 first-to2/final3/bronze2/32 slots with39 darts; Slutspel2 off. This qualifies saved choices appearing on reload; it does not qualify a completed scoring-limit tie-break. Production unchanged.

Owner selected Monday baseline Round Robin + both Slutspel A/B and 39 darts per player per leg throughout, including finals and bronze; at the limit use the native tie-break decision. Owner retains final control of settings. New-event UI defaults all three stages to39 darts. Both event creation and existing-event editing offer USE MONDAY SETUP — RR + A/B, which enables all three stages and sets each limit to39 while preserving currently entered legs, final/bronze choices and capacity where present. A previously disabled stage uses the existing initial legs/bronze/capacity defaults; those are editable and disclosed in review, not newly approved fixed Monday rules. Applying the preset never writes. All choices, including turning the limit off or switching formats, remain editable before Review and explicit Save. Back retains overrides. Existing saved events are not changed by installing source.

No scoring engine or result handling changed. Native settings continue using limit_rounds1/rounds13 and round overrides roundLimit1/maxRound13 for configured final/bronze; no invented tie-break API field. Official reference: https://api.n01darts.com/api/v1/n01_api_manual_en.html . Real scoring-limit/tie-break acceptance remains pending.

Two new executable UI regressions cover defaults, preset restoration from RR-only, preservation of selected legs, no save on preset application, and organiser disabling a limit before review. Full suite expected843; installer confirms actual counts. Google TEST update and owner acceptance of Monday button pending. No production/deployment changes.


## Cleanup preparation — 7 November 2026

Owner authorised cleaning all fake data/averages and is personally deleting TEST tournaments in Nakka while retaining real competitions and people. No remote data deletion was performed by this source update. Monday Preset installed by owner: 841 -> 843 PASS, inventory PASS, Google20files/1changed VERIFIED 2026-11-06T23:26:01.408Z.

Removed creation dependency on historical event t_QHaG_7792. Creator now builds clean 501/01 settings from configuration only, with Monday defaults RR+A/B and39 darts, rather than reading any existing event. Existing selected rules still override these values; all preview/audit/one-create/readback guards remain. This permits deleting the historical template. No player entry, result or average is included in the clean base. New tests verify creation with deleted template and contaminated historical settings not consulted. Full suite844; native clean creation still requires acceptance.

Remaining cleanup: owner completes Nakka TEST deletion and dummy profiles; verify league stats no longer include sample games, refresh/remove Hub last-good stats cache, review TEST spreadsheet dummy/master/registration rows and obsolete local installers, preserve one verified recovery copy and formal test fixtures/audit evidence. Deleting an event should not be confused with separately verified cleanup of archived matches or manually overridden averages. Prior creation journals intentionally still block reusing a recorded date; archive/reset only after the removed-event inventory is confirmed. Production unchanged.


## Reviewed Hub TEST cleanup — 7 November 2026

Owner personally removed Nakka TEST events; screenshot00:42:51 Stockholm retains genuine Monday history and upcoming Mondays. Owner00:45 screenshot and statement confirm native league statistics back to normal. No claim of a numerical full-season recomputation comparison. Screenshot00:53:14 shows Hub0players and event unavailable after deleting selected TEST. Real production data and Nakka player profiles must remain. Clean Creation844 update was delivered; owner installation receipt not yet supplied.

Cleanup is accessible from Evening Setup, including its missing-event screen. It explicitly previews clearing ALL registration history/status/consent/messages in the isolated TEST spreadsheet copy (not production), recognised dummy master names, last-good average shards and deleted-test creation/draw/binding journals. Real master names and their name correction mappings remain. Recognition is deliberately narrow: Beauty Test, Hub Test, Test Player/Mobile/Kiosk/Hub/New prefixes. Unrecognised dummy-looking names are not guessed and may require later manual review. Production/master originals and genuine Nakka events receive no mutations.

Preview requires the complete league event list with no TEST titles. Confirm binds staff/session, snapshot, selected date, exact property subset and native event list for5minutes, requires acknowledgement, verifies five native sheet copies plus backup audit, rechecks state, journals ATTEMPTED, applies targeted TEST writes, verifies contents/formulas/formats/control/master identities, property deletion and unchanged native event list, and records verified receipt. Any unverifiable partial attempt blocks repeats. Last-good stats are removed before fresh native season fetch; failed fetch cannot restore fake averages or invalidate an already verified data cleanup. No Nakka write route is called. Native calls are GET only.

Seven new executable regressions cover preview, source-preserving backups, contents and cache cleanup, kept real identities and credentials, no provider writes, stale/session/expiry/input refusal, native TEST/incomplete inventory blocker, backup/audit/partial failure, real-name corruption detection, stats failure and UI acknowledgement/single-save/missing-event access.851 local tests expected; installer records actual complete-suite and inventory outcomes. Device/native owner cleanup execution pending; this package does not itself execute data deletion during source upload.

Includes Clean Creation dependency so source may install over843Monday Preset or844Clean Creation. Current project source baseline851after local checks. Local Mac downloads/duplicate folder archive cleanup and unrecognised dummy-name review are still outstanding. Test fixtures/audit evidence and one recovery backup are retained. No production/deployment changes.
