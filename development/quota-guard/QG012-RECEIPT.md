# QG012 — reject new registrations for past events

User selected “block and ask me” for new registrations when an old event remains selected. Private TEST v16 deployed 2026-11-25 at 22:16 Stockholm, unchanged URL, owner execution, Only myself access. LIVE unchanged; background workers remain paused.

New requests are rejected before queue save and before registration effects when Stockholm's current calendar date is later than the selected event date. Message asks the organiser to select the correct event, explicitly stating no new request accepted. Existing receipt replay and already-pending-player handling precede this check so saved requests remain recoverable. The QUEUE_ code preserves the message through the Hub response adapter; mobile/kiosk render server errors directly.

Accepted requests store the same clock instant used for the date decision. When processing is delayed across midnight, the worker derives a new response timestamp from that accepted instant in Europe/Stockholm. Existing persisted responseSerial values are not rewritten.

Tests pass: past-date rejection with zero new saves, current/future acceptance, Stockholm midnight while UTC remains prior day, original receipt replay, pending-player precedence, and real worker response construction after midnight; invalid acceptance timestamp fails closed. Recovery pending-display regression passes.

Saved editor source reloaded and compared exactly with intended source. SHA256 matches private local candidate-qg012 LiveRegistrationQueue.gs:
`0a0d9447f5707a8edb3d7a564f58b293eef01e6a892c55de8e69e738bb6e2552`

Native fresh-page verification PASS, 2026-11-25 at 22:26 Stockholm: authenticated TEST v16, selected event 24 November 2026, new synthetic name Beauty Combined Date Guard, photo/video NO. Submitted once through Register Player. The UI displayed the exact expected past-event rejection and explicitly stated no new request was accepted; register button re-enabled. Existing review count remained one. No Resolve issue action was repeated. This prevents new stale-event requests; it does not resolve the pre-existing Quota Native REVIEW record or constitute successful current-date registration/removal acceptance. No dates, records, or guards were rewritten to force that request through.
