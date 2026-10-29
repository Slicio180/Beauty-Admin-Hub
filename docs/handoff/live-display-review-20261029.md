# Beauty Live review — 29 October 2026

Owner-approved proposal:30 players per page; Spelare | Snitt | Poäng in one row;
fine vertical divider between average and points. Long names use reduced type
and wrap within the same row height. Fixed numeric columns remain aligned.
All settings sit in a modal with Escape/close and focus return. Page rotation
pauses while settings are open. Names-only mode and12-second page swaps remain.
Statistics do not silently change the selected sort order. Row numbers remain
list positions unless the explicit verified ranking sort is selected.

The existing cast feed remains provider-read-only. Last successful fixed-league
values are retained up to seven days with a visible stale status and source time.
A separate guarded RPC validates staff auth, locks the refresh, runs existing
fixed-league read-only statistics loading, and returns no profiles/credentials.
The signed-in Hub refreshes on opening and every4 minutes while visible.
Existing provider rate limiting remains. Session expiration and sign-out stop
staff refreshes. Public casting tabs never trigger provider calls themselves.
Pool draw freshness rules are unchanged: stale display values cannot qualify draws.

Real overall league ranking is still unqualified/unconnected and remains disabled.
No inferred ranks or invented tie-breaks. This package does not change production,
kiosk/remote registration, dates, rosters, consent or Nakka event data.

Validation:579 offline tests /0 failures and inventory mapping; offline guarded
installer and19-file Google clone/overlay/readback rehearsal. This does not prove
native Google browser appearance or Nakka API availability. Browser rendering
attempt could not run because Chromium is not installed here. Mac/TV acceptance
is pending:30 rows fit; long names17/18 wrap without overlap; average then points;
settings popup closes with Escape and full screen; paging and fresh/stale labels.
