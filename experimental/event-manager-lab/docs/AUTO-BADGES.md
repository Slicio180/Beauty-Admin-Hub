# Automatic badges — development version 0.4.0

The production design controls Nakka autopilot; it must not run a competing assignment engine. The local project now includes an explicitly synthetic scheduler to rehearse the organiser workflow. It is guarded to the local-rehearsal event and has no network transport or native credentials.

## Behaviour implemented and tested locally

- Stage-specific available board ranges, round scope and pauses; both stages may use identical or overlapping ranges; the rehearsal shares occupancy across stages.
- A ready match needs two known opponents, no structural bye, no earlier recorded finish and no conflicting player activity. Unknown active-player identities stop the rehearsal rather than guessing.
- A board occupied by an existing badge remains occupied. Players with existing assigned badges remain busy, even before a separate active-game record appears.
- Assignments retain their board and players on repeated ticks; new waiting matches receive distinct free boards in stable order.
- Simulating a match finishing records completion, releases its badge and starts board/player break timers. The next eligible queued match gets the board when the break expires.
- Pausing affects new assignments only; existing badges remain. Resume revalidates the stage settings and board-range conflicts. Repeated pause/resume cycles have separate audit receipts bound to their reviewed revisions.
- Finals remain manual. Unsupported third-place/referee/round variants are not inferred.
- The queue displays assignment, waiting-board, opponent-undecided, player-busy, break, bye, paused and manual-final states. All those structured reason codes currently belong to our synthetic model.
- An enabled configuration alone does not mean a native service is running. The monitor distinguishes missing, old and recent status timestamps and service errors.

## Native qualification still required

Nakka documents autopilot configuration and a status/held list. Its detailed native held-reason shape, cross-event scheduling, pause latency, finals/third place and referee behaviour have not been tested with this project. The eventual adapter must normalize actual native records, use Nakka as the assignment engine, verify settings and display real observed badges/status. It must never forward the local rehearsal scheduler as a native writer. Manual badges require pausing their stage's autopilot in this version.

Reference checked 6 November 2026: https://push.n01darts.com/api/v1/n01_api_manual_en.html (autopilot/get and autopilot/update).

No current Hub, Google deployment or real event was changed.

Shared ranges are independently configurable and paused. The synthetic scheduler interleaves eligible stage candidates and remembers the last stage assigned, giving the other stage first opportunity on the next tick. It cannot override active badges or skip board/player breaks. This is local fairness policy, not a claim about native Nakka priority. Native occupancy across all real events and the need for open browser tabs remain unverified.
