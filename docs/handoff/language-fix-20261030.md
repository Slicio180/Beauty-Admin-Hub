# English Hub / Swedish public surfaces — 30 October 2026
Owner requirement: EVERY Hub-owned label, popup, dropdown, message and date in
English. Remote, kiosk, Beauty Live and venue cast text in Swedish. User approved
language audit then instructed implementation. TEST only; installation later.

Changes: Hub Board/Group/Group overview labels, edit dialog, duplicate messages,
swap picker, scheme3/4/5-player-group descriptions, selected board counts and board
plan export all English. YES/NO consent display restored; stored JA/NEJ unchanged.
Hub dates/timestamps explicitly en-GB (Stockholm time) including tournament date,
statistics, comparison and health; Swedish name collation retained intentionally.
No player name, message, Nakka tournament title, ID, canonical value or source altered.

Public stage markup declares sv. Dropdown options, headings, tables, captions,
controls, empty/loading/error/stale/offline messages, page/round navigation, aria
labels and fullscreen feedback Swedish. Display-only format translation maps
First to/Limit legs/sets/draws to Swedish without changing provider match settings.
Bye/pending placeholders localized by state; literal player names preserved even
when a name matches an English placeholder. Build defaults translated too.

Remote/Kiosk response boundary maps structured codes to Swedish before opening
identity dialogs or displaying failures. Unknown errors use conservative Swedish
check-with-organiser-before-retry guidance; raw error.message removed from context
load failures. Identity code/base/proposed name fields preserved; no automatic
retry introduced. Existing shared Swedish identity modules remain intact.
Beauty Live inspected as already Swedish; its behavior/feed unchanged.

600 tests PASS and inventory PASS, including actual submit transport, per-page
error-boundary/context-load failures, Hub labels/dialog/picker and cast-format/
identity invariance. Shared core/server validators, RPC permissions and targets
unchanged. Canonical integration values must not be translated. Four Google HTML
files change: HubTest, StageTest, RemoteRegistration, KioskTest;15 preserved.

Combined installer includes BOTH uninstalled elegant layouts plus this language
pass. Requires owner checkpoint2624286/recovery/2026-10-28. Google baseline remains
last verified19-file29 October readback. Use this newest package instead of earlier
Pool Elegant/Hub Elegant packages, not in addition. Prior ZIPs retained as history.
Native UI/device/Google upload acceptance pending. Browser/OS chrome, spellcheck,
native date picker and native validation can follow device language rather than
HTML lang; the Event Control input is explicitly marked English. Do not claim
control over Google/OS-owned text. The new six-group cast redesign is still a
mockup; this patch translates the existing working cast page, without claiming
that the new visual layout/provider integration was qualified.
Dated record retains prior audit numbering gap without inventing AUD numbers.
