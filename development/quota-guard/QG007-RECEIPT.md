# Beauty QG007 — TEST v11 receipt

Installed 25 November 2026, 15:28 Europe/Stockholm. Google confirmed Version 11 successfully deployed to the existing private Release TEST deployment, with Only myself access preserved. LIVE unchanged; TEST worker configuration unchanged and paused.

## Finding and fix

Source inspection found existing last-good display retention in Hub dashboard, cast roster and stage failure handlers. Event-context changes and identity mismatches deliberately reset or block incompatible views; those guards remain necessary. This audit does not prove every rendering failure is atomic or all native display paths work.

The cast roster refresh lacked an in-flight guard and did not cancel a pending scheduled refresh before a manual refresh. Manual updates could overlap RPC requests and accumulate timers. QG007 permits one active browser roster request until reply or timeout, replaces the previous scheduled timer, and schedules a single next refresh. Failed reads retain the existing list and connection warning. Retries slow to 30, 60, 120, 240 and 300 seconds; a successful read restores the 15-second interval. Manual refresh can bypass that delay once no request is pending. Synchronous RPC exceptions now reach the same failure handler.

The browser cannot cancel a timed-out Apps Script execution. A late callback is ignored, but that server execution may continue. This change does not affect the separate Nakka stage feed, pool logic or writes. Native end-to-end and visual acceptance remain pending.

## Verification

Only LiveCastView.html differs from v10. Saved source was reloaded from Google and matched SHA256 6a35d769c78d48d9a4b19b871df0d4387b0fd9323d87a283f51eee9a98cd5585.

Tests execute the actual extracted cast refresh function with synthetic callbacks/timers: deduplication, pending timer replacement, retained list, backoff/cap/success reset, timeout and late response, synchronous RPC failure, invalid input and disposal all passed. Existing 14 quota checks and asynchronous dashboard checks passed; all candidate server and inline browser scripts parse. The cast test mocks rendering and does not prove full DOM rendering safety.

No quota probe, provider write or production deployment was performed. Changes are committed locally, not pushed to GitHub. This cumulative TEST artifact is not approved for LIVE promotion.
