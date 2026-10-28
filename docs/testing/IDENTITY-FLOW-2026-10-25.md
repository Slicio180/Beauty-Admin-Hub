# Conditional name-conflict registration

Approved by Alessio in the Beauty conversation on 25 October 2026.

## Behavior

A manually entered new-player name matching the master list opens the identity popup before saving. Selecting an existing player already registered tonight also opens it. Normal selection of an existing player who has not registered tonight continues without asking for an extra name.

DET ÄR JAG reuses the existing saved name. A second registration that night is rejected without updating that player's consent, message or status. JAG ÄR EN ANNAN PERSON reveals the extra field. A middle name, nickname or other identifying detail produces a label such as Demo Anna (Karla), keeping the complete base name intact. The user reviews the label and explicitly presses BEKRÄFTA. Cancel, ×, Escape and backdrop click dismiss without saving.

The original player remains unchanged. Future registrations select the distinct saved label. Matching ignores case, repeated whitespace and Unicode normalization differences. Blank/unsafe/overlong details, occupied labels, stale conflict choices and duplicate identical master rows are rejected. Identical master rows require organiser help.

This adds distinct display labels within the current name-keyed architecture. Permanent player IDs and safe migration of existing records remain a separate requirement. A label is not proof of a person's identity. No account authentication is introduced.

## Source map

Hub: public/js/name-resolution.js (shared pure rules), identity-dialog.js and css/identity-dialog.css; hub-services.js uses the rules in mock mode and app.js uses the shared dialog.

Remote/kiosk: apps-script/registration-identity-candidate/ contains candidate copies of both projects. Each embeds the exact shared rules and dialog, uses the pinned TEST spreadsheet, has an owner-only manifest, blocks web routes until an approved TEST script ID is provisioned and leaves its registration write gate false. Candidate Google Form sync and Nakka registration are disabled. Original apps-script/remote-app and automatic-nakka snapshots remain unchanged. No remote project or deployment was updated.

Do not deploy these candidates over the live apps or the existing Event Control TEST project. They require separate TEST provisioning, trigger review and integration qualification. A script lock serializes candidate registration within one project; it does not coordinate two Apps Script projects sharing a spreadsheet. Cross-project concurrency must be resolved before live rollout. The existing Google Form backup does not gain this popup in this update.

## Verification

175 PASS / 0 FAIL locally across 9 files. Tests exercise shared rules, popup reveal/review/confirm/cancel, keyboard focus, no retry after transport failure, the actual Hub submit handler and actual remote/kiosk HTML submit handlers with stubbed candidate Sheets. They check no mutation before confirmation and no modification of the original master identity. Browser and Mac retests are pending. No real Google/Nakka requests were made.

## Mac review

After installing, rerun npm test and npm run test:inventory with dated evidence. Start npm run preview. Reload the preview to reset fixtures. Register Demo Anna through MITT NAMN FINNS INTE I LISTAN and type Demo Anna. Verify the popup, reveal the detail field, enter Karla and review Demo Anna (Karla). Only BEKRÄFTA should add the fourth player. Verify the original Demo Anna is unchanged. Try DET ÄR JAG on an existing registration and confirm no duplicate is added. Try cancel and a repeated Karla label. Remote/kiosk behavior in a real Apps Script TEST deployment remains pending.
