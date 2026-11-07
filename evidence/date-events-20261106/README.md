# Date-matched TEST events — 6 November 2026

Implemented in an isolated copy of the owner-confirmed combined Hub update.

- Changing the Hub date does not create anything in Nakka. The normal authenticated lookup selects the unique approved TEST event on that calendar date in league lg_tM2v_3523.
- Existing original TEST event t_QHaG_7792 still requires its exact historical title. Additional TEST events require the AIK Hub TEST title prefix. Same-date production events are excluded. Multiple matching TEST events, truncated lists, invalid dates and stale bindings block selection.
- After a verified date save, FIND OR CREATE NAKKA EVENT opens the Nakka review. Missing-event review offers a name, inherited round-robin/two-knockout settings and explicit public read-only visibility acknowledgement. One separately confirmed create starts at accepting entries, with a random join password. No entries, pool draw, results, badges or existing bracket assignments are copied. Pool settings can be reviewed through the existing planner before sending.
- Before a provider POST, an audit and durable date-specific ATTEMPTED journal are written. Confirmation is staff/session/date/ticket bound and expires in five minutes. A response timeout or failed readback blocks automatic/repeated creation. Native entries, settings, identity and date are read back before success.
- Transfers, removal, attention checks, pool writes, per-event journals and Live IDs use the same selected binding. Live opens through an authenticated date lookup and receives a validated event ID from the server. Native editing and knockout progression remain in Nakka Admin.
- The original completed event is preserved. No Google upload, Nakka mutation, production release, Git push or native acceptance was performed by this build.

Limitations: TEST-only title/league gate; production needs a separate qualified release. New-event format inherits the completed TEST event's game settings; no general format editor is added. The provider event list is capped at 100 and fails closed at that boundary. An external Nakka admin can create an event during our final lookup/POST gap; final duplicate detection leaves an uncertain journal, rather than retrying. A genuinely uncertain create requires audit inspection and deliberate operator recovery. This update does not qualify native automatic board assignment or partial-pool advancement. A real TEST creation and kiosk/mobile/Hub/Live check remain required.

Local tests use synthetic native responses; passing them does not establish deployed behavior.
