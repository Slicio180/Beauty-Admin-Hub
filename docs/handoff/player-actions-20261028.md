# Player actions correction — 28 October 2026

Owner-authorised scope: orange STANDBY (#d97900), original AIK Siffror for Hub
summary totals and row numbers, and removal from the selected Hub event AND its
Nakka event entry. Keep the NEW PLAYER label. League profiles remain.

## Baseline and recovery history

The Mac working source is the recovered prepared snapshot, newly tracked on
recovery/2026-10-28. Owner root checkpoint be4f1a3; font correction a237a8e.
Seven dashboard files were manually saved to the central Google TEST project.
Then all 16 files were cloned with clasp 3.4.1, three corrected HTML pages were
staged while retaining 13 unchanged files, and all 16 pushed at owner-reported
17:05:04 on 28 October. The supplied screenshot confirms the new Hub and fonts;
STANDBY was grey and the totals used AIK Display, prompting this update.
The newer pre-recovery Mac Git history remains unavailable; older audit material
is partial and must not be represented as a complete recovered history.

## Removal contract

A REMOVE action appears beneath SOURCE on each Hub row. Staff inspect exact
player/event/league LPID and Nakka tournament-entry TPID, tick the confirmation,
then explicitly remove. Authentication, selected date, full spreadsheet snapshot,
Nakka event and all entry metadata are rechecked under the shared script lock.
Preview tickets expire in five minutes, are session/user bound, and are consumed
on confirmation. Only fixed Beauty Identity TEST event t_RqC2_2034 and league
lg_tM2v_3523 are writable. Event status must be 10 or 20, and the target entry
must not appear in any bracket/table. Ambiguous league identities, registrations
or tournament entries fail closed. A positively absent event entry is displayed
as absent, with Hub-only cleanup after confirmation; no Nakka POST is sent.

The original typed Sheet snapshot and provider entry data are archived in a new
REMOVE-* sheet inside the TEST workbook. A durable ATTEMPTED journal is verified
before the single event-entry remove POST. The receipt and unchanged remaining
entries are verified before clearing two B:C name cells on exactly one selected-
date response row and C:F on its one status-storage row. Timestamp, consent,
message and source in the response archive remain; permanent identity A:B,
master list, other responses, formulas, formats and other player data are checked.
Only Tonight C status cells are rebuilt after formula recalculation. No row or
league profile is deleted. The recovery copy contains the original response.

A timeout, partial write or failed readback stays uncertain, retains the journal
and raises persistent organiser attention. It never retries automatically or
reports complete removal. Recovery is deliberate/manual, using the journal and
recovery sheet; no automatic rollback or removal-retry UI is implemented.
An explicit later registration may add again only when a matching VERIFIED
removal proof retains the exact prior verified transfer record. An uncertain
transfer journal is never bypassed by removal.

API contract: https://push.n01darts.com/api/v1/n01_api_manual_en.html
Only tournament/entry/update with remove:[reviewedTPID] is used for deletion.
Nakka has no documented compare-and-swap for this endpoint. External native
editing pages must be closed during removal. Native bracket and Sheet formula
qualification remains necessary; unsupported layouts are blocked.

## Delivery and verification

The local installer checks clean recovery branch/head and all before/after file
hashes, preserves a local backup, builds the Hub, runs tests/inventory and commits
only the listed files. It performs no Google/provider call.
prepare-google.cjs creates a fresh read-only clone of the exact central TEST
script, checks all five changed/new remote file preconditions, preserves all
other downloaded files, and prints a push command for owner execution.
verify-google.cjs downloads the resulting project into another new folder and
compares every staged filename and byte. No setup, scopes, access, deployment,
Script Properties, production AIK or JDC changes are needed.

Native review pending: orange dropdown; Siffror totals/ordinals; NEW PLAYER badge;
confirmation close/keyboard; one explicitly chosen TEST player removed from Hub
and Nakka event; league/master profile retained; other players/metadata retained;
read-only comparison and attention after removal; fresh registration only if
explicitly desired. Do not select a real production player/event.
