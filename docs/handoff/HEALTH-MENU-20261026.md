# Hub health menu refinement — TEST

Requested 26 October 2026: remove Nakka API and Beauty Backend cards from the dashboard, move Nakka details into its menu entry, keep a visible status dot in the Nakka menu, clarify the other connection indicator. Also remove duplicate Register Player from the left menu; preserve the main working registration button.

Implementation: Nakka opens a labelled native dialog with original health details and refresh action. Nakka sidebar dot follows CHECKING/OK/DEGRADED/UNAVAILABLE with grey/green/amber/red; tooltip and accessible name state the outcome. System Status opens Google Sheets connection details and explanation. Sidebar dot turns green on a successful Identity TEST read, red on read failure, back to green on recovery. Offline demo remains grey. A green TEST read is not production validation or write permission. Monitoring keeps running while panels are closed. Close button and native Escape close each dialog and restore focus.

Nakka TEST is still deliberately disconnected, so its dot remains red/unavailable with explanatory text until real read-only wiring is implemented. No health result is fabricated. No registration/status/Event Control/Nakka server or production change.

Verification: 248 local tests and inventory PASS; generated Hub HTML reproducibility checked. UI behavior and state propagation checked with fake DOM and services, including preserved main registration button. One syntax error in the new test harness was fixed before final PASS; failed run retained. Actual Google browser layout/keyboard review pending.

Upload after installer: replace only HubTest.html in separate Beauty — Remote Identity TEST and refresh /dev?page=hub. Check dashboard cards gone, sidebar Register Player removed, main + REGISTER PLAYER remains; open and close Nakka and System Status and review dots/details. No deployment.

Additional user request: compact Tonight's Players rows. Reduce vertical cell padding from 16px to 6px, line-height from 1.35 to 1.2; retain 22px name text. Status control minimum 34px, consent/message controls 32px, smaller heading/control-row padding. Long values still wrap; no fixed row heights or clipping introduced. Sticky headings and main registration button retained. Included in the same pending AUD-072 update; not a separate installation. Actual row fit pending Google TEST screenshot.
