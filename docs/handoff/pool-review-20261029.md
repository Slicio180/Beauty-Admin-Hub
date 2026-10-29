# Pool Planner review fix — 29 October 2026

Owner baseline006d3e3, recovery/2026-10-28. Google TEST19-file readback verified
at2026-10-29T19:30:09.045Z. Owner rehearsal:58 IN players; sparse boards1-4,7-9,
13-15;19 pools(one4 and eighteen3);10 boards each6 matches. Pool numbers, sparse
board allocation and batch sharing shown in native screenshots. Swap not yet
verified natively: controls disappeared repeatedly during review.

Confirmed code cause:5-minute automatic poolload unconditionally set invalid=true
whenever frozen existed. renderDraw returned before board overview and swaps.
This was independent of whether source values changed. It does not prove that
no other native source/session failure occurred.

Fix: pause planner background loading while a draw is frozen or identity review
is open. Keep frozen averages and original selected boards; no automatic redraw.
Planning/adjustment tickets last30 minutes; final handoff approval still5 minutes.
Cache eviction can expire a ticket earlier; a failed adjustment explains expiry
and keeps frozen reference. Signed-out sessions still clear private planner data.
Server auth, current-roster comparison, Nakka revision/identity checks and fresh
five-minute stats checks before prepare/save remain. No safety guard bypass.

Unresolved mappings first, then Swedish alphabetical order; sticky name column
and fitting identity controls. Generate opens explicit acknowledgement popup,
Cancel/Generate; no network draw request until checked confirmation. Cancel/Escape
return focus. Review is reset on each generation request.

Invalidation keeps board overview, export and disabled swap/handoff controls
visible, with specific reason. Original frozen allocation is shown even if the
current board-input changes. Smaller card padding, unchanged main fonts.

582 regression tests and inventory recorded, including timer continuity, popup
cancel/confirm, unresolved ordering, retained disabled controls,30-minute planning
and unchanged5-minute final approval. Guarded installer and mock19-file Google
readback. Native follow-up: hold draw beyond5 minutes; attempt one manual swap;
verify exact pair, pool sizes/averages, original board plan and popup focus.

No production, registration, date or Nakka event mutation. Two TEST outputs
change: HubTest.html and HubTestPools.js. Other17 preserved byte-for-byte.
Five unresolved historic identities remain unresolved; no inferred bindings.
