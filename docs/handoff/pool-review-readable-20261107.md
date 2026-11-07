# Pool review persistence and readable rules — TEST only

Pool previews and final pool-send reviews now use durable, verified, chunked Script Properties instead of 30-minute / 5-minute CacheService tickets. No timer invalidates these reviews. One active draft per staff member and event is retained; replacement removes the previous shards. Session authentication remains required. This does not extend the staff login or the separate Start/qualifier approvals.

The server still rechecks roster, event date, provider event and schedule, league identities/statistics, settings, board plan, confirmation and write gate before sending. Consumed tickets and durable send journals prevent repeat sends. Storage failure blocks sending. The old preview/approval is retained if writing its replacement fails.

Match rules are shown as plain English stage sections. Finals, third place, points and round/dart limits appear without expanding JSON. Technical details remain collapsed. The review uses actual selected Nakka settings, including when preserving the current format. The n01 API manual identifies single-elimination game_setting round -1 as final, -2 as semifinal and -3 as third place:
https://push.n01darts.com/api/v1/n01_api_manual_en.html

For the owner's supplied settings: 501; group matches first to 2 (best of 3); Slutspel 1 standard first to 2, final first to 3 (best of 5); Slutspel 2 first to 2 including final; 13 rounds / 39 darts per player per leg; third-place matches off. This update does not change these match rules.

Validation: 951 tests passed, 0 failed; inventory passed. Browser launch attempted but blocked by local Chromium socket restrictions. Google TEST upload and real browser verification remain pending. No production changes or GitHub push.

Installation: run Beauty-Pool-Review-TEST.cjs from the Beauty-Admin-Hub terminal. It validates the exact uploaded baseline or this update, backs up changed sources and the Google TEST project, updates only HubTest HTML and HubTestPools server code, checks Google readback and writes an installation receipt. --check-local is read-only.

Migration: an already evicted legacy preview cannot be reconstructed from the missing cache record. Record current manual swaps/board choices before reloading. After installing, generate and review a fresh preview once and reapply those choices. New reviews have no countdown. This update does not promise restoring an unsent preview after closing/reloading the page or signing out.
