# Pool Planner feature block — TEST only

Status: implemented and locally verified; Mac install, Google TEST upload and actual browser review pending. No production deployment.

Entry: Pool Planner in left menu. Count comes from selected event players with exact IN status. OUT/STANDBY excluded. Board count and preferred size (3/4) are organiser inputs retained while the panel remains loaded. No event mutation, player draw or Nakka write.

Results: preserve the selected preference using the uploaded scheme. Also find the arrangement retaining the most preferred-size pools while fitting one pool per available board. If impossible, explain shared boards or later starts. A starting-batch bound is not a match timetable. Five players use one five-player pool. Below five: no arrangement proposed. Above 101: explicitly marked calculated extension (up to 10,000 players). Boards validated as integers from 1–1000.

37 / prefer 3 / 10 boards: 11 pools of 3 plus one of 4 (12 pools); board-fitting alternative 3 pools of 3 plus 7 of 4 (10 pools).
34 / prefer 3 / 7 boards: 10 pools of 3 plus one of 4 (11 pools); no one-pool-per-board alternative using 3/4-player pools.

Original uploaded XLSX is included byte-for-byte as public/assets/pool-scheme.xlsx. Static preview downloads it directly; generated HubTest.html embeds it, requiring no new server route. Actual Google HTML-service download behavior must be reviewed in browser.

Verification: seven new behavior cases; 244 full-suite cases pass. First full run retained two failures from historical sidebar/script-count expectations; updated these exact expectations for the added button/module. No existing backend contract was relaxed. Browser screenshot review unavailable locally: Chromium executable absent. This is not browser acceptance.

Installation: use supplied installer from project root at 3d5269e, recovery/2026-10-24. It preflights hashes, backs up touched files and audit, runs builds/tests/inventory, records AUD-069 and commits only upon success. No upload, deployment or push.

Google TEST: replace HubTest.html only in Beauty — Remote Identity TEST. Other Apps Script server files unchanged. Review player count, 3/4 choice, board input, original scheme download, close/Escape, refresh and status changes. Never upload this owner-only TEST Hub into production.

## Browser download failure and correction
26 October 2026: supplied screenshot 08.47.07 shows Chrome download failures: File wasn't available on site. Root cause confirmed in generated HTML: spreadsheet substitution ran before script inlining, leaving the relative asset URL unchanged. Move embedding after inlining; create a Blob URL from embedded original bytes for download and set target to self. Original XLSX is unchanged. Actual generated panel executes download construction in a fake browser; resulting bytes match original. 245 full-suite cases pass; Google browser retest remains pending. Prior AUD-069 local tests did not establish embedded download correctness.
