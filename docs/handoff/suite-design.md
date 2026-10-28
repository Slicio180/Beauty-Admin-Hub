# Replacement automated suite design

RECONSTRUCTED design, not implemented test coverage. The inventory JSON contains only executable cases actually present and run. Proposed work below must not be counted as tests.

Implement by risk, each change following CHANGE → AUTOMATED TEST → REGRESSION TEST → EVIDENCE → AUDIT UPDATE → COMMIT.

1. P0 isolation: route/project/config mismatch, denied service access, both gates false, no production fallback, malformed calls. New local gate tests start this work.
2. P0 Event Control: fixture snapshots with full userEntered/effective values, formats and validations; canonical object key equivalence versus array order/type/undefined/hole/-0 differences; invalid tokens; lock contention; baseline drift; prewrite drift; exact A2/B2 request; readback failure; thrown writer; lock release; no retry. Test through exported adapter interface; do not alter hash-preserved recovered source merely to expose internals.
3. P0 status: in-memory fake Sheets client with call recording; identity mismatch, unknown/duplicate/alternate names, exact single C-cell mutation, concurrent drift, exception and readback mismatch. A fake success is not real TEST qualification. Current first-match behavior must be reviewed before successful writes are authorized.
4. P1 dashboard and registration: representative grids, formulas/errors/blanks, consent/messages, limits/truncation, normalization, same-name identities, idempotency and partial integration failure. Specify intended behavior before writing tests around uncertain legacy behavior.
5. P1 integration contracts: fake Sheets/Form/Nakka services returning documented success/error/quota shapes; deterministic dates/times and no secrets; no direct external requests in the default suite.
6. P1 browser: real browser with local fixture transport, blocked network and Swedish default; keyboard/mobile/modal/status rollback/race handling, registration and cast/ranking/sorting. Add browser dependencies only with reproducible pinned lockfile and safe transport mode.
7. P0 security/operations: authorization and session model, untrusted text rendering, backup/restore and release artifact identity. Complete threat model and deploy/rollback rehearsal before programmer-safe release.
8. Explicit opt-in remote TEST qualification: separate runner, target allowlist, disabled writes by default and ten-control approval evidence package. Never include real writes in npm test. Production release remains a separate decision.

Each implemented case gets stable inventory ID, requirement/regression, exact test name/file, fixtures, observable expected result, evidence path/hash and audit row. Add adverse cases that would detect a realistic bug, not duplicates to increase totals. Review mutation sensitivity for critical safeguards. Missing specification is an issue, not a passing test.

Progress (VERIFIED local, EVENT-BEHAVIOR-2026-10-25): Step 2 now has EVBEH-001–035 covering real adapter/preflight behavior with fake clients. This partially implements the plan; missing cases remain in coverage.md. Real write qualification and operational readback remain separate.
