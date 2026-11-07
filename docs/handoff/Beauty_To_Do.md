# Latest GitHub save — 7 November 2026

See GITHUB-CHECKPOINT-20261107.md for confirmed installation versus prepared work, owner interface boundaries and cleanup status.

# Beauty — to-do and decisions

## Immediate priorities — 7 November 2026, Stockholm

Owner direction: continue development. Monday 9 November is the urgent operational priority: Round Robin followed by A/B slutspel. The club doubles KM is expected in about one month; exact date is not supplied. Treat it as the next delivery milestone, not an indefinite wishlist. These priorities supersede older ordering below; historical evidence remains intact.

### Monday first
- [x] Evening Setup and direct Change Settings installed and uploaded to Google TEST by owner. LOCAL_EVENING_DIRECT_SETTINGS_INSTALL_PASS: 840/840 -> 841/841; inventory PASS. GOOGLE_TEST_READBACK_VERIFIED at 2026-11-06T22:43:29.230Z (23:43 Stockholm), 20 files verified, one changed. Production and deployment unchanged.
- [x] Owner accepted the one-place saved setup; manual Verify Existing Event button removed. Hub performs any existing-creation read-only check automatically.
- [ ] Owner acceptance of opening Change Settings, saving intended rules, native readback and reopening persisted choices. Do not alter the November 8 RR-only event to the Monday format without the owner's chosen settings.
- [ ] Rehearse a fresh Monday-format TEST competition: registration -> balanced pools/manual swaps -> boards -> Round Robin -> A/B through Nakka Control -> finals/winners -> next event. Check sparse boards, byes/empty slots and correct Live state. Preserve completed TEST results; no duplicate Start or pool resend.
- [ ] Kiosk/mobile/Hub together, withdrawals/removal, login/reload/logout, actual casting and connection recovery. Keep native Automatic progress window open where used.
- [ ] Reconcile operator handbook to current Evening Setup/Pool Planner/Nakka Control path; backup/rollback and explicit production release decision after acceptance. TEST upload is not a production release.
- [ ] Saved reusable Monday preset and multiple-event selection remain unimplemented; do not describe either as available.

### Next delivery — club doubles KM, about one month
- [ ] Separate club-member player list/source for KM, selectable per event without replacing or adding to the permanent Monday master list automatically. Preserve an individual identity for each member.
- [ ] Store a doubles entry as a pair of individual players with a combined display name. A display label alone must not merge two players into one permanent person.
- [ ] Pairs are event/year-specific and can be redrawn or edited by the organiser each year. Preserve historical pairs, membership, results and the average snapshot used for each draw; never rewrite last year's event when changing this year's partners.
- [ ] Propose pairs with team strength as equal as possible using each participating player's reviewed average. Use the two-player mean as the visible strength estimate; label it a pairing estimate, not a measured doubles match average. An initial unconstrained approach is highest average with lowest, then next highest with next lowest; review the spread across all pairs.
- [ ] Let the organiser inspect individual averages, their source/date, estimated pair strengths and overall spread; swap partners manually and see recalculated balance before saving. Freeze the approved draw; no automatic reshuffle after sending to Nakka.
- [ ] Missing/stale averages need explicit organiser input/review, never silently treated as zero. Handle odd player counts, incomplete pairs, duplicates and withdrawals explicitly. The same person cannot occupy two active pairs in one competition.
- [ ] Verify native Nakka doubles/team representation, registrations, groups, knockout progression, board/scoring behaviour and readback in a dedicated TEST event. Do not assume one combined name gives full native doubles support or correct individual statistics.
- [ ] Keep team event results separate from individual singles averages/rankings; choose and record the approved average source/time window before KM pairing.
- [ ] End-to-end doubles KM rehearsal and owner acceptance before its real date. No doubles production readiness claimed yet.


## Owner TEST installation and acceptance — 6 November 2026, 17:18–17:40 Stockholm

- [x] Owner local installer LOCAL_COMBINED_HUB_INSTALL_PASS finished 2026-11-06T16:18:17.888Z: 766/766 before, 780/780 after, no failures, inventory PASS. Repeats returned ALREADY_INSTALLED with no changes.
- Backup: /Users/alessiotampella/Downloads/Beauty-Recovered-20261028/02-Prepared-Dashboard-Source/Beauty-Admin-Hub/backups/combined-hub-before-2026-11-06T16-16-55-954Z. Evidence: same root/evidence/combined-hub-install-2026-11-06T16-16-55-954Z.
- [x] Owner confirmed saving all seven existing Identity TEST files: BeautyLiveTest.gs into BeautyLiveServer.gs, HubTestRemove.gs, Code.js into Code.gs, HubTest.html, HubTestPools.gs, StageTest.html, BeautyLiveTest.html. This supersedes earlier Google-upload-pending notes for the combined update only.
- [x] Event Control screenshot 17:31:25 shows Tournament Control command removed and date controls retained (libfile_ae5406bd9944819183f259a94dd1f5a3).
- [x] Live opens with seven players (17:32:19, libfile_49c07438c10081918a93965ff8a1eacb); group view shows Bana 2 and Bana 5 + 6, START/NU, scores, V-F, Legs and Rank (17:33:09, libfile_7015491e3c688191a8794f32528d2e9f).
- [x] Slutspel 1 final 3–0, Alessio winner/cup and third place 2–0 preserved (17:34:12, libfile_b4baae35f86881919f197c260af792b4). Slutspel 2 final 2–0 and Mobile winner/medal preserved (17:34:46, libfile_9d7eb2b8af90819195b237e177118679).
- [x] Running Pool Planner shows editable boards, saved 5+6 / 2, no Tournament Control command and sidebar Live (17:36 screenshots libfile_aea8523fe1d08191bb748d72241f543b and libfile_edd9ef846d448191a774fcd2b6c01bb8). Owner confirmed one-board/two-board toggle restores 5 and 6.
- [x] Owner clicked SAVE BOARDS & MATCH PLAN with unchanged boards; screenshot 17:39:53 reports Board match plan saved in the Hub, Nakka scoring unchanged (libfile_36032251ab948191afe668b182b691dc). Owner subsequently confirmed refresh retains 5+6 / 2.
- [ ] Fresh draft acceptance of automatic defaults and manual player swaps remains pending. Running/sent event deliberately locks player swaps. This saved existing-event check does not prove fresh defaults, native board assignment or partial-pool advancement while others play.
- [ ] Actual bye label remains incorrect (waiting text instead of Bye). Existing historical event title/player records still include Beauty; they were deliberately not renamed by label cleanup.
- Production unchanged. Existing completed TEST event/results preserved; no pool resend or repeated Start. Separate Nakka Admin is the operating workflow; replacement manager/admin skin paused.


## Combined TEST installer — 6 November 2026

- [x] Removed Tournament Control/Slutspel review-assignment command from Event Control and running pool screen. Generated Hub no longer loads the assignment dialog. Initial event Start, board Save and Live knockout display retained. This supersedes older statements that command removal is not implemented.
- [x] Reconciled automatic board defaults/running edits with user-facing Beauty label removal in ONE package: Hub-Combined-TEST-20261106.zip. Use it instead of separately applying the two older installers.
- [x] Combined local suite: 780/780 PASS. Isolated installer and inventory results included in package checkpoint.
- [ ] Owner Mac install and Google TEST upload still pending. Seven existing Google files listed in READ-ME.txt. Production unchanged; no GitHub push or native event mutation in this work.
- [ ] Separate Event Manager and admin-skin work paused per owner decision. Use Nakka Admin separately. Partial completed-pool handover while other pools remain active still needs fresh TEST acceptance. Native physical pool-board field connection, Open Nakka Admin button and Bye wording remain pending.


## Current launch checklist — 6 November 2026, evening preparation

This is the current priority list for Monday 9 November. It supersedes older work ordering and the proposal to build a full replacement event manager for this launch. Use Nakka Admin separately for main tournament editing, match control and moving completed pools into knockout brackets. Keep the existing Event Manager prototype as deferred work; do not integrate it for Monday. No installation, deployment or new acceptance test is claimed by this checklist update.

### 1. Install prepared TEST changes

- [ ] Save the current source checkpoint, configuration and rollback copy before installation.
- [ ] Install and verify automatic pool-board defaults and the included running board-plan editing fix (Hub-Auto-Pool-Boards-TEST-20261106.zip). Package evidence: 779/779 local tests and inventory PASS; owner installation and Google TEST upload pending. Preserve manual one/two-board choices.
- [ ] Install the removal of the user-facing “Beauty” labels (Hub-Plain-Labels-TEST-20261106.zip). Owner clarified this is label removal, not a general wording cleanup. Check compatibility/order with the board update before applying either installer; do not overwrite newer changes.

### 2. Complete small interface changes

- [ ] Add Open Nakka Admin for the correct event.
- [ ] Remove the Hub Slutspel review/assignment panel in line with the agreed Nakka-admin workflow; preserve Beauty Live knockout display.
- [ ] Display “Bye” for actual byes, retaining waiting text for genuinely pending player slots.

### 3. Verify the full competition path in a fresh TEST event

- [ ] Rehearse realistic player/pool numbers, seeded preview, manual player swaps, selected physical boards, one/two-board overrides, approval and exact Nakka group readback. The earlier completed two-pool test does not qualify all draw sizes.
- [ ] Move completed pools into brackets through Nakka Admin, including incremental progression while other pools remain active where the event format permits. Confirm Beauty Live follows actual Nakka entrants, byes, results, finals and winners without resending pools or restarting the event.
- [ ] Verify actual Nakka match-board assignments and document the operator workflow. Hub saved board labels are not proof of native assignments; keep actual assignment in Nakka unless a supported connection is separately qualified.
- [ ] Preserve completed TEST event t_QHaG_7792. Use a new dedicated test event; never resend its pools, repeat Start or reassign its knockout players.

### 4. Complete operational acceptance

- [ ] Test kiosk, mobile and Hub registration together: duplicates, IN/OUT/STANDBY, persistence, consent, messages, source, removal/recovery and Nakka reconciliation.
- [ ] Test on the home Windows desktop in Edge: login, reload, separate display opening, background refresh, logout boundaries and connection recovery. Prior spotless reload session remains valid; historical intermittent blank-page/DEADLINE_EXCEEDED root cause is still unresolved.
- [ ] Check Beauty Live with realistic player numbers, long names, pagination/rotation and fullscreen. Compare ranking/points/averages with Nakka if that view is included. Verify mobile Safari opening separately.
- [ ] Review the staged Nakka skin on TEST scoring screens and live-feed behaviour. Keep scoring-session requirements explicit; full authenticated Nakka Admin embedding/skinning is unverified and is not a prerequisite for separate Nakka administration.
- [ ] Run the complete registration-to-winner and next-event rehearsal in TEST, checking no old-event data remains. Record timings, outcomes and unresolved limitations.
- [ ] On Monday at the venue, check the actual internet connection, screen/casting setup, readability and computer settings. Home testing cannot close these venue checks.

### 5. Handover and controlled release

- [x] English first-time-operator booklet created: Beauty_Operator_Handbook_EN.pdf. Written on the requested assumption that the system is already launched/configured; it is not evidence of a real production launch.
- [ ] Revise the booklet against the verified on-screen controls and handoff workflow; provide event links, access details and an organiser contact separately.
- [ ] Verify live configuration and access, preserve TEST/production separation, prepare backup/rollback and the existing registration/Nakka fallback, then obtain an explicit release decision before production changes.
- [ ] Save the final source checkpoint and dated test/audit evidence. Do not assume GitHub is current; no push without existing explicit authorization.

Later work: separate Event Manager, AI/music, GP/multi-event expansion, multi-club hosting and broader enhancements. These are not Monday launch requirements.

## Event Manager shared Slutspel boards — 6 November 2026, version 0.4.0

- [x] Local rehearsal now allows Slutspel 1 and 2 to use identical or overlapping board ranges, with independent pause/resume. One shared occupied-board set prevents duplicate assignments; released shared boards alternate stage opportunity. Existing RR badges remain occupied.
- [x] 61 local synthetic Node/HTTP tests pass. Native Nakka transport and actual shared-board arbitration are NOT qualified; current Hub and saved pool-board update unchanged.
- [ ] User said “Checkwinnauks also”; clarification requested between knockout winners and wins/losses. No inferred real-event result changes. Result entry/corrections remain blocked pending native qualification.


