# LIVE v46 — speed release closed

24 November 2026, checkpoint 97. The final normal authenticated LIVE Hub check passed. This closes the speed release; the earlier R1–R10 combined release remains closed.

## Exact application promoted

The private TEST v4 application's 37 files were promoted byte for byte to LIVE v46 at the existing deployment URL. The application identity is `b344bc4af5530e8f6c890a468e6db9e0059843dc03cae661668059e5362409ad` (SHA256 of sorted UTF-8 `file<TAB>sha256<LF>` entries, excluding the environment manifest). All 38 installed files and all 38 immutable v46 files were independently read back and matched. The LIVE manifest, permissions, scopes and URL remain unchanged. The temporary measurement helper is excluded.

The exact approved public source/test checkpoint is commit [22ef7f5](https://github.com/Slicio180/Beauty-Admin-Hub/commit/22ef7f54fa9a16611c0be62a00ae571778eefe53): 48 additions, all 977 previous files preserved, 1,025 files verified by paths and blob hashes. This later document records LIVE acceptance without changing that frozen source or its historical TEST evidence. Two unchanged historical application files with captured private context remain in the complete private artifact; public coverage records their hashes.

## Accepted behavior and evidence

- 431 distinct local checks across 23 suites passed.
- Forty native baseline/candidate comparisons were completed. Candidate server receipt medians were 4.346 seconds for existing players and 3.226 seconds for new players, versus 31.325 and 29.207 seconds in the baseline.
- Single TEST cloud-browser kiosk and mobile saved receipts took 6.624 and 7.037 seconds. A receipt means the request is durably saved; Nakka completion follows asynchronously.
- Full candidate completion medians were 32.664 and 26.117 seconds. Slow runs and roughly 91–95-second outliers remain in the evidence. No fixed completion-time or physical-tablet guarantee is made.
- Forty-five native harness requests were independently checked for exact fields, uniqueness and Nakka entry. One separate normal authenticated TEST Hub request also passed UI, Sheets and Nakka verification. Three jobs completed without client continuation through the existing background worker.
- LIVE registration health, kiosk and mobile rendering passed. The cast list contained the expected 19 names.
- Final normal LIVE staff sign-in passed. All 19 rendered player names, statuses, consents, messages, sources and new-player markers matched the saved workbook after display-language translation.
- LIVE Nakka API was connected: Hub 19, Nakka 20, 19 matched, zero Hub-only names, one pre-existing Nakka-only name, zero duplicates and no pending registration jobs. The completed event's historical difference was preserved.
- Five bounded LIVE workbook ranges were unchanged before/after deployment and after the observed worker error. All 198 template formula cells in D2:E100, including 38 across the populated rows, were preserved.
- No production registration was submitted for this acceptance and no historical player was imported or removed.

## Worker and installation observations

One existing owner background clock was paused and resumed; no additional trigger was created. Unattended completed runs were observed after resumption.

During staging, a navigation overlay caused source to be pasted into the wrong editor tab. Five syntax-failed clock starts occurred before deployment while worker configuration was paused and public v45 remained deployed. The source placement was corrected; full reload, installed readback and immutable v46 verification then passed. This incident did not change the approved application artifact.

One later worker execution ended with a generic Google server error after 176.71 seconds. Its cause is unestablished; it is not classified as HTTP 429. Subsequent automatic runs completed. Retain this observation rather than claiming every execution succeeded.

## Operating and rollback notes

Use the normal Beauty credentials and the existing LIVE URL. No new permission grant or installation step remains for this release. The existing completed-event Nakka-only difference is not a release blocker or an instruction to backfill history.

Rollback, if needed, must restore both the previous application source at HEAD and the deployment version because the background clock executes HEAD. AIK Internal CP006, multi-club work and separate statistics batching remain outside this release.

