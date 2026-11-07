# Knockout badge mapping — TEST fix

Observed event t_gINp_8026 supplied badge indices 0,1,4,5 for its quarterfinals in both t and s2. The previous ordinal lookup 0,1,2,3 hid the last two assigned boards. Nakka native n01_comp.min.js (version query a=832) constructs single-elimination badge container IDs using slot - slot % 4 / 2. The projection now follows that indexing for every knockout round. No fallback to another match's board is allowed.

Evidence sources read 7 November 2026:
- https://api.n01darts.com/api/v1/tournament/get?tdid=t_gINp_8026
- https://api.n01darts.com/api/v1/tournament/standings?tdid=t_gINp_8026
- https://n01darts.com/n01/league/n01_v2/js/n01_comp.min.js?a=832

The captured public event projected boards 1,2,3,4 in Slutspel 1 and 5,6,7,8 in Slutspel 2 after the fix. Added coverage for 8/16/32/64 entrants, later rounds, stage separation and missing badges with misleading alternative keys. Full suite: 953 PASS, 0 FAIL. Inventory verification recorded alongside this file's evidence. Browser screenshot verification remains pending after Google TEST upload.

Only the shared read-only projection and its two generated TEST Live pages change at runtime. No Nakka board assignments, players, results or production endpoints change. The source update includes tests and audit evidence. Installer targets the existing fixed Google TEST script and refuses unknown baseline files. Reload the existing Live tab after successful installation; no redraw or competition restart is needed.
