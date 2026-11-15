# Beauty recovery workstream — 14 November 2026

## Verified live baseline

Hub33, mobile34, kiosk61. Owner supplied PRODUCTION_DEPLOYED_VERIFIED for Hub33 and the 09:07:53 native Nakka comparison: Hub8 / Nakka8, no differences, no pending registration jobs, no player alerts. Dashboard shows eight IN, zero attention. Preserve the existing eight registrations in the 16 November event. Native fault recovery and timing for Hub33 have not been newly demonstrated by a healthy-state screenshot.

## Prepared update — NOT DEPLOYED

Beauty-Recovery-Centre-20261114.cjs. Hub only: changes LiveHub, LiveHubView, LiveNakkaMonitor, LiveRegistrationQueue; adds LiveRecovery. No manifest/scope change. No jobs, property cleanup, event switch, Sheet/player/Nakka data operation or credential-file modification is executed by the installer. Exact Hub33 source and existing deployment/access guards, backup, frozen-version readback and optional diagnostic preservation remain. A publication verification failure stops; no automatic republish.

### Delivered in the candidate

- Nakka panel has always-visible TRANSFER PLAYERS, IMPORT FROM NAKKA and RECOVERY controls. They carry the live-control marker required by the old feature gate. They do not appear only after a failure. When all lists match, their candidate lists are empty.
- Transfer means Hub -> selected Nakka event, one reviewed IN player at a time, before event start. Review includes exact event/date and proposed existing league identity. No new league member is created; no cross-event player move. Duplicate/conflicting identities and OUT/STANDBY are excluded. Existing entries are not added again. Missing exposed league link is reported honestly.
- Import means selected Nakka event -> existing event workbook, one reviewed player at a time. Source NAKKA, status IN, consent N/A, blank message. Master list unchanged. The timestamp is event-window bookkeeping, not claimed original Nakka registration time; existing sorting excludes NAKKA bookkeeping timestamps. Existing/removed status records and aliases cannot be overwritten. Google backup Form must be closed before import.
- Each transfer/import has a durable, bounded receipt and intent before mutation. Lost replies are resolved by readback. Rechecks never blindly repeat an uncertain append/add. Import response/status records use one Sheets batch; status display is rebuilt from current source records. Existing records are checked for preservation.
- A pending transfer/import blocks that player's conflicting actions and event switches, while unrelated registrations remain eligible after the active operation ends. Queue storage accounting reserves growth for these receipts too. No property cleanup.
- Saved-result rechecks for old registration, status, consent and completed removal receipts. Original receipt retained in an immutable keyed proof before its pending flag is released. This verifies current saved state, not historical attribution of a lost request. Raw stored messages are preserved; whitespace tolerance applies only to display comparison. Registration identity, original response, consent/source, master and Nakka evidence are checked. Status can rebuild the derived display without repeating the source edit. Consent is never inferred or changed by recovery.
- Recovery inventory includes older player receipts, consent receipts, transfer/import receipts and unfinished competition operations. References remain visible. Needs Attention includes these receipts even if player names match. Running operations are progress, not red review alerts; an expired interrupted operation becomes reviewable.
- UI gives loading/checking/terminal feedback, captures event/session, deduplicates clicks, never re-enables a consumed confirmation, ignores stale callbacks, closes on logout and times out explicitly without replaying a request. Event-switch recovery links to the existing guarded event selector.

## One recovery checklist — do not call the whole workstream closed

