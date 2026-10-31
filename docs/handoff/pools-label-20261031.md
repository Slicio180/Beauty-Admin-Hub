# Pool summary label and vertical tiles — 31 October 2026

Owner confirmed LiveResume installed with 665 passing tests and all 19 Google
TEST files read back at 2026-10-31T21:29:47.185Z. Checkpoint ad64659, branch
recovery/2026-10-28. This update requires that exact local and Google state.

Add POOLS after the BOARDS number tile and before the size summary, using the
same label class/font/size as BOARDS. Stack the size tiles vertically with a
6px gap and equal width. Keep only nonzero sizes, preferred size first. A single
size remains one tile with no empty row. Board count, allocation, draw controls,
player identities and all provider/session behavior remain unchanged.

Reversible presentation change: no extra CSS-only tests. Existing 665 tests and
52-file inventory pass. Build output checked. Scoped Google overlay is only
HubTest.html; all other 18 files are preserved and full 19-file readback is
required. Backups/evidence and existing baseline refusals retained. Native
layout acceptance remains pending. No production, Nakka, Git commit or push.
