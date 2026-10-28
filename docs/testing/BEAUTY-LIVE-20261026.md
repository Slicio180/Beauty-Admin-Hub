# Beauty Live — TEST feature block
Baseline: 8f230ff, recovery/2026-10-24. Production untouched.

Swedish landscape casting view: KVÄLLENS SPELARE in original AIK bold and #ffd700, number/SPELARE tile beside title at right, numbered names below in up to four columns, filling down each column. Default alphabetical; registration timestamps are matched by exact displayed identity and selected event date, earliest registration first; missing timestamps last. No source rows reordered. OUT/STANDBY registrations remain on names list; no operational status is shown.

15-second refresh after previous request completes; 20-second timeout; late responses ignored. Last list retained with Swedish stale warning on failure. Up to 60 players fit in four columns of 15 on landscape screens; above 60 the list scrolls slowly up/down with a pause at each edge. Title/counter remain fixed. Hover pauses scrolling; touch pauses it for ten seconds. Unchanged data refreshes preserve scrolling. Read-only server projects only name/time/rank/points; no messages, consent, source, master list or statuses sent to casting browser. Existing owner-only access and exact TEST identity guard retained. Popup requires browser permission. No login/security redesign.

Nakka integration is NOT complete: ranking/points controls disabled and labelled unavailable. Pure sorting/rendering supports future verified numeric ranks/points, but there are no real Nakka calls or fabricated statistics.

Source: public/beauty-live.html, public/css/beauty-live.css, public/js/beauty-live*.js. Build: node scripts/build-beauty-live.cjs. Hub opener in TEST transport; rebuild Hub with node scripts/build-hub-test.cjs.

Google TEST upload (same owner-only Remote Identity TEST): replace Code.js and HubTest.html; add BeautyLiveTest.gs and BeautyLiveTest.html. Save only, no production deployment. Direct TEST URL: existing /dev?page=live. Google route, popup behaviour, true automatic refresh, actual response date matching, viewport fit, long names, page cycling and screenshot evidence still require manual qualification. Pixel review unavailable in preparation runtime (browser executable absent).

Audit as one block: installer creates dated backup, validates file hashes and baseline, runs suite and inventory using disk streams, checks generated HTML hashes survive, records AUD-066 on success/failure. No automatic commit on failure. After browser review append acceptance and evidence to same block, then make one explicitly scoped Git checkpoint. Raw failures retained.

Capacity refinement 2026-10-26: original 00.30.28 screenshot reviewed and retained. Names were row-major; user requested numbered, down-column reading, sixty-player fit and automatic scrolling beyond sixty. Numbers are display positions in the selected sort order, not permanent player IDs or Nakka ranks. Pixel fit and auto-scroll on actual venue screens remain pending. Local BeautyLiveTest.gs maps to Google BeautyLiveServer.gs because Apps Script rejected duplicate base names; HTML remains BeautyLiveTest.html.
