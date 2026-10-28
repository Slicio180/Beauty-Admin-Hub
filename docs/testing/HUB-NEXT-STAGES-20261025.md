# Hub remaining stages — 2026-10-25

This is a workflow checklist, not a release-readiness claim. Every browser stage needs dated expected/actual results and evidence in the audit.

1. Status: upload prepared TEST status bridge; verify IN/STANDBY/OUT cycle, preservation, reload persistence and no flashback. Local tests ready; Google runtime pending.
2. Event Control: adapt the existing separately tested reset/preflight/date logic deliberately to the Identity TEST sheet; inspect current reset behavior, bounded writes, stale-event guards, confirmation, readback and rollback. Older Event Control TEST project/gates remain preserved. Do not simply enable old gates against another sheet.
3. Core navigation: make sidebar and Event Control buttons open their intended views/popups; distinguish implemented functionality from placeholders. Verify register/message dialogs, player/new-player/source/consent/status display and error paths.
4. Beauty Live: separate self-refreshing cast tab, correct selected event/players, main Hub stays usable, then agreed Nakka rank/points and sorting requirements where applicable.
5. Nakka: authenticated configuration, read-only health check, failure handling and eventual controlled event integration. Current Identity TEST intentionally makes no Nakka calls; earlier health test evidence is separate.
6. Shared computer security: actual login, roles, sign-out/session expiry and protected server writes. Existing Google owner-only TEST is a temporary test boundary, not the finished Hub login.
7. Registration coordination: central/shared locking design across kiosk and Remote/Hub; controlled concurrent, stale and uncertain-result tests, cancellation and reused identifying-detail checks. Sequential success alone does not qualify this.
8. Product completeness: current requirements review including Swedish-first multilingual support, player sorting, event-specific pools, instructions, configuration/status, privacy/access control, backups/recovery and remaining sellable-product/ISO-readiness work.
9. Final rehearsal and release decision: realistic end-to-end TEST event, independent before/after comparisons, audit evidence, restore check and deployment configuration review before any live cutover. Keep live Monday systems preserved until explicitly authorized.

## Progress at 8ddc4ef

Sequential TEST status-cycle observations and screenshots are committed in AUD-043–044. Event Control read-only inspection is now prepared locally; Google upload/summary/cancel review pending. Event writes remain unimplemented in this Identity TEST bridge. The older separately qualified Event Control source is preserved for deliberate integration after inspection.
