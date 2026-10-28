# English Hub and event-date review — 2026-10-25

Starting checkpoint db42730. User decision: the entire Hub is English; remote and kiosk remain Swedish. This supersedes the earlier Swedish-first default for the Hub only. No production or Google operation by the assistant.

## Scope

Both public Hub pages and generated Apps Script TEST Hub use English navigation, forms, name-conflict dialogs, feedback, consent labels and system messages. Official AIK branding/player names and player-authored messages are preserved. JA/NEJ, the new-name sentinel and MOBIL stay canonical in storage/protocols; visible Hub labels are YES/NO and MOBILE. The Swedish identity modules, remote/kiosk HTML/server sources and qualified status server are unchanged. English Hub identity files are generated deterministically from shared originals using scripts/build-hub-english.cjs; build-hub-test.cjs runs that generator. Do not hand-edit generated language files. Source baseline hashes are in HUB-SWEDISH-SOURCE-BASELINE-20261025.json.

Event Control is now a simple date-review form. Event Details is a separate sidebar item with actual spreadsheet/date/reset metadata, reset counts, blockers and warnings. The offline preview has clearly fictional read-only Event Details; its disconnected boundary remains closed and CSP still denies remote connections.

## Required accidental-change checks

The proposed date must be a real, changed calendar date; the event must be loaded without blockers. The organiser must check the reset acknowledgement and type the exact YYYY-MM-DD date before REVIEW CHANGE enables. The final review names the old/new dates and reset effect. Editing the proposed date, BACK, reload or close/reopen clears confirmation. Both review and close are read-only: final SAVE — NOT ENABLED stays disabled, and no date-save client/server route exists.

This is not authentication. No password is collected or stored in the page. Actual password reauthentication belongs with the pending Hub login/session/access-role implementation. Before a later real date-save action, the server must independently enforce authenticated authorization, explicit confirmation, expected date/version, fresh reset snapshot and readback. The checkbox alone cannot authorize a server write.

## Observed prior inspection

Screenshots 19.35.15 and 19.35.27 show current date 25/10/2026; last reset 24/10/2026 20:23; Europe/Berlin; seven visible players; response row 161. The legacy reset would delete seven event-status rows, retain three correction rows and clear nine C:E cells, retaining F source values on two correction rows (warning). Save visibly disabled. These screenshots prove observed loading/display only; cancellation and a complete no-write comparison were not performed. Copies/hashes are in evidence/hub-english-date-review-20261025/inspection-screenshots/ and inspection-manifest.json.

## Upload after successful Mac installation

Use only Beauty — Remote Identity TEST, script ID 1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N.

1. Replace HubTestEventPreview.gs from apps-script/registration-identity-test/remote-app.
2. Replace HubTest.html with the regenerated file in that folder. Save both.

No changes to Code.gs, HubTestBridge.gs, HubTestStatus.gs, RemoteRegistration.html, manifest or kiosk project. Reload /dev?page=hub.

## Browser checks pending

Verify all Hub labels/forms/consent/source/identity/error controls are English; seven existing players and stored details unchanged. Event Control should contain only current/new date and reset safeguards; Event Details should contain the technical counts/warning. Choose 2026-10-26, tick the acknowledgement and type 2026-10-26: REVIEW CHANGE enables; final save remains disabled. BACK or editing must clear confirmation. Close/reopen must reload actual 2026-10-25 with checkbox unchecked and typed confirmation empty. Verify Control A2/B2 and response count remain unchanged. Do not directly edit Control or run simultaneous registrations during this check. Record exact observations with screenshots; no event-reset qualification is claimed.

## Validation and rollback

227 local tests pass, inventory 227 across 13 files. Evidence under evidence/hub-english-date-review-20261025/. These are fake-service/DOM checks, not independent browser verification. Installer makes backups, preserves prior audit entries and records only observed/prepared/local-test facts. Restore its before files and remove new paths marked before:null for local rollback, keeping evidence. Google rollback separately restores the two replaced files. Event reset, retained F-column policy, cross-project concurrency, authenticated shared-computer login and full Hub release remain pending.
