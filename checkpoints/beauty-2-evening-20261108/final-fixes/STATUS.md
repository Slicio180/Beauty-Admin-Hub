# Beauty 2.0 final fixes — 8 November 2026

This supplements the verified evening archive in the parent directory. Restore that archive for all earlier source, installers, tests and instructions. These two folders contain the complete final patch source, installers and test evidence.

## Confirmed outcomes
- League-linked event fix: owner supplied LINKED_EVENT_SOURCE_DEPLOYMENT_PASS; original Hub URL retained. Native backup: /Users/alessiotampella/Downloads/Beauty-Linked-Event-Backup-DINe5e. Owner confirmed Hub/kiosk/mobile worked after activation.
- Active recreated event: t_Ig9A_5138, league lg_tM2v_3523, AIK MÅNDAGSDARTARNA 2026-11-09, date 2026-11-09. Public diagnostic reported league:0, team_games:0, status:10.
- Live follow-up: owner screenshot at 22:50 shows correct event title and date and 0 registered players. Installer receipt for this follow-up was not supplied; exact deployed version is not independently recorded. Native title display confirmed; full groups/brackets are not newly venue-tested.

## Implementation
1. Beauty-Linked-Event-Fix removes erroneous top-level league flag restrictions in four Hub runtime files, retaining exact event/league/date/singles and existing authorization guards. 149 mocked checks and 3 installer checks passed.
2. Beauty-Live-Linked-Event-Fix removes the same redundant check in LiveCastView. 14 mocked feed checks and 3 installer checks passed. It depends on completed first patch.

Installers reconstruct supported existing baselines, compare exact current source, back up before writes, publish existing Hub deployment and read back source/version/access. They do not activate events, change players or alter kiosk/mobile deployments. Do not rerun older installers. See each README for dependencies and recovery guidance.

## Saved scope
The parent archive plus these final fixes contain all Beauty source/artifacts available in this workspace for tonight. No credentials, Script Properties, unsupplied Mac backups, live Sheets or Nakka data are included. This GitHub save does not modify live deployments or data.

Before venue registration, verify one real registration reaches Hub and Nakka, then check kiosk/mobile event labels and Live.
