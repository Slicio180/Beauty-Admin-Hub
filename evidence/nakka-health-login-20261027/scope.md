# AUD-089 — Nakka health after login

Owner observed a red generic health result from before login while the authenticated event lookup successfully matched test tournament t_RqC2_2034 for 2026-10-28. The health check later refreshed automatically and returned OK (27 October 18:26:17). This was stale independent health UI, not evidence that a missing event makes Nakka disconnected.

Fix: skip authenticated TEST health requests until a Hub session exists. Emit beauty-hub-opened after authorised Hub data loading and perform an immediate health check. Keep the independent five-minute refresh, 60-second manual cooldown and existing server cache. Sign out clears the old result to neutral NOT CHECKED, aborts the pending client wait and invalidates late results. Neutral/checking/green/red health is based on existing league connectivity only, independent of event matching. No backend or Nakka write changes.

Two new executable lifecycle tests check no pre-login request, immediate opened-event health fetch, logout neutral state, abort, fresh-session result, stale-response rejection and preserved cooldown. Existing auth client test verifies Hub-open signal. Full suite/inventory results in package evidence. Native behavior after this fix PENDING. Native test target match and eventual green status were observed on prior code, not acceptance of this patch. No production/JDC changes.
