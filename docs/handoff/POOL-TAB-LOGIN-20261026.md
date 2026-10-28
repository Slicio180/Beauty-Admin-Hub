# Pool reference tab and login page — 2026-10-26

Baseline on Mac: 9f43d5c / AUD-076. Prepared AUD-077.

## Pool scheme
Click **Open your pool scheme ↗**. A separate tab shows the supplied 5–101-player reference with both preferences. Only its **Download original Excel file** button downloads the exact original workbook. The file is embedded; no public upload or external viewer is required. All 97 rows use the already verified original scheme fixture. Pool calculations and event selection are unchanged.

Google TEST update after this local installer: replace only HubTest.html in the existing Beauty — Remote Identity TEST project, save, then refresh the TEST Hub. Confirm the scheme opens in another tab, the Hub stays open, row 37 is correct and the explicit download works. Do not deploy production.

## Email/password login page
The user selected email/password and a new dedicated Beauty account project, separate from JDC Academy. The prepared local page is public/login.html, with sign in, show/hide password, forgot password, send reset link, back to sign in, Open Hub and sign out controls. Keyboard labels, busy states, error feedback and password clearing are implemented. It denies entry without an authorized account service. No password is stored or checked locally. No public account registration is offered.

This page is a UI implementation and service contract, not working authentication. It is deliberately not substituted for the current Google TEST Hub or advertised as securing it. No real reset email has been sent. The existing Google owner-only boundary remains the only current deployed boundary.

Next setup: Firebase console currently requires the user's Google sign-in. Create a separate Beauty project; enable Email/Password with no open self-registration in the Hub; provision approved admin identities. Then implement and test server token validation and authorization for every Hub data/write route, close direct bypasses, session revocation/logout, inactivity expiry, refresh/reload/back-button behavior and account recovery. Keep remote registration and casting separate. Test before changing the shared-computer entry route. Firebase is proposed for managed accounts; no Firebase resource or billing change has yet been made.

## Evidence and limits
268 local automated cases PASS; 18 files; full test inventory PASS. The four new login cases use a fake account service; they are not real security verification. Pool tab/browser download on Google TEST remains pending. Account provisioning, real login/reset/logout, server gates and session expiry remain pending. No production changes, API credentials, deployment, Google upload or git push are part of this installer.

## Install
Unzip into Downloads. From the Beauty-Admin-Hub repository root:

    node "$HOME/Downloads/Beauty-Pool-Tab-Login-20261026/apply-pool-tab-login.cjs"

The installer requires checkpoint 9f43d5c and branch recovery/2026-10-24, verifies exact source and package hashes, backs up files, rebuilds, runs the full suite/inventory, appends AUD-077 and commits only on PASS. Earlier audit entries and AUD-076 coverage are preserved. If checks fail, evidence is kept and no commit is made.

Login layout preview after installation: run npm run preview and open http://127.0.0.1:4173/login.html. The page clearly labels itself as disconnected. The current Google TEST does not gain login/logout from this package.

Rollback: restore paths with non-null before hashes from the dated backup, remove only newly introduced manifest paths, rebuild and retain all evidence. Google rollback separately restores the previous HubTest.html. No backup restore has been rehearsed against Google.
