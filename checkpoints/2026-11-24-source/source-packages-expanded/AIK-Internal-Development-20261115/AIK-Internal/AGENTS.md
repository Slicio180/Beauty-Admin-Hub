# AIK Internal project instructions

- Keep this work separate from Beauty for now. A future merge is deferred.
- Build a separate TEST page with a dedicated workbook and AIK master roster.
- Nakka internal cups use tournaments only, never leagues.
- Support singles KM, doubles KM and other internal tournaments.
- Do not silently reuse Monday's roster, workbook, event context or credentials.
- Keep a detailed beginner-readable operator manual as development proceeds.
  For every verified procedure document purpose, prerequisites, screen location,
  exact labels, steps, expected result, failure handling and how to finish.
- Mark proposed instructions, local mocks, native TEST evidence and LIVE
  availability distinctly. Never imply a draft or saved URL starts a match.
- At every meaningful checkpoint update Manual, Handover, status and procedure
  log; preserve an immutable numbered source/test snapshot and checksums.
- Preserve earlier checkpoints. Fixes get a new checkpoint, not rewritten proof.
- Save updates to the existing AIK package identity; do not touch Beauty's
  handover or to-do list. Record actual Git commits/remotes only after success.
- Never include passwords, OAuth tokens, credential exports or real player data
  in source checkpoints. A GitHub repository should be private if created.

- Use English throughout the AIK Internal interface and manual. Reuse original
  AIK fonts/crest assets from assets/; do not generate replacement artwork.

- Owner Mac working folder is /Users/alessiotampella/Downloads/AIK-Internal 6.
  Update in place using terminal; do not request new working folders. Back up
  changed files under Checkpoints before updating. Do not alter Beauty.

## Owner clarification — 16 November 2026 (supersedes standalone final UI)
AIK Internal is selected from Beauty League / Tournament, uses its own master
list and workbook, then returns to the normal Hub to run the event. Preserve
data isolation from Monday throughout. See Handover/HUB-INTEGRATION-20261116.txt.
Do not publish against an unverified installed Hub baseline.

## Owner workflow and defaults — 16 November 2026
Build only; no deployment or native workbook/provider changes today.
Create Nakka internal tournament before registration; then return to normal
Hub for kiosk/Hub registration from AIK master, pairing and draw.
Doubles Fair default means stronger + weaker. Keep fixed couples intact.
Use recorded averages with source/date; unrated is not zero. Automatic
Dartstatistik retrieval/matching remains unverified.
