# Compact Hub and saved-plan recovery — TEST 2026-11-05

Owner approved compact cards and four-per-row wide desktop mockup, then reported a disabled planner during reload and a repeated Save boards first instruction. Disabled controls indicate an outstanding request; exact deployed request duration/cause is not yet verified.

Definite client bug: render/selection handlers permanently mutated the server canStart flag. Readiness is now derived from server eligibility, exact saved board selections and load health. Fresh saved-plan load discards unsaved local board choices. Reverting to saved selections restores readiness without a redundant save.

Pool-load reads have a 45-second client deadline. Timeout returns controls, shows an explicit full-Hub-reload message, blocks Save/Start using stale state and ignores late read results. It neither cancels server execution nor releases the underlying shared transport queue; full reload is the supported recovery. Mutations have no new timeout/retry behavior. No provider operation is re-sent automatically.

Approved presentation: four Hub columns from 1280px, three at 1101–1279px, two at 761–1100px, one below. START shares the saved card header, board selectors share a compact row, and qualification rules use collapsed details. Beauty Live grids unchanged.

Baseline 748 PASS; updated 752 PASS and inventory PASS. Google TEST upload and device acceptance pending. Only HubTest.html needs Google save. Production unchanged.

Request generations prevent an old locked-session completion from releasing a newer request’s busy gate.

Owner clarified compact dual-board field labels: Board 1 and Board 2. Selected physical bana numbers are retained.
