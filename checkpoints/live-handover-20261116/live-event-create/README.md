# Approved event creation added to LIVE — prepared for publication

Latest confirmed LIVE: version 39, published and verified by the owner's log from Beauty-LIVE-Complete-Recovery-2026-11-16T13-21-56-982Z-T3je3z. That release already includes the compact sidebar, approved Nakka layout, direct Recovery, automatic player recovery and simple issue/removal screens.

The owner asked to add what was already finished. This update ports the approved find/create league event workflow into the current LIVE system. It does not claim unfinished bulk removal or performance changes are complete.

## Visible workflow

Open League / Tournament (or Nakka → FIND OR CREATE EVENT), choose an existing league and date, then select MAKE NEW EVENT FOR THIS LEAGUE when no event exists.

The copied approved form offers Round Robin only, Slutspel only, or both; independently enabled Slutspel 1 and 2; legs to win; optional dart limit; final/third-place rules; knockout slots; and the Monday preset. REVIEW CREATE EVENT shows the chosen settings. The existing explicit checkbox and CREATE EVENT button create the reviewed event and select it in the Hub. The review explains that current registrations are kept in event history and are not copied into the new event. Drafting/reviewing does not switch the current event or change its date.

Saved creation issues offer Resolve issue and collapsed Advanced. A lost creation reply is inspected through the original receipt; another create is never sent. If the current roster changed after creation, the new event is retained and an explicit CONTINUE TO EVENT action opens it through the existing LIVE selector.

## LIVE adaptation

Three existing files change: LiveHub (private service route), LiveEventContext (pending-creation indication for date lookup), and LiveHubView (copied form and selector wiring). LiveEventCreate is added. All other 26 existing files remain unchanged, including the v39 player recovery engine, registration queue, removal correction, planner, kiosk/mobile code and manifest.

This uses the existing single-workbook LIVE archive/switch system. It does not create TEST workbooks or copy TEST settings/credentials. Creation is bound to the authenticated organiser, selected context, saved administrable league, reviewed date/settings and the current event snapshot. The final create requires a fresh source and league lookup under the existing script lock. Existing pending-registration, recovery and linked-form guards are preserved.

A durable receipt is written and verified before one Nakka create request. Event identity, configuration and empty entry/play data are read back before selection. Interrupted switching uses only the matching existing switch journal. A creation result already selected in the Hub can be acknowledged later without requiring the event to stay empty after people register. Unknown/ambiguous outcomes are retained for review.

## Owner publication command

Save Beauty-LIVE-Event-Creation-20261116.cjs to Downloads, then run:

    node "$HOME/Downloads/Beauty-LIVE-Event-Creation-20261116.cjs" --approve-live

The installer verifies the exact v39 source and published version, saves a backup, installs the reviewed changes, publishes and reads back the pinned LIVE deployment. Unknown changes stop before upload. Default / --inspect remains read-only. The installer does not execute a Beauty function or change a Sheet, Nakka, Git or credential file. Creating an actual event happens only when the organiser uses the reviewed create controls after publication.

No publication result has yet been received for this package. Version 39 remains the latest confirmed LIVE version. No actual event was created during development. Native visual/operational acceptance after publication remains pending.

## Focused verification

Eight engine checks passed: read-only draft/review, one reviewed create plus existing switch, lost-reply resolution without duplicate creation, settings/identity mismatch, stale session/source/context and pending-operation guards, changed-roster preservation, matching interrupted-switch recovery, and the real existing LIVE archive projection. Four interface fixtures passed for the copied form, explicit confirmation and double-click guard, simple issue resolution, sign-out, and retention of v39 UI/recovery. Five release safeguards passed for the exact v39 baseline, preservation of unrelated files, frozen publication, lost-reply readback and blocked execution routes.

Bulk player deletion and deletion speed improvements are still pending. Standalone tournament creation was not implemented in the approved TEST flow and remains the existing Nakka-create/connect route. GitHub was not updated by this checkpoint.
