# Registration feedback popup

User request: display duplicate registration feedback in a popup like the player-message window instead of the inline banner.

All registration validation/server errors now reuse the message popup with title Anmälan and a close ×. The registration form remains open underneath and retains entered values. No success confirmation or live backend behavior is changed.

Assistant verification: 134 tests passed, including an actual registration-handler test with a fake DOM checking duplicate rejection, popup text, dismissal, retained player input and unchanged count. Inventory maps 134 cases across 8 files. Browser retest on Mac remains pending.

Source: installed local-preview patch, based on user Mac checkpoint 142f55b with uncommitted preview changes. This update changes only desktop frontend, test inventory and evidence; Apps Script source remains untouched.
