# Beauty — prepared starting point, 29 October 2026

Status: LOCAL CANDIDATE, NOT INSTALLED OR DEPLOYED. Prepared from the complete
Status25 candidate source corresponding to owner-applied d40d0a4. The scratch
Git baseline is a reconstruction, not the owner's Git history.

## Prepared

- Original crest between AIK and DART, yellow EVENT HUB subtitle, large white
  tagline, improved spacing and white sign-in heading/labels.
- Successful authorised login calls the existing server-validated openHub
  immediately. No intermediate Open Hub click. Keep sessionView markup as an
  error/retry-signout surface; do not delete the logout failure path.
- Approved desktop typography in Hub and Pool Planner. The available font files
  are AIK Display Light/Bold, Condensed Bold and Siffror; “Title” maps here to
  existing AIK Display rather than inventing a new font asset.
- Remove displayed beside Source using the existing confirmation workflow.
- Isolated pure board module: parses nonconsecutive board ranges, gives numeric
  pool labels in its output, allocates largest match workloads first, then least
  loaded selected board with stable numeric ties. Sequential batches per board.
  No provider calls. Allocation is a workload heuristic, not a promise of exact
  finishing times or a mathematically optimal schedule.
- Generated Google TEST Hub HTML rebuilt; TEST notice remains intact.

## Verification

519 tests PASS / 0 FAIL across40 files; inventory and deterministic Hub rebuild
PASS. Added direct-open failure test and three meaningful board allocation tests
cover sparse boards,20 equal pools, mixed sizes, spare boards and invalid input.
Existing auth/session/removal/provider guard tests still pass.
Native visual review has NOT been performed. Font sizing/layout must be checked
on the actual computer; the wider table intentionally scrolls at narrow widths.

## Next work tonight

1. Review sign-in, Hub and Pool Planner on the computer, including original
   artwork, exact weights, long names and fixed-row/scroll behavior.
2. Wire the board selector and board overview into the frozen planner lifecycle;
   invalidate review when selected boards change. The pure module is not yet
   imported by the app. Numeric pool labels are not yet changed throughout
   existing previews/server/audits; qualify that consistently before enabling.
3. Beauty Live30-player pages, yellow dividers and real rank/points/average
   integration remain pending. Preserve fullscreen/options and names-only view.
4. Nakka board writes and pool/knockout/result presentation remain pending.
5. Before any owner install, create/rehearse the guarded installer against the
   actual owner baseline, then fresh Google clone/preservation/readback. This
   archive is a development starting point, NOT a Mac installation package.

No Google/Nakka write, production change, or GitHub push was performed.
