BEAUTY 2.0 — LEAGUE-LINKED EVENT FIX — 8 November 2026

Problem: recreated event t_Ig9A_5138 belongs to lg_tM2v_3523, date 2026-11-09,
but reports league:0. Hub incorrectly required league:1 in four runtime checks.
Official API documents league/tournament/link as setting lgid and private.
Reference: https://api.n01darts.com/api/v1/n01_api_manual_en.html

Fix: remove only redundant top-level league flag restrictions in LiveEventContext,
LiveRegister, LiveHub, LivePlanner. Exact event ID, league ID, date, singles and
existing access/status checks stay. lg_setting.league (playing format) is unchanged.
Original-event workbook identity guards and new-event workspace isolation stay.
Historical fixed-target preflight diagnostics are unchanged.

INSTALL
Unzip in Downloads. Keep the prior Beauty installer folders and receipts there.
Run: node "$HOME/Downloads/Beauty-Linked-Event-Fix/install.cjs"
Supports completed Compact Settings or Matching Event Panels, with/without Login
Text Fix. Stops on any other source/deployment changes. Uses existing clasp login;
never exports tokens. Backs up current source/deployment privately before upload.
Publishes only Hub to existing public URL. No event activation, player changes,
Nakka writes, Script Property edits or kiosk/mobile deployment changes by installer.

AFTER PASS
Refresh Hub. Open LEAGUE / TOURNAMENT, existing league, date 2026-11-09,
CHECK FOR EVENT, then START EVENT. This user action activates the newly created
event and creates its isolated workspace if needed. Confirm event labels in Hub,
kiosk and mobile. Confirm one real registration reaches the new Nakka event.
Do not delete/recreate again or rerun older installers.
If STOP occurs, preserve backup/receipt and paste the exact output.

VALIDATION
149 mocked runtime guard checks passed across four current-source combinations.
All server JS syntax checked. Only four intended files change.
3 installer simulations: same URL/permissions, Hub-only deployment, no-write rerun,
concurrent source change rejected. No live deployment or native-device success
claimed until owner runs installer and confirms.
