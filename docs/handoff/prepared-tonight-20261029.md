# Beauty - prepared for tonight, 29 October 2026

## Additional outstanding-work checkpoint — 29 October 2026

575 offline tests across48 files pass. Installer backups are saved beside the
project in Beauty-Prepared-Tonight-Backups so they cannot dirty the working tree
and block Google preparation. The combined package retains all previous
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

## Latest integration checkpoint (supersedes older pending-route notes below)

All morning work is retained. This package now adds:

- An authenticated Hub Nakka-panel opener for the separate pool/knockout display.
  The server verifies session, fixed TEST identity and selected Hub date before
  returning the URL, then rechecks session/date after the public lookup. The
  client rejects foreign URLs, duplicate opens and signed-out late callbacks.
- A guarded `?page=stages` route and deterministic self-contained StageTest.html.
  Deployed TEST mode loads the fixed event directly without rendering fictional
  participants. The local preview continues to start in marked synthetic mode.
  It still reads public Nakka endpoints without browser credentials.
- Documented rr_result matrices; league matrices use league/schedule/get card ids
  and lg_result keys. Table positions remain distinct from standings ranks.
  Missing data stays unavailable; repeated fixtures show Multiple matches and
  retain provider standings. Matrices are bounded to16 members per group.
- Separate t3/s2_3 third-place results and badge keys. Leg/set labels use explicit
  settings; conflicting or unsupported settings do not produce guessed labels.
  Knockout-only events can display without a round-robin standings response.
- Fixed sidebar Condensed family override, local Beauty Live font loading,
  readable20px Hub dialog/review text,
 18px Planner action buttons and Unseeded badges. Kiosk and remote keep their
  independent sizes unchanged by this Hub-only CSS cleanup.
- An offline production profile template/validator, rejecting TEST identities,
  unknown endpoints, invalid dates and premature writes. It does NOT activate
  production or migrate existing runtime guards. Read production-profile-20261029.md.

563 local tests across46 files and inventory PASS. New evidence is in
`evidence/integration-20261029`; earlier evidence remains historical. Google plan:
18 before-files,19 after-files,7 scoped outputs (6 modified plus1 new),12 preserved.
No upload or provider mutation performed. Owner baseline remains d40d0a4.

Still required: native provider response/badge comparison, actual overall rank
source/ties, board-plan write qualification, full rehearsal, production runtime
migration, deployment/readback and physical screen checks. Documentation-based
mapping is not native acceptance. The remaining older sections below are history
where this checkpoint explicitly supersedes them.


DEVELOPMENT CANDIDATE. Owner baseline d40d0a4, recovery/2026-10-28.
This supersedes starting-point-20261029.md as the current candidate handover.
No Google/Nakka writes or GitHub push were performed.

## Ready to review and install into local TEST source

- Approved sign-in artwork/type/spacing and direct entry through the existing
  authenticated server touch; session controls and failed-signout retry retained.
- Hub font sizes, Source/Remove beside each other; Pool Planner font resizing.
- Numeric pool labels in the shared core, frozen draw, swaps and audit data.
- Actual board range input and16 toggle buttons; derived count; deterministic
  longest-workload/least-loaded assignment with sequential sharing batches.
  Each pool shows its board and batch; a board overview lists all sharing pools.
  Board changes invalidate approval. Allocation remains explicitly Hub-only:
  it is NOT written into Nakka's board badges/settings by this candidate.
- Beauty Live30-player paging (three columns of ten on desktop),12-second
  rotation, enlarged names/numbers, yellow division lines, original sponsor-free
  artwork, fullscreen and options retained. Names-only and stats displays remain.
- Live points/averages use the staff-refreshed last-good league cache, exact
  unique normalized-name matching only. Anonymous casting triggers no Nakka calls.
  Expired/failed cache is unavailable, duplicate names are not guessed.
- Unassigned Nakka entries are shown before sending and BLOCK sending until
  compatibility is qualified or registrations are explicitly resolved. No removals.
  The synthetic provider tests explicitly simulate qualification with a VM flag;
  real source has no enabled qualification flag. Do not add one without dated
  native evidence and review. Existing send/identity/session/CAS/audit guards stay.
- Read-only stage projection module for provider standings and single-elimination
  t/s2 bracket participants, scores and averages. No independent progression.
  Standalone renderer at public/competition-preview.html starts with synthetic
  data and offers an explicit fixed TEST read-only loader. Badge mapping and
  refresh are coded; actual response shape and native behavior need qualification.
  League result matrices and live match overlays still need integration.

## Critical remaining integration qualifications

1. Real overall league RANK and ties: the qualified rank_list is per-event points,
   not a verified ordinal rank field. Rank remains NULL/unavailable in the actual
   feed. Renderer/model preserve real ranks/ties when supplied; do NOT fabricate
   ranks from alphabetical order, selected-player subset, or unqualified points.
2. Nakka match-board badges vs whole-pool board plan, sequential sharing and
   autopilot conflict behavior. No new board-write routes are enabled.
3. Qualify the standalone TEST feed, wire authenticated Hub/public casting routes,
   and complete actual group result matrices and final approved styling.
4. Native keyboard/viewport/font/long-name/fullscreen/paging review. No automated
   browser visual PASS is claimed; browser executable was unavailable here.
