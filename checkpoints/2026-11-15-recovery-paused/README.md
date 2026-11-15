# Beauty recovery — paused checkpoint, 15 November 2026

Development is stopped at the owner's request. This is a saved TEST checkpoint, not a release or authorization to resume development or deploy LIVE.

## Current source and evidence

`installed-test-source/` contains all 38 files from the exact planned source of the Closed Dialog installer. The owner reported successful installation and full TEST source readback: 37 existing files preserved, one HTML file changed, zero files added. No Beauty function was run by that installer. Post-reload visual acceptance of that final popup remains pending.

`development-evidence/` preserves the recovery modules, test sources and existing local test results. These are historical mocked checks, not evidence that the full native workflow passes. Original installer packages and complete baseline/planned fixtures remain in the canonical Beauty-Handover.zip; some archived tests need those fixtures and are not standalone here. No new behavioural tests or production actions were performed for this save-only checkpoint.

`Operator-Handbook-Draft.md` is the current handbook export, with the affected player's name and owner-local audit paths generalized for the public repository. `SHA256.json` identifies the saved files.

## Required behaviour on resumption

- Keep diagnostics, colour examples and their records in the system, hidden during normal organiser operation and revealed only when needed. This preference is recorded but NOT implemented: the owner stopped work first.
- Recovery belongs beside the affected player: automatic safe recovery first, red/orange only for actual problems, clear guided steps if organiser help is needed, green when recovery is verified, and an accessible explanation/report.
- Do not require organisers to manually verify ordinary registrations or display a list of unexplained "Not yet verified" players.
- Completed events must reject new registrations before writing a registration or transferring to Nakka. Verify the implemented admission guard across the intended entry routes before release.
- The late-registration case was marked OUT; removal remained blocked after event completion and its warning remained. OUT is not deletion. Mistaken-registration cleanup and warning clearance are unresolved.
- The owner observed that the TEST system remained usable; this does not establish full release readiness.
- No diagnostic exercises need rerunning merely to resume work. Do not reinstall previous fixes blindly.

## Save boundaries

This directory preserves the latest TEST source without replacing the older active application directories on the recovery branch. Do not build or deploy those older directories assuming they contain these updates. Reconcile source deliberately when development resumes.

Canonical handover: Beauty-Handover.zip. Canonical handbook: https://chatgpt.com/space/page_d004fe97823c8191844a50da2d2344fd . Private player reports, screenshots, credentials and full owner-local archives are not published here. Existing Git history is preserved. LIVE has not been changed by this checkpoint.