## Automatic pool board defaults — 6 November 2026

- [x] Implemented in isolated Hub TEST source: pool drafts prefill selected physical board numbers in numeric order; sparse selections exclude unavailable boards. Example 3/3/4 pools and boards 1,4,5,6 → [1], [4], [5,6].
- [x] Reserve one board per pool first; spare boards go to four-player pools. With scarce boards, pools get one and queue by earliest available board. Shared-board notes identify later pools. 50 players/nine sparse boards and 120 mixed-venue combinations covered.
- [x] Manual one/two-board overrides, chosen board numbers and saved choices persist; download lists both boards and rows. Usage count reflects defaults and manual edits. Includes the preceding running-edit fix with revision protection.
- [x] Fixed TEST request allowlist to carry poolprepare boardPlan and poolboardplan boardVersion, covered through the real client transport.
- [x] LOCAL_AUTO_POOL_BOARDS_INSTALL_PASS: isolated installer baseline 766/766 → 779/779; no new failures; inventory PASS. Reproducible generated TEST files verified; repeat installer does nothing. Source, backups/tests and install evidence packaged as Hub-Auto-Pool-Boards-TEST-20261106.zip.
- [ ] NOT INSTALLED on owner Mac or uploaded to Google. Google TEST files when ready: existing HubTestPools.gs and HubTest.html only. Device acceptance pending. Completed event must not have pools resent or Start repeated.
- [ ] Native Nakka pool board-field connection still pending qualification. This is automatic draft/venue planning, not native automatic match assignment or Slutspel autopilot. Existing Event Manager project, production and GitHub unchanged. Deferred plain-label rename not included.


## Pool board gaps — 6 November 2026

- Owner requested fixing both pool-board gaps before further Event Manager work.
- [x] ISOLATED LOCAL SOURCE: pool board controls and Save remain available while status is running. Running saves bind event revision and current saved plan, reject stale/missing versions and changed native group membership, audit before/after plans, preserve pools/results/status and do not repeat Start.
- [ ] NOT DEPLOYED: owner Mac and Google TEST remain unchanged. Source checkpoint only; do not treat the editable Hub plan as native match assignment.
- [ ] NATIVE ASSIGNMENT STILL BLOCKED: API supports badge/update, but the physical-board to native Round Robin pair/address mapping needs an observed native example. Public docs do not fully define RR address correspondence. All native attempts in this session were read-only; no credentials or authenticated native admin session available. Do not guess indices, write rr_board as physical board numbers, or assign all future matches as simultaneous in-progress badges.
- [x] Added private read-only owner-editor capture beautyPoolBoardReadback_ for target t_QHaG_7792, omitting names/results/credentials. It does not qualify the mapping by itself and has not been executed against Nakka.
- Preserve the completed existing TEST event; use a separate future native qualification event for write/readback checks. Do not resend groups, repeat Start, or reassign its knockout players.


## Event Manager automatic badges — version 0.3.0, 6 November 2026

- [x] Separate synthetic automatic scheduler now assigns distinct boards, holds a waiting queue, reuses finished boards, observes board/player breaks, protects busy players and preserves existing assigned badges.
- [x] Per-stage pause/resume with repeated-cycle coverage, queue/status display, synthetic finish/clock controls and audit receipts bound to reviewed revisions. Manual badge changes require pausing their owning stage. Finals remain manual.
- [x] 59 local tests pass, including HTTP automatic handover and pause/resume cycles. Current Hub source unchanged; no Google/Nakka/production writes or GitHub push.
- [ ] This does not run real Nakka autopilot. Native held-status normalization, actual automatic assignment, cross-event boards/players, round/final/third-place/referee semantics and browser/device acceptance remain open. Production design must use the native autopilot service; never connect the local rehearsal scheduler as a real writer.


## Event Manager development update — 6 November 2026, version 0.2.0

- [x] Separate project now has 41 passing local synthetic/HTTP tests.
- [x] Manual within-stage guide swaps, reviewable before/after positions, rematch warnings, protected assigned matches and stale-revision refusal.
- [x] Durable guide revision store with immutable history and reopen/restart coverage. Local rehearsal guide can persist via EVENT_MANAGER_DATA_DIR; synthetic event tables/results still reset per server restart. Complete event persistence is not implemented.
- [x] Saved-guide key-order comparison bug fixed and covered by reopening plus assignment test.
- [ ] Native guide/partial assignment/badge/autopilot acceptance, remaining match/setup controls, full rule editor, host integration/persistence/recovery and visual acceptance remain pending. No Hub integration, production change, GitHub push or Nakka mutation.


## Separate Event Manager project — authorised 6 November 2026

Owner requested a full manager comparable to Nakka Admin, developed separately and integrated only when fully developed and accepted. Owner authorised autonomous development while the app stays open. This supersedes the earlier blanket direction to avoid a future manager; Nakka Admin remains the current/Monday operating choice.

- [x] First isolated development build created, with its own source, loopback rehearsal, control inventory, provider references and tests. No current Hub/Google/production integration or Nakka mutation.
- [x] Incremental completed-pool assignment engine, fixed approved pool/rank guide positions, membership/settings binding, structural byes and preservation of existing assignments.
- [x] Manual badge and Nakka autopilot configuration proposals plus synthetic review/readback. These do not run the native autopilot service.
- [x] Expiring staff/session approvals, stale-state refusal, serial writes, durable atomic event journal, no retry after uncertainty; 33 synthetic Node/HTTP tests pass.
- [ ] Native provider adapter, authenticated snapshots/live-match normalization, actual partial assignment and badge/autopilot qualification; host persistent guide/journal and recovery console.
- [ ] Complete match control (corrections, watch/game data, unlock), setup/player control, guide editor/referees/order/announcements/lifecycle and remaining parity inventory.
- [ ] Browser/device acceptance: Chromium launch was environment-blocked; no visual pass claimed. Current first build is NOT complete or integration-ready.
- [ ] Review against the full signed-in Nakka Admin page before claiming parity; preserve the existing scoring/progression engine.

Monday test scope stays kiosk, remote registration, Hub and skin; use Nakka Admin for full tournament control. New manager is a separate workstream. Plain-label update Hub-Plain-Labels-TEST-20261106.zip is prepared (766 tests pass), but owner deferred applying it until tonight; do not assume it installed. Removal of the current Hub Slutspel review/assignment panel is agreed for tonight but not yet implemented/applied.


## Latest TEST checkpoint — 6 November 2026, after midnight Stockholm

This section supersedes older pending statements only for the checks explicitly recorded here. Production is unchanged. Full source checkpoint: Beauty-Full-Checkpoint-20261106.zip.

### Verified tonight

- [x] Reload reliability — owner follow-up on 6 November: reload was spotless throughout tonight’s session. PASS for tonight’s use; earlier intermittent failures did not recur tonight. Next priority is realistic casting and the complete event rehearsal. Historical DEADLINE_EXCEEDED root cause has not been established; this does not undo tonight’s successful check.

- [x] Owner installed Tournament Control update: LOCAL_TOURNAMENT_CONTROL_INSTALL_PASS, 2026-11-05T22:59:17.135Z (23:59 Stockholm), baseline 752/752 and after 766/766; inventory PASS, no new failures. Source, generated TEST files, tests, backups and dated evidence preserved. Owner confirmed saving HubTestPools.gs, HubTestBridge.gs and HubTest.html to Identity TEST.
- [x] Compact Hub pool cards approved: four per desktop row, START beside heading, Bana title/accent, inline Board 1/Board 2, explicit save and compact status. Advanced contains qualification rules and match order; step 4 has Save boards & match plan and Start event.
- [x] Saved board plan and frozen START averages shown on Beauty Live: Bana 5 + 6 / START 46.21, Bana 2 / START 40.83. Native V-F win/lose projection corrected; scores, START/NU, V-F, Legs and Rank use 24px Display, secondary averages 16px. Latest owner screens show working values.
- [x] Dedicated registration TEST t_QHaG_7792 started once and completed all nine group matches. Never resend its pools or repeat Start.
- [x] TEST Hub Tournament Control review showed four Slutspel 1 qualifiers, three Slutspel 2 qualifiers and one bye, with correct cross-pool Slutspel 1 semifinals. Owner explicitly confirmed assignment once. Server reported assigned and verified at 00:08 Stockholm; audit POOL-f6e900cfe2fe44b99d04 (transcribed from screenshot).
- [x] Beauty Live displayed both populated knockout brackets. Slutspel 2 bye advanced Beauty Test Mobile 02 Nov directly to the final.
- [x] Slutspel 1 semifinal winners Alessio Tampella and Adam Pettersson advanced; both losers entered third place. Final 3–0 displayed Alessio as winner with cup; third place 2–0 displayed. Owner screenshot 00:13:10.
- [x] Slutspel 2 semifinal 2–0 advanced Beauty Test New 02 Nov; final 2–0 displayed Beauty Test Mobile 02 Nov as winner with medal. Owner screenshot 00:14:58. This verifies the observed TEST path, not all tournament formats.

### Agreed direction and next work

- [ ] Use the full native Nakka Admin page for tournament administration. Owner accepted this fallback rather than reproducing all admin features in Hub. Plan an Open Nakka Admin entry from Event Control; this button is NOT implemented yet. Current Hub qualifier panel remains installed and has passed its specific TEST flow.
- [ ] Do not extend the custom control panel into a replacement for all Nakka administration at this stage. Embedding authenticated Nakka Admin and applying a full Beauty admin skin are unverified. Official API documents competition custom themes; anonymous admin request redirects to Nakka login. No authenticated embed test was completed. No claim that embedding is impossible or blocked.
- [ ] Fix Beauty Live bye text: an actual bye currently reads “Väntar på spelare”; display Bye without changing player advancement or pending-match slots. Not implemented tonight.
- [ ] Check mobile Safari Beauty Live opening, real TV and realistic player-count casting, consent/messages/source parity, full registration-to-next-event rehearsal and production release preparation. Do not mark these closed from knockout evidence.
- [ ] Current qualifier assignment implementation deliberately supports TWO saved pools in this fixed TEST event, with completed groups and unique native ranks. Larger draws need separate implementation/qualification. It does not configure board badges, autopilot or per-match routing; Hub board plan/display labels alone do not perform those native writes.
- [ ] Nakka skin remains separately staged; no theme deployment or production activation tonight. Current TEST native player/admin page is not automatically Beauty-themed.
- [ ] GitHub repository Slicio180/Beauty-Admin-Hub is connected/private; recovery/2026-10-28 exists. No commit/push performed by this checkpoint. Archive is the complete saved source reference; GitHub head must not be assumed current.

No production changes, GitHub push, pool resend, repeat Start or assistant-triggered provider mutation. The owner performed the explicit TEST assignment and TEST scoring through the approved UI.


## Monday launch priorities — updated 3 November 2026

Target: **Monday, 9 November 2026**. Alessio is unavailable Tuesday 3 and Wednesday 4 November and will be at the venue on Monday. Available joint work window: Thursday 5–Sunday 8 November. This section supersedes earlier ordering for this launch; historical requirements below remain.

### Scope and current evidence

- Core registration and recovery paths have native TEST evidence. Latest owner local installation: 712/712 tests and inventory PASS. This does not establish acceptance of the complete competition engine or production readiness.
- Automatic player attention, named missing-player guidance, manual restoration and fresh-check alert clearing were observed. Latest red top-line/red-number appearance uploaded; active appearance acceptance remains pending.
- **Nakka card size and cosmetic cleanup are deferred until after launch**, per Alessio. Keep the existing working issue flow and Advanced section.
- Production remains unchanged. Full checkpoint saved as Beauty-Full-Checkpoint-20261103.zip (libfile_e90c5fbf99f4819183ec295e6e592b12), including source, tests, audit evidence, preimages, installers and resume notes.

### Launch work, in order

