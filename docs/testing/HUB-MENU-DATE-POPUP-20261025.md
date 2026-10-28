# Hub sidebar and date confirmation — 2026-10-25

Source checkpoint: e23ce9c. This update changes only Hub navigation and local date review. Event saving remains disabled. Registration/status server code and Swedish remote/kiosk remain unchanged.

Sidebar: Dashboard, Beauty Live, Register Player, Event Control Details, Nakka, System Status, Instructions. Tonight’s Players and Event Control remain on the Dashboard. Event Control Details opens the read-only technical panel.

Date flow: choose a changed valid date, acknowledge reset, click Review Change. The confirmation popup names the old/new dates and reset consequences. Cancel Change clears acknowledgement. Editing, closing/reopening and reloading reset confirmation. The confirm action stays disabled until separately qualified server saving is implemented. This is accidental-change protection, not authentication.

Beauty Live requirements agreed with Alessio: separate casting tab, automatic refresh as players register, original AIK fonts, black background, gold title/border, white names. Names only by default, no status/consent/messages. Independent sort options: alphabetical, registration timestamp, overall Nakka rank (unranked last). Optional Nakka statistics including rank/points. Cast integration, timestamp retrieval and Nakka data are NOT implemented by this update; the sidebar position is prepared only.

Google upload after installer success: replace HubTest.html only in Beauty — Remote Identity TEST. Then reload /dev?page=hub. No Code.gs, manifest, Swedish remote/kiosk or server changes.

Browser review pending: sidebar order; Event Control Details opens; main Dashboard retains player table/Event Control; date form has no typed-date input; changed date + checkbox permits review; popup shows both dates/reset warning; confirmation disabled; Cancel Change clears acknowledgement; close/reopen restores actual date. No date save is expected.
