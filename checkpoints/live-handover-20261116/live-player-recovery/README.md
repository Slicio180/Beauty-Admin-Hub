# LIVE layout and automatic player recovery — prepared for publication

The previous layout-only installer is superseded. Use Beauty-LIVE-Complete-Recovery-20261116.cjs. This package includes the missing player-centred recovery engine, adapted to the existing LIVE registration queue and recovery journals. Work is based on verified LIVE version 37; the already approved layout-only source is also recognized exactly. No new TEST project or deployment was used.

## What the operator sees

- Smaller sidebar controls and a direct RECOVERY entry.
- The approved Nakka card layout: event, API connection, Hub/Nakka counts, difference rows, COMPARE LISTS and collapsed Advanced. Its event button uses the existing LIVE event selector.
- Recovery lists players whose registration needs checking, players who need help, and recently resolved issues. Ordinary healthy registrations do not clutter the screen.
- Player rows show Checking, Needs help or Resolved when applicable. Needs Attention opens Recovery directly and includes recovery-only issues.
- Issue dialogs show Checking, then Issue solved or Issue not solved. Use Resolve issue when action is needed. Reports, identifiers and histories remain under Advanced.

## Automatic work included

While an authenticated Hub is open and visible, dashboard refreshes request current recovery status. Eligible work is processed one player at a time. The existing queue worker lease, script locks, selected-event guards and durable operation receipts remain authoritative.

The engine can recheck an interrupted queued registration using its original request; fill verified missing fields in an existing status row from the unique original response; rebuild the derived display through the existing queue service; transfer an eligible IN player with a unique existing league identity into the current open event; and verify existing saved operations. It does not append a replacement original response or repeat an uncertain add. Transient repair failures have a bounded retry budget; an active or uncertain operation is retained for review. Removal is verified through its existing saved operation, never repeated automatically. Saved OUT/consent changes can be shown as solved without claiming a new IN entry.

A missing league profile requires explicit review and confirmation before creation. If a creation reply is lost, the same add is not repeated; the current profile can be reviewed. If other Nakka entries arrived during a saved transfer, a bound review can acknowledge the verified current player entry while retaining the original receipt and not claiming historical attribution.

New queued registrations are rejected before acceptance when the event is closed or cannot be checked. Existing ambiguous identities, closed-event pending requests, incomplete old receipts, and unresolved partial removals remain Issue not solved. They are retained for organiser review. There is no automatic event reopening, player OUT change, permanent-player deletion or guessed identity merge.

Automatic checking needs an authenticated visible Hub. It is not a scheduled server trigger. Bulk deletion and the earlier removal timing work remain pending. Existing LIVE event-creation/switch restrictions are preserved; this package does not port TEST-specific event creation.

## Install on the owner's Mac

Save the installer to Downloads, then run once:

    node "$HOME/Downloads/Beauty-LIVE-Complete-Recovery-20261116.cjs" --approve-live

The command uses the existing clasp login in memory, verifies the fixed LIVE project and pinned deployment, backs up the current source, changes four files, adds LivePlayerRecovery, preserves the other 24 existing files and the manifest, publishes a frozen version and reads it back. It accepts only the two known reviewed starting sources or its own exact installed result. Unknown changes stop before upload. Default / --inspect is read-only. Lost upload/deployment replies are reconciled by readback without replaying writes.

The installer itself does not run a Beauty function or mutate a Sheet, Nakka, Git or credential file. After confirmed publication, reload LIVE; the authorized automatic recovery can then perform its guarded work while the Hub is visible. Keep the installation result. Until that result is received, the latest confirmed LIVE publication remains version 37.

## Focused verification

Fourteen local engine checks, five interface fixtures and six release safeguards passed. They cover read-only diagnosis, automatic transfer, original-request queue recovery, missing-field evidence, uncertain-write non-replay, identity/session/context guards, concurrent workers, bounded retries, explicit profile review, saved removal/status results, closed-registration rejection and preservation of the removal gate. Interface checks cover automatic scheduling, sign-out/visibility, simple results, event invalidation and dashboard wiring. Publication checks cover exact source sets, known layout compatibility, all-file preservation, pinned deployment readback and blocked function execution. No actual LIVE player or remote Beauty function was used for these checks. Native visual and operational acceptance after publication are still pending.

## Continuity

The owner has ended the separate TEST workflow: use current LIVE as the working baseline, and include all explicitly approved feature behavior when preparing a LIVE release. Never describe a layout copy as the complete automatic repair engine. The old layout-only package remains historical evidence and must not be run instead of this combined update. GitHub has not been updated by this work.
