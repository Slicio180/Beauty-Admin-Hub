# Beauty LIVE — checkpoint, 8 November 2026, 00:53 Stockholm

## Resume here

Alessio ended the session after confirming Matt Collins was removed from both
the Hub and the Nakka event list. Do not repeat passed registration/removal tests
or re-register Matt without an operational reason. Alessio remains registered.
Continue the remaining LIVE modules; review the next priority with the owner.
Pool Planner/event setup and Beauty Live casting are still disabled in LIVE.
Do not label the whole Hub production-ready or deployed at its final URL.

## Verified tonight

| Check | Result and evidence |
|---|---|
| Selected event | 9 November 2026, t_UsRG_9574, league lg_tM2v_3523. V4 preflight CONNECTION_CHECKS_PASS. |
| Sign-in and sign-out | Approved LIVE account verified; previous session rejected after logout. |
| Live viewing | Approved AIK fonts/crest/layout retained; real registration data displayed. |
| Status | Alessio IN → STANDBY → IN confirmed in Hub and both relevant sheets. Formula-tail row-count bug corrected; do not restore the old getLastRow-only guard. |
| Existing-player registration | Matt Collins, HUB, IN, YES. Receipt VERIFIED at 2026-11-07T23:27:18.580Z. LPID ORl2; TPID HxUw. API did not expose league link, but owner screenshot showed League badge. |
| Duplicate prevention | Native popup: You are already registered for this event. No additional entry observed. |
| Removal setup | READY_FOR_REMOVAL_REVIEW, writesPerformed:false at 00:50:36 Stockholm. |
| Removal | Native preview selected Matt, LPID ORl2, TPID HxUw. Owner confirmed. Hub reported removed, master-list/league profile retained and recovery sheet saved. Owner separately confirmed Matt absent from Nakka list. |
| Session correction | Six-hour patch supplied; owner said done. Local mocked-clock checks passed. Actual six-hour uninterrupted duration not yet observed. |

Registration receipt: pending:null, last.state:VERIFIED; recordedUTC
2026-11-07T23:27:11.881Z. Matt was subsequently removed; this is historical
registration evidence, not current membership.

Removal recovery sheet shown: REMOVE-20261108-005242-ce012bdb.
Full removal reference is in the LIVE script's receipt and recovery sheet;
the screenshot truncates it, so it is deliberately not reconstructed here.

## Current LIVE configuration

- Apps Script: 1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4.
- Spreadsheet: 1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM.
- Firebase: beauty-admin-hub-live. Approved UID 607O4cFmrTMPSk2CgADhwNu7k742.
- Original kiosk/mobile apps are the working baseline and were not overwritten.
- Owner uses the Apps Script /dev Hub. Existing /exec deployment remains the
  initial login-check version; no final operational deployment was created.
- Full spreadsheet, external-request and Forms scopes. Forms is for the backup
  form's new-player choices. Nakka credentials are Script Properties only;
  none are included in this package.
- Live spreadsheet locale en_GB; timezone Africa/Ceuta, read from metadata.
  Actual Tonight formula window is timestamp >= Control!B2 and < Control!A2+1.
  Control A2 is 9 November; B2 last reset 7 November 22:39. Preserve this advance
  registration behavior; do not transplant TEST's same-day date filter.
- Session idle and absolute limits restored to six hours. Refresh/reload needs
  fresh sign-in; explicit logout still revokes. Existing short sessions are not
  extended by the code change. Cache expiry is not session expiry.

## Files and installation order

The supplied ZIPs are evidence/recovery artifacts, not instructions to reinstall
everything tomorrow. Registration and removal have already been installed and
accepted. Six-hour patch is reported installed by the owner.

1. Beauty-LIVE-Registration.zip — source readback PASS; Mac backup
   /Users/alessiotampella/Downloads/Beauty-LIVE-Registration-Backup-sTDP4J.
2. Beauty-LIVE-Removal.zip — source readback PASS; Mac backup
   /Users/alessiotampella/Downloads/Beauty-LIVE-Removal-Backup-Ww12BY.
3. Beauty-LIVE-Six-Hour-Session.zip — owner reported done; preserve this fix in
   every future installer baseline. Its backup path was not pasted.

Earlier status backup:
/Users/alessiotampella/Downloads/Beauty-LIVE-Status-Backup-kDjwFf.
Earlier original deployment readback:
/Users/alessiotampella/Downloads/Beauty-LIVE-Deployment-Readback-DPsZRn.

Source/current-prepared.json is an assembled development snapshot from the
verified installer sources and six-hour fix, not a fresh full Google readback.
It contains the intended status row fix. The owner's exact native status file
and optional LiveLayoutCheck diagnostic were preserved by installers; their
exact formatting/latest bytes require the native source backup if needed.

## Test evidence

- Original TEST suite: 953 cases / 69 files, pass; owner output supplied earlier.
  This is TEST evidence and not a count of LIVE tests.
- LIVE registration: 27 local mocked service tests + 8 installer/integration
  checks (35); existing-player and duplicate paths subsequently checked natively.
- LIVE removal: 26 local service/schema/state tests + 7 UI/installer tests (33);
  native removal subsequently passed, with owner confirmation in Nakka.
- Six-hour session: 5 mocked-clock checks + 1 session-installer preservation
  check. Actual six-hour native duration remains pending.
- Embedded fonts and crest unchanged in generated updates. No new desktop
  browser automation success is claimed; native screenshots are owner evidence.

## Remaining work

- [ ] Preserve a fresh final native source/deployment readback when resuming;
  consolidate LIVE changes into Git without losing either recovery branch side.
- [ ] Continue LIVE Pool Planner/event setup and Beauty Live/casting migration
  from tested sources; keep existing Nakka administration workflow.
- [ ] New-player path (new master-list entry, backup form choices, league create)
  still lacks native acceptance. Do not create dummy players just to tick a box.
- [ ] Confirm six-hour session behavior during actual use; no short timeout
  should be reintroduced by future installers.
- [ ] Review registration confirmation visibility. No modal success popup was
  shown; owner said TEST behaved the same. Registration itself passed.
- [ ] Improve long removal-reference wrapping; screenshot overflowed the dialog.
- [ ] Qualify attention/recovery handling, concurrent kiosk/mobile/Hub operations,
  Windows/venue screens, full event-to-winner and next-event workflow.
- [ ] Remove temporary LIVE review banners only as relevant controls qualify.
- [ ] Update operator handbook to actual LIVE workflow and publish final /exec
  deployment only when intended release work is complete.

## Git and preservation status

Latest explicitly verified GitHub backup remains backup/test-verified-1734c5f,
commit 1734c5f323ffb904e63eb53384e126c12c5a2cac. Tonight's LIVE updates are not
committed/pushed to GitHub. Recovery branch divergence was last reported ahead 1,
behind 3; do not use blind Sync or force-push. This workspace is an extracted
source tree, not the owner's Git checkout.

The saved checkpoint contains source, installers, local tests, receipts as text,
and updated work list. It is not a backup of live Sheet data, Script Properties,
passwords, clasp credentials, all Git history or Nakka event data.

Original apps and Hub use different locks. Uncertain saves leave durable pending
markers and must be reviewed, not automatically retried or cleared. Recovery
copies are retained. Source rollback does not undo real event mutations.

## GitHub save

This checkpoint is being saved on backup/live-verified-20261108, based on
1734c5f323ffb904e63eb53384e126c12c5a2cac. The older pending-push text above
records the pre-sync closeout. The recovery branch remains separate; no merge
or Mac working-copy synchronization is claimed.