1. [ ] **Reload reliability:** investigate intermittent blank pages and Google Apps Script storage DEADLINE_EXCEEDED. Repeated opening/login/refresh must be checked. Cause remains unresolved; do not attribute it conclusively to Google or background polling.
2. [ ] **Player-list Live casting:** verify correct event and players, status inclusion rules, refresh, event switching without retained old data, fullscreen, pagination/rotation, long names and actual TV readability at realistic player numbers.
3. [ ] **Cast access and recovery:** confirm separate public cast continues after Hub logout, exposes no organiser controls/credentials, marks stale/unavailable data honestly, and recovers after a connection interruption.
4. [ ] **Ranking/statistics view if included Monday:** compare real overall rank/ties, points and averages with source data; missing/unranked handling must be honest. Use the existing view. Do not call it qualified from names-only casting.
5. [ ] **Nakka skin:** retain existing staged theme work; last recorded configuration disabled, autoApply false, targetEventId null. Verify actual current configuration before any activation. Review skin on the intended TEST scoring screens: scoring controls, names/scores, board labels, readability and live-feed behavior. Previously observed requirement to keep the scoring session active must be included in rehearsal; background/closed-session behavior is unqualified. Stage-only completion is not production activation.
6. [ ] **Competition display and planner:** separately rehearse correct TEST target, seeding/approved pools, supported Nakka handoff and readback, scores, standings, board numbers and round-robin/knockout progression. Names-only casting does not qualify competition screens; do not infer completed provider board writes from Hub planning.
7. [ ] **Complete event rehearsal:** kiosk/mobile/Hub registration, duplicate guards, statuses and persistence, consent/messages/source, removal/recovery, cast, logout and next-event switch. Record timings and unresolved limitations.
8. [ ] **Controlled production release:** verify production configuration rather than copying hard-coded TEST settings; preserve current data and working production, backup/rollback, access and public registration/cast links. Explicit release decision after acceptance; no production activation or deployment authorized by this to-do update alone.

### Proposed joint work window

- Thursday 5 November: reload reliability, player-list Live casting, Nakka skin review.
- Friday 6 November: remaining casting/statistics, planner and competition integration checks.
- Saturday 7 November: full rehearsal and corrections; another organiser's rehearsal if practical.
- Sunday 8 November: final verification, backup and release decision; freeze extra features.

This is a priority plan, not a delivery guarantee. Alessio's presence Monday supports operation but does not replace testing. Agree any fallback for unqualified modules before launch; preserve the existing working system. AI/music, GP and multi-club expansion remain later work.


## Current checkpoint — 2 November 2026

This checkpoint supersedes older pending statements below for the specific items verified on 1 November. Older sections remain as historical requirements; this is not a claim that the entire Hub is finished or production-ready.

### Verified in the separate TEST system

- [x] Staff sign-in and event-date change to 2026-11-01, with snapshot backup BKP-20261101-222938-fcc5da55. Registration history and master list retained.
- [x] Nakka event matching fixed for undated historical events; correct registration TEST selected: t_QHaG_7792, “Beauty Registration TEST event DO NOT USE LIVE”.
- [x] Hub registration: Alessio Tampella saved as IN, source HUB; manual existing-league-player transfer verified in the TEST event. Do not describe this initial Hub registration as an automatic-transfer pass.
- [x] Remote registration: Eric Werkestam saved as IN, source MOBILE, and reached the TEST Nakka event automatically.
- [x] Kiosk registration: Axel Johansson Edström saved as IN, source KIOSK, and reached the TEST Nakka event automatically.
- [x] Three-player comparison: Hub 3 / Nakka 3, all three names matched; Hub-only 0, Nakka-only 0, duplicates 0. Name comparison alone does not prove permanent league identity linkage.
- [x] Attention check repaired and completed; no players needing review. Dashboard showed IN 3 / attention 0; consent values and message buttons visible. Message contents and all consent behaviours still need their own acceptance checks.
- [x] Beauty Live showed the three players; repaired Hub launcher opened it successfully (owner confirmed).
- [x] Sign-out returned the Hub to login. Separate Beauty Live remained available after reloading (owner confirmed). This is workflow evidence, not a full security audit.
- [x] Remote and kiosk colour fixes saved to Google TEST: white form, black controls, AIK yellow highlights. Remote pinning/scroll CSS updated; existing kiosk pinning and sizes preserved. Final mobile visual acceptance remains open.
- [x] All six source fixes synced to the local Mac project: LOCAL_SYNC_PASS at 2026-11-01T22:53:11.802Z (23:53 Stockholm). Files: HubTestNakkaEvent.gs, HubTestNakkaTransfer.gs, HubTestAttention.gs, RemoteRegistration.html, KioskTest.html, BeautyLiveTest.gs.
- [x] Local backup: backups/test-sync-2026-11-01T22-53-11-736Z. Local audit: evidence/test-sync-2026-11-01T22-53-11-736Z. Under the current Beauty-Admin-Hub project. Package: Beauty-Hub-Sync-20261101.zip, corrected launcher filename BeautyLiveTest.gs.
- [x] Isolated mocked checks: event lookup 17, transfer 14, attention 7, Live launcher 9. Installer fixture checks covered install, repeat run and unknown-baseline refusal. These do not replace project-wide regression or native acceptance.

### Next work, in order

1. [ ] Run npm test and npm run test:inventory on the synced Mac project; retain dated output and review failures before further Google uploads. Do not assume old test assertions automatically qualify the new TEST target.
2. [ ] Fix remote mobile typography throughout the form and player popup; sizes are too small. Repair popup spacing/alignment and check on a real phone. Preserve independent kiosk sizing. Detailed screenshot reference is in the next section.
3. [ ] Verify final remote/kiosk colours, touch targets, search/pinned new-player option, consent selection and confirmations on their actual devices.
4. [ ] Test IN / OUT / STANDBY changes, reload persistence and their intended effect on Nakka, planner and Live; do not infer behaviour from registration tests.
5. [ ] Test duplicate registration across Hub/mobile/kiosk and existing-name manual entry; confirm no duplicate registration or repeated Nakka transfer. New-player and same-name identity flows need separate controlled qualification.
6. [ ] Verify saved messages, consent and original registration source remain correct through status changes and refresh.
7. [ ] Correct the stale old-event introductory text in the Hub transfer dialog using the current HubTest.html. Server-side transfer preview was correct; presentation still needs alignment.
8. [ ] Review planner/stage TEST target configuration before using it with this new registration event. Existing stage planner/audit references remain on the old TEST event; they were not migrated by the Live launcher fix.
9. [ ] Complete remaining ranking/statistics, competition display, full event rehearsal and release checks against current source; retain the detailed historical requirements below.

### Launch constraints

- Production Beauty and Monday 2 November's normal Nakka layout remain unchanged.
- Nakka custom theme is staged only: enabled=false, autoApply=false, targetEventId=null. Activate it with the eventual combined Hub launch, after final review.
- Existing theme work is complete/staged, including the pool-heading alignment fix and Live-feed operating instructions; no extra CSS installation step is needed now.
- Keep the scoring session active for the Live-feed behaviour already verified. Broader background/closed-session behaviour remains unqualified.
- Before a later-day public registration test, review the TEST Hub date and dedicated Nakka TEST event together: mobile/kiosk registration enforces today's date.
- No production deployment, Google upload by the sync installer, Git commit or push was performed. Full production release remains pending.

## Next session — mobile Tonight’s Players popup (1 November 2026)

- [ ] Fix the remote/mobile “KVÄLLENS SPELARE” popup layout, using Screenshot 2026-11-01 at 23.47.22.png as the issue reference (libfile_2c0d916bd200819182f05a3107584af9). Review heading/count alignment, excess spacing, player-name size/readability, close controls and phone viewport fit. Preserve the live count, player data and existing registration logic. Confirm the desired final layout with Alessio during review; this item records the issue without claiming a specific visual fix is approved.
- [ ] Increase all remote/mobile registration font sizes for phone readability: headings, labels, helper text, search/input text, dropdown names and pinned new-player option, consent choices, message field, submit/confirmation text, and Tonight’s Players popup names/count/controls. Current remote typography is too small per Alessio, 1 November 2026. Review on an actual phone; preserve independent kiosk sizing, agreed colours and registration behaviour. Exact sizes require mobile review; do not mark accepted from desktop alone.
- [ ] Review on an actual phone and record before/after evidence. Deferred to next session; no code change for this item tonight.

## Next-stage development — Beauty AI + Music & Playlists (31 October 2026)

Status: AGREED / PLANNED — begin after the core Hub is stable. These features are not current core-release dependencies.

- [ ] Beauty AI: explore an organiser assistant to help Alessio run tournaments within the Hub. Define the first useful tasks and integration scope during this next stage.
- [ ] Music & Playlists: explore adding Spotify playlists/music access in the Hub for event use. Verify supported integration options and applicable service requirements before implementation.
- [ ] Keep core Hub stability, event workflow verification and existing release priorities ahead of both additions.

Requirements recorded only; neither feature is implemented or deployed by this update.

## Integration coding follow-up - 29 October 2026

- [x] All morning code retained; authenticated, date-checked Hub opener and guarded TEST stage route/build prepared. Deployed mode loads real TEST data directly and never paints synthetic players. Native upload and comparison pending.
- [x] Documented rr/league matrix projection (league card ids), independent third-place tables/results, explicit leg/set labels with ambiguity handling, knockout-only feed fallback. No independent progression or scoring writes. Native responses/badges remain unqualified.
- [x] Correct sidebar Condensed override and smaller Hub/Planner controls; preserve independent kiosk/remote sizing and remote-only player list.
- [x] Offline production profile template/validator rejects TEST targets and premature writes. Production runtime migration is NOT complete or enabled.
- [x] 563 local tests/46 files and inventory PASS. New Google plan18 before/19 after,7 scoped outputs including new StageTest,12 preserved. Not owner-installed or uploaded.
- [ ] Real overall ranking/ties; native board badges/matrix comparisons; supported board-plan transfer; full rehearsal; controlled production runtime migration and release. Sunday evening1Nov target for Monday2Nov; these remain release priorities.

## Kiosk and remote - same style, independent sizing (29 October 2026)

- [x] Owner keeps original kiosk typography/button sizes and touch dimensions. Kiosk-only colour theme preserves base CSS sizes; common AIK artwork/colours remain. No kiosk Tonight's Players display/list is needed; venue TVs supply it. Existing kiosk already omitted the list; retain that behavior. Registration name dropdown remains.
- [x] Remote retains its player list and independent typography/touch sizes. Its generated HTML remains unchanged. Separate theme sources prevent future mobile sizing changes from shrinking kiosk controls.
- [x] Candidate548 tests/44 files and inventory PASS; player builder and guarded installer updated. Five scoped Google changes including KioskTest,13 preserved. Not owner-installed or deployed.
- [ ] Check physical Lenovo tablet touch/readability and remote mobile separately during rehearsal.

## Screen-ready display controls — owner screenshot clarification, 29 October 2026

- [x] All stages view; independent open/close chevrons for Round robin and Knockout stages1/2. Per-stage Earlier/Later arrows show two adjacent knockout rounds, letting the organiser move past earlier rounds. White numeric styling and fullscreen/options retained. No new casting system: owner already casts a browser tab to the TVs.
- [x] Stage collapse/round choices survive feed updates, with safe clamping if source rounds disappear; no automatic rotation of hidden pools and no guessed completion-based hiding. Not persisted across a full page reload.
- [x] Candidate547 tests/44 files and inventory PASS; saved with screenshot references IMG_0605.png through IMG_0609.png. Not owner-installed or deployed.
- [ ] Native TV/desktop layout review; exact Nakka leg-format/third-place mapping and full round-robin result matrices still pending real response qualification.

## Additional stage preparation — 29 October 2026

