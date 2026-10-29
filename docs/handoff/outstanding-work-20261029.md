# Outstanding work implementation — TEST candidate

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

Local ranking validation (no upload):

```
node scripts/qualify-native-ranking.cjs native-ranking.json profiles.json validated-ranking.json
```

Input requires schemaVersion1, leagueId lg_tM2v_3523,
source native-league-ranking, reviewedAgainstNative true, capturedAt ISO timestamp,
evidenceReference and rows [{lpid,rank,points}]. profiles.json is the complete
qualified league profile array. These inputs must come from native comparison;
no synthetic example should be imported to the real cast feed.

Board-note code is server/board-handoff.cjs; local journal is
server/handoff-journal.cjs. Transport callbacks operate on normalized TEST event
snapshots. Native memo shape must be qualified. Do not flip the qualification
flag or wire a write route based only on unit tests. The persistent adapter must
atomically claim the TEST event revision before a mutation; a repeated or unknown
attempt requires inspection. Existing pool/card send remains separate.

Source reference: https://push.n01darts.com/api/v1/n01_api_manual_en.html
Documented APIs: tournament/memo/update, tournament/badge/update,
autopilot/get/update and league/stats. A pool note, a match badge and autopilot
configuration represent different state. They must not substitute for each other.
