# Beauty Hub account connection — AUD-079 — 2026-10-26

## Scope
Dedicated Firebase project beauty-admin-hub-test, owned by the existing Google owner. The Hub account is separate. The user created an Email/Password account and supplied its UID; only that exact UID is approved server-side. JDC Academy and production Monday systems are unchanged.

This is a TEST integration, not a production security release. Google web-app settings remain MYSELF / USER_ACCESSING. Staff still need the current Google TEST access boundary as well as the Beauty account. Do not widen deployment permissions.

## Resulting behavior
The existing Hub URL opens an account screen before the dashboard. Sign in, show/hide password, forgot password, reset-link request, back to sign in, Open Hub and Sign out work through the connected service. Passwords are submitted directly over HTTPS to Firebase; the Apps Script server receives only the Firebase ID token. Firebase's accounts:lookup backend validates that token, and the server checks project/issuer/times/UID, disabled/revoked token state at login and its own approved UID list.

Only approved accounts receive an opaque Hub session. Every Hub read/write RPC requires that session. The old direct private-data getter is guarded and its implementation is private; casting uses only the existing names/time/rank/points projection. Privileged maintenance helpers become private RPCs. Public Remote registration cannot impersonate HUB provenance; Remote registration itself stays available.

Status, registration and event-write handlers recheck the session after obtaining the script lock; event saving rechecks after backup before resetting data. A request already performing a write before sign-out may finish; the client discards responses from the previous session and never retries mutations automatically.

Sessions are memory-only in the browser: no localStorage, sessionStorage, cookies, password or refresh-token persistence. Reload requires sign-in again. Maximum session duration is one hour (bounded by Firebase ID-token expiry), with a 15-minute inactivity limit. Polling cannot renew inactivity; visible user activity sends throttled server touches. Server cache eviction can end a session early and fails closed. Browser history restoration locks and clears the page.

Logout locks/clears the dashboard immediately and revokes all existing Hub sessions for that UID using a server epoch. Other same-origin tabs are notified without tokens; server checks reject their next request even without BroadcastChannel. Failed server logout leaves the page locked with explicit retry. Closing the tab drops its client credential; unused server sessions expire. An account already disabled in Firebase after login can retain a Hub session until its one-hour bound; to revoke immediately, remove its UID from BEAUTY_HUB_ADMIN_UIDS or sign it out. This remains a limitation for production account administration.

The default approved UID is in HubTestAuth.gs only. To override/revoke, set the script property BEAUTY_HUB_ADMIN_UIDS to a comma-separated UID list. An explicitly empty property denies all logins. No signup UI or automatic privilege assignment exists.

## Local installation
Requires Mac checkpoint c5d10b7 on recovery/2026-10-24 and clean tracked files.

    node "$HOME/Downloads/Beauty-Hub-Login-TEST-20261026/apply-hub-login.cjs"

The installer checks before/after hashes, backs up changed files and existing audit register, runs both builds/full tests/inventory, records environment/time/outcome, and appends AUD-079. It commits only on PASS. It does not upload to Google, provision accounts, change Firebase, deploy production or push git.

## Google TEST upload — after Mac PASS
Close the Hub and other TEST registration tabs while replacing this coordinated set. Use only Beauty — Remote Identity TEST, script ID 1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N. Production remains untouched.

1. Add HubTestAuth.gs, copying the complete matching local file.
2. Replace appsscript.json with the local manifest. It adds only script.external_request to the existing spreadsheets scope for Firebase's HTTPS verification. Keep MYSELF / USER_ACCESSING. If the manifest is hidden, enable its display in Project Settings.
3. Replace Code (local Code.js), HubTestBridge.gs, HubTestStatus.gs and HubTestEventSave.gs.
4. Replace the existing BeautyLiveServer.gs with local BeautyLiveTest.gs. Keep its existing Google name; do not create a duplicate HTML/server basename.
5. Replace HubTest.html last. Empty the editor completely first, then paste the whole local file and save. Use the same exact generated file; do not append fragments.
6. Run the existing private beautyHubTestGuard_ once from the editor if Google requires owner reauthorization for the new HTTPS scope. Approve only this isolated TEST project's requested access.
7. Reopen the existing /dev?page=hub URL. No production deployment or permission change is needed.

## Browser acceptance still required
Before sign-in, no player/consent/message data should appear and direct unsigned Hub read/status/event requests must fail. Sign in with the dedicated Hub email/password; Open Hub must show the selected event. Test one ordinary reversible status change and readback, then restore it. Check message popup, Pool Planner/new tab/download, and Beauty Live. Sign out: player data disappears and requests using that old Hub token fail. Reload/back must require login. A second unapproved Firebase account must not gain Hub access. Confirm real password recovery delivery via the on-page control; never put passwords, tokens or codes in chat or audit screenshots. Test expiry using bounded fake-time checks locally and an actual idle session before production. Real browser/Firebase acceptance is pending until these are observed.

## Validation and evidence
294 automated cases across 20 files PASS, including 26 new account/session cases. Tests use fake Firebase/RPC/DOM/time; this does not claim real network verification. Existing feature fixtures explicitly inject authorized test sessions. Historical source-byte assertions now exclude only the exact TEST Code/status/manifest files intentionally changed here; original baseline hashes remain retained. Remote/kiosk source and production source files outside this TEST set are unchanged. Login-page rendering and real password reset/sign-out require browser review.

Evidence: evidence/hub-auth-20261026. Local installer rehearsal output is included in the package. The earlier Google copy/paste incident is recorded separately by hashes: duplicated HTML and a JavaScript tail after the document were diagnosed; the user confirmed a clean replacement fixed it. No application-code patch was required for that incident.

## Rollback
Restore non-new manifest paths from the dated backup and remove only new manifest paths, retaining evidence. Rebuild. Google rollback must restore the previous coordinated Code/bridge/status/event/Live/manifest/HTML set and remove HubTestAuth.gs; restoring only the HTML will not remove the server gates. Native restoration is not qualified. Keep the current Google owner-only access boundary throughout.
