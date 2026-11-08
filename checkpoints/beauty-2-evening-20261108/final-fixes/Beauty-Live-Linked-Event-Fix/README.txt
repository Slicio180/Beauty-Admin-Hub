Beauty Live linked-event follow-up — 2026-11-08
Removes the overlooked top-level league flag restriction from LiveCastView's
read-only event feed. Exact event ID, lgid, date, singles and API result checks stay.
Only LiveCastView changes. No cosmetic fallback masking: feed loads actual data.

Unzip into Downloads and retain all previous Beauty installer folders/receipts.
Run: node "$HOME/Downloads/Beauty-Live-Linked-Event-Fix/install.cjs"
Requires the completed Beauty-Linked-Event-Fix installation.
Backs up source/deployment, checks exact source baseline, publishes same Hub URL,
verifies version/source/access. No active-event or player data edits, no kiosk or
mobile deployment changes. Do not rerun older installers.
After PASS, refresh the Live window and confirm event name, date and stage data.
On STOP retain backup and report output.

Validation: 14 real feed refresh simulations with mocked provider responses,
including valid league flags 0 and 1 and rejection of wrong event/league/date/team.
Both compact and matching panels baselines tested; inline JS syntax checked.
Three deployment simulations passed: existing URL/access preserved, no-write
rerun, concurrent source edit rejected. Native deployment/display pending owner.
