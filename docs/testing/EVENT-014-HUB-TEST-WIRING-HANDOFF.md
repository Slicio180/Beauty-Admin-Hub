# EVENT-014 — HUB TEST WIRING HANDOFF

## Status
EVENT-014 is complete: `PASS / VERIFIED` at isolated TEST scope.
Do not reopen EVENT-014 unless real Hub wiring exposes a regression.

## Current real Hub seam found before workspace loss
1. Current real Hub still uses mock services.
   - `Beauty-Admin-Hub/public/index.html` loads `js/dev-services.js`.
   - It omits the TEST bridge.
   - `js/dev-services.js` supplies `BeautyServices` at `mock://beauty-hub`.
   - `js/event-control.js` falls back to that service.
   - `js/app.js` separately uses it for dashboard/status/registration.
2. Exact Event Control seam.
   - `event-control.js` selects `BeautyTestEventServices`.
   - Its `request(options)` delegates to `js/event-control-test-services.js`.
   - The bridge calls `google.script.run.beautyTestEvent(...)`.
3. Smallest change for BEAUTY-HUB-023.
   - Reuse `scripts/prepare-event-control-test.cjs` for an explicit TEST Hub entry.
   - Load DateEncoding + `event-control-test-services.js` before Event Control.
   - Add a missing bridge/RPC guard so the intended TEST build cannot silently fall back to mock.
   - Keep global `BeautyServices` unchanged.
   - Apps Script RPC requires HtmlService hosting; a static page cannot connect merely by knowing a `/exec` URL.
   - Dashboard/status/registration stay mock/blocked until separately connected.

## Guards that must be preserved
- TEST project pin
- TEST Sheet ID/title/locale/timezone pins
- owner-only access
- strict payload/config/identity rejection
- integer Google Sheets serial encoder
- A2+B2 opaque concurrency token
- canonical snapshot comparisons
- lock/reset/six-request write plan
- backend gate default false
- confirmation requirement
- Cancel behavior
- fresh reload before write
- one Save / no retry
- uncertainty handling
- backend/UI/native readback

## HUB-023 tests required
`tests/event-control-test-ui.test.cjs`
- explicit TEST entry selection
- correct script order
- absent bridge/RPC fails closed
- no silent mock fallback
- closed gate state
- Cancel/reopen refreshes token
- single Save/readback/failure behavior

`tests/event-control.browser.cjs`
- actual new Hub TEST entry
- synthetic RPC
- changed-B2 reopening
- zero external requests

Retain adapter/canonical/encoder/mock regressions, full suite, Chromium and audit integrity.

## Manual qualification after HUB-023
If another real write qualification is ever required:
- baseline is now `2099-01-12`, not Jan 5
- A2 `72697`
- recorded B2 `46319.849867881945`
- old Jan 5 backup predates current state
- create/verify matching rollback protection before any new write

## Sequencing
After HUB-023:
- HUB-014 status integration
- HUB-015 registration integration

Live qualification should be sequential: registration changes Tonight, then status consumes it.

## Nakka outstanding
- exact event/tournament mapping unresolved
- league previously verified read-only
- Beauty Live target `NAME | RANK | POINTS`
- sort ascending Nakka rank, unranked at bottom
- Hub needs Nakka API health / last-sync
- no Nakka mutation