- [x] Prepared reusable safe stage renderer and standalone TEST review screen: pool standings, 4/6-pool paging, stage selector, match averages, byes/winner slots, white numbers, fullscreen/options, manual/automatic refresh and optional page rotation. Missing badge payload is unavailable, not assumed unassigned.
- [x] Failure/paused/offline/overdue views mark board assignments as last known. Hidden tabs stop polling/rotation; page exit cancels timers and suppresses late responses. Local stage-only preview policy permits public API origin; other local Hub pages stay offline.
- [x] Read-only schema diagnostic collects bounded structure without player/provider text values or private admin fields, fixed target only, with revision consistency report. Native acceptance worksheet prepared.
- [x] 543 tests across44 files and inventory PASS. Existing archive updated; not installed on owner Mac or uploaded to Google.
- [ ] Actual Nakka GET shape/CORS/automatic badge behavior, full group result matrices, real overall ranks, final screen alignment and authenticated Hub/public casting route remain for native qualification/integration. No Nakka board/configuration writes enabled.

## Badge mirroring candidate follow-up — 29 October 2026

- [x] Code fixed TEST public GET controller and exact stage/round/even-slot badge projection; white match board labels, unassigned/unavailable/stale handling, assignment/reassignment/removal tests and no-overlap/cancel protections. Standalone competition preview offers explicit read-only load; no provider writes.
- [x] 531 tests/42 files and inventory PASS. Updated same Beauty-Tonight-20261029 candidate; owner baseline still d40d0a4, not installed/deployed.
- [ ] Qualify actual tournament.badge GET schema; adapter currently expects key→{str,st} from documented badge write contract. Direct API read via browsing tool was inaccessible; do not call this real-data verified. Optional scripts/inspect-stage-readonly.cjs prepared for owner collection.
- [ ] Final approved pool/knockout styling, production navigation/casting route wiring, real overall ranks and Nakka board-write qualification remain pending. Nakka automatic assignments take precedence over Hub planned boards; do not run a second assignment engine during knockout display.


## Prepared tonight candidate — 29 October 2026

Owner requested advance coding and one saved folder. Beauty-Tonight-20261029 contains source, guarded local installer, Google staging/readback helpers,527-test evidence, installer/Google mock rehearsals and handover. NOT owner-installed or deployed.

- [x] Candidate typography/direct login/Remove beside Source; numeric pools; actual-board selector and allocation/shared-board overview;30-player Live paging/fullscreen/options; cache-backed public points and averages; conservative unassigned-entry send review/block; isolated read-only stage model and synthetic preview.
- [x]527 tests/41 files, inventory, both builds, guarded install/repeat refusal and18-file Google mock staging/readback/drift refusal PASS. Four Google changes,14 preserved.
- [ ] Native visual and integrated data verification tonight before owner upload. Rank remains unavailable until real overall rank/ties qualified. Stage provider wiring and Nakka board writes remain pending; Hub allocation is explicitly planned only.
- [ ] Current owner baseline remains d40d0a4; full18-file readback was verified2026-10-29T05:46:15.632Z. Native status25 statistics load succeeded,60IN/five unresolved identities. Do not rerun prior installers.

This candidate supersedes the earlier519-test prepared starting point. Applied-source archive is not replaced with uninstalled code.

## Agreed — Beauty presentation of Nakka pools, knockout stages and board assignments (29 October 2026)

Owner clarifies and approves: “translate” Nakka's competition layout/data into Beauty's AIK-styled interface. Nakka remains the competition/scoring/results system; this is not a second tournament engine or duplicate score-entry workflow.

- [ ] Add AIK-styled pool-stage views: numbered pools, board assignments and sharing, players, match results, wins/losses, standings and averages from the correct Nakka event.
- [ ] Add knockout-stage bracket views showing actual participants, byes, round/leg format, results and advancing players as supplied by Nakka; do not invent progression or independently resolve ties.
- [ ] Integrate existing approved Hub seeding/selected-board planning with supported Nakka writes, then read back groups/cards/assignments. Show planned Hub allocations distinctly from verified provider state until readback agrees.
- [ ] Read tournament/get for brackets/results/settings, tournament/standings for provider-computed group standings, league/schedule/get for league fixtures, tournament/stats for relevant stage stats, and match/list/get/live for match progress. Distinguish frozen overall seeding averages from current event/group/match averages.
- [ ] Qualify tournament/badge/update for actual match board numbers, tournament/memo/update for pool/division notes, and autopilot settings/status for automatic assignment. Do not equate a note or badge with enforced scheduling or assume whole-pool allocation automatically configures every match.
- [ ] Test sparse available boards and two pools sharing one board, match sequencing/player conflicts, manual overrides, stage transitions/byes, corrections and live refresh/recovery against controlled TEST data. Preserve unrelated settings, results and existing journals; require explicit review for writes.
- [ ] Preserve public cast/fullscreen/options and organiser access boundaries; backend-only admin credentials/private fields. Display source/update time and honest stale/unavailable states. Keep future mobile event hub aligned with the same event data where in scope.

Feasibility: documented API support confirmed29Oct2026 from official https://push.n01darts.com/api/v1/n01_api_manual_en.html (standings, brackets/results, live match data, board badges, group notes and autopilot). Exact Beauty workflow and provider field mapping still require implementation and native TEST qualification; no deployment or mutation performed by this requirements save.

Owner screenshots IMG_0598.jpeg and IMG_0599.jpeg are pool/knockout functional references. Preserve original AIK fonts/artwork and agreed readable styling rather than copying Nakka's white table appearance.

## Approved Pool Planner typography; numbered pools and actual available boards (29 October 2026)

Owner accepts the latest enlarged-font Pool Planner mockup as the direction, saved for computer review tonight. Preserve original AIK fonts/artwork, current engine, manual swaps, identity review and guarded handoff. Mockup is illustrative, not deployed or native acceptance evidence.

- [ ] Apply matching approved Hub typography:48px EVENT HUB,22px Condensed Bold sidebar/labels,26px section/pool headings,24px bold player names and readable Siffror averages,20px body/controls,18px buttons. Long names wrap without overlapping the reserved average column. Review actual viewport before acceptance; do not force all cards on screen by shrinking text.
- [ ] Replace user-facing pool letters A/B/C with numeric labels Pool1/Pool2/Pool3, consistently across preview, swaps, approval, audit and board overview. Keep internal provider indices/identities correctly mapped; verify whether Nakka permits matching display labels rather than assuming it.
- [ ] Replace count-only board planning with selection of actual available board numbers. Venue has15/16 boards and availability varies nightly. Provide a clear numbered multi-select (for example1–16) and/or range entry, showing selected boards and derived count. Board selection is scoped to the current event.
- [ ] Support owner's exact example:1–4,7–9,13–15 gives available boards1,2,3,4,7,8,9,13,14,15 (TEN boards). Never assign unavailable boards5,6,10,11,12,16.
- [ ] Automatically allocate every numbered pool to one selected board and show each pool's board plus a board-first overview listing every pool sharing it. Where pools exceed boards, clearly distinguish sequential starting batches/sharing; do not imply simultaneous games or guaranteed start times.
- [ ] Spread pool workload sensibly across available boards, considering pool sizes/round-robin match counts where relevant; preserve seeded memberships/capacities and allow explicit organiser review/adjustment. With20 equal-size pools and the example10 boards, a simple proposed overview is board1:pools1&11, board2:2&12, board3:3&13, board4:4&14, board7:5&15, board8:6&16, board9:7&17, board13:8&18, board14:9&19, board15:10&20. This is an illustrative allocation, not a saved draw.
- [ ] Board changes invalidate relevant approval and require refreshed allocation/review; never silently change a sent draw. Preserve player membership and flag any plan that cannot be allocated. Validate empty selection, duplicate/range entries, sparse/nonconsecutive boards, fewer/more pools than boards, mixed pool sizes and withdrawals.
- [ ] Qualify provider support before promising board assignments transfer to Nakka. Hub board planning and verified Nakka group/card handoff are distinct; do not overwrite unrelated settings or claim provider scheduling/board assignment is implemented from a mockup.
- [ ] Record implementation/tests and native computer review tonight before deployment. No application code or external event changes by this note.

Visual reference: latest Pool Planner mockup in this conversation, enlarged typography and six sample pool cards. Subsequent numbered-pool/actual-board requirements above supersede its lettered labels and count-only setup.

## APPROVED — Beauty Live ranking/statistics mockup (29 October 2026)

Owner clarification: retain the existing Full Screen control and options/settings bar. The mockup must not remove existing display controls. Organiser chooses names-only or ranking/statistics for casting. Ranking view must follow verified REAL overall Nakka league rank ascending, preserve actual rank values/ties rather than renumber the selected event subset, and place unranked players last alphabetically. Do not sort ranking view by average or registration order. Preserve existing names-only sorting options and30-player pagination. Verify switching views, fullscreen entry/exit and access to the options bar in native TEST; missing/unavailable ranking must be clearly indicated, never fabricated.

Owner explicitly approved the displayed mockup and requested saving it. Approved reference: AIK Darts ranking and statistics screen.png (libfile_d83cc862b2c081918b890bcb561bf089), retained as the visual reference.

- [x] Design approval:30 players per page in THREE columns of TEN; automatic rotation with page/player-range indicator (65 gives30/30/5).
- [x] Design approval: large readable bold condensed names, clear numerals, compact branded header, black/white/AIK-yellow palette and thin yellow vertical column dividers plus footer/batch divider.
- [x] Design approval: existing player/statistics view controls; ranking view columns RANK / SPELARE / POÄNG / SNITT. Connect the existing tab rather than creating a duplicate.
- [ ] Implement using original AIK artwork and font files. Generated artwork/type are references only. Verify precise sizes, long-name fit and venue readability on the actual display.
- [ ] Connect verified overall Nakka league ranking, points and weighted three-dart average. Mockup rankings/points are illustrative sample data and must never become production fixtures or acceptance evidence. Preserve missing-data handling, source freshness and backend-only credentials.
- [ ] Record implementation tests and native review/readback before release. Design approval does not mean the statistics connection is implemented, verified or deployed. Production remains untouched.

This approval supplements the detailed Beauty Live requirements below and is saved for tonight's consolidated work.

## Beauty Live — 30 players per page and connected statistics (29 October 2026)

Owner requests the following for the consolidated review/implementation. Existing statistics tab is present but not fully connected, per owner report; integration is not complete or accepted.

- [ ] Show30 players per page with automatic page rotation, retaining thin AIK-yellow division/batch line. Final page holds the remaining players, without omissions or duplicates (65 players gives30/30/5).
- [ ] Enlarge venue-screen names and row numbers using original AIK fonts. Proposed starting targets32–36px bold Condensed for names and28px Siffror for row numbers; verify at actual display resolution/viewing distance with30-player capacity and long names. These Live sizes are proposals, separate from approved Hub sizes.
- [ ] Complete the existing average/ranking/stats tab connection rather than adding a duplicate tab. Inspect current source and controls before implementation.
- [ ] Use real overall AIK league data linked to reviewed player identities: overall weighted three-dart average, overall ranking and points. Reuse the shared qualified data service where appropriate; never substitute ranking points for averages or invent missing data/rank tie rules.
- [ ] For the ranking view show NAME / RANK / POINTS and the requested average where appropriate, ordered by overall rank ascending; registered unranked players at bottom alphabetically. Missing averages remain clearly unavailable/Unseeded, never fake0. Qualify additional statistics fields before displaying them.
- [ ] Preserve separate public cast view and backend-only provider credentials; show last update and honest stale/unavailable state, with self-refresh. Preserve current registration/status inclusion rules unless explicitly changed.
- [ ] Test source identity mapping, known average/points comparisons, rank/ties/missing data, refresh/failure/recovery,30-player paging, long names, yellow divider and actual venue readability in TEST. No production change or provider mutation by saving this requirement.

Native reference: IMG_0587.jpeg. Review tonight alongside saved sign-in and dashboard typography work; no scheduled reminder requested.

## Dashboard typography and Remove placement — saved for tonight's review (29 October 2026)

Owner likes the latest dashboard mockup and explicitly requests retaining Remove beside Source. Design direction accepted provisionally; computer review is pending tonight. No application code, deployment or native acceptance changed by this save.

| Element | Approved target |
| --- | --- |
| EVENT HUB | 48px |
| Sidebar labels | 22px AIK Condensed Bold |
| Card labels | 22px AIK Condensed Bold |
| Player totals | 44px AIK Siffror |
| Tonight's Players | 26px Bold |
| Table headings, including # | 26px AIK Title; lighter bold appearance |
| Player names | 24px Bold |
| Row numbers | 24px AIK Siffror |
| IN / OUT / STANDBY | 20px |
| Consent controls | 20px |
| Messages | 20px |
| Source | 20px |
| Buttons | 18px |

