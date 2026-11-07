# Beauty TEST sync — 1 November 2026

Scope: local TEST source only. Google TEST changes were manually saved and exercised by Alessio. Production remains unchanged. Nakka theme stays staged/inactive; no theme activation.

## Browser evidence and user reports (Stockholm time)

- 23:08 attention refresh completed, no players need review (screenshot).
- 23:25 Hub 2 / Nakka 2; Alessio Tampella and Eric Werkestam IN; zero name differences/duplicates (screenshot).
- 23:31 Hub 3, IN 3, attention 0; Alessio HUB, Axel Johansson Edström KIOSK, Eric Werkestam MOBILE; consent and message controls visible (screenshot).
- 23:32 Hub 3 / Nakka 3; all names match; zero differences/duplicates (screenshot). Mobile/kiosk automatic entry path passed based on user workflow and comparison; this is not proof from names alone of permanent league links.
- 23:34 Hub Live launcher failed (old TEST target).
- 23:35 direct Live page showed 3 names (screenshot).
- After launcher patch, user reported successful Hub launch.
- User reported Hub sign-out returned to login; separate Live page remained available including after reload. This is a UI workflow check, not a complete authorization/security audit.

## Source changes

1. Event lookup skips explicitly undated events, still rejects malformed dates.
2. Transfer target restricted to t_QHaG_7792 / Beauty Registration TEST event DO NOT USE LIVE.
3. Attention refresh exact title aligned to same event.
4. Remote registration white form, black controls, yellow highlights; search and pinned new-player option.
5. Kiosk palette aligned, existing pinning/sizing/scripts preserved.
6. beautyLiveTestUrl gets a separate current TEST target check. Stage planner/audits still refer to old target and are deliberately not migrated.

## Verification limits / remaining work

- Earlier isolated mocks: event 17, transfer 14, attention 7. Installer reruns these checks and records output.
- Live launcher had 9 mocked checks; actual launch subsequently user-confirmed.
- Both HTML script blocks were checked byte-for-byte unchanged. Browser automation was unavailable in this environment; no automated visual PASS is claimed.
- Registration colour updates were user-saved; screenshots of the final registration visuals/pinning remain pending.
- IN/OUT/STANDBY transitions, duplicate-registration checks, new league player creation, planner new-target handoff, multilingual, and broad regression/security tests remain pending.
- Hub transfer-dialog introductory text may still name the old TEST event; its server-side preview showed the correct target. Needs a narrow UI label correction from the current HubTest.html.
- This bundle does not contain the complete Hub or a deployment. Local Mac sync is PENDING until install.cjs runs. Full local npm test and inventory are pending.
- Never upload local source to Google again until this sync is applied successfully.

## Resume

First apply the sync from the Beauty-Admin-Hub terminal. Inspect the recorded outcome, then run the normal project tests/inventory. Continue status/duplicate tests only on the dedicated registration TEST event. Public registration enforces today's date; if testing after midnight, review TEST date and TEST event together before registering. Keep Monday production untouched.