5. Controlled existing pool/card handoff and OUT/STANDBY-unassigned verification.

## Validation and rollout

563 offline tests across46 files pass, test inventory and both deterministic
builds pass. Latest stage-focus evidence is in evidence/stage-focus-20261029;
earlier screen/diagnostic evidence is in evidence/competition-screen-20261029;
badge evidence is in evidence/badge-mirroring-20261029; earlier
527-test evidence is retained in evidence/prepared-tonight-20261029. Additional
installer/Google mock rehearsals are included in the outer package evidence.

The installer is local-only, baseline/hash/branch/clean-tree guarded, backs up
before editing, rebuilds both surfaces, runs full tests/inventory and creates a
scoped local commit. No remote push. Google preparation fresh-clones18 baseline files,
overlays7 scoped outputs including one new stage page, preserves12, and stages19 files, and never uploads. Readback verifies all19.
Review on the computer tonight before the owner runs the separately printed
Google push. Never reset Git or bypass a baseline mismatch.

The outer folder groups source, installer, evidence and this handover. Current
applied-source archive and production remain unchanged until owner installation.

## Badge mirroring follow-up

Added fixed-event public read-only refresh controller and per-match badge mapping
for exact stage/round/even-slot keys. White board labels, assignment/reassignment/
removal handling, unavailable-shape handling, stale visual state and stopped/
overlapping refresh protection. Standalone competition preview has an explicit
Load fixed TEST event button; no background call until chosen. Three GETs per
refresh compare tournament updateTime around standings to reject torn snapshots.
No autopilot writes or changes to Nakka's assignment policy.

The read adapter currently expects tournament.badge[key]={str,st}, consistent
with the documented badge write key/value contract. The actual GET response
schema has NOT been confirmed: web retrieval of the fixed TEST API was blocked
by the browsing tool. Unsupported shapes show Board unavailable instead of
guessing. scripts/inspect-stage-readonly.cjs is prepared for optional owner-run
read-only schema collection. Do not claim real badge mirroring is verified until
assignment/reassignment/removal have been compared against native Nakka in TEST.

The standalone display is connected through its explicit public-GET loader.
Integration of this screen into authenticated Hub navigation/public casting
routes, and the final approved visual styling, remain pending.


## Additional preparation — practical stage screen

Reusable read-only renderer now backs the standalone page: pool standings with
4/6-pool paging, provider ranks/zero values, separate supplied knockout stages,
white scores/board labels, match averages, pending/byes and final winner slots.
Long names wrap in reserved columns. Fullscreen/options, manual refresh, optional
page rotation and auto-refresh controls stay accessible. Failure, pause, offline
and overdue refreshes clearly mark last-known boards. Hidden tabs do not poll or
rotate; leaving the page stops timers and suppresses late callbacks. Returning
from the browser back/forward cache marks the display suspended and requires a
reload, so an old board cannot appear current indefinitely.

Local preview policy now allows the fixed public API origin on this stage page
only; the Hub's offline preview policy stays network-blocked. Actual CORS and
provider shapes still need native qualification. No new deployed route is claimed.
The owner-run diagnostic collects bounded structural shapes for standings and
stage/badge fields without provider text values or private admin fields, records
revision consistency, and makes three GETs only.

Read native-review-20261029.md for the local review URL and PENDING acceptance
worksheet. Tests exercise DOM behavior and local HTTP responses, not a rendered
browser; no native font/layout PASS is claimed. Pool result matrices, actual
leg format/live overlays, final mockup alignment and Hub/casting navigation are
still pending. This candidate does not change Nakka automatic assignment.


## Screen-ready controls clarified from owner screenshots

The owner already casts a browser tab to venue TVs; no new casting system is
required. Reference IMG_0605.png through IMG_0609.png: independent chevrons for
Round robin, Knockout stage1 and stage2; horizontal arrows for adjacent knockout
rounds; later rounds, final and third-place match visible in Nakka's own data.

Candidate now has an All stages view, independent accessible stage headers and
two-round windows with Earlier/Later arrows per knockout. Display preferences
stay stable during feed updates (not across a full page reload). Round limits
clamp if a changed bracket has fewer rounds; missing stages are not invented.
Collapsed pools do not auto-rotate. Controls and values remain read-only; no
automatic hiding based on a guessed completion rule. White numeric styling and
existing fullscreen/options remain.

Actual leg-format labels, third-place match mapping and full round-robin result
matrices remain pending response-shape qualification. The candidate is not yet a
fully qualified substitute for every Nakka screen. Native layout/readability and
Google route integration still need review.


## Independent kiosk and remote sizing

Owner retains the original kiosk text/button/touch sizing, with no Tonight's
Players list on kiosk; players use venue TVs. Kiosk already had no such list,
and the candidate continues to omit its UI/calls. The player name selection
dropdown remains essential to registration and is retained. Remote keeps its
Tonight's Players list and existing separate sizing.

A kiosk-only colour theme now shares AIK palette/artwork without overriding
font sizes, line heights, padding or touch heights. The original kiosk base CSS
remains intact, including responsive rules. Separate theme files are selected by
the deterministic player builder; remote output is unchanged. Kiosk output is
now the fifth scoped Google change (13 other files preserved). Earlier four-file
Google mock evidence is historical; a new five-file rehearsal is included.
Native Lenovo/mobile readability and touch review remain PENDING.
