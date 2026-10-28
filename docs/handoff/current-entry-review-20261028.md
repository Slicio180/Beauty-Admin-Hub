# Explicit review of a current entry — 28 October 2026

Baseline owner checkpoint 35e54bf on recovery/2026-10-28; 17-file Google byte
readback previously PASS. Native Beauty Test New 01 removal passed. Owner later
reported removing only Anna Felldin. Snapshot then Hub63/Nakka57/IN60/alerts7;
comparison shows six Hub-only identities, no Nakka-only names or duplicate names.
Adam Pettersson is present in native event list with League badge and Hub IN.
His preview exposes LPID T1aj and event TPID Uj59. Owner supplied his original
ATTEMPTED journal from 27 October19:24:21.556Z, beforeCount1. Its old beforeHash
cannot automatically reconcile a roster that now has57 entries. No duplicate
registration/removal or Nakka fault is established by that journal alone.

## Resulting behaviour

Nakka > TRANSFER ONE PLAYER — TEST > select IN player > REVIEW TRANSFER.
For a same-event, same-identity ATTEMPTED marker and a unique current entry whose
old fingerprint no longer proves the add, staff get REVIEW_EXISTING rather than
an add option. Show event, Hub name, league LPID and exact current entry TPID.
The checkbox explicitly acknowledges the existing entry; button is CONFIRM
EXISTING ENTRY. This sends no Nakka mutation and makes no Sheet change.

The five-minute ticket is bound to owner/session/player, intent, full current
state and the original journal bytes. Confirm re-reads and authenticates before
persisting. An immutable review receipt records actor/time/current IDs and the
original journal hash; its pointer must match the archived receipt exactly.
The ATTEMPTED journal remains byte-for-byte unchanged. operationVerified stays
false: presence does not prove attribution of the historic POST. An unexposed
LPID remains identityVerified:false. Public registration contexts cannot request
or confirm these staff reviews. A review-intent ticket cannot become an add.

Read-only attention refresh can resolve this history alert only when the exact
receipt still matches original journal/event/date/identity/current TPID. New or
removed/replaced entries, changed journals and invalid receipts re-open review.
The receipt cannot enable retry if the entry later disappears; old uncertain
attempt barriers stay intact. Duplicate identities and conflicting league links
stay blocked. Review storage failure reports uncertainty but sends no provider
POST. Do not delete/reset journals or re-register Adam to clear his alert.

## Validation and delivery

464 automated cases across36 files after inventory update. Focused runtime and
UI tests cover no provider POST, exact original record preservation, role/session/
expiry/stale IDs/changed journal, receipt integrity, uncertain storage, missing or
replaced entry barriers, and explicit review-only UI. Owner native acceptance
remains PENDING. Review retains the pre-start TEST transfer guard (status10/20). No new public endpoint, manifest/scope/access/deployment change.

Guarded local installer expects clean35e54bf, backs up, builds/tests/inventory and
commits the scoped change. Fresh Google preparation clones17 files and changes
ONLY HubTest.html, HubTestAttention.js and HubTestNakkaTransfer.js, preserving
14 other files. After owner push, full17-file readback and one native staff review
must be recorded. Historical write must not be relabelled VERIFIED.
