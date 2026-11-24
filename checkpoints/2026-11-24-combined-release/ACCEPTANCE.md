# Combined release acceptance

Recorded 24 November 2026. LIVE is v43; combined TEST uses fresh synthetic players and a private event. Historical fixtures were not replayed.

| Item | Evidence |
|---|---|
| Sign-in/opening | Correct authenticated combined TEST Hub; 16 local authentication/lifecycle checks. |
| Nakka monitoring | Native matched lists; transient failures retain last confirmed comparison and later success clears the warning; 8 shared monitoring/report checks. |
| Recovery reports | Native read-only report opening, three automatic retries then stop, original receipt preserved, resolved removal banner cleared. |
| Background recovery | One owner TEST clock recovered a saved registration while the Hub was closed. Idle provider discovery runs outside the shared lock; actual adapter lock boundaries and bounded retries tested. A prior long worker timed out and its claim recovered. |
| Nakka → Hub | Two fresh native imports, N/A consent, blank message, NAKKA source, no master-list write; repeat scan adds nothing. Removed entries remain absent. |
| Pool preservation | Native four-player partial-board restoration; six-player A/B draw and settings restoration; eight-player C retained exact seed/membership/boards/top2-bottom2 format. Reopening clears approval. Changed roster/provider invalidates sending while retaining the draw. C send verified two groups of four, 12 round-robin pairings and two four-slot knockouts. |
| Instructions | Fifteen chapters, SV/EN search, diagram, no-results and clear/reset; native chapter column wraps at 237px. |
| Displays | Native public list and portrait list; actual saved groups on boards 5/6 and portrait group mode. Transient failed reads retain confirmed data with a warning. 52 local display regressions cover independent read failures, finals, third place and event changes. |
| Performance components | Validated-state reuse and batch operations retained. Native existing registration 35.4s / new 47.3s; no speed target claimed. Ordinary removal and interrupted-removal completion verified. |
| Registration safeguards | Native Hub/kiosk/mobile consent, messages and source; new/existing/duplicate workflows; first/second append formula preservation; public form reset and 12 reset/uncertain-reply checks. |

Later-edit protection was exercised on a fresh synthetic removal: automatic cleanup stopped after a message was edited, preserved the edit, and finished the original receipt only after that specific synthetic edit was corrected. No second removal request was created.

Native source integration found and corrected an obsolete TEST cast-label function call. Five focused checks validate both caller targets, default/manual labels, unchanged-plan validation and rejection of invalid/foreign labels. Exact TEST readback and affected local suites pass.

Release state: immutable private TEST version 2 is frozen. All 37 application files and the private TEST manifest were independently read back from that immutable version and matched. The TEST-only helper is archived privately and absent from the frozen application. All 38 intended LIVE files are saved in the LIVE editor and read back exactly; the four new modules also persisted after editor reload. The only TEST/LIVE manifest difference is web-app access (MYSELF versus ANYONE_ANONYMOUS). The running LIVE deployment remains v43 with zero background triggers. Google is requesting new LIVE authorization for owner-bound background triggers and account-email verification. After that actual consent step, deploy the existing LIVE URL, install one owner clock and verify deployed source/runtime; preserve v43 for rollback.

Limits: no new physical phone/tablet interaction was performed. Native portrait mode and desktop wrapping are verified; older physical portrait evidence remains preserved separately. Native competition checks use unscored synthetic groups; completed finals/third-place failure cases are covered by source-bound regression tests. A fresh Nakka/Hub readiness read was needed once after a roster change before review re-enabled; the saved draw was preserved. No pool send was repeated.

Final native Start result: the original one-time request reached Nakka status 30. Its first strict readback reply was uncertain. A fresh comparison matched the original approved event projection exactly; the narrowly scoped owner-only TEST reconciliation preserved the original receipt and marked it VERIFIED with zero provider writes. The Hub now says Competition running and renders the verified groups. Start and pool send were not repeated. This reconciliation was TEST tooling, not an added application feature.
