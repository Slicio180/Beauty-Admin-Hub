# Setup and execution

VERIFIED locally with Node v24.22.1; >=22 is declared, other versions UNKNOWN / UNVERIFIED. No npm dependencies or install step required. Apps Script code executes under Google V8 remotely, not Node; tests use VM harnesses.

1. Receive the full repository including `.git`; verify `git status --short`, `git branch --show-current`, `git log -1 --oneline`.
2. Inspect README and environment map before starting a server. Do not open `public/index.html` as TEST: it points to production.
3. Install Node (use v24.22.1 to match evidence); verify `node --version` and `npm --version`.
4. Run `npm test` from repository root. A nonzero exit blocks progression until explained and resolved. `npm run test:recovery`, `npm run test:health`, and `npm run test:safety` select subsets.
5. Capture fresh evidence: `node --test --test-reporter=tap tests/*.test.cjs tests/recovery/*.test.cjs tests/handoff/*.test.cjs > local-run.tap`; retain shell exit status. PASS means local assertions passed, not deployment qualification.
6. See inventory JSON for every test's requirement, source file, purpose, method and limitations. Inspect test bodies for exact assertions and fixtures.

No Google account, credentials, network connection or real data is required for this automated suite. Do not run application entrypoints, setup/reset functions, triggers or real APIs as test setup. No safe interactive local application mode is yet provided; that is a release blocker for a standalone programmer sandbox.

Run `npm run test:inventory` to execute all inventoried files and reject orphan files, renamed/missing cases, unknown requirements or missing evidence. After adding coverage, update the inventory, coverage and audit before committing.

Event behavioral tests: `node --test tests/handoff/event-control-behavior.test.cjs`. Fixture `tests/fixtures/event-runtime.cjs` constructs synthetic metadata, headers, numeric controls, ordinary/correction/garbage status rows, a formula and validation; interprets fake updates/deletions independently; records client/lock calls. No real data or remote APIs are used. Approval `true` exists only inside the fake runtime, never Route.gs.
