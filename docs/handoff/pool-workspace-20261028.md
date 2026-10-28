# Approved Pool Planner workspace — 28 October 2026

Owner baseline **72d0b68**, recovery/2026-10-28. Candidate not installed or
uploaded yet. Owner approved the full-page AIK Pool Planner visual mockup after
native engine/average/swap tests. Production and JDC are outside scope.

## Implementation

- Pool Planner opens in the main Hub content area; existing masthead/sidebar and
  account controls remain. Dashboard and other sidebar modules restore the normal
  view. There is one workspace, reused on reopen. Busy operations prevent sidebar
  departure; logout closes and clears private pool state and drops late responses.
- Original AIK assets/fonts remain. Counts, averages and preference numbers use
  AIK Siffror. Setup shows IN count, 3/4 choice, actual boards, preferred or
  one-pool-per-board layout and computed starting batches. A batch count is not
  a timed playing schedule or a board assignment.
- Hypothetical planning count, alternative scheme arithmetic and the exact
  original5–101 workbook reference sit under Advanced planning. Their values do
  not change the IN roster or actual draw.
- Statistics freshness/refresh and player review have separate status areas.
  Identity proposals/LPID/TPID table and explicit acknowledgement are disclosed
  through Review players. Unresolved identities can still be planned Unseeded;
  Nakka handoff is visibly disabled until reviewed IDs/entries exist for every
  included player. The backend remains authoritative and rechecks all bindings.
- Frozen preview cards separate flexible wrapping names from an88px right-hand
  numeric/badge column; no floats. Exact names are retained. Known means, rated
  coverage and Unseeded counts stay visible. Colour bands are optional, editable
  through a disclosure and do not mutate the draw.
- Manual swaps and the separate Nakka review/explicit send stages retain their
  original RPCs, one-use tickets, confirmation and failure guidance. All backend
  modules, core draw source and Nakka write safeguards are byte-identical.
- Board count/size/layout changes invalidate a frozen approval; unavailable Hub
  data disables new previews and handoffs. No redraw is silently requested.
- Read-only offline recommendations keep their original dialog; TEST uses the
  approved workspace. Event Control/remote/kiosk/Live and their flows are intact.

## Validation

**511 tests/39 files PASS**, build and inventory PASS. Six new interaction cases
cover page navigation, changed settings, isolated estimates, missing identities,
colour presentation and Hub unavailability, in addition to prior preview/swap/
authentication/session/timeout/confirmation tests. Existing tests still cover all
5–101 schemes, exact averages, zero versus missing, capacity and round-robin cards.
Byte preservation evidence is in evidence/pool-workspace-20261028/.

Tests execute synthetic DOM and services. A browser executable was unavailable
in the assistant environment, so CSS rendering, keyboard/scroll operation and
native desktop/mobile viewport acceptance remain pending owner review. No native
visual PASS is claimed from the generated design or the synthetic tests.

## Owner sequence

Apply the guarded installer from clean72d0b68. It saves backup/evidence, verifies
before/after hashes, builds, runs511 cases/inventory and commits scoped changes.
Prepare Google from a fresh18-file TEST clone: only HubTest.html changes, all17
other files are preserved. Owner pushes the reviewed stage and verifies full
18-file byte readback, then refreshes DEV Hub.

Native review: Pool Planner is a page with a yellow active sidebar indicator;
choose boards/3or4, inspect alternative layout/batch count, open Advanced planning,
refresh stats, review all identity proposals, generate preview, confirm long names
wrap and averages remain separate, test colour bands/manual swap, and check
setting/roster/navigation/session invalidation. A first actual pool/card handoff
remains separately pending; do not re-register earlier unresolved Hub-only tests.
