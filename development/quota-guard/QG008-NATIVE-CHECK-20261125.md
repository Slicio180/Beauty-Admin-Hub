# QG008 native acceptance — initial check

Date: 2026-11-25, approximately 20:49–20:54 Europe/Stockholm.
Target: private Release TEST, active deployment version 12. LIVE unchanged.

## Observed passes

- Staff sign-in reaches the TEST dashboard.
- Request Usage loads: 9 counted requests at first inspection, TEST limit 2,000, background work paused. This is project usage, not Google's remaining allowance.
- Initial dashboard refresh failure preserves all 54 synthetic players and marks the list stale. Later normal refresh recovers, verifies the event, and reports no list differences / zero attention items.
- Event Setup reads Beauty Combined Release TEST 2026-11-24, 54 Nakka entrants, two saved groups and saved match settings.
- Player Averages loads provider identities. Synthetic player Beauty Combined Speed Browser Hub was initially UNRATED, saved at 45, then reloaded as 45 ESTIMATED.
- Mark unrated was applied, and reopening/reloading confirmed UNRATED. Append-only rating audit history remains; no Nakka rating write was made.
- Pool Planner displays Equal/Fair, Similar strength, and Random. Existing sent plan reports players or date changed after sending and blocks start pending review.

## Release blockers / remaining checks

- Instructions remains disabled with title "Not available yet". Candidate LiveHubView.html contains a legacy sidebar blocker around lines 2653–2658 that disables Instructions and intercepts its click. The new handbook handler exists but is unreachable. Handbook visual/search acceptance FAILED.
- Initial dashboard connection failure recovered; its original underlying server exception was not exposed in the UI, so cause remains unverified.
- Pool-method behavior, refreshed averages in preview, cast refresh/backoff, registration/recovery writes and bounded worker-expiry acceptance remain pending. Existing sent synthetic plan must be handled deliberately before testing new draws.
- No LIVE promotion. This is a partial native acceptance record, not an all-pass release receipt.
