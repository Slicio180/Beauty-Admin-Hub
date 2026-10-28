# Identity TEST sign-in verification — AUD-080 — 2026-10-26

Mac baseline: 105e42e / AUD-079. The owner sees the sign-in page with no player data. Actual sign-in returns the server AUTH_INVALID message after Firebase password authentication. Running beautyHubAuth for Google owner authorization did not clear the error. Real login/logout has not passed; the earlier 294 local cases remain local qualification only.

## Changes
Normalize the JWT payload's unpadded Base64url to a multiple of four before calling Google's Utilities decoder. The original full token is unchanged and must still be accepted by Firebase's accounts:lookup endpoint. Project, issuer, times, UID approval, expiry, logout and write gates remain enforced. A strict native-style decoder fixture fails before normalization and passes afterward. This is a compatibility correction; the actual Google failure cause is not confirmed until a native retest/probe.

Return bounded AUTH_TOKEN_FORMAT/DECODE/PROJECT/TIME and AUTH_VERIFY_PERMISSION/CONNECTION/HTTP_NNN stages. The frontend displays only these explicitly allowed codes, never provider text, exception text, tokens, passwords, account details or keys.

Add beautyHubAuthProbe to the same TEST Auth file. Run manually from the TEST Apps Script editor. It logs only a timestamp, two Base64 test booleans and an HTTP/error category from sending a fixed intentionally invalid token to Firebase. HTTP 400 / INVALID_ID_TOKEN is expected for that fake token and means it reached the verifier; it is not a real login failure. No real credential, session or account is read. The exact TEST project guard applies before this diagnostic.

## Install locally
Unzip into Downloads and run from the Beauty repository root:

    node "$HOME/Downloads/Beauty-Hub-Login-Verify-20261026/apply-login-verify.cjs"

Requires 105e42e on recovery/2026-10-24. Exact before/after hashes, dated backups and audit evidence are recorded. Both builds, 298 tests and inventory must pass before the AUD-080 commit. Prior audit entries are appended to, not overwritten. No Google upload, deployment, Firebase mutation, password reset or git push is performed.

## Google TEST update
Only replace these two complete files in Beauty — Remote Identity TEST:

1. HubTestAuth.gs from apps-script/registration-identity-test/remote-app/HubTestAuth.gs.
2. HubTest.html from the same directory. Empty the editor fully before pasting; save.

Refresh the existing TEST Hub and sign in again with the same account. Do not change the password. If it still fails, report only the visible AUTH_ code. Also run beautyHubAuthProbe from the editor and share its JSON log; it contains no real login data. Do not send a password or ID token.

## Evidence and limits
298 local automated cases across 20 files PASS, inventory PASS. Four new cases cover strict padded decoding, permission/connection/HTTP categorization, the fixed-input native probe's output and the frontend diagnostic allowlist. The red-before/green-after compatibility check is retained. Native cause, successful real login/logout, recovery email delivery and complete shared-computer qualification remain pending. Production and JDC unchanged. No security gate is relaxed.

Rollback restores the prior Auth and HTML as a pair in Google and the manifest paths from the local dated backup. Retain all failed/native evidence. No independent Google restoration rehearsal has been performed.
