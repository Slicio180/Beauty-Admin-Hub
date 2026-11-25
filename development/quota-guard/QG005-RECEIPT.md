# Beauty QG005 — TEST v9 receipt

Installed 25 November 2026 at 15:09 Europe/Stockholm. Google confirmed deployment successfully updated to Version 9 in the existing private Release TEST deployment. Only myself access preserved. LIVE unchanged. TEST workers remain paused; no configuration changes were made.

## Fix

Removed the automatic three-second Nakka comparison retry after BUSY or CHECK_IN_PROGRESS. The existing two-minute schedule now handles these retries. Manual comparisons and existing action/roster-triggered checks remain available immediately. The last verified comparison is retained. A changing roster can cause a complete five-fetch comparison to return CHECK_IN_PROGRESS; repeatedly rerunning it every three seconds was unnecessary load. BUSY caused by a queue lease usually returns before those fetches, but still creates Apps Script executions.

This change does not alter registration processing, recovery writes, authentication, event verification, or dashboard refresh. A delayed comparison can wait up to the next scheduled interval unless an existing explicit/event trigger starts it earlier. Existing timeout guards cannot cancel an already-running server request.

## Evidence

Only LiveHubView.html differs from v8. Its saved source was reloaded from Google and matched SHA256 f0d4dc03f18775c57a7689d35c9558134cd13b0fb07ae6f217866145155f75e7.

The test executes the actual extracted browser check function with mocked callbacks. BUSY and CHECK_IN_PROGRESS add no rapid retry; last-good data survives failures; later/manual calls still work; stale-session replies do not update the display. Existing 14 synchronous quota checks and asynchronous dashboard backoff/retention checks passed. All candidate server and inline browser scripts parse.

Authenticated native acceptance and measured quota savings remain pending. No quota-reset claim or external fetch probe was made. Source overlay/tests are committed locally, not pushed to GitHub. This artifact is not approved for LIVE promotion.
