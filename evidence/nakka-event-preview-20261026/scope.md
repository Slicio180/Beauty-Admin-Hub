# AUD-085 — Nakka event date preview — Identity TEST
Owner supplied https://n01darts.com/n01/league/season.php?id=t_qJH9_0995 and said the event is today, 2026-10-26. Owner confirmed TEST Hub event date saved to 2026-10-26. Public page could not be independently fetched. Native match remains pending.

New HubTestNakkaEvent.gs provides only a read-only event list preview. Current event comes from Control A2, not client-selected IDs. Exact TEST identity, valid session, known spreadsheet/timezone, real non-formula date required. Fixed GET to existing league/tournament/list?lgid=lg_tM2v_3523&count=100 with existing server properties. No data mutation. No token, credentials, raw response or provider exceptions returned. No/duplicate matches and lists at the 100-item limit refuse selection. Strict provider dates and event ID validation; name rendered as text. Session and Control date checked again after remote fetch. One match shown with fixed safe n01 URL. Checking does not persist a target or sync any player.

Generated TEST Hub only: adds CHECK EVENT to Nakka panel, manual request through authenticated queue. Date changes and logout remove prior preview; late responses ignored. Standalone demo unchanged. Existing Nakka health startup may show an initial pre-login request failure; manual health refresh after login works (AUD-084). This block does not change that behavior.

307 local cases across 21 files pass, inventory pass. Nine new cases cover unique/no/ambiguous match, credentials and date failures, exact GET, timezone midnight, HTTP/network failures, invalid response and incomplete list, wrong identity/session, expired session, date race and safe client rendering assertions. Native provider schema/match and browser interaction PENDING; source assertions alone do not qualify native behavior. Previous 298 tests preserved.

Google TEST upload: create Script file HubTestNakkaEvent (Apps Script adds .gs), copy full matching local file. Replace full HubTestBridge.gs and HubTest.html. Save all three, refresh and sign in. Nakka → CHECK EVENT. Verify 2026-10-26 and t_qJH9_0995. No deployment required.

No production, JDC, Firebase account, Nakka registration or player synchronization changes. Rollback restores bridge and HTML together and removes added event script; local originals in installer backup. No independent native rollback rehearsal performed.
