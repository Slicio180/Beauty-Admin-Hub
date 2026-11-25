# QG008 — operator handbook update

Installed in private TEST v12 on 25 November 2026 at 15:42 Stockholm. See QG008-RECEIPT.md. Earlier checkpoint notes follow.

# QG007 — cast refresh protection

Installed in private TEST v11 on 25 November 2026 at 15:28 Stockholm. See QG007-RECEIPT.md. Native visual acceptance pending. Earlier checkpoint notes follow.

# QG006 — specific recovery explanations

Installed in private TEST v10 on 25 November 2026 at 15:24 Stockholm. See QG006-RECEIPT.md. Recovery decisions are unchanged; native acceptance pending. Earlier checkpoint notes follow.

# QG005 — bounded comparison retry

Installed in private TEST v9 on 25 November 2026 at 15:09 Stockholm. See QG005-RECEIPT.md. Earlier checkpoint notes follow.

# QG004 — reduced automatic comparison requests

Installed in private TEST v8 on 25 November 2026 at 15:06 Stockholm. QG003 was installed in v7 at 14:57. LIVE unchanged. TEST workers remain paused. See REQUEST-AUDIT-QG004.md for current findings and installation evidence. Earlier checkpoint notes below describe their status at creation.

# QG003 — clear sign-in errors and offline preview, 25 November 2026

Status: QG002 is installed in private TEST v6. This QG003 follow-up is prepared and tested locally but NOT installed or deployed. LIVE was not changed; TEST workers remain paused.

QG003 maps confirmed daily URL Fetch exhaustion and an active cooldown to a clear sign-in pause message. The separate TEST budget has its own explanation. Other connection failures do not claim quota exhaustion or a wrong password. Existing token, permission, access and HTTP checks remain enforced. The standalone HTML preview uses the actual Hub CSS and card script with synthetic data, embedded fonts and network access disabled by CSP. It is not a signed-in Hub or a native acceptance test; actual browser visual verification is still pending.

## Simple System Status card

One card shows usage, status and a plain explanation when requests are paused. Details are collapsed. It reads only when the existing System Status button is clicked; no new timer, external fetch or settings panel is added. The authenticated server route reads properties without modifying them, and works without event/provider verification. Sign-out clears the card and stale-session replies are ignored. Missing measurement is shown as no recorded requests, not a claimed full Google allowance. A completed fetch after cooldown clears the previous quota-error flag; the card never claims a verified Google balance.

Card tests cover authentication, no external requests/property writes, no measurements, cooldown, recheck, TEST limit, demand-only loading, errors and stale replies. Browser visual/native acceptance remains pending.

## Request audit

The 39-file baseline has 14 direct URL Fetch call sites: 13 fetch sites and one fetchAll site. A call site can execute repeatedly; these are not daily consumption totals. They span dashboard/Sheets reads, public event verification, Firebase login, Nakka registration and removal, event switching, and maintenance checks. The batch wrapper counts each request in the batch.

All direct sites in this candidate route through BeautyQuota.gs. Counts are attempted requests per source file, including failures and batch reservations; they are conservative, not Google's billable counter. No historical totals can be reconstructed. Google remaining allowance and reset time are explicitly unknown. Other projects—including the original production name-list sync and old Remote Identity TEST—are outside this meter.

## Changes

- A project-local rolling counter retains the current partial hour plus the previous 24 hours. It persists no URLs, credentials, request bodies or responses.
- An exact daily UrlFetch exhaustion exception opens a shared 30-minute cooldown in this project. This is a retry delay, NOT Google's reset time. The next ordinary request after the delay may try once; no automatic replay or scheduled probe is created. Concurrent requests already dispatched cannot be cancelled.
- TEST has a conservative 2,000-attempt rolling budget. This is a new application safeguard, NOT an allocation granted by Google. LIVE has no new application cap; it would be counted and cooled down only after an approved promotion.
- Explicit TEST worker installation/resume grants two hours. Missing or expired TEST leases fail closed at worker entry and authority checks. LIVE is exempt. Expiry leaves the trigger installed but returns without event work; minimal trigger runtime remains. Existing paused configuration is not enabled by installation of source.
- Automatic dashboard refresh backs off 30, 60, 120, 240, then 300 seconds after failures. Successful reads reset it. Manual/action-triggered refresh remains immediate, subject to the server cooldown/budget. Existing in-flight, context and session guards remain; failed reads do not replace the displayed roster.
- The authenticated health-display endpoint shares successful results for at most 60 seconds per event context. It retains the original verification timestamp and labels cache hits. Cache failure falls back to fresh reads. Registration/removal verification and explicit event verification stay fresh.

## Validation

- 14 synchronous guard/integration checks passed, plus an asynchronous dashboard scenario covering backoff, cap, manual refresh, success reset, retained data, deduplication and stale-session suppression.
- All candidate server files and inline browser scripts parse.
- 30 existing player-rating checks passed against the assembled candidate.
- 108 pool draw scenarios passed, including previous Fair behaviour and browser/server parity. Existing Internal singles/doubles checks in that suite passed.
- The builder rejects any file whose baseline SHA-256 differs, and refuses to overwrite an existing output directory. The output includes a full file hash manifest.

These are local mocked checks, not native Google/provider acceptance or a load test. The last real quota probe at 13:44:04 Stockholm still returned daily UrlFetch exhaustion.

## Reproduce

Keep the complete baseline/candidate private. The public repository should contain only this overlay, tests, audit and hashes.

```sh
python development/quota-guard/prepare.py PRIVATE_BASELINE NEW_PRIVATE_CANDIDATE
node development/quota-guard/tests/run.cjs NEW_PRIVATE_CANDIDATE
node development/quota-guard/tests/regression.cjs NEW_PRIVATE_CANDIDATE
```

## Before native acceptance or promotion

1. Confirm quota availability with one read-only TEST request. Do not restart old TEST fixtures.
2. Install the exact candidate in Release TEST only, preserving PAUSED configuration. Verify all uploaded hashes. No source upload or deployment occurred in this checkpoint.
3. Verify metering persistence/lock behaviour, cache isolation/timestamps, bounded background expiry, and registration/removal no-replay behaviour in native TEST. Count reservations can overestimate if execution dies before dispatch.
4. Observe a bounded synthetic event workload. Tune the TEST budget/TTL only from evidence. Native usage of PropertiesService and trigger runtime must also be measured; the meter itself adds property operations.
5. Broader caching of roster/statistics requires a separate invalidation audit. This checkpoint does not claim every read is cached or guarantee account-wide quota safety.
6. After explicit acceptance, prepare promotion separately. TEST v5 also includes ratings/pool/English changes not yet accepted on LIVE; this candidate is NOT a quota-only patch that can safely replace LIVE v46.
7. After Google requests recover, verify production's essential reads and recovery without making synthetic registrations in production. Protecting TEST does not prove LIVE has recovered.
