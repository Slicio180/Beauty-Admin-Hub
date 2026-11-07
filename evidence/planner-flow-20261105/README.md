# Pool workflow TEST — 2026-11-05

Includes the START-average correction and main-screen qualification controls, automatic planner entry load, saved verified draw recovery and explicit Start competition confirmation. Four-player groups require a 1/2-board decision. Hub venue match plan has six unique matches in three parallel waves on two boards or six sequential waves on one. Other pools sharing those boards wait; no players or boards overlap.

Board match plans are Hub venue schedules. They do not enable Nakka autopilot, assign referees or write per-match board routing. Beauty Live shows the selected board(s). Nakka remains the scoring system.

Start uses tournament/update with set:{status:30}, expected provider revision, authenticated staff and TEST identity/write guard. Requires original verified send audit/receipt, unchanged roster/date, qualification format, unchanged saved event/cards, and a board decision for four-player pools. Five-minute session-bound single-use approval. Durable ATTEMPTED journal and recovery evidence precede mutation. Exact readback changes status only. Uncertainty blocks retries. No automatic Start on save or load.

Existing groups are loaded rather than sent again. Current original send audit POOL-3015b0364c854724bd05 was reconciled successfully with zero provider writes; receipt POOL-0afd7471f01f448f8336. Existing four-player group can receive a Hub board plan without re-sending groups.

Baseline 731 PASS; final results recorded in package verification. Local synthetic provider tests are not live API acceptance. Google TEST save, real Start and browser acceptance remain pending. Production unchanged. Temporary Google owner runner and userinfo.email scope remain outside this patch.

API contract reviewed: https://push.n01darts.com/api/v1/n01_api_manual_en.html — tournament/update status 30 starts competition; native RR tables and Fixture schedules differ. Start can be rejected by provider capacity/payment limits; it is not retried.
