# Beauty desktop local preview

The desktop Hub now opens disconnected by default. Start `npm run preview` from the master project, then open http://127.0.0.1:4173/preview.html. Stop the server with Ctrl+C. Use fictional names only. The yellow banner identifies the demo and the backend reads DEMO. Nakka reads UNAVAILABLE because no Nakka check is performed.

Try changing Demo Anna's status, reading Demo Björn's message, registering Demo Dani with JA or NEJ, and registering a fictional new name. Reload to restore the original three fictional players. All state is page memory. No requests leave the preview.

Only dashboard, status, messages and registration are in scope. Sidebar Event Control, Beauty Live, Nakka management and Instructions have not been implemented by this change. The existing owner-only Google TEST Hub remains separate. Live authentication and an authenticated remote adapter are still required.

## Verification

Assistant: 114 existing cases plus 19 preview cases passed; 133 total across 8 files. Minimal DOM and loopback HTTP checks passed. Browser review could not run because Chromium is absent. Mac rerun and visual review remain pending and must be recorded separately.

`npm test` runs all eight test files. `npm run test:inventory` also executes the mapped suites and checks evidence paths.

## Installation

Keep the master project open. Extract the update ZIP outside the master project (for example Downloads). In the master project's VS Code terminal, run `node ` followed by the extracted apply-update.cjs path. The installer validates original file hashes before writing anything, backs up changed files inside the master's backups folder and refuses mismatches. Keep the update ZIP inside the master backups folder after installation. Do not copy a second complete project over the master.

## Recovery

The installer saves a manifest of added/replaced paths and original copies under backups/local-preview-before-<timestamp>. Stop the preview before rollback. Restore only listed replaced files from that backup; remove only listed added files after preserving test/audit evidence. Do not reset the entire repository or discard unrelated changes.
