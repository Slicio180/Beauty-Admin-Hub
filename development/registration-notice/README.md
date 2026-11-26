# Registration notice and connection-label correction — 2026-11-26

Status: installed in acceptance TEST HEAD; not deployed or accepted end-to-end. LIVE unchanged.

Verified removal clears only the registration banner for that player/date/context. A per-player removal revision prevents an older registration callback from resurrecting that banner. Fresh re-registration and unrelated players remain eligible. Existing session/context guards remain enforced. The system panel now says CONNECTED and Selected event spreadsheet instead of inaccurately saying LIVE in TEST.

Validation: 14 focused VM checks execute the actual notice functions. Installed LiveHubView baseline SHA256 57fec265161325cbf0f41e16d9305053889132702ce68a1eab8c1c9ed68bc8b6; candidate SHA256 1e19d6b6099486ced96a4724cc965a88ebab5f2f4f50efdf0b083f10a8c29808. Editor Saved to Drive observed, reloaded, exact clipboard readback verified. All 39 visible installed .gs/.html files then read through editor and matched the local candidate fingerprints. Manifest not included in that count.

Run: node development/registration-notice/tests.cjs /path/to/candidate/LiveHubView.html

Native session: owner signed into ordinary acceptance TEST Hub; fixed 25 November private event, empty roster, no attention and no Nakka differences. It is now 26 November: a fresh fixture is required for current-date registration; no old timestamps or date guard were altered. Usage panel showed 1704 attempted requests against project TEST budget 2000, not Google's remaining quota.

Next: provision current-date isolated fixture; verify manifest/bindings; deploy immutable TEST version; ordinary native registration/removal and delayed-reply checks; bounded clients-closed worker acceptance; retain prior evidence. No production readiness claim.
