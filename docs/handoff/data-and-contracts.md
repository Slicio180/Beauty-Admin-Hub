# Data model and integration contracts

VERIFIED from adapter and route source; complete production schema UNKNOWN / UNVERIFIED. The recovered files are implementation evidence, not proof of current live schema.

| Data | Observed contract | Important constraint |
|---|---|---|
| Control A2 | Integer Sheets date serial; DateEncoding handles calendar encoding | Never write JS Date objects; validate supported date |
| Control B2 | Numeric wall-clock token | Version uses exact serial/token; not a unique global ID |
| TONIGHT'S PLAYERS A:F | player, newPlayer, status, consent, message, whereFrom | TEST reads A1:F100; at most 99 data rows |
| PLAYER'S MASTER LIST A | Player names | TEST reads A1:A1000; permanent identity migration unimplemented/unverified |
| PLAYER STATUS DATA A:C | Player, alternate/old name, status | Status adapter searches A1:F1000, then updates C of first matching row |
| Form responses 2 | Registration backend | Full column schema and trigger interactions require qualification |

TEST RPC `beautyTestHubData()` takes no config; returns success/mode/test data or sanitized failure. `beautyTestStatus({player,status})` only accepts exactly player,status with a nonblank normalized name and IN/OUT/STANDBY. False gate returns WRITES_DISABLED before client access. Identity mismatch returns BLOCKED. Unknown player returns PLAYER_NOT_FOUND after approved reads. Save or readback uncertainty returns SAVE_UNCERTAIN; never retry automatically. Readback currently checks status and partial identity; uniqueness/concurrency and full identity checks are coverage gaps.

`beautyTestEvent(input)` delegates to Adapter.gs. Actions, version validation, diagnostics and snapshot rules must be read there before extending callers. Version token is JSON `["test-event:v1",dateSerial,resetToken]`; stale diagnostics include BASELINE_DATE_MISMATCH, BASELINE_TOKEN_MISMATCH and PREWRITE_SNAPSHOT_MISMATCH. Current source has a pinned project check and false event gate.

Legacy remote GET routes include hubdata (read), hubstatus and hubregister (writes), and nakkahealth (read). Never probe the write routes without approval. Nakka health returns `{status,message,timestamp}` with OK/DEGRADED/UNAVAILABLE; uses server-side N01_API_USER/N01_API_PASSWORD Script Properties, one league GET, 60-second cache, lock and no retry. UI uses a 15-second timeout, five-minute visible polling and one-minute manual refresh throttle. Mock tests cover these contracts; real integration state is unverified here.

Nakka tournament selection, ranking mapping, credentials provisioning, quotas, all production error shapes and backup/trigger contracts need an independently reviewed integration specification.
