# Approved venue pool screen — 30 October 2026
Approved mockup: six cards (three columns/two rows), Swedish cast UI, AIK fonts,
matched condensed bold Bana/Grupp, thin text-width yellow accent, light names,
yellow positions, pool-stage overall average under each name, matrix match
averages, white frozen group average and yellow current average below Grupp.
Single-group board omits Grupp; groups sharing a board are ordered board/group.
Board overview and knockout navigation retained. Four-card option and12-second
rotation retained. Responsive layout reflows; six-card readability on the actual
venue screen requires visual acceptance, particularly with long names/four players.

Public Nakka GETs only. Core stage snapshot every10seconds; live pool cycle every
2seconds while visible/online/auto enabled, bounded by response latency. No overlap,
no credential forwarding, redirect refused,15second request timeout, four parallel
live requests,32active-match and1000match bounds; full list pagination100items.
Fast cycle cannot revive an expired/failed structural snapshot. Complete archival
pool fixtures plus current live set totals are rebuilt each cycle by exact event,
pool and player IDs; no rounded-average averaging or double counting a live match.
Pool/player average =3*total scored points/total darts. Group live value is weighted
by all darts, not the arithmetic mean of displayed rounded player averages.
Only01singles pool formats qualified; sets, missing totals, incomplete history,
multiple documents for a fixture or repeated pairings suppress aggregate averages.
Knockout results never enter pool averages. Zero darts is unknown, not measured0.
A live response must match requested mid, tmid, event and both player IDs.
Two mirrored cells highlighted only while end_match=0; ended removes highlight.
Failure/offline/pause/stale removes visual LIVE claim and highlights, with last-
fetched notice. Older structural snapshots must refresh within15seconds for fast
cycles; late responses cannot publish after stop. Provider scoring cadence governs
actual latency; no every-dart guarantee or device/Nakka qualification claimed.

White starting value comes from the VERIFIED pool-send BEFORE audit, linked to its
READBACK receipt and journal drawHash. Arithmetic mean of known frozen league
averages, with coverage exposed in tooltip; not retroactively reset at first cast
load. Missing verified baseline yields dash. Only public pool IDs, tpidmembership,
aggregate baseline/coverage and labels leave the audit boundary; no player names,
LPIDs, staff IDs, consent, messages, passwords or source audit rows are returned.
Bana/Grupp are Hub planning labels, not live Nakka board reservations. Label save
requires staff auth twice and exact audited membership/unique board-group pairs;
only a separate TEST script property is written, never Nakka or frozen baseline.
Future verified pool sends publish labels separately. If that step fails, only
labels may be retried; pool send cannot repeat. Existing accepted events can use
Pool Planner > Advanced settings > REVIEW CAST BOARD LABELS, review every board
and group, SAVE CAST LABELS, then reopen cast. Suggested allocation in this explicit
review uses selected Setup boards. Until reviewed/published, Bana shows dash rather
than invented assignment. New card labels never drive autopilot or progression.

615tests PASS; inventory615/49files expected. Full suite/inventory and guarded
installer rehearsal recorded with package. Native browser preview could not run:
Chromium download returned invalid archive; cloud browser cannot reach workspace
loopback. No rendered-pixel acceptance claimed. Existing DOM/runtime tests cover
safe output, card averages, exact two highlights, completion, math, correction,
metadata secrecy, auth, pagination, overlapping/stopped feed and snapshot failure.
Google upload/device/live-game acceptance remain pending. No installed changes,
production/JDC/GitHub or Nakka event writes. Audit numbering gap remains disclosed;
this dated feature record does not invent an AUD number.

Combined package supersedes all uninstalled Oct30 Pool Elegant, Hub Elegant and
Hub Language ZIPs. Owner baseline2624286 on recovery/2026-10-28. Five Google files
change: HubTest.html, StageTest.html, RemoteRegistration.html, KioskTest.html and
BeautyLiveServer.js. Other14files preserved; all19verified in offline mock clone.
Official API basis (read30Oct2026):
https://push.n01darts.com/api/v1/n01_api_manual_en.html
match/list, match/live, statsData allScore/allDarts, tmidformats and since polling.
Live API response shape still requires owner TEST acceptance; sample values in
unit fixtures are synthetic and are never rendered in deployed automatic mode.