| Case | Implementation / safe outcome | Local evidence | Native state |
|---|---|---|---|
| Ordinary queued registration | Existing durable queue retained | 25 queue scenarios; regression PASS | Prior registrations passed; speed still unmeasured |
| Queued saved-but-unverified result | Existing guarded recheck + Hub33 feedback | Auth/context/route and feedback PASS | Earlier whitespace recovery passed; new fault-feedback check pending |
| Missing IN player in Nakka | Reviewed one-player transfer | Normal, stale, duplicate, lost reply, absent uncertain, later-visible, OUT, standalone PASS | Candidate not installed |
| Nakka-only player | Reviewed one-player import | Eight-player preservation, lost reply, display recovery, empty table boundary PASS | Candidate not installed |
| Transfer/import reply lost | Read saved result; do not repeat uncertain add | PASS | Controlled native check pending |
| Old registration already saved | Verify exact original response/current source/master/Nakka; archive receipt | Trailing spaces and missing identity cases PASS | Candidate not installed |
| Old status source saved, display stale | Rebuild derived display, verify, archive | PASS | Candidate not installed |
| Old consent source saved | Verify source/display; retain original audit | PASS | Candidate not installed |
| Removal already fully saved | Compare removal backup and current absence; archive pending receipt | Complete vs partial PASS | Candidate not installed |
| Interrupted event switch | Existing archive/readback recovery retained | Prior tests unchanged | Prior native switch/recovery passed |
| Missing/ambiguous original response or identity | Keep receipt; explicit owner inspection | Reject without replay PASS | Not an automatic repair |
| Uncertain write still absent | Keep receipt; no repeat without evidence | Transfer/import/queue no-replay PASS | Owner inspection remains required |
| Partial removal | Preserve backup and pending receipt; no repeat deletion | Reject partial state PASS | Finishing a partial removal is NOT implemented here |
| Partial legacy registration with missing effects | Verify what exists; retain unresolved receipt | Missing-entry rejection PASS | General finish/migration is NOT implemented here |
| Uncertain source status/consent not saved | No inferred value or repeated source edit | Reject missing intended value PASS | Guided new-intent resolution is NOT implemented here |
| Interrupted pool/settings/start | Inventory shows reference; existing planner controls/owner audit retained | No new competition recovery claimed | Unified UI repair remains OPEN |
| Old receipt bound to another event/workbook | Refuse current-event evidence | PASS | Cross-event owner recovery remains OPEN |
| Storage full/corrupt receipt | Preserve evidence; stop new conflicting action | Existing quota/queue checks retained | Owner maintenance remains OPEN |
| Registration latency | Existing Hub33 focused readback retained | Regression only | Measure acceptance, worker and dashboard latency separately |

## Validation

30 focused recovery service scenarios PASS with simulated Google/Nakka transports. Additional checks PASS: completed and partial removal; consent receipt visible in monitor; processing vs expired review; first import into header-only tables; failed proof archive retains pending receipt. Existing 25 queue scenarios, 11 real auth/context/dispatcher integration scenarios, actual panel and legacy gate checks, Hub33 feedback/readback checks, new recovery UI scenarios, full server/inline JavaScript syntax, installer drift/idempotence/preservation and publisher lost-response/access checks PASS. These are local tests, not proof of native Google/Nakka runtime behavior.

## Native acceptance — preserve all eight

1. Run this one installer from the existing authenticated Mac project setup. Save its full result/audit reference. Do not rerun a stopped publication automatically.
2. Reload the existing production URL. Check the 16 November event still has eight IN and zero attention and Hub8/Nakka8 still match.
3. Open Nakka: TRANSFER PLAYERS, IMPORT FROM NAKKA and RECOVERY should all be visible and enabled. Transfer/import should report no unmatched eligible players on the current healthy lists. Merely opening or previewing does not change player data.
4. Inspect Recovery. Do not fabricate a production failure, remove a player, clear receipts or re-register an existing player to test it.
5. Use controlled nonproduction fault injection for absent-write, lost-response, identity conflict and partial-save native cases. Use legitimate future registrations/imports only when the owner intends those data changes. Record event/context, channel, times and outcome.
6. Close each remaining recovery checklist item only with evidence. No blanket 'all six fixes complete' claim.

## Checkpoint and GitHub

This candidate and evidence are saved in the handover. Latest previously verified GitHub snapshot remains commit 53076ac4789135fc353ad1ec39de825b310a8c41 on backup/live-checkpoint-20261114 (Hub32/mobile34/kiosk61). Hub33 and this candidate have NOT been uploaded to GitHub in this turn. Main and the Mac working copy remain untouched.
