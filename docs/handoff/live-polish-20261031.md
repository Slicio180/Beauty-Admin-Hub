# Live interface and pool-board plan —31October2026
Owner: code all paused feedback after installedCastLayoutFIX passed648tests and
Google19-file readback31Oct14:23:01.594Z. The confirmed source remainsad64659,
recovery/2026-10-28 with known uncommitted upgrades. This patch starts there.

Pool layout now groups visible cards into physical pairs (or individual cards
on narrow screens). Only a three-player neighbour of a four-player card gets an
empty fourth row; later three/three pairs remain shorter. No fake players,
positions or match columns. Geometry uses actual stage viewport width/height:
natural rows52px, overhead80px. If needed, compact header40/thead20 with overhead64
and row height budgeted across all visible pair counts. Two-column mixed page
[4,3,3,3,3,3] fits within728px content area at1400px width with name>=14px and
average>=12px; [4,4,3,3,3,3] likewise. All-four rows fit at that height using42px
rows. An extremely short window/open settings may still scroll below the40px row
minimum; text is never shrunk indefinitely. Uniform pair heights and top-aligned
unused space retained with four-group mode. ResizeObserver and font-ready paths
refit geometry and remeasure full-stop name truncation. Original provider text,
full-name dialog, weighted averages, ranks and paired stale/live highlights kept.

All public display titles uppercase, including tabs/cards/rounds; player names
unchanged. One live count tile next to player title, no duplicate KVÄLLENS SPELARE
row. Title+tile group centred between equal header side columns. Same two SVG
controls on all four views: corner-expand fullscreen (accessible enter/exit
labels) and three-line display menu. Listinställningar is inside the menu.
Public Swedish; organiser English. TEST markers remain until production migration.

Hub PoolPlanner > Advanced settings > CHANGE POOL BOARDS opens the existing
authenticated verified-label editor. Each frozen pool keeps its identity and
starting average. Saved labels load without needing Setup boards again; missing
labels still require a board plan. Changing board suggests the next unused group
on that board; final unique/integer/range validation before save plus unchanged
server membership validation and double session check. Uses existing
beautyStageLabelsTest; it changes the Hub cast board plan only, not Nakka live
match-board assignments. Public cast metadata contains no staff/registration data.
Already-open windows re-read the verified public plan every10seconds and apply
it on the next normal feed cycle. One in-flight plan read; late responses ignored
after page exit; unavailable reads retain last plan. Refresh paused/offline follows
existing controls. No pool resend or change to knockout progression.

654tests/52files PASS (6new executable cases; existing cases updated for revised
pair and icon/header requirements). Math/DOM behavior is tested; real pixel/device
acceptance remains PENDING. Tests prove both label session/identity guards and
editor behavior; no real board-plan write performed here. Actual live-game start,
Nakka numeric opening-guide shape and full knockout bracket acceptance remain
separate pending checks. A TEST provider tree with only a waiting final cannot
establish the complete32-player bracket from screenshots alone. No synthetic
provider matches inserted and no knockout start action added.

Guarded installer backs up and changes only delta; builds and654tests/inventory,
exact output verification, rollback on failure. No commit/GitHub/production write.
update-test.cjs can run install, known-baseline Google TEST staging, push and full
19-file readback in sequence when the owner explicitly runs it. Failures stop;
production is never targeted. Installer-only and prepare/verify scripts retained
for manual recovery. The one-command updater is rehearsed with local mocks, not
a real upload. Owner supplied baseline installation/readback stays preserved.

Final owner feedback15:57: remove the duplicate OPEN POOLS & KNOCKOUTS — TEST
button from the Nakka popup. Builder no longer injects that button or loads its
legacy opener. Legacy source/tests are retained separately; Beauty Live remains
the active authenticated entry to all four views. Shared shell contract checks
that generatedHubTest has no duplicate opener. Test count remains654.

Removal also reduces the generated Hub inline script inventory19to18; the existing reproducibility/parsing check now requires18 and still parses every script. This is unrelated to the Google project19-file count, which is unchanged.
