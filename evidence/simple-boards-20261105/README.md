# Single board control path — TEST 2026-11-05

Owner clarified that Group 1/2 identify separate pools sharing the same physical board. A single four-player pool selecting boards 4 and 9 must immediately show Bana 4 + 9 on its saved pool card.

Removed the separate Edit display boards UI and its unused client handler. Board selectors on each saved card update its heading immediately; one Save boards & match plan action persists the selections through the existing audited Hub plan route. Group numbers appear only when pools share a selected board. No auto-save, provider writes or competition start on selection. Frozen player/pool averages retained. Repeated saved-pool paragraphs and duplicate event details removed; the event remains in the header and compact green/red status indicators replace repeated guidance. Refresh is an icon with an accessible label. Red attention text appears for failed refresh or unsaved board choices; empty success guidance takes no space.

Two legacy editor UI tests replaced with tests of the single inline path and expired-session handling. Added shared-board group numbering case. Server label API compatibility remains; no server or live-feed changes in this patch. Hub board plans remain venue schedules, not Nakka autopilot routing.

Baseline 746 PASS. Updated 748 PASS and inventory PASS. Google TEST save and screen acceptance pending. Only HubTest.html needs Google upload. Production unchanged.

Compact status regression checks green verified/saved states, red failed refresh and unsaved board edits, and blocks Start until visible selections match the saved plan.
