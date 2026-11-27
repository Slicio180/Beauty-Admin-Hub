> Current deployed UI baseline: [LIVE v53](LIVE-V53-RELEASE.md), accepted by the owner on 27 November 2026. The v47 functional acceptance record below is retained for history.

# Beauty Hub LIVE v47 — 27 November 2026

Version 47 is deployed at the existing LIVE URL. Final signed-in Hub acceptance passed on 27 November at approximately 18:17 Stockholm. Runtime release acceptance is complete. Publication of these release notes was approved by the owner.

The 39 application files match the frozen TEST candidate byte for byte. All 40 installed files were read back after a reload: the 39 application files plus the unchanged LIVE manifest. The application identity, using sorted file<TAB>SHA256<LF> entries excluding appsscript.json, is `0e3ea0906d9fbc82fa2524c02718f0d4f3fb19857db565aa358567b1273303aa`.

## Included changes

- Accepted provisional-average lifecycle: estimates remain until a completed first event has real darts and two separated automatic confirmations. Hub and Pool Planner then use the verified Nakka average; unplayed players retain their estimates.
- Registration lost-reply handling, preserved saved receipts and the accepted four-player background completion work.
- Request accounting and clearer quota status, plus recovery polling backoff/coalescing and hidden/signed-out guards.
- Existing accepted planner, display and English Hub changes in the frozen TEST artifact.

## Verification

Native average acceptance and 19 final preservation checks passed in isolated TEST. Twelve focused recovery polling scenarios passed; 34 server files and 60 inline scripts parsed. These checks do not constitute a 64-player capacity guarantee.

On LIVE, Google confirmed deployment version 47 at 18:00 Stockholm. The existing worker was paused during installation and resumed on the same trigger. Its automatic run at 18:06 finished normally (idle; ratings not due) for Monday 30 November.

Registration health returned success with the correct Monday event context. Kiosk and existing mobile registration forms loaded; the cast display showed Monday with zero players registered and a current refresh time. Its initial statistics snapshot was marked not updated, last timestamp 25 November 23:39:21; the subsequent signed-in planner check refreshed league statistics successfully, as recorded below. No synthetic production registration, match, player removal or event change was submitted.

Signed-in acceptance: dashboard shows the correct Monday event, zero players and no Nakka list differences; Sheets is connected; request tracking is active; player averages load from Nakka; Pool Planner loads and reports league averages current at 18:16:18; Recovery reports no IN players; the English instructions provide 16 chapters and search. The initial planner load was slow (it remained loading through a 15-second observation wait and later completed); no precise end-to-end timing was recorded. No draw or player data was changed by these read checks. Mobile Player Hub prototype and AIK Internal are outside this deployment.

## Operator handbook addendum

Use the same Hub address and normal Beauty credentials. A saved registration receipt means Beauty has retained the request; Nakka readiness follows in the background. Do not register again after an uncertain reply: check saved status. A provisional average remains an estimate until the completed-event verification succeeds. No darts means the estimate remains.

The request counter measures this project's attempted requests over its documented rolling window; it is not Google's account-wide remaining quota. LIVE is metered without the private TEST 2,000-request cap. After provider failure, recovery reads wait progressively longer; explicit saved-status checks remain available. Closing the Hub does not disable the owner background clock.

## Rollback

The complete pre-change LIVE HEAD source and version 46 deployment receipt are preserved privately. Rollback must restore both HEAD and the version 46 deployment, because background triggers execute HEAD. Pause the existing clock while restoring, verify source and unchanged LIVE permissions, then resume that same trigger. Never install the TEST manifest or temporary acceptance helpers on LIVE.

The complete source/evidence bundle remains private. This public document contains no credentials, player records or private configuration.
