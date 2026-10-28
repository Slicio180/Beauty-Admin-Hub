# AUD-081 — 2026-10-26
User confirmed actual TEST login, sign out, refresh while signed out (Hub remains hidden), and subsequent sign in. Native probe identified missing external_request permission; both native Base64 decoder variants passed. Explicit requireScopes caused Google consent; user granted permission and real login worked. Padding was not the observed native failure cause.

UI request: move signed-in email and Sign out below Instructions. Builder injects account controls inside sidebar; header keeps original compact padding and branding. Full 298 automated cases and inventory PASS. Browser acceptance of this new placement PENDING. Headless visual check unavailable: installed Playwright has no browser binary. No claim of native layout acceptance.

Sync the explicit TEST diagnostic requireScopes line and its fixture to Mac. Google Auth file already has that exact manual change; only HubTest.html needs replacing now. No production, Firebase account, Nakka or deployment change. Password reset delivery, idle timeout and complete shared-computer browser qualification remain pending.