- [ ] Retain the latest mockup's dashboard layout and position each Remove button beside its row's Source, rather than underneath it. Preserve the existing explicit removal preview, confirmation and backend safeguards.
- [ ] Implement with original AIK fonts/artwork. Mockup proportions are illustrative; the table above specifies actual CSS targets. Use only available font weights rather than inventing a font file called “light bold.”
- [ ] Keep STANDBY fully readable at20px with sufficient control width, padding and separate chevron; retain semantic orange/green/red status colours.
- [ ] Review on the owner's computer tonight: hierarchy, long names,26px column headings, Source/Remove alignment, narrow viewport and scrolling/fixed rows, keyboard focus and action usability. No automatic reminder requested.

Visual reference: AIK Event Hub dashboard mockup(1).png, saved image libfile_9c509a993f608191a7eb6e7b41ddf2cb. This supersedes earlier assistant-proposed dashboard sizes. Preserve honest unavailable attention state and every existing action; this is a typography/layout revision.

## Agreed — remove extra post-login screen (29 October 2026)

- [ ] Remove the intermediate “Signed in / Open Hub” screen for the current single-event Måndagsdartarna workflow. Successful authorised sign-in should open the Hub dashboard directly.
- [ ] Keep the signed-in account and Sign out accessible in the sidebar. Preserve authentication, authorisation, session expiry and logout safeguards.
- [ ] For future multi-event support, use an event chooser only when the organiser has multiple available events; a single available event opens directly. Keep each event's players, settings and Nakka target separate.
- [ ] Verify direct login, failed/unauthorised login, expired sessions and sign-out in TEST before release.

Status: REQUIREMENT SAVED; no application code or deployment changed by this note.

## Approved — sign-in typography and artwork (29 October 2026)

Status: OWNER-APPROVED DESIGN; implementation and native review pending. Save this direction for the consolidated font-size update; no application code or deployment changed by this note.

- [ ] Use original AIK artwork and original AIK font files, not the generated mockup's approximations.
- [ ] Centre the masthead as AIK [original crest] DART, with both words AIK yellow. Place EVENT HUB underneath as the yellow subtitle; omit BEAUTY from this masthead.
- [ ] Give the crest clear space below its bottom edge. Lower EVENT HUB and the content beneath it slightly so the crest and subtitle do not touch or overlap; keep the full composition centred and balanced.
- [ ] Place the large white body line “Your Event Starts Here” beneath EVENT HUB. Keep “Sign in” as a smaller white subheading and the field labels white.
- [ ] Retain the dark card, fine AIK-yellow border, readable inputs, consistent black/yellow buttons, and properly spaced Forgot password? link. Maintain practical desktop/mobile sizing without clipping or excessive empty space.
- [ ] Keep a discreet readable shared-computer sign-out/password reminder. The IDENTITY TEST / approved staff accounts notice remains specific to TEST, not the proposed production design. Present actual session-timeout behaviour accurately.
- [ ] Verify final font sizes, crest/subtitle spacing, keyboard focus and form behaviour in TEST before release. Preserve authentication and session safeguards.

Approved visual reference: the second sign-in mockup in this conversation, showing AIK [crest] DART / EVENT HUB / Your Event Starts Here, with the owner's subsequent spacing correction above. The image is a layout reference, not production artwork.

## Agreed — pre-send pool reconciliation review (29 October 2026)

Status: REQUIREMENT SAVED; not implemented or natively verified by this note.

- [ ] Before sending the approved ready-made pools to Nakka, show a “Ready to send?” review popup or equivalent clear review panel.
- [ ] Show IN players included in the pools, OUT/STANDBY players excluded but still registered in Nakka, and unresolved league/event identities. Include names and counts so the organiser can resolve each case.
- [ ] Let the organiser return to correct Hub statuses or separately review explicit event-registration removal. Keep permanent league profiles; never automatically remove registrations or silently add excluded players to pools.
- [ ] Verify in TEST whether Nakka allows registered players to remain unassigned and generates matches only for the exact approved pool membership. This provider behaviour is not yet natively verified.
- [ ] If excluded registrations are permitted, show a clear reminder before explicit send confirmation. If they conflict with group/card generation, block sending until the organiser resolves the mismatch.
- [ ] Unresolved identities block sending. Any relevant roster/status change invalidates the frozen approval and requires a fresh reviewed preview.
- [ ] Record tests and audit evidence for mixed IN/OUT/STANDBY lists, unresolved identities, status changes, explicit removal, and exact group/card readback. No Nakka mutation was performed by saving this requirement.

Owner clarification: the Hub sends the approved ready-made pools to Nakka; Nakka generates the round-robin matches from those groups. Previewing and swapping do not send changes.

## Status25 diagnosis and correction — latest29Oct2026

- [x] Owner ran read-only diagnostic: fixed TEST is status25 Building the bracket; expected IDs/title/normal01 league settings match; auto_schedule is boolean true.
- [x] Diagnose planner-only guard omission: accepted10/20 but omitted pre-play25. Actual group/result/card state was not included in output.
- [x] Prepare guarded status25 correction with515 tests/39 files, build/inventory and installer/Google rehearsal PASS. No provider mutation. Active30/finished40 and every existing-data/snapshot/auth/ticket/audit/readback barrier retained; no status change; other routes unchanged.
- [ ] Apply Beauty-Pool-Status25-TEST-20261029 from cleanb0e3ebf. Google fresh18-file stage changes HubTestPools.js only;17 files preserved. Owner push/full readback and native load retest.
- [ ] Continue workspace viewport/keyboard/colour/invalidation review and intended identity resolution before any separately reviewed pool/card handoff. No real pool send performed.

Owner-applied source remainsb0e3ebf until installer confirmation. Earlier pending
diagnostic entries are superseded by the verified status25 cause above.

## Bedtime checkpoint — 29 October 2026

- [x] Approved full-page workspace installed at **b0e3ebf**; guarded local PASS23:17:14.017Z,511 tests/39 files, backup pool-workspace-before-2026-10-28T23-16-38-418Z.
- [x] Google18-file push and complete byte readback PASS23:20:11.720Z; stage pool-workspace-google-H8UcOP. Other17 Google files preserved.
- [x] Native new page/sidebar/setup render. Current IN60, preferred3,12boards gives20pools/two batches.
- [ ] **NEXT: read-only diagnose event guard failure**: Only the pre-start, single round-robin Beauty TEST league event is supported. Cause unproven; terminal diagnostic not yet run because owner stopped for bed. No event/settings changes or guard bypass.
- [ ] After diagnosis, complete native workspace functionality/viewport/keyboard/wrapping, colour bands and source/settings/roster/session invalidation checks.
- [ ] Resolve intended missing identities/event entries before an explicitly reviewed TEST group/card handoff. No pool send performed.
- [x] Save applied code, deployment evidence and bulk audit in current-source archive and handover notes. Production/JDC untouched.

Owner stopped for bed; retain this checkpoint and resume diagnostics next session.
Earlier pending workspace-install/upload statements are superseded.

## Approved Pool Planner workspace — latest

- [x] Owner display fix installed72d0b68 and full18-file Google byte readback PASS22:38:20.577Z.
- [x] Native statistics rows render. Adam40.83/Alexander36.67 match Nakka; sampled frozen pools show even Unseeded coverage; Nina/Alexander manual swap verified D46.12/E45.94. Bulk native record updated.
- [x] Owner approved professional full-page mockup after identifying crowded long names/averages and confusing estimate field.
- [x] Implement approved workspace with original AIK fonts, compact setup and batches, separate freshness/player-review panels, Advanced planning, distinct name/average columns, optional bands, swap toolbar and guarded Nakka stages. Backend/core byte-identical.
- [x]511 tests/39 files, build/inventory, installer and18-file Google staging/readback mock rehearsals PASS. Candidate Beauty-Pool-Workspace-TEST-20261028.zip.
- [ ] Owner install from clean72d0b68, then fresh Google18-file stage: HubTest.html only,17 preserved, owner push and full readback.
- [ ] Native full-page appearance, responsive wrapping, sidebar/scroll/keyboard, preference/boards/estimate, colour bands and invalidation review.
- [ ] Resolve intended identity/event-entry issues before an explicitly approved Nakka pool/card handoff. No pool send has been performed.

This section supersedes earlier pending display-fix installation statuses.

## Pool install verified; native display correction — latest

- [x] Owner local seeded-pool install PASS at **c434716**; backup saved.
- [x] Google18-file upload and complete byte readback PASS22:27:18.636Z; stage seeded-pools-google-7YAt02.
- [x] Native first load reaches current AIK league statistics and60 IN mapping proposals; review rendering fails on undefined.toFixed.
- [x] Prepare guarded display fix: optional averages normalized to Unseeded, measured zero preserved, frozen-pool means protected, real DOM parentElement used for identity changes.505 tests/39 files, build/inventory PASS.
- [ ] Apply Beauty-Pool-Display-Fix-TEST-20261028 from clean c434716; then HTML-only overlay preserving17 Google files, full18-file readback and native retest.
- [ ] Native average/source/rounding comparison, complete identity review, seeded preview/swaps/colours/roster invalidation and separately approved Nakka group/card handoff remain pending.

These results supersede earlier pending local pool-install and upload sections.

## Seeded Pool Planner — latest candidate status

- [x] Read and implement the full agreed pool/shared-data/approved-transfer scope.
- [x] Owner decision: missing-average players spread evenly as **Unseeded**, never fake0; manual moves and imbalance warnings retained.
- [x] Qualify real read-only JSON:97 league profiles,92 score/dart aggregates, all92 point totals agree with per-event sums,57 TEST event entries. Actual target is normal `lg` league divisions, not `rr`.
- [x] Shared backend LPID statistics, weighted three-dart average, separate points, five-minute freshness/manual+visible-panel refresh, durable last-good and stale/unavailable blocking; no exposed credentials or invented rank/tie semantics.
- [x] Full pool UI: original5–101 scheme/preferences/boards/five-player exception/manual planning count; reviewed identities; seeded frozen preview; means/coverage; swaps; optional adjustable bands; IN-roster/date/source invalidation.
- [x] Approved fixed TEST pool handoff: existing entries only, explicit identity review, exact target/pre-start guards, preserve all other settings/entries, CAS groups plus required native match cards, durable before/readback audit, repeat/stale/uncertain barriers.
- [x] **503 tests/39 files**, build/inventory, guarded installer and mocked Google preparation/readback PASS. No actual Google/Nakka write during development. Candidate package Beauty-Seeded-Pools-TEST-20261028.zip.
- [ ] Owner apply from clean86c068e; installer saves backup/evidence and scoped commit. Current applied/Google source remains86c068e until then.
- [ ] Fresh-clone Google stage:2 changed +1 new module,15 files preserved,18 total; owner push and full18-file readback.
- [ ] Native UI and weighted-average/source/rounding validation; original scheme, colours, swaps, frozen preview, additions/withdrawals/session changes.
- [ ] Resolve intended missing/ambiguous league identities and TEST event entries explicitly; do not backfill or retry earlier registrations implicitly. API-hidden saved league links remain unverified.
- [ ] Controlled first Nakka handoff, preserving settings/order/entries and verifying every native division/card. No event start or production enablement. Partial sends retain ATTEMPTED and require inspection, never blind retry or journal deletion.
- [ ] Next separate feature: Live larger venue-readable text, real rank/points and thin yellow page/batch divider. Stable Mac location and independent backups remain open.

The section above supersedes older pending pool-development/collector statuses.
Code and synthetic verification are complete; owner installation and native review
remain pending. Beauty-Current-Source.zip remains the applied86c068e reconstruction.

## Current accepted follow-up — Adam existing-entry review

