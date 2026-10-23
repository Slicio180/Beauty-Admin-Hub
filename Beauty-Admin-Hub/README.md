# Beauty Desktop Admin Hub

Primary desktop event-management interface for Beauty.

## Purpose
Run an event from one control centre without requiring normal access to the underlying Google Sheets, Nakka pages, or separate Beauty admin pages.

## Core rule
The existing live Beauty system remains untouched while the Hub is developed and tested.

## Planned Hub modules
- Secure admin login
- Event dashboard
- Player registration
- Tonight's Players live control table
- IN / OUT / STANDBY controls
- Photo/video consent
- Player messages
- Beauty Live screen launcher
- Event/date control
- Nakka integration
- Nakka API health/status
- Beauty/Google backend health monitoring
- Instructions / Manual
- Session security
- Backup/error visibility

## Project
Beauty-Admin-Hub

## Nakka API health check

The Hub uses `remote-app`'s read-only `?page=nakkahealth` route on the same
deployment URL as its existing Hub API. It makes one authenticated GET to the
existing Nakka league `lg_tM2v_3523` and never writes to Nakka, Sheets, or Forms.
`N01_API_USER` and `N01_API_PASSWORD` remain in that project's Script Properties.
Raw Nakka bodies, player lists, exceptions, and credentials are not returned.

Example response:

```json
{
  "status": "OK",
  "message": "Nakka is reachable and the expected league is readable.",
  "timestamp": "2026-10-23T12:00:00.000Z"
}
```

- `OK`: HTTP 200, API result 0, and a readable league entry list (including an
  empty list). This checks read access only; it does not confirm tournament
  selection, write permission, or successful player synchronization.
- `DEGRADED`: Nakka responded but league access was not confirmed, including
  HTTP 500/429, redirects, invalid JSON, or an API rejection. A concurrent probe
  also returns a short degraded response without waiting or issuing another GET.
- `UNAVAILABLE`: missing credentials, HTTP 401/403, HTTP 408/504, a network/native
  timeout exception, or an unavailable health-check service. A browser/backend
  failure also shows unavailable, explicitly stating that Nakka is unconfirmed.

All probe outcomes are cached for 60 seconds across clients, with no retries.
Apps Script caches are best effort and can evict entries early. The Hub refreshes
every five minutes while visible, prevents overlap, and allows manual refresh
once per minute. Returning to a visible tab checks again if five minutes elapsed.
The timestamp is the observation time, including when a cached result is served;
for browser failures it is the time the Hub failed to confirm health.

The Hub stops waiting after 15 seconds. `UrlFetchApp` has no supported custom
timeout, so a browser timeout does not cancel the server's request. Native fetch
timeouts return a sanitized unavailable result if Apps Script can complete.

### Local verification

Run from the repository root:

```sh
node tests/nakka-health.test.cjs
node tests/nakka-health-ui.test.cjs
```

These tests mock services and requests; they do not contact production.

### Deployment steps (manual; nothing is deployed by editing this repository)

1. Verify the existing Hub URL maps to the intended `remote-app` project and
   record its current deployment version for rollback. Compare the project's
   current source with the repository before uploading; preserve any live-only
   changes. Do not upload files to `automatic-nakka`, `sheet-controls`, or `nakka01`.
2. Confirm `N01_API_USER` and `N01_API_PASSWORD` exist in **remote-app** Script
   Properties. Do not move them into HTML/JavaScript, URLs, or logs.
3. Apply the reviewed health route and private helpers to that project. Test
   through its test deployment with a real read-only league request. Confirm the
   JSON shape and that no Sheets/Form or Nakka mutation requests occur. No new
   triggers, reset/setup functions, or manifest changes are required.
4. When approved, update the **existing** production web-app deployment to the
   reviewed version, preserving its deployment ID/URL and access settings. Verify
   `/exec?page=nakkahealth` returns JSON. Do not test `hubregister` or `hubstatus`
   against production as part of this health check; those routes write data.
5. Publish the Hub's updated `index.html`, `css/style.css`, and new
   `js/nakka-health.js` through its existing host. The original `app.js` is
   unchanged. Refresh the Hub and check the Nakka result, timestamp, and button.
   Publishing the frontend first will show unavailable until the route exists.
6. If rollback is needed, restore the prior Apps Script deployment version and
   prior static Hub assets. No spreadsheet migration or trigger change is involved.
