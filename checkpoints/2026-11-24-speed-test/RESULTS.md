# Beauty registration speed TEST acceptance

24 November 2026 — checkpoint 95. The frozen private TEST v4 speed update has passed the scoped kiosk, mobile, background and normal authenticated Hub workflows. LIVE v45 is unchanged. The new update is ready for the owner's exact publication and promotion decision.

## Final normal Hub check

Normal Beauty staff sign-in succeeded. One synthetic new-player submission saved one response, master identity, status row and Tonight's Players row. The Hub showed IN, NO consent, the correct message and HUB as the source. Independent reads of five bounded TEST workbook ranges confirmed that every prior row was preserved and Control was unchanged. Nakka reported 54 Hub players, 54 Nakka players, 54 matching names, zero differences, zero duplicate names, no pending registration jobs and no player alerts.

This is the 46th checked speed request: the previous independent native harness passed 45 requests; the final Hub request passed a separate UI, Sheets and Nakka comparison check. It was submitted once. Exact Hub receipt latency was not captured: a selector wait expired, then a later observation saw the saved receipt. The 40.886-second observation bound includes tool/model gaps and must not be represented as a measured receipt time.

## Measured waiting time

| Check | Previous v45 | Speed candidate |
| --- | ---: | ---: |
| Existing-name server receipt, median of 10 | 31.325 s | 4.346 s |
| New-name server receipt, median of 10 | 29.207 s | 3.226 s |
| Existing-name full completion, median of 10 | 31.034 s | 32.664 s |
| New-name full completion, median of 10 | 29.688 s | 26.117 s |

The actual TEST kiosk saved receipt appeared 6.624 seconds after the submit click; mobile took 7.037 seconds. Each is one cloud-browser observation including automation overhead. The receipt confirms that the request is safely saved; Nakka confirmation follows. These are not production or physical-tablet guarantees. Server candidate completion included 91–95-second clock/recovery cases. The kiosk and mobile requests were behind three background-only requests and completed later, at 97.992 and 76.800 seconds from durable job creation. Outliers remain in the evidence. One baseline Sheets HTTP429 was captured and recovered; other failures are not assigned that cause without evidence.

## Exact accepted scope

All 37 application files plus the private TEST manifest match immutable TEST v4 byte for byte. Application identity: `b344bc4af5530e8f6c890a468e6db9e0059843dc03cae661668059e5362409ad`, calculated from sorted UTF-8 `file<TAB>sha256<LF>` lines, excluding the environment manifest. The six changed application files are BeautyBackground.gs, LiveRegistrationQueue.gs, LiveRegister.gs, Kiosk.html, RemoteRegistration.html and LiveHubView.html. No application bytes changed during final Hub acceptance.

The queue saves and verifies the request before returning a truthful acknowledgement. A short-lived receipt may continue only its own saved queued job. Bounded busy retries and the existing owner clock preserve recovery when the browser closes. Independent Sheets reads are batched while fresh post-write verification, identity guards, leases and write-ahead records remain in place. The owner clock drains at most three jobs and stops starting another after two minutes. No new Google scope, permission or trigger is required.

431 distinct local checks across 23 suites pass; the public subset contains 88 checks. The earlier 45-request native integrity harness verified exact fields and unique queue/response/master/status/display/Nakka records. Three requests completed without any client continuation, using the existing owner clock. The original eight TEST event entries and pool/bracket settings were preserved. Five projection comparisons preserved exact values, formulas, formats and Dates; they show fewer API requests but no established elapsed-time gain. The slower removal experiment is excluded and LiveRemove.gs remains identical to v45. The temporary measurement helper is absent from frozen TEST and the proposed publication.

## Publication and release boundary

This checkpoint contains source, local tests and aggregate acceptance evidence. It includes the previously disclosed owner identifier, Firebase client configuration and Google project IDs. Passwords, access tokens, real player/consent/message records, raw native logs and temporary measurement tooling are excluded. Two unchanged historical recovery source files remain private. Publication does not itself deploy the speed update. A later release record must identify the actual LIVE version and verification; do not infer deployment from this TEST checkpoint.