- [x] Owner local existing-entry review install PASS at **86c068e**;464 tests/36 files, build/inventory; backup entry-review-before-2026-10-28T21-28-21-729Z.
- [x] Three Google changes,14 preserved, full17-file upload/readback **PASS at2026-10-28T21:32:08.449Z**; stage entry-review-google-BuJ9AU.
- [x] Native Adam review-only preview/explicit confirmation: current entry reviewed, no new player added, original ATTEMPTED journal retained; unexposed exact league link remains unverified.
- [x] Owner confirmed CHECK AGAIN reduced alerts7→6 and Adam is no longer listed. Historical POST attribution remains unverified; do not delete/reset the old journal.
- [x] Bulk review and canonical source/continuation records updated to applied86c068e. Do not reinstall old packages.
- [ ] Six earlier league-identity cases; remaining release/session/concurrency/rollback/public-page and independent Sheet recovery checks.
- [ ] **Next development: seeded Pool Planner**, owner priority, with overall three-dart averages, balanced stronger IN players, preview/manual moves and separately verified Nakka group handoff.
- [ ] Live venue-readable typography/rank/points/yellow batch divider; stable Mac location and independent backup plan.


## Existing-entry review — latest follow-up

- [x] Diagnose seventh alert from owner Adam ATTEMPTED journal: old beforeCount1/fingerprint no longer proves a write against57 current entries. Presence is confirmed; attribution is not. Owner removed only Anna Felldin, not Adam.
- [x] Prepare staff-only CONFIRM EXISTING ENTRY path with no provider POST/Sheet change, preserving original attempt and immutable review receipt; missing/replaced entry and modified-journal retry barriers retained.
- [x] Local464 tests/36 files, inventory/Hub build and installer/Google helper rehearsals PASS.
- [ ] Owner apply Beauty-Existing-Entry-Review-TEST-20261028.zip at clean35e54bf; stage3 changes preserving14 Google files, push and verify17-file readback.
- [ ] Native Adam REVIEW_EXISTING preview/explicit confirmation. Expect original ATTEMPTED record unchanged; membership63/57 unchanged; alert7→6 after verified review/CHECK AGAIN. Do not re-register or blindly clear/delete journals.
- [ ] Continue six pending league-identity cases and release checks. Seeded Pool Planner remains next requested development priority after this issue.


## Latest bulk acceptance — 28 October 2026

- [x] Owner local player-actions checkpoint **35e54bf**, tests/build/inventory PASS (452 / 35 files).
- [x] Exact default-wrapper repair, 17-file Google TEST push and complete 17-file byte readback PASS at 2026-10-28T20:38:31.061Z.
- [x] Native Hub shows AIK Siffror, SOURCE/REMOVE and working six-player attention list.
- [x] Native explicit removal of Beauty Test New 01 from TEST event 27 October: Hub success/recovery reference, Nakka event entry absent, league profile retained, totals **64 / 62 IN / 6 alerts**.
- [x] Bulk text review saved as Beauty-Native-Review-20261028.md; current-source snapshot updated to applied code. Historical newer Mac Git objects remain unrecovered.
- [ ] Six pre-existing pending league identity cases; do not auto-backfill or retry registrations.
- [ ] Full native STANDBY control confirmation; public remote/kiosk review; independent Sheet preservation/recovery and uncertain/concurrent/session/release paths as needed for launch. One happy-path TEST removal is not production readiness.
- [ ] **Next development priority: seeded Pool Planner**, using overall three-dart averages, balanced strong-player distribution, preview and manual moves. Nakka group transfer requires separate verified review.
- [ ] Live larger readable typography, real rank/points and thin yellow page/batch divider. Stable Mac project location/independent backups remain open.

The latest Google and removal status supersedes older pending-install/pending-push
sections below. Do not rerun the installers at the current35e54bf checkpoint.


## Latest owner result — player actions installed, Google preparation blocked safely

- [x] Owner local apply PASS at **35e54bf** (28 October 16:37:01.446Z), backup player-actions-before-2026-10-28T16-36-32-443Z. Do not rerun the installer.
- [x] Diagnose Google preparation mismatch from owner diff: baseline HubTestAttention.js was wrapped inside default myFunction(), hiding its functions. No upload occurred.
- [x] Prepare exact-wrapper-only helper correction, preserving downloaded original and every other baseline guard. Four helper tests plus standalone correction/preparation rehearsal pass; application suite remains 452 tests.
- [ ] Owner run repair-beauty-upload-check.cjs from Downloads; inspect fresh stage output, push, verify all 17 remote files, then bulk native review.
- [ ] Verify attention check works once corrected top-level helper is uploaded. Continue prior Nakka/removal/pool priorities below.


## Current recovery and player actions — 28 October 2026 (supersedes older status)

- [x] Recover Beauty into a clearly labelled multi-folder workspace, retaining original archive and separating historical/current prepared source. New owner Git root be4f1a3 on recovery/2026-10-28; missing previous Mac history is not restored.
- [x] Owner manually saved all seven dashboard files to Google TEST.
- [x] Correct unintended Arial overrides to original AIK fonts. Owner local 434-test PASS, backup before-font-fix-SsVMPP, checkpoint a237a8e; clasp 3.4.1 via npx configured and 16-file TEST push succeeded at 17:05:04. Native Hub screenshot received; NEW PLAYER badge approved.
- [x] Prepare orange STANDBY, original AIK Siffror totals/row numbers, and explicit confirmed REMOVE from both Hub event registration and Nakka event entry, keeping league/master profile. Exact TPID preview, pre-start/no-bracket gate, backup, uncertainty journal and retained alert. Keep NEW PLAYER label.
- [x] Local 452 tests/35 files, inventory/Hub build; synthetic dialog/stale-session/double-confirm/error checks; local installer and Google prepare/readback helper rehearsals. No native removal executed.
- [ ] Owner apply Beauty-Player-Actions-TEST-20261028.zip from clean a237a8e; then prepare Google stage, owner push, full 17-file readback, bulk native review.
- [ ] Native test ONE explicitly chosen TEST registration through preview/confirm. Verify Hub/Nakka entry absent, league/master identity retained, other players/messages/consent/source and Sheet formulas intact. Keep recovery reference. No uncertain-operation retry.
- [ ] Inspect attention check unavailable shown in native screenshot although API dot green. Finish Nakka reliability/attention qualification.
- [ ] Stable Mac project location and independent recovery backup. Current working source is in Downloads/Beauty-Recovered-20261028/02-Prepared-Dashboard-Source/Beauty-Admin-Hub; update workspace explicitly if relocated. JDC source/recovery is separate and has not been supplied here.
- [ ] Then seeded Pool Planner — owner priority. Continue remaining native/session/concurrency/release checks and larger Live typography/rank/points/thin yellow page divider.

Use npx --yes --package=@google/clasp@3.4.1 clasp, not the failed global install.
Do not run old apply-dashboard.cjs against the new recovery Git history. Current
owner source checkpoint is a237a8e; removal package is prepared, NOT deployed.


## Latest prepared revision 2 — AIK header, sidebar controls, remote and kiosk

