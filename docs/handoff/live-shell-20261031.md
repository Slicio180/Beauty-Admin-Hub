# Approved Beauty Live shell and knockout implementation — 31 October 2026

Scope: continuation of owner approval in this chat. Implements the approved
four-tab page: Kvällens spelare, Gruppspel, Slutspel1, Slutspel2; one shared panel
opens below the slim tabs; clicking the selected tab closes it. Fullscreen is
inside the open panel and requests that panel only. Independent browser windows
retain their own selected stage, round and scroll position across feed refreshes.
To show both knockouts, open Beauty Live twice and use two ordinary side-by-side
windows. Browser fullscreen is for one selected view, not simultaneous split OS
fullscreen. No production, GitHub, Google upload or Nakka mutation performed here.

Original AIK font files/logo retained. Existing approved venue pool renderer is
reused, with white starting group average, yellow current average, light white
player text, group labels only on shared boards, and the existing six/four card
paging and rotation. Existing elegant Hub, planner and language work retained.
Hub English; public cast Swedish. Four-view entry points now share the same
self-contained generated HTML and use the existing public player-list RPC.
Nakka event name/date comes from the fixed TEST tournament. Date mismatch against
the public player-list feed prevents displaying a bracket for the wrong evening.

Knockout: separate provider t/s2 trees, last32 supported without shrinking names;
three readable rounds at wide sizes, two in split windows, one on narrow screens.
Earlier rounds can be hidden/reopened with icon-only left/right arrows. Headings
and formats centered over the measured column width, one1px filled yellow accent
(no border/shadow). Each two-player card measures its actual content height after
column width and fonts resolve; each name and average stay inside a flexible row.
A single SVG layer shares the scroll canvas; orthogonal connector endpoints are
computed from the same card centres. Round headings stay outside the vertically
scrolling viewport. Third place is separate, shown below the final rounds.
Automatic vertical scrolling25px/s, endpoint pauses, pause/resume/disable, manual
wheel/touch/key hold, pointer hover hold, hidden-page pause and reduced-motion
preference. Fullscreen and resize recalculate layout without clearing selection.

Results, players, progression and formats remain provider-owned. Winner/champion
row is not exposed as an extra navigation round. No independent advancement.
Draw numbers: only explicit unique numeric opening guide values in t_init/s2_init
are accepted; no ranking or guessed seed order substituted. The exact live guide
shape still needs native acceptance; if absent/unsupported numbers are omitted.
Averages use Nakka result.a or validated current01match totals. Missing averages
show dash. Shared public match-list cycle also maps exact knockout/third-place
fixtures and updates scores/averages for supported01single-set live games. Reversed
provider player order is mapped by identity; unrelated event/round/pair rejected.
Duplicate fixture documents, sets or incomplete live totals cannot invent current
statistics/highlights. Polling targets2seconds; structural refresh10seconds. These
are request intervals, not guaranteed provider latency. Stale/pause/offline removes
current-match highlighting. Pool totals remain isolated from knockout totals.

Hub Beauty Live opener captures staff session before opening, validates returned
fixed Google host/route, drops callbacks after logout, retries only pending board
labels separately from pool send, and creates a new independent tab per click.
Both public live/stages URL openers verify fixed TEST event/date. Existing public
list keeps private consent/messages/staff tokens out and paging updates separately.

637offline tests/50files including20new cases; test inventory maps requirement,
expected outcome, dated evidence and limits. Original617tests also pass. No real
browser engine was available in this workspace; this is not pixel/native/device
acceptance. Google upload and live Nakka scoring remain PENDING. Verify card fit,
long names, scrollbar, two independent windows, fullscreen, final bestof5 override,
third place, live visits/end transitions, stale warnings on the actual TEST page.
Manual input and cloud/public API behavior can only be accepted on those devices.
Official field reference: https://push.n01darts.com/api/v1/n01_api_manual_en.html

Baseline reconciliation: current saved Beauty-Overview-TEST-20261030 package
libfile_b033dea6bc048191adade37dd08e6256 exactly matches the pre-change source for
all its manifest entries; all52Oct30hashes from the installed Oct31standalone
package also match. Prepare the upgrade for ownerad64659/recovery/2026-10-28,
not the earlier2624286baseline. The separate beauty-live-isolated-test folder is
not edited or replaced. Package installation is deferred, and any baseline/hash
mismatch must stop rather than reset/rebase owner work. Existing numbered audit
register gap is retained; this record uses a dated feature ID without inventing
an AUD number.
