# Beauty — START HERE

This is the recovered Beauty Admin Hub repository. The current checkpoint establishes a human programmer handoff framework; **Beauty is not yet qualified as programmer-safe or release-ready**.

VERIFIED intake: branch `recovery/2026-10-24`, base commit `408fecc`. Development continues from this repository, never from historical backups.

## Safety first

- No GitHub push or production changes without separate explicit approval.
- Both TEST write gates in `apps-script/event-control-test-write/Route.gs` remain FALSE.
- **Do not launch `public/index.html` as a TEST environment. Its backend URL points to production.**
- Default tests use mocked services; no credentials or remote writes are needed.
- Real TEST writes require explicit approval and all ten controls in [write rules](docs/handoff/security-and-write-gates.md).

## Run local tests

Use Node v24.22.1 to match recorded evidence. No dependency installation is required.

```sh
node --version
npm test
```

Run from this repository root. A failure blocks progression until it is understood and recorded. See [setup and execution](docs/handoff/setup-and-tests.md) for subsets and evidence capture.

## Evidence and scope

The 25 recovery baseline cases passed here. Two additional existing Nakka health files were discovered; their UI harness needed one relative-path correction. All 68 pre-existing expanded cases then passed. Eleven new mocked safety regressions bring the checkpoint to **79 PASS / 0 FAIL** at the framework checkpoint. A subsequent 35-case Event Control behavioral extension brings the current suite to **114 PASS / 0 FAIL**. See [audit evidence](docs/handoff/audit-register.md).

Historical record: 451 tests, 450 PASS / 1 TODO / 0 FAIL. Those original runnable suite files were lost. This checkpoint does not recreate or claim them. A passing local suite does not qualify real TEST writes, production, authentication, full event operation or rollback.

## Programmer route

Read [framework index](docs/handoff/index.md), [architecture](docs/handoff/architecture.md), [environment map](docs/handoff/environments.md), [contracts](docs/handoff/data-and-contracts.md), [test inventory](docs/handoff/test-inventory.md), and [coverage gaps](docs/handoff/coverage.md). Follow the [suite design](docs/handoff/suite-design.md) before feature development. Deployment and rollback runbooks are explicitly unqualified until rehearsed.

Every meaningful change follows CHANGE → AUTOMATED TEST → REGRESSION TEST → EVIDENCE → AUDIT UPDATE → COMMIT. Labels: VERIFIED (directly observed, scoped), RECONSTRUCTED (new/rebuilt material), HISTORICAL EVIDENCE (prior records), UNKNOWN / UNVERIFIED (not established). [Provenance](docs/handoff/provenance.md) governs older documents that use stronger wording.
