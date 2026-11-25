# Hub provisional player averages — PR001, 25 November 2026

**Installed in private Google TEST v5 on 25 November 2026. Native acceptance pending; not installed in LIVE.** Builds on the closed v46 source and includes the PD001 pool method changes. No production workbook, player record, Nakka data or trigger was changed while developing this candidate.

## Operator workflow (proposed, pending native TEST)

In Tonight's Players, choose **PLAYER AVERAGES**, beside Register Player. Select the player, enter a three-dart estimate greater than zero and at most 180, then Save estimate. Players registering through any route are available after Nakka registration has established their league player ID. This first candidate uses a separate editor after registration; it does not add an estimate field to the registration submission.

The editor displays Estimated, Unrated or Nakka. Mark unrated clears the estimate while retaining the first-event gate. Estimates remain staff-only; public kiosk/mobile forms and registration endpoints are unchanged. An established verified player cannot be assigned a replacement estimate. A late estimate requires matching current open-event and aggregate totals; native provider consistency must be verified before release.

Changes require the current event/session and the exact rating revision. On a failed or uncertain save, Reload before retrying. Signing out closes the editor. Old-session/event replies cannot alter the current editor. Reopen Pool Planner after saving: existing draws retain their frozen averages and provenance, and sending checks for changed effective statistics.

## Storage and scope

A dedicated **PLAYER RATINGS** sheet in the selected league workbook stores append-only JSON versions. Its header is a schema marker. Keys are league ID + permanent Nakka league player ID, with workbook ID checked in every record. No name-only attachment. History retains the original estimate, editor, dates and final-event proof. A missing sheet is created only on an authenticated save, under a script lock; malformed existing sheets are rejected.

`BeautyRatingCore.effective` is the common resolver for saved provisional records. A provisional estimate overrides changing live Nakka averages. A provisional record explicitly marked unrated stays null, even if live statistics exist. Players without a provisional record retain the established Nakka behavior; this candidate does NOT automatically enroll every new player in the first-event gate. An organiser must save an estimate or Mark unrated to enroll that player.

The resolver supplies pool identity mappings, draw averages and provenance, and the dashboard response's effectiveAverage/averageSource fields. Pool review, cards and export label estimates. The new editor shows values for all verified league identities. Ranking points remain provider points; an estimate never invents ranking points. Public cast and scoring screens are unchanged.

## Automatic retirement

The existing owner clock invokes a bounded rating check after idle/import work, outside the registration lock. It checks one provisional player per due pass, rotating through them, at most once every two minutes. Therefore retirement is eventual, not an instant or fixed-duration promise; busy registration/recovery work takes priority.

An event must have status 40, the correct league and exact player entry, positive recorded darts, valid score totals, and no manual-statistics marker. Event identity/revision is reread around the statistics request. Two identical final snapshots at least 60 seconds apart are required. Running events, no-play registrations, outages, invalid data and reopened events cannot retire the estimate. Previous recorded events remain eligible after the selected event changes within the same workbook/league. Other workbook/league histories remain isolated.

After verification, state becomes VERIFIED; the estimate remains in history but is no longer used. The current official league average is used thereafter, with the verified first-event average as fallback. Frozen draws are never recalculated automatically.

Provider reference checked: https://api.n01darts.com/api/v1/n01_api_manual_en.html (tournament/get, tournament/stats, league/stats). The official manual documents the endpoints but does not fully specify individual score-total fields. The adapter strictly expects the existing Beauty score/darts/a/acnt schema; unknown shapes fail closed and retain estimates. Native TEST must confirm event-specific statistics and identity fields before release.

## AIK Internal limitation

Internal CP006 has its own manual rating store and local tournament model. The Monday Hub adapter rejects standalone tournament context, rather than silently reading Monday identities or applying aggregate team averages to individuals. Internal automatic retirement is NOT integrated in PR001. It needs the verified Internal workbook/event adapter and per-person provider mapping, especially for doubles. Its existing manual estimates and PD001 pair-preserving pool development remain separate. Do not describe this as installed or universal across all interfaces yet.

## Reproduce and test

From a fresh repository checkout:

```sh
python3 development/player-ratings/prepare.py
node development/player-ratings/tests/ratings.cjs
node development/player-ratings/tests/pool-regression.cjs
```

PASS: 30 checks for first-dart protection, null/unrated, completed-event evidence, repeated stable samples, changed/reopened events, workbook writes/history, stale revisions, authentication, context changes, malicious input, existing ratings, worker retirement/retry/idempotency, provenance, and embedded-script syntax.

PASS: existing 108 Hub draw scenarios plus Internal singles/doubles core checks against the combined candidate; browser/server pool algorithm parity and default Fair equivalence.

Browser test `tests/ui.cjs` is written but **NOT RUN successfully**. The local Chromium launcher targets a missing executable; the Playwright browser download returned HTTP 403. Supply a working browser through CHROMIUM_PATH or install Playwright's matching browser, then run it. Mocked Google replies are used; passing this would still not be native Google acceptance.

## Installation / remaining acceptance

This is an overlay, not a full deployment bundle. Prepare the complete private v46 artifact, overlay the generated application files (including the new BeautyPlayerRatings.gs), verify the installed TEST baseline, then test with synthetic players only. Keep TEST's fixed workbook/event restrictions: only the fixed event's tournament/stats GET was added to its read allowlist.

Required before release: native Sheets persistence/auth; actual provider score/identity schema; completed/nonparticipant/withdrawal scenarios; switch/retry behavior; UI checks; registration timing regression; Internal integration if universal availability is required. Retire no production estimate on an unverified adapter. Do not move to LIVE until the exact candidate is accepted.

## English interface update

Owner requested English throughout Hub on 25 November. Player averages and pool-method controls now use English only. The Instructions sidebar label, initial chapter view, search controls and sign-out reset default to English; The language selector is removed; language selection is deferred. No LIVE installation was performed.

English-only follow-up: removed Swedish manual chapters and the manual language selector, translated remaining knockout/board labels and backend planner messages. Player/event names, Swedish alphabetical sorting and stored provider/consent identifiers retain their original data.
