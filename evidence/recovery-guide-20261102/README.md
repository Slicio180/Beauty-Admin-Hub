# Beauty TEST guided recovery — 2 November 2026

## Reproduced issue
The owner intentionally removed one TEST Nakka entry but selected Beauty Test New 02 Nov instead of Beauty Test Mobile 02 Nov. Hub correctly detected the missing kiosk-created player. The earlier confirmed transfer journal prevented a second add, but the UI stopped at manual-review jargon. Detection and retry protection passed; understandable recovery failed.

## New organiser path
- Red Needs Attention outline and red number appear for detected player issues; clicking the tile opens the issue list. Clicking an eligible player name opens that one player and starts a fresh preview without a second selector or check button.
- TEST checks start when event data arrives, repeat every 30 seconds while the Hub is visible, resume on tab return and run after roster changes and completed operations. Requests do not overlap; a changed roster queues a fresh check and invalidates the old result. Known alerts survive check failures.
- Event view contains monitoring and named issues. Advanced holds the optional CHECK NOW, list comparisons, timing and API status. Repeated event links/check buttons are removed; a recovery link appears only where the chosen solution needs it.
- Monitoring covers Hub IN entries and retained creation/removal alerts. Nakka-only entries remain an optional Advanced comparison; this is not an automatic all-list reconciliation.
- Confirmed missing-entry recovery:
- Confirmed historical entry now missing: explain that the Hub registration remains saved. Offer:
  1. RESTORE ENTRY IN NAKKA: fixed dedicated TEST link and named Add from league instructions. The organiser manually restores the existing league player, saves and closes the editing tab. CHECK RESTORED ENTRY reads fresh data, then requires an explicit current-entry review. This does not call Nakka add or rewrite the original transfer.
  2. REMOVE HUB REGISTRATION: closes the review and opens the existing named, guarded removal preview. Separate checkbox and save remain mandatory; league profile is kept.
- Unconfirmed earlier attempt: distinct text, read-only inspection link and fresh check. No restore/add ticket or misleading claim that the earlier transfer was confirmed. If still absent, organiser investigation remains necessary.
- Support reference collapsed by default.
- Current-entry review preserves the original transfer byte-for-byte; archives an immutable receipt bound to owner, session, current entry ID, event/date, roster, identity and prior journal hash.
- Fresh attention checks clear a reviewed replacement only while that exact receipt still matches. Replacement or disappearance invalidates the review. A review never permits a new add.
- Guarded Hub removal after prior confirmed entry absence retains verified-absence proof. Reviewed replacement removal can retain proof for original and current IDs. This records observed absence, never claims an API deletion where no deletion was sent.
- Unknown/uncertain historical transfers cannot be blessed by these absence proofs.

## Native evidence after the first speed pass
Owner local install result: LOCAL_SPEED_PASS_INSTALL_PASS, 2026-11-02T21:16:58.574Z; 695 before / 697 after; strict inventory PASS. Four Google TEST files saved by owner.
- Removal: displayed preview 7.7s total / 5.9s server (owner stopwatch 8.3s); final removal 26.0s total / 22.6s server (owner stopwatch 26.3s).
- Earlier baseline: preview 7.4s / 5.8s; removal 28.4s / 22.7s. No meaningful server speed improvement established by this run.
- Removal left five matched names, Hub only 0 / Nakka only 0 / duplicates 0; Albert absent. Beauty Test Hub 02 Nov was OUT and remained in Nakka.
- Albert kiosk re-registration: Hub row ~6s, thank-you ~11s; owner confirmed six matching names, no differences/duplicates. Earlier kiosk confirmation ~15s; single-run comparison only.
- Kiosk different-person conflict offered Det är jag / Jag är en annan person / Avbryt. Owner entered a longer distinguishing detail, creating Beauty Test Hub 02 Nov (Beauty Test Hub 02 Nov kiosk test).
- Seven matched names; base player OUT, distinct new player IN; zero differences/duplicates. Fresh connection check no alerts.
- Later intentional TEST entry removal produced one issue. UI named Beauty Test New 02 Nov. Transfer preview refused repeat mutation with manual-review message; user reported confusion.
Native screenshots provided by owner at 22:26, 22:28, 22:37, 22:39, 22:40, 22:54, 22:55 and 22:56 Stockholm. These are observations, not local fixture runs or exact LPID proof.

## Qualification
Local test output and strict inventory supplied separately in package verification.
New executable tests cover staff-only missing-entry navigation, immutable confirmed-history review, stale identity/session/history blocking, uncertain attempt separation, fixed links and guarded removal UI, absence-proof eligibility and reviewed-replacement removal.
An existing replacement-entry test now expects explicit REVIEW_EXISTING rather than a dead-end error; it still asserts no additional POST and no claim of original-operation verification.
Existing original ATTEMPTED journals and uncertain-transfer no-retry tests remain.

## Remaining acceptance
Owner must upload HubTestNakkaTransfer.gs, HubTestAttention.gs, HubTestRemove.gs and HubTest.html to Identity TEST only, then exercise the already-missing player's recovery.
Automatic check cadence, red alerts, named issue flow, actual manual Nakka restoration, review confirmation, attention clearing, and alternative Hub removal/re-registration remain unverified on devices for this update.
Uncertain absent requests still need organiser investigation. This update does not implement automatic restoration or claim a solution to removal latency.
Production untouched. No Git commit, push or deployment.
