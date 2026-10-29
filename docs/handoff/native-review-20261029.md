# Beauty — tonight's computer review

Candidate only. Applied owner checkpoint: d40d0a4 on recovery/2026-10-28.
Record actual results below; every native check starts PENDING. Offline tests do
not prove the deployed UI or Nakka behavior. Production and JDC stay untouched.

## Review order

1. Confirm the recovered project and checkpoint before installing. Use the
   guarded installer from this package. A baseline/hash mismatch means stop and
   inspect the current source; never reset Git or bypass a guard.
2. Inspect local appearance before any Google upload. From the project root,
   `npm run preview` serves loopback only. Open
   `http://127.0.0.1:4173/competition-preview.html` for the standalone stage review.
   The local page starts with clearly marked synthetic data; no API call happens until
   **Load TEST event** is selected. Other local Hub pages remain network-blocked.
3. If actual TEST shapes are unsupported, collect the minimal read-only diagnostic
   with `node scripts/inspect-stage-readonly.cjs`. It writes a dated JSON under
   backups, omits player names/values and credentials, and makes only fixed TEST
   public GET requests. A changing revision is recorded as inconsistent, not a
   successful qualification. This command performs no registration/board writes.
4. Qualify actual stage/standings/badge shapes before accepting real display data.
   A CORS or connection error is a failed check, never permission to add secrets
   to the browser. The generated TEST stage route is now available after upload; open it from the Hub Nakka panel. It must match the selected Hub date and must never show synthetic participants.
5. Review Hub and Live typography/login/casting using the scoped TEST deployment
   workflow. Close editing/TEST pages before the separately reviewed Google push.
   Prepare helpers clone fresh source and preserve every unrelated Google file;
   verify readback after upload. Do not deploy this whole source directory blindly.
6. Test mutation-dependent pool transfer only after identities and OUT/STANDBY
   extras are resolved/qualified. Previewing and swapping are safe review steps;
   actual sending needs its own explicit reviewed confirmation and readback.

## Native acceptance worksheet

| Check | Expected behavior | Observed / evidence | Result |
| --- | --- | --- | --- |
| Kiosk / remote | Kiosk retains previous text/button sizes and has no Tonight's Players list; remote retains list and independent sizes; test on Lenovo tablet/mobile | — | PENDING |
| Sign in | Approved crest/type/spacing; direct authorised Hub entry; failed/expired login remains blocked | — | PENDING |
| Hub table | 48px EVENT HUB, 26px headings, 24px names/numbers, 20px controls; STANDBY readable; Remove beside Source | — | PENDING |
| Long names / keyboard | Names wrap without numeric overlap; tab order, focus, scrolling and actions reachable | — | PENDING |
| Actual boards | 1–4,7–9,13–15 selects ten boards only; 20 pools share in two batches; changed selection invalidates approval | — | PENDING |
| Status reconciliation | OUT/STANDBY excluded; extra Nakka registrations named; sending blocked until qualified/resolved; no automatic deletion | — | PENDING |
| Live pages | 65 players → 30/30/5; fullscreen/options retained; no missing/duplicate rows | — | PENDING |
| Real ranking | Actual overall rank/ties retained; unranked last; unavailable rank never inferred from points/averages | — | PENDING |
| Standalone pool view | Numeric labels, provider order/rank/points; 4 or 6 pools per page; empty source clearly empty | — | PENDING |
| Knockout view | Correct stage, participants, byes, scores, match averages, third-place results and winner; no invented advancement | — | PENDING |
| Automatic badges | Compare assigned board, reassignment and removal against Nakka in TEST; exact stage/round/slot | — | PENDING |
| Refresh failure/recovery | Last-known warning after failure/paused/offline/overdue; new data replaces old board labels | — | PENDING |
| Fullscreen / switching | Display selector/options remain accessible; pool rotation pauses while page hidden; exit restores view | — | PENDING |
| Collapse / round arrows | Independently fold Round robin/stage1/stage2; move through adjacent round pairs; feed refresh retains choices; no hidden-pool rotation | — | PENDING |
| Real handoff | Approved exact memberships/settings/cards verified by readback; unrelated records preserved | — | PENDING |

## Record each accepted or failed check

Date/time UTC: ______  Candidate/archive checksum: ______
Browser/OS and viewport: ______  TEST script/event: ______
Check name: ______  Expected: ______  Actual: ______  PASS/FAIL: ______
Evidence path: ______  Reviewer: ______  Follow-up: ______

Keep screenshots, JSON and logs with the dated review evidence. Do not record
passwords, session tokens or private admin payloads. Earlier audit records remain
history; this worksheet never upgrades a PENDING check automatically.