Owner approved the final mockup and asked for code across all three surfaces. Revised **Beauty-Dashboard-TEST-20261028.zip** replaces the earlier uninstalled package, same [saved download](https://chatgpt.com/library?file_id=libfile_c642bf2b42008191a965867a9e67baa0&account_id=personal). Last reported owner Mac remains2781600/AUD-100; do not assume deployment.

- [x] Prepare approved masthead with original SVG crest, centred yellow AIK-font EVENT HUB, original sponsor-free logo above dashboard tiles and selected Nakka event title with stale/unavailable handling.
- [x] Put existing Event Control date/acknowledgement/review/confirmation/save controls in its sidebar tab; retain Event Details and guarded back/switch behavior.
- [x] Implement one moving yellow sidebar marker/icon/text/aria-current for the open section; health dots remain separate.
- [x] Prepare matching remote/central-kiosk dark panels, thin yellow borders, black/yellow controls, selected consent, embedded original assets/fonts and closes, preserving registration/identity/return logic.
- [x] Qualify locally:434 tests, both builds/inventory, deterministic HTML, browser synthetic auth/RPC and desktop/phone/tablet paths, installer rehearsals and rejection guards.
- [ ] Owner Mac install of revised package, then all SEVEN Google TEST files saved: Attention, Bridge, AutoRegister, NakkaTransfer, RemoteRegistration, KioskTest and HubTest. No Code.js/scopes/setup/deployment edits. If earlier AUD-102 was installed, inspect its output first.
- [ ] Bulk native review of header title/event changes, current-section navigation, Event Control/details, persistent attention, both public TEST forms, consent, long messages, duplicate-name flow, remote list count/close and success/return.
- [ ] Keep Live font/stats/yellow page divider open. After attention/Nakka reliability acceptance, seeded Pool Planner remains next functional priority.

Current source ZIP remains installed AUD-100; reconstruct candidate from it plus revised package payload. Code prepared locally is not production or native acceptance. This replaces the earlier421-test/five-file/no-remote-styling candidate status.

## Prepared candidate — dashboard, attention and Hub submenus (28 October 2026)

Owner requested implementation of the approved mockup. **Beauty-Dashboard-TEST-20261028.zip** is prepared, not yet owner-installed/Google-saved/native-accepted. Current reported owner baseline remains2781600/AUD-100. Keep production tasks open.

- [ ] Run apply-dashboard.cjs and collect output. Installer accepts2781600 or only the prepared immediate AUD-101 evidence commit; appends pending bulk AUD-101 when absent, then feature AUD-102. Do not run the old recorder afterwards.
- [ ] After PASS, save NEW HubTestAttention.gs and full existing HubTestBridge.gs, HubTestAutoRegister.gs, HubTestNakkaTransfer.gs, HubTest.html in Beauty — Remote Identity TEST. Reopen only after all five.
- [ ] Bulk native review: one numbered replacement table, SOURCE heading/storage unchanged, NEW PLAYER label, PLAYERS/IN PLAYERS/attention cards, no old header tile/top-left brand block, approved sidebar/icons/yellow marker.
- [ ] Verify persistent named alerts across reload/all registration routes: white0 when clear, red count when active, conditional dark banner/thin red outline, honest unavailable status. GET-only checks identify missing IN entries/duplicate league names without guessing/retrying/deleting journals. Earlier six can surface as alerts but are not backfilled.
- [ ] Review matching Hub submenus, black/yellow press states, standard44px closes and long scroll panels; transfer X retains save guard. IN remains registration status, not physical attendance.
- [ ] Keep public remote/kiosk visual refresh and Live larger typography/rank-points/yellow page-batch divider pending. Seeded pools remain next functional priority after Nakka reliability qualification.

Local: **421 tests PASS**, builds/inventory PASS, generated hashes stable; installer rehearsals pass including pending/already-recorded AUD-101, repeat rejection and file-collision protection. Chromium synthetic UI review passes; owner Google/native qualification remains pending. Current source ZIP stays AUD-100 until confirmed installation. Reconstruct candidate using that source plus package manifest-verified payload.

Updated: 28 October 2026, Europe/Stockholm.

## Latest recorded checkpoint

- Owner Mac **2781600 / AUD-100**, 401 passed/0 failed, both builds and inventory PASS, 27Oct2026 22:29:07.640Z (23:29 Stockholm). Google TEST HubTestNakkaTransfer and HubTestAutoRegister both saved.
- Central Hub/mobile/kiosk TEST registration supports existing and newly resolved league identities; canonical nickname/duplicate checks before creation; verified creation LPID receipt/readback before event add; durable journals/no mutation retries. No production rollout.
- Browser findings27–28Oct: three new test identities in Nakka event with League badges; duplicates Sandra/Emanuel blocked guessing, owner removed duplicates, reviewed transfers then reached TEST event. Final65 Hub/59 Nakka/59 matching/6 earlier pending/no Nakka-only/no duplicate-name groups. Exact event LPID link still unexposed; scoped name match is not full identity verification.
- Earlier six intentionally left pending: Frida Persdotter(kok), Stefan Jansson(pippo), Test Player Hub/Kiosk/Remote/Remote(Remigio). Owner says registered while/before fix; do not re-register/backfill/delete implicitly.
- Mobile count tile17 native screenshot passed. Long-message wrapping/scroll passed. Live17/32/63 layouts observed; type too small at larger counts. Ranking source still not connected.
- Owner Mac tests were not rerun for this documentation closeout; the refreshed source snapshot was independently revalidated locally:401/401 and inventory PASS. Bulk evidence AUD-101 recorder prepared for next session; actual Mac audit checkpoint remains AUD-100 until run. See current START-HERE and source snapshot continuation record.

## Next session priorities — agreed at closeout

**Priority update — owner28Oct2026:** after Nakka reliability/attention handling is fixed, prioritise the Pool Planner's seeded, balanced group allocation ahead of remaining display improvements. Fetch the shared league identity/overall three-dart-average data needed for seeding as part of that work; rank/points display can reuse this foundation later. Spread stronger players across groups, not into the same group. Preserve preview/manual moves and review missing/ambiguous averages. The detailed balanced-pool and approved-transfer requirements below remain authoritative.

1. Record the collected scoped native browser results in one bulk Mac checkpoint (prepared AUD-101 recorder); do not repeat passed work or request full source uploads.
2. [ ] Add persistent organiser attention alerts for failed/blocked/uncertain Nakka registrations: named player, concrete reason, attention count and Review action; survive reload, clear only on verified resolution. Keep connection health separate and do not silently pick a duplicate league identity.
3. [ ] Preserve ambiguity handling; owner prefers prominent review alerts rather than automatic guessing/merging/deleting duplicate Nakka members. Duplicates observed, origin unproven; do not attribute to Nakka or Beauty without evidence.
4. [ ] Investigate mobile Försök igen om en stund during bulk activity as part of Nakka/registration reliability; busy suspected, root cause unconfirmed. Do not retry mutations or turn saved Beauty registration into a false failure.
5. [ ] **NEXT after Nakka fixes: seeded Pool Planner.** Implement shared league identity/overall three-dart-average data and balanced IN-only group allocation, preview/manual adjustments, frozen source averages and missing-data handling. Then qualify approved Nakka pool transfer separately in TEST; do not assume registration transfer already proves draw transfer.
6. [ ] Afterwards, enlarge Beauty Live player typography and qualify final NAME | RANK | POINTS together, with shared league stats, long names, stats off/on and venue fullscreen dimensions. Check boundaries15/16,30/31,45/46,60/61 and scrolling beyond60. Names-only layout counts do not qualify stats readability. Hub numbers and Live page divider remain pending display work.

Additional display requirements — 28 October 2026, owner screenshot 00:11:54:

- [ ] **Hub player numbering:** show a visible number next to each player in the Hub list, following the current displayed order and updating with sorting/filtering. Numbers are display positions, not permanent player identities.
- [ ] **Beauty Live page divider:** use a thin AIK-yellow (#ffd700) horizontal line across the full width between scrolling pages/batches, explicitly confirmed by owner28Oct. Clearly separate players 1–60 from 61 onward, so the next page does not look like a continuation of just the first column. Keep the multi-column page boundary aligned; this is a page divider, not yellow lines around every player row.
- [ ] **Beauty Live font size — priority:** noticeably enlarge player names and row numbers for viewing across the venue. Current four-column/60+ layout is too small. Check full-screen venue dimensions, long/nickname names, different list sizes and final NAME | RANK | POINTS layout; avoid clipping and preserve scrolling.
- Evidence: owner-supplied Screenshot 2026-10-28 at 00.11.54.png shows bottom row15/30/45/60 with player61 directly beneath the first column. Requirements recorded only; no code changes made for these additions.

The session crossed midnight: current date28Oct, selected TEST event last known27Oct. Deliberately review date alignment before any new submission; leave existing registrations/event history intact. Concurrent events and advance-registration schema remain deferred.

## Agreed — shared Nakka league data for Hub and Beauty Live

Status: TO DO — requirements agreed on 26 October 2026.

Source: AIK MÅNDAGSDARTARNA 2026/2027, league ID lg_tM2v_3523.
Ranking page: https://n01darts.com/n01/league/l_stats.html?id=lg_tM2v_3523&tab=rank

- [ ] Fetch overall ranking points and playing statistics from the same selected Nakka league, using the appropriate API requests.
- [ ] Match players using their Nakka identities; do not rely solely on names. Surface ambiguous or missing matches.
- [ ] Provide automatic refresh, Refresh now, last successful update time, and connection/stale-data status.
- [ ] Retain the last successfully fetched data if Nakka is temporarily unavailable; visibly mark it as stale.
- [ ] Make the fetched data available to the Hub, Beauty Live and Pool Planner. The Nakka webpage does not need to remain open.
- [ ] Keep API credentials on the backend, outside browser code and developer handover packages.
- [ ] Verify the average calculation and rounding against the Nakka statistics display, including missing data and excluded formats.
- [ ] Test refresh, identity matching, unavailable API and stale-data behaviour; record evidence.

## Agreed — Beauty Live rankings/statistics list

Status: TO DO — verify existing implementation before adding or marking any work complete.

- [ ] Show tonight's registered players with NAME | RANK | POINTS from overall league standings.
- [ ] Sort by overall league rank, best rank first, irrespective of registration order.
- [ ] Put players without a ranking at the bottom; do not invent a rank or points.
- [ ] Refresh the list as registrations and league data change.
- [ ] Additional statistics may be drawn from the same league source; agree the final fields before expanding the display. Average is available for consideration, not an agreed extra Live column.
- [ ] Keep seeding colour bands and pool-planning controls inside the Hub; do not add them to Beauty Live.

## Agreed — balanced round-robin player allocation

Status: TO DO — HIGH PRIORITY immediately after Nakka reliability fixes, per owner28Oct2026. Extension to the existing Pool Planner requirements; ahead of remaining display work.

- [ ] Use the selected event's IN players; exclude OUT and STANDBY.
- [ ] Use each player's overall Nakka league three-dart average as the seeding measure, separately from ranking points.
- [ ] Allocate players across the chosen valid pool sizes to spread stronger players evenly and balance pool strength.
- [ ] Do not group all similar-average players together.
- [ ] Show a preview with names, individual averages, pool sizes and a comparable pool-strength summary.
- [ ] Allow manual moves and adjustments before sending.
- [ ] Offer a Show seeding colours toggle for manual planning/adjustments; colours are optional, not necessary for automated allocation.
- [ ] Define adjustable average bands with non-overlapping boundaries. Example bands discussed: 60+, 55–59.99, 50–54.99, below 50.
- [ ] Show missing-average players as unseeded; do not silently treat missing averages as zero. Owner28Oct approved spreading them evenly across pools, with manual adjustment available.
- [ ] Freeze the seeding averages for each generated draw and record their source/update time.
- [ ] Mark the preview as needing review if the IN list changes; do not silently modify an approved draw.
- [ ] Validate every included player appears once, nobody excluded appears, pool capacities match the selected scheme, and the balance method handles ties and uneven pool sizes.
- [ ] Keep the existing pool-scheme requirements: 5–101 players, mainly 3- or mainly 4-player preferences, the five-player exception, and a manual planning count.

## Agreed — send approved pools to Nakka

Status: TO DO — API support checked in documentation; Beauty end-to-end transfer not yet verified.

- [x] Dedicated registration TEST event exists: Beauty Hub TEST — DO NOT USE LIVE, t_RqC2_2034. This does not qualify pool transfer.
- [ ] Verify correct target event and player identities, including league-to-event player ID mapping.
- [ ] Generate balanced pools → preview → manual adjustments → send approved groups to Nakka.
- [ ] Preserve tournament settings and correctly update group membership, match-order and related fields together.
- [ ] Read back Nakka's stored groups and confirm they match the approved Hub draw.
- [ ] Prevent unintended repeat submissions and protect against intervening changes or an event already under way.
- [ ] Record target event, draw, averages snapshot, date/time, operator, outcome, failures and readback evidence.
- [ ] Test additions/withdrawals and transfer failures in TEST before enabling live use.

## Remaining launch checks from the last checkpoint

- [ ] Verify session timeout on the shared computer.
- [ ] Complete an end-to-end event rehearsal.
- [ ] Prepare and verify production configuration, release steps and rollback.
- [ ] Maintain the formal Test & Audit Log: feature/test ID, expected/actual result, PASS/FAIL, verification status, date/time, build/checkpoint, notes and evidence.
- [ ] Inspect the latest repository before choosing implementation tasks; do not repeat completed work solely because it remains listed here.

## Programmer handover preparation

- [ ] Prepare a separate development copy at an identified checkpoint; retain the original Master.
- [ ] Include source, dependency manifests/lockfiles, relevant tests, sanitised audit notes, requirements and setup instructions.
- [ ] Inspect current files, nested archives, backups, logs and any included Git history for credentials and personal information.
- [ ] Remove secrets, tokens, credential files, production access and live player/consent/message data; provide placeholders and synthetic test data.
- [ ] Default the handover copy to TEST with real writes disabled; check it can install/run without production credentials.
- [ ] Record the handover checkpoint and exclusions. Agree how the programmer's changes return for review/testing.
- The current Master folder has not been inspected in this conversation and is not certified safe to share unchanged.

## Planned — same-name player handling

- [ ] Support different people with the same full name, for example two players named Karl Persson.
- [ ] Introduce permanent player IDs; names must not be the sole identity key.
- [ ] Provide a clear way to distinguish same-name players, such as club affiliation, in kiosk and mobile selection.
- [ ] When manual entry matches several people, ask which player they are rather than choosing the first or merging identities.
- [ ] Plan migration of existing registrations, status records and n01 associations without losing player history or creating duplicates.
- [ ] Test kiosk, remote, Sheets and n01 together before deployment.

Historical decision19Oct deferred full permanent-ID support. Later27Oct TEST work implemented canonical nickname/different-person prompts and duplicate registration checks across Hub/mobile/kiosk. Full permanent Beauty identity migration and Nakka identity mapping remain pending; preserve live Måndagsdartarna.

Interim option if an actual same-name pair occurs: distinct master-list and n01 display names, for example Karl Persson (AIK) and Karl Persson (Oasen). Canonical nickname handling is now implemented in TEST; this is not permanent player-ID migration.

## Completed — manual existing-name protection

- [x] Remote: normalize manually entered names and check PLAYER'S MASTER LIST before saving a new-player response.
- [x] Kiosk: apply the same check.
- [x] On a match, use the master-list spelling in the existing-player response field and leave the new-player field empty.
- [x] Both existing deployments updated and live checks passed, as reported by Alessio on 19 October 2026.
- [x] Test entry Al Essio Ta Mpella cleared, as reported by Alessio.

Matching ignores case, trims outer whitespace, collapses repeated whitespace between words and uses Unicode NFC. It preserves accents, punctuation and word boundaries. Al Essio Ta Mpella remains distinct from Alessio Tampella. Multiple identical-name identities are not supported by this fix.

## Agreed — configurable GP / MULTI EVENT tab

Status: TO DO — requirements agreed on 27 October 2026. Finish and verify the main Hub first; implement this extension afterwards. No GP readiness date is promised.

- [ ] Add a separate GP / MULTI EVENT tab inside the Beauty Hub, using the same authenticated access.
- [ ] Let the organiser create an event with its own name, venue, description and start/end dates.
- [ ] Support one-day and multi-day events (two, three, four or more days), with an organiser-defined number of competitions. Do not hardwire seven competitions, GP names or a fixed weekend programme.
- [ ] Let the organiser add, edit, duplicate and cancel individual competitions, each with its own name, date, start time, singles/doubles format, entry fee, capacity, registration deadline and eligibility requirements.
- [ ] Keep a separate player/team list and Nakka event link for every competition; support simultaneous competitions and events on different dates.
- [ ] Support an event-specific player pool, imported or manually maintained, without automatically altering the permanent Monday master list; choose the player source for each competition.
- [ ] Allow one player to enter several competitions; support linked doubles partners, partner changes and incomplete pairs.
- [ ] Track competition entry, physical check-in, IN/OUT/STANDBY status and payment separately, with a player overview across their entries.
- [ ] Support organiser-controlled late entries, capacity/deadline checks and configurable extra fees.
- [ ] Link kiosk, mobile registration and Beauty Live lists to the selected event/competition, with closed registrations unavailable for new entries.
- [ ] Provide an event overview with the competition schedule, registration state and entry/check-in counts.
- [ ] Scope registrations, statuses, payments, display lists and Nakka actions to explicit event/competition identities so GP competitions and Monday darts remain independent.
- [ ] Record tests and audit evidence, including single-day/multi-day configuration, concurrent competitions, cross-competition isolation, multiple entries per player, doubles, payments and the correct Nakka target.

Initial scope: configurable event and competition management with organiser-reviewed eligibility. Automatic eligibility verification, schedule-conflict detection and direct Dartstatistik integration are later enhancements, not first-release dependencies. Imports must use a supported file/manual route until any direct integration is verified.

Example use case only: AIK DART GP 4, 27–28 November 2026. Its advertised seven competitions are entered through configuration, not built into the system.

## Agreed — remote app multi-event registration and player event hub

Status: TO DO — requirements agreed on 27 October 2026. Extend the remote app after the main Hub is finished and verified; coordinate with the GP / MULTI EVENT tab.

### Multi-event registration

- [ ] Provide a general event directory plus direct event links/QR codes.
- [ ] Display available competitions grouped by day, driven by the Hub's event configuration: names, dates/times, formats, fees, deadlines and registration availability.
- [ ] Let a player select their identity from the event player pool and enter multiple competitions; allow new-player entry only where enabled.
- [ ] Support doubles partner selection and show missing partner information.
- [ ] Show an entry review and confirmation, including fees; reuse imported/existing entries and prevent duplicates.
- [ ] Keep entry, check-in and payment separate; make mobile check-in an organiser-controlled setting.

### Player-facing event hub

- [ ] Make the remote app a place players can use throughout the event to see what is happening, beyond registration.
- [ ] Show the event programme, competitions by day, current activity and upcoming matches.
- [ ] Show live games and scores, match status, players/teams and board assignments where the integration provides them.
- [ ] Let players follow their own competitions, upcoming games and results; show groups, standings and knockout progress where supported.
- [ ] Show organiser announcements, delays and schedule/board changes, plus practical event information.
- [ ] Keep the player view aligned with the selected event/competition and usable on phones; preserve multilingual support with Swedish as default.
- [ ] Verify available Nakka read endpoints, data fields, refresh limits and update latency before promising live-score detail. Show last update and stale/unavailable status; avoid presenting stale scores as current.
- [ ] Treat live-score viewing as agreed scope. Entering scores or operating a match from this app is a separate capability requiring scope and integration verification.
- [ ] Record tests and evidence for correct event/match routing, score refresh, missing/stale data, multiple competitions, registration duplication and mobile usability.

Product direction: the remote app becomes the player's event hub, connected to the organiser's Beauty Hub and configured events. Detailed display layout and match-scoring capabilities remain to be agreed.

### Nakka integration feasibility — documentation checked 27 October 2026

Official source: https://push.n01darts.com/api/v1/n01_api_manual_en.html

Status: DOCUMENTED SUPPORT CONFIRMED; live API responses and Beauty end-to-end operation have not been verified in this check. The browsing tool could not access the JSON endpoints; this is not evidence of a Nakka outage.

- [ ] Keep Nakka as the match-running/scoring system; display its data in the player event hub alongside Beauty registrations, schedules and announcements, without duplicate score entry.
- [ ] Use match/list filtered to the competition (tdid, live=1) to discover in-progress games.
- [ ] Use match/live for current scores, sets/legs won, player names, averages, current-leg throws and the next player to throw; use match/throws for leg-by-leg scoring detail where needed.
- [ ] Use match/get and match/list for match history/results, tournament/stats for statistics, tournament/standings for round-robin/league tables, and tournament/get for brackets.
- [ ] Verify board assignment/badge and announcement fields against a controlled event before displaying them. Do not equate an assignment or start time with a guaranteed future match time.
- [ ] Poll selected live matches using since/updateTime to avoid unchanged payloads. The manual's example suggests 1–2 seconds, not a guaranteed delivery latency or a per-viewer polling requirement.
- [ ] Share fetched updates through an appropriate backend/cache so growing phone audiences do not multiply upstream requests. Respect the documented approximately 300 requests/minute per-address limit and Retry-After responses; adjust polling to actual event load.
- [ ] Keep administrator credentials and private administration fields on the backend; expose only player-facing data permitted for the selected event.
- [ ] Run a controlled live-match test: score and correct throws in Nakka; verify player names, score, legs/sets, next thrower, match completion, board mapping, standings/bracket progress, measured refresh delay and stale/recovery behaviour in Beauty. Record dated evidence and outcomes before marking integration VERIFIED.

## Agreed — consistent Beauty styling and close controls

**Shared button standard — owner28Oct2026:** every button across Hub, kiosk and remote must match. Default: black background, thin AIK-yellow outline and yellow text/icon. Pressed/active: AIK-yellow background with black text/icon. Use the existing AIK accent (#ffd700), with a fine consistent border rather than thick yellow frames. This applies to primary/secondary actions and closing X tiles; removes inconsistent solid-yellow/default browser button treatments. Keep clearly visible keyboard focus and disabled states, and preserve action labels/save safeguards. Persistent selected controls can keep the active treatment where their selected state is meaningful; ordinary buttons return to normal after release. Status badges/health indicators remain separate semantic indicators, not button styling. Implement through shared styling and review matching desktop/mobile/tablet states across all three surfaces. This explicit standard supersedes earlier individual button appearance suggestions.

Owner28Oct2026 explicitly approves the Tonight's Players popup as the Beauty style reference: black/dark panel, thin gold outline and rounded corners. Reference screenshot C0B28193-7B7C-46A6-BB72-DB618FA1F4F6.png (same mobile list/count17 design).

- [ ] Apply this visual language to the main Hub's principal panels/cards and relevant dialogs across the system. Maintain clear hierarchy/readability; avoid outlining every table cell. Use shared styling rather than separately tuned copies. Keep venue accent colours configurable in the future neutral product.
- [ ] Audit all closing X buttons/tiles: main Hub panels, registration, messages, Nakka/transfer/event-control and identity dialogs, plus mobile/kiosk equivalents. Current versions differ in shape, font, colour, dimensions and placement; transfer currently also has a plain CLOSE control.
- [ ] Define one standard close control consistent with Beauty: shared tile treatment, X icon, dimensions, corner style, padding and top-right placement; consistent hover/focus/disabled states and adequate touch target. Keep a clear accessible Close label and keyboard behavior.
- [ ] Keep close controls visible/reachable in long scrolling dialogs and on phones/tablets. Preserve cancel/unsaved-change and in-progress-save protections; a visual refresh must not bypass save guards.
- [ ] Review desktop, mobile and kiosk screenshots for consistent gold borders, spacing/corners and closing controls before acceptance. Gold remains the current AIK Beauty reference; neutral venue themes are later work.

Status: AGREED / NOT IMPLEMENTED. Part of the remaining UI consistency work after Nakka reliability and seeded pools; no priority change or app-code edit in this requirements update.

## Wishlist — configurable commercial Beauty product

Added28Oct2026 by Alessio. FUTURE PRODUCT WORKSTREAM, not implemented and not a blocker for the current AIK release. Preserve priority: Nakka reliability → seeded pools → remaining core display/release checks.

- [ ] Create a neutral base product for other venues/pubs, shipped with default fonts, colours and logos/placeholders; preserve AIK as a venue theme rather than the product's fixed identity.
- [ ] Add an organiser branding/settings screen: venue/event names, logo, colours, readable font choices, language, contact details and player-facing text. Apply consistently to Hub, Beauty Live, kiosk, mobile and confirmations. Validate contrast, long names and mobile/cast readability. Review rights before redistributing AIK/custom fonts or sponsor artwork.
- [ ] Move venue-owned configuration out of source: customer/project identity, sheet/storage, Nakka league/event targets and credentials. Preserve explicit target validation and TEST/production separation; never solve configurability by removing guards.
- [ ] Offer a standalone core Hub for event/player management. It must work with Nakka, kiosk and remote modules disabled; current TEST registration context still depends on Nakka-specific helpers, so this needs deliberate refactoring.
- [ ] Make Nakka integration, remote registration and kiosk registration separately enableable modules, with clear dependencies. Consider Beauty Live/stats/pool-seeding packaging separately rather than assuming the price/module structure. Seeded pools may require league stats or another supported data source; explain that dependency.
- [ ] Support a commercial model of core Hub plus optional recurring add-ons. Nakka add-on can use the customer's own API account/subscription and backend-only credentials. Keep Beauty's integration fee separate from provider fees; verify provider permissions/licensing before offering resale or bundled access. No price, vendor approval or payment implementation is implied by this wishlist.
- [ ] Separate purchased entitlement, organiser enable/disable preference and operational health/configuration. An available API is not proof of a paid Beauty module. Enforce subscription/module access on backend actions as well as UI, including public remote/kiosk URLs. A customer-editable Apps Script/source copy cannot alone provide tamper-resistant subscription enforcement; decide hosted/service-controlled backend versus customer-owned installation before building billing.
- [ ] Define trial, activation, renewal, cancellation, expiry/grace and temporary billing outage behavior without losing registrations or interrupting an active event unexpectedly. State who pays for hosting/support and whether kiosk access is licensed by venue/device; commercial details remain undecided.
- [ ] Isolate each venue's players, events, credentials, branding and access. Define customer onboarding, administrators, backup/export, deletion/offboarding and upgrades. Multi-venue tenant architecture is not currently implemented.
- [ ] Test a second fictional venue from a clean setup with synthetic data: generic branding, core-only, each module independently enabled/disabled, expired entitlement, data isolation and recovery. Keep production AIK/JDC untouched.

Current assessment from inspected source28Oct: reusable Hub/Live/registration modules exist, but branding, approved TEST project/sheet identities, Nakka league and TEST event targets remain explicitly tied to AIK/current environment. Commercial neutrality and subscription enforcement require a planned productisation phase; no percentage-complete or finished sellable-product claim.

## Preserved direction — Beauty Multi-Cup

- [ ] Keep the live Måndagsdartarna setup safe; clone for Multi-Cup development.
- [ ] Support a prospective client at the same venue with similar Nakka configuration, running at least two and sometimes five or six cups weekly.

This is a requirements and decisions record, not a fresh code audit or a complete inventory of every historical Beauty task.


## Additional outstanding-work checkpoint — 29 October 2026

575 offline tests across48 files pass. The combined package retains all previous
work and adds the following:

- A DOWNLOAD BOARD PLAN action in the planner: selected board numbers, numeric
  pools, per-board batch order and player names in a portable text file. It exports
  only the reviewed frozen draw and marks every allocation PLANNED, NOT SENT.
- A TEST-only pool-note handoff engine with exact identity/group-order/date checks,
  five-minute review expiry, changed-revision refusal, preserved organiser notes,
  one attempted mutation and exact readback. No HTTP transport, credentials or
  Apps Script route is provided. Native qualification defaults false. Pool notes
  are descriptive; they do not assign match badges or run sharing queues.
- A local durable rehearsal journal uses atomic per-event-revision claims and
  fsync. Restarting the engine cannot repeat an uncertain attempt when using this
  adapter. Deployment requires an equivalent server-side persistent adapter.
- A reviewed native ranking contract and local validation CLI. It accepts only
  explicit full-league native ordinal ranks, retains supplied ties, checks exact
  identity/points coverage and expires after five minutes. It never calculates
  ranks from points or tonight's subset. The real cast feed remains disabled for
  ranking until native data is compared and an authenticated import is connected.
- A Focus remaining play button: closes sections only when all provider result
  matrices/matches are recorded, keeps uncertain/pending sections open, and moves
  knockout windows to the first unrecorded round. Manual arrows and reopening,
  full screen and options remain available. No results or progression are changed.

Native TEST memo readback field `lg_memo` is a provisional adapter contract and
must be compared against tournament/get before any transport is connected. The
memo/update write endpoint is documented. No claim of native board transfer,
true ranking, full rehearsal or production readiness is made by these local tests.

Still requires actual Nakka schema/ranking/badge comparison, decision and native
qualification for board/memo/autopilot handoff, authenticated deployed adapters,
production runtime migration, actual event rehearsal and physical screen review.
No Google/Nakka mutation, production deployment or GitHub push has occurred.