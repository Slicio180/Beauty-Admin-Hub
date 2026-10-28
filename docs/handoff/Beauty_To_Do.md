# Beauty — to-do and decisions

Updated: 28 October 2026, Europe/Stockholm.

## Latest recorded checkpoint

- Owner Mac **2781600 / AUD-100**, 401 passed/0 failed, both builds and inventory PASS, 27Oct2026 22:29:07.640Z (23:29 Stockholm). Google TEST HubTestNakkaTransfer and HubTestAutoRegister both saved.
- Central Hub/mobile/kiosk TEST registration supports existing and newly resolved league identities; canonical nickname/duplicate checks before creation; verified creation LPID receipt/readback before event add; durable journals/no mutation retries. No production rollout.
- Browser findings27–28Oct: three new test identities in Nakka event with League badges; duplicates Sandra/Emanuel blocked guessing, owner removed duplicates, reviewed transfers then reached TEST event. Final65 Hub/59 Nakka/59 matching/6 earlier pending/no Nakka-only/no duplicate-name groups. Exact event LPID link still unexposed; scoped name match is not full identity verification.
- Earlier six intentionally left pending: Frida Persdotter(kok), Stefan Jansson(pippo), Test Player Hub/Kiosk/Remote/Remote(Remigio). Owner says registered while/before fix; do not re-register/backfill/delete implicitly.
- Mobile count tile17 native screenshot passed. Long-message wrapping/scroll passed. Live17/32/63 layouts observed; type too small at larger counts. Ranking source still not connected.
- Owner Mac tests were not rerun for this documentation closeout; the refreshed source snapshot was independently revalidated locally:401/401 and inventory PASS. Bulk evidence AUD-101 recorder prepared for next session; actual Mac audit checkpoint remains AUD-100 until run. See current START-HERE and source snapshot continuation record.

## Next session priorities — agreed at closeout

**Priority update — owner28Oct2026:** after Nakka reliability/attention handling is fixed, prioritise the Pool Planner's seeded, balanced group allocation ahead of remaining display improvements. Fetch the shared league identity/overall three-dart-average data needed for seeding as part of that work; rank/points display can reuse this foundation later. Spread stronger players across groups, not into the same group. Preserve preview/manual moves and review missing/ambiguous averages. The detailed balanced-pool and approved-transfer requirements below remain authoritative.

1. Record the collected scoped native browser results in one bulk Mac checkpoint (prepared AUD-101 recorder); do not repeat passed work or request full source uploads.
2. [ ] Add persistent organiser attention alerts for failed/blocked/uncertain Nakka registrations: named player, concrete reason, attention count and Review action; survive reload, clear only on verified resolution. Keep connection health separate and do not silently pick a duplicate league identity.
3. [ ] Preserve ambiguity handling; owner prefers prominent review alerts rather than automatic guessing/merging/deleting duplicate Nakka members. Duplicates observed, origin unproven; do not attribute to Nakka or Beauty without evidence.
4. [ ] Investigate mobile Försök igen om en stund during bulk activity as part of Nakka/registration reliability; busy suspected, root cause unconfirmed. Do not retry mutations or turn saved Beauty registration into a false failure.
5. [ ] **NEXT after Nakka fixes: seeded Pool Planner.** Implement shared league identity/overall three-dart-average data and balanced IN-only group allocation, preview/manual adjustments, frozen source averages and missing-data handling. Then qualify approved Nakka pool transfer separately in TEST; do not assume registration transfer already proves draw transfer.
6. [ ] Afterwards, enlarge Beauty Live player typography and qualify final NAME | RANK | POINTS together, with shared league stats, long names, stats off/on and venue fullscreen dimensions. Check boundaries15/16,30/31,45/46,60/61 and scrolling beyond60. Names-only layout counts do not qualify stats readability. Hub numbers and Live page divider remain pending display work.

Additional display requirements — 28 October 2026, owner screenshot 00:11:54:

- [ ] **Hub player numbering:** show a visible number next to each player in the Hub list, following the current displayed order and updating with sorting/filtering. Numbers are display positions, not permanent player identities.
- [ ] **Beauty Live page divider:** add a clear full-width horizontal line, gap or labelled separator between scrolling pages/batches. Clearly separate players 1–60 from 61 onward, so the next page does not look like a continuation of just the first column. Keep the multi-column page boundary aligned.
- [ ] **Beauty Live font size — priority:** noticeably enlarge player names and row numbers for viewing across the venue. Current four-column/60+ layout is too small. Check full-screen venue dimensions, long/nickname names, different list sizes and final NAME | RANK | POINTS layout; avoid clipping and preserve scrolling.
- Evidence: owner-supplied Screenshot 2026-10-28 at 00.11.54.png shows bottom row15/30/45/60 with player61 directly beneath the first column. Requirements recorded only; no code changes made for these additions.

The session crossed midnight: current date28Oct, selected TEST event last known27Oct. Deliberately review date alignment before any new submission; leave existing registrations/event history intact. Concurrent events and advance-registration schema remain deferred.

## Agreed — shared Nakka league data for Hub and Beauty Live

Status: TO DO — requirements agreed on 26 October 2026.

Source: AIK MÅNDAGSDARTARNA 2026/2027, league ID lg_tM2v_3523.
Ranking page: https://n01darts.com/n01/league/l_stats.html?id=lg_tM2v_3523&tab=rank

- [ ] Fetch overall ranking points and playing statistics from the same selected Nakka league, using the appropriate API requests.
- [ ] Match players using their Nakka identities; do not rely solely on names. Surface ambiguous or missing matches.
- [ ] Provide automatic refresh, Refresh now, last successful update time, and connection/stale-data status.
- [ ] Retain the last successfully fetched data if Nakka is temporarily unavailable; visibly mark it as stale.
- [ ] Make the fetched data available to the Hub, Beauty Live and Pool Planner. The Nakka webpage does not need to remain open.
- [ ] Keep API credentials on the backend, outside browser code and developer handover packages.
- [ ] Verify the average calculation and rounding against the Nakka statistics display, including missing data and excluded formats.
- [ ] Test refresh, identity matching, unavailable API and stale-data behaviour; record evidence.

## Agreed — Beauty Live rankings/statistics list

Status: TO DO — verify existing implementation before adding or marking any work complete.

- [ ] Show tonight's registered players with NAME | RANK | POINTS from overall league standings.
- [ ] Sort by overall league rank, best rank first, irrespective of registration order.
- [ ] Put players without a ranking at the bottom; do not invent a rank or points.
- [ ] Refresh the list as registrations and league data change.
- [ ] Additional statistics may be drawn from the same league source; agree the final fields before expanding the display. Average is available for consideration, not an agreed extra Live column.
- [ ] Keep seeding colour bands and pool-planning controls inside the Hub; do not add them to Beauty Live.

## Agreed — balanced round-robin player allocation

Status: TO DO — HIGH PRIORITY immediately after Nakka reliability fixes, per owner28Oct2026. Extension to the existing Pool Planner requirements; ahead of remaining display work.

- [ ] Use the selected event's IN players; exclude OUT and STANDBY.
- [ ] Use each player's overall Nakka league three-dart average as the seeding measure, separately from ranking points.
- [ ] Allocate players across the chosen valid pool sizes to spread stronger players evenly and balance pool strength.
- [ ] Do not group all similar-average players together.
- [ ] Show a preview with names, individual averages, pool sizes and a comparable pool-strength summary.
- [ ] Allow manual moves and adjustments before sending.
- [ ] Offer a Show seeding colours toggle for manual planning/adjustments; colours are optional, not necessary for automated allocation.
- [ ] Define adjustable average bands with non-overlapping boundaries. Example bands discussed: 60+, 55–59.99, 50–54.99, below 50.
- [ ] Show missing-average players as unseeded; do not silently treat missing averages as zero. Agree their allocation rule.
- [ ] Freeze the seeding averages for each generated draw and record their source/update time.
- [ ] Mark the preview as needing review if the IN list changes; do not silently modify an approved draw.
- [ ] Validate every included player appears once, nobody excluded appears, pool capacities match the selected scheme, and the balance method handles ties and uneven pool sizes.
- [ ] Keep the existing pool-scheme requirements: 5–101 players, mainly 3- or mainly 4-player preferences, the five-player exception, and a manual planning count.

## Agreed — send approved pools to Nakka

Status: TO DO — API support checked in documentation; Beauty end-to-end transfer not yet verified.

- [x] Dedicated registration TEST event exists: Beauty Hub TEST — DO NOT USE LIVE, t_RqC2_2034. This does not qualify pool transfer.
- [ ] Verify correct target event and player identities, including league-to-event player ID mapping.
- [ ] Generate balanced pools → preview → manual adjustments → send approved groups to Nakka.
- [ ] Preserve tournament settings and correctly update group membership, match-order and related fields together.
- [ ] Read back Nakka's stored groups and confirm they match the approved Hub draw.
- [ ] Prevent unintended repeat submissions and protect against intervening changes or an event already under way.
- [ ] Record target event, draw, averages snapshot, date/time, operator, outcome, failures and readback evidence.
- [ ] Test additions/withdrawals and transfer failures in TEST before enabling live use.

## Remaining launch checks from the last checkpoint

- [ ] Verify session timeout on the shared computer.
- [ ] Complete an end-to-end event rehearsal.
- [ ] Prepare and verify production configuration, release steps and rollback.
- [ ] Maintain the formal Test & Audit Log: feature/test ID, expected/actual result, PASS/FAIL, verification status, date/time, build/checkpoint, notes and evidence.
- [ ] Inspect the latest repository before choosing implementation tasks; do not repeat completed work solely because it remains listed here.

## Programmer handover preparation

- [ ] Prepare a separate development copy at an identified checkpoint; retain the original Master.
- [ ] Include source, dependency manifests/lockfiles, relevant tests, sanitised audit notes, requirements and setup instructions.
- [ ] Inspect current files, nested archives, backups, logs and any included Git history for credentials and personal information.
- [ ] Remove secrets, tokens, credential files, production access and live player/consent/message data; provide placeholders and synthetic test data.
- [ ] Default the handover copy to TEST with real writes disabled; check it can install/run without production credentials.
- [ ] Record the handover checkpoint and exclusions. Agree how the programmer's changes return for review/testing.
- The current Master folder has not been inspected in this conversation and is not certified safe to share unchanged.

## Planned — same-name player handling

- [ ] Support different people with the same full name, for example two players named Karl Persson.
- [ ] Introduce permanent player IDs; names must not be the sole identity key.
- [ ] Provide a clear way to distinguish same-name players, such as club affiliation, in kiosk and mobile selection.
- [ ] When manual entry matches several people, ask which player they are rather than choosing the first or merging identities.
- [ ] Plan migration of existing registrations, status records and n01 associations without losing player history or creating duplicates.
- [ ] Test kiosk, remote, Sheets and n01 together before deployment.

Historical decision19Oct deferred full permanent-ID support. Later27Oct TEST work implemented canonical nickname/different-person prompts and duplicate registration checks across Hub/mobile/kiosk. Full permanent Beauty identity migration and Nakka identity mapping remain pending; preserve live Måndagsdartarna.

Interim option if an actual same-name pair occurs: distinct master-list and n01 display names, for example Karl Persson (AIK) and Karl Persson (Oasen). Canonical nickname handling is now implemented in TEST; this is not permanent player-ID migration.

## Completed — manual existing-name protection

- [x] Remote: normalize manually entered names and check PLAYER'S MASTER LIST before saving a new-player response.
- [x] Kiosk: apply the same check.
- [x] On a match, use the master-list spelling in the existing-player response field and leave the new-player field empty.
- [x] Both existing deployments updated and live checks passed, as reported by Alessio on 19 October 2026.
- [x] Test entry Al Essio Ta Mpella cleared, as reported by Alessio.

Matching ignores case, trims outer whitespace, collapses repeated whitespace between words and uses Unicode NFC. It preserves accents, punctuation and word boundaries. Al Essio Ta Mpella remains distinct from Alessio Tampella. Multiple identical-name identities are not supported by this fix.

## Agreed — configurable GP / MULTI EVENT tab

Status: TO DO — requirements agreed on 27 October 2026. Finish and verify the main Hub first; implement this extension afterwards. No GP readiness date is promised.

- [ ] Add a separate GP / MULTI EVENT tab inside the Beauty Hub, using the same authenticated access.
- [ ] Let the organiser create an event with its own name, venue, description and start/end dates.
- [ ] Support one-day and multi-day events (two, three, four or more days), with an organiser-defined number of competitions. Do not hardwire seven competitions, GP names or a fixed weekend programme.
- [ ] Let the organiser add, edit, duplicate and cancel individual competitions, each with its own name, date, start time, singles/doubles format, entry fee, capacity, registration deadline and eligibility requirements.
- [ ] Keep a separate player/team list and Nakka event link for every competition; support simultaneous competitions and events on different dates.
- [ ] Support an event-specific player pool, imported or manually maintained, without automatically altering the permanent Monday master list; choose the player source for each competition.
- [ ] Allow one player to enter several competitions; support linked doubles partners, partner changes and incomplete pairs.
- [ ] Track competition entry, physical check-in, IN/OUT/STANDBY status and payment separately, with a player overview across their entries.
- [ ] Support organiser-controlled late entries, capacity/deadline checks and configurable extra fees.
- [ ] Link kiosk, mobile registration and Beauty Live lists to the selected event/competition, with closed registrations unavailable for new entries.
- [ ] Provide an event overview with the competition schedule, registration state and entry/check-in counts.
- [ ] Scope registrations, statuses, payments, display lists and Nakka actions to explicit event/competition identities so GP competitions and Monday darts remain independent.
- [ ] Record tests and audit evidence, including single-day/multi-day configuration, concurrent competitions, cross-competition isolation, multiple entries per player, doubles, payments and the correct Nakka target.

Initial scope: configurable event and competition management with organiser-reviewed eligibility. Automatic eligibility verification, schedule-conflict detection and direct Dartstatistik integration are later enhancements, not first-release dependencies. Imports must use a supported file/manual route until any direct integration is verified.

Example use case only: AIK DART GP 4, 27–28 November 2026. Its advertised seven competitions are entered through configuration, not built into the system.

## Agreed — remote app multi-event registration and player event hub

Status: TO DO — requirements agreed on 27 October 2026. Extend the remote app after the main Hub is finished and verified; coordinate with the GP / MULTI EVENT tab.

### Multi-event registration

- [ ] Provide a general event directory plus direct event links/QR codes.
- [ ] Display available competitions grouped by day, driven by the Hub's event configuration: names, dates/times, formats, fees, deadlines and registration availability.
- [ ] Let a player select their identity from the event player pool and enter multiple competitions; allow new-player entry only where enabled.
- [ ] Support doubles partner selection and show missing partner information.
- [ ] Show an entry review and confirmation, including fees; reuse imported/existing entries and prevent duplicates.
- [ ] Keep entry, check-in and payment separate; make mobile check-in an organiser-controlled setting.

### Player-facing event hub

- [ ] Make the remote app a place players can use throughout the event to see what is happening, beyond registration.
- [ ] Show the event programme, competitions by day, current activity and upcoming matches.
- [ ] Show live games and scores, match status, players/teams and board assignments where the integration provides them.
- [ ] Let players follow their own competitions, upcoming games and results; show groups, standings and knockout progress where supported.
- [ ] Show organiser announcements, delays and schedule/board changes, plus practical event information.
- [ ] Keep the player view aligned with the selected event/competition and usable on phones; preserve multilingual support with Swedish as default.
- [ ] Verify available Nakka read endpoints, data fields, refresh limits and update latency before promising live-score detail. Show last update and stale/unavailable status; avoid presenting stale scores as current.
- [ ] Treat live-score viewing as agreed scope. Entering scores or operating a match from this app is a separate capability requiring scope and integration verification.
- [ ] Record tests and evidence for correct event/match routing, score refresh, missing/stale data, multiple competitions, registration duplication and mobile usability.

Product direction: the remote app becomes the player's event hub, connected to the organiser's Beauty Hub and configured events. Detailed display layout and match-scoring capabilities remain to be agreed.

### Nakka integration feasibility — documentation checked 27 October 2026

Official source: https://push.n01darts.com/api/v1/n01_api_manual_en.html

Status: DOCUMENTED SUPPORT CONFIRMED; live API responses and Beauty end-to-end operation have not been verified in this check. The browsing tool could not access the JSON endpoints; this is not evidence of a Nakka outage.

- [ ] Keep Nakka as the match-running/scoring system; display its data in the player event hub alongside Beauty registrations, schedules and announcements, without duplicate score entry.
- [ ] Use match/list filtered to the competition (tdid, live=1) to discover in-progress games.
- [ ] Use match/live for current scores, sets/legs won, player names, averages, current-leg throws and the next player to throw; use match/throws for leg-by-leg scoring detail where needed.
- [ ] Use match/get and match/list for match history/results, tournament/stats for statistics, tournament/standings for round-robin/league tables, and tournament/get for brackets.
- [ ] Verify board assignment/badge and announcement fields against a controlled event before displaying them. Do not equate an assignment or start time with a guaranteed future match time.
- [ ] Poll selected live matches using since/updateTime to avoid unchanged payloads. The manual's example suggests 1–2 seconds, not a guaranteed delivery latency or a per-viewer polling requirement.
- [ ] Share fetched updates through an appropriate backend/cache so growing phone audiences do not multiply upstream requests. Respect the documented approximately 300 requests/minute per-address limit and Retry-After responses; adjust polling to actual event load.
- [ ] Keep administrator credentials and private administration fields on the backend; expose only player-facing data permitted for the selected event.
- [ ] Run a controlled live-match test: score and correct throws in Nakka; verify player names, score, legs/sets, next thrower, match completion, board mapping, standings/bracket progress, measured refresh delay and stale/recovery behaviour in Beauty. Record dated evidence and outcomes before marking integration VERIFIED.

## Agreed — consistent Beauty styling and close controls

**Shared button standard — owner28Oct2026:** every button across Hub, kiosk and remote must match. Default: black background, thin AIK-yellow outline and yellow text/icon. Pressed/active: AIK-yellow background with black text/icon. Use the existing AIK accent (#ffd700), with a fine consistent border rather than thick yellow frames. This applies to primary/secondary actions and closing X tiles; removes inconsistent solid-yellow/default browser button treatments. Keep clearly visible keyboard focus and disabled states, and preserve action labels/save safeguards. Persistent selected controls can keep the active treatment where their selected state is meaningful; ordinary buttons return to normal after release. Status badges/health indicators remain separate semantic indicators, not button styling. Implement through shared styling and review matching desktop/mobile/tablet states across all three surfaces. This explicit standard supersedes earlier individual button appearance suggestions.

Owner28Oct2026 explicitly approves the Tonight's Players popup as the Beauty style reference: black/dark panel, thin gold outline and rounded corners. Reference screenshot C0B28193-7B7C-46A6-BB72-DB618FA1F4F6.png (same mobile list/count17 design).

- [ ] Apply this visual language to the main Hub's principal panels/cards and relevant dialogs across the system. Maintain clear hierarchy/readability; avoid outlining every table cell. Use shared styling rather than separately tuned copies. Keep venue accent colours configurable in the future neutral product.
- [ ] Audit all closing X buttons/tiles: main Hub panels, registration, messages, Nakka/transfer/event-control and identity dialogs, plus mobile/kiosk equivalents. Current versions differ in shape, font, colour, dimensions and placement; transfer currently also has a plain CLOSE control.
- [ ] Define one standard close control consistent with Beauty: shared tile treatment, X icon, dimensions, corner style, padding and top-right placement; consistent hover/focus/disabled states and adequate touch target. Keep a clear accessible Close label and keyboard behavior.
- [ ] Keep close controls visible/reachable in long scrolling dialogs and on phones/tablets. Preserve cancel/unsaved-change and in-progress-save protections; a visual refresh must not bypass save guards.
- [ ] Review desktop, mobile and kiosk screenshots for consistent gold borders, spacing/corners and closing controls before acceptance. Gold remains the current AIK Beauty reference; neutral venue themes are later work.

Status: AGREED / NOT IMPLEMENTED. Part of the remaining UI consistency work after Nakka reliability and seeded pools; no priority change or app-code edit in this requirements update.

## Wishlist — configurable commercial Beauty product

Added28Oct2026 by Alessio. FUTURE PRODUCT WORKSTREAM, not implemented and not a blocker for the current AIK release. Preserve priority: Nakka reliability → seeded pools → remaining core display/release checks.

- [ ] Create a neutral base product for other venues/pubs, shipped with default fonts, colours and logos/placeholders; preserve AIK as a venue theme rather than the product's fixed identity.
- [ ] Add an organiser branding/settings screen: venue/event names, logo, colours, readable font choices, language, contact details and player-facing text. Apply consistently to Hub, Beauty Live, kiosk, mobile and confirmations. Validate contrast, long names and mobile/cast readability. Review rights before redistributing AIK/custom fonts or sponsor artwork.
- [ ] Move venue-owned configuration out of source: customer/project identity, sheet/storage, Nakka league/event targets and credentials. Preserve explicit target validation and TEST/production separation; never solve configurability by removing guards.
- [ ] Offer a standalone core Hub for event/player management. It must work with Nakka, kiosk and remote modules disabled; current TEST registration context still depends on Nakka-specific helpers, so this needs deliberate refactoring.
- [ ] Make Nakka integration, remote registration and kiosk registration separately enableable modules, with clear dependencies. Consider Beauty Live/stats/pool-seeding packaging separately rather than assuming the price/module structure. Seeded pools may require league stats or another supported data source; explain that dependency.
- [ ] Support a commercial model of core Hub plus optional recurring add-ons. Nakka add-on can use the customer's own API account/subscription and backend-only credentials. Keep Beauty's integration fee separate from provider fees; verify provider permissions/licensing before offering resale or bundled access. No price, vendor approval or payment implementation is implied by this wishlist.
- [ ] Separate purchased entitlement, organiser enable/disable preference and operational health/configuration. An available API is not proof of a paid Beauty module. Enforce subscription/module access on backend actions as well as UI, including public remote/kiosk URLs. A customer-editable Apps Script/source copy cannot alone provide tamper-resistant subscription enforcement; decide hosted/service-controlled backend versus customer-owned installation before building billing.
- [ ] Define trial, activation, renewal, cancellation, expiry/grace and temporary billing outage behavior without losing registrations or interrupting an active event unexpectedly. State who pays for hosting/support and whether kiosk access is licensed by venue/device; commercial details remain undecided.
- [ ] Isolate each venue's players, events, credentials, branding and access. Define customer onboarding, administrators, backup/export, deletion/offboarding and upgrades. Multi-venue tenant architecture is not currently implemented.
- [ ] Test a second fictional venue from a clean setup with synthetic data: generic branding, core-only, each module independently enabled/disabled, expired entitlement, data isolation and recovery. Keep production AIK/JDC untouched.

Current assessment from inspected source28Oct: reusable Hub/Live/registration modules exist, but branding, approved TEST project/sheet identities, Nakka league and TEST event targets remain explicitly tied to AIK/current environment. Commercial neutrality and subscription enforcement require a planned productisation phase; no percentage-complete or finished sellable-product claim.

## Preserved direction — Beauty Multi-Cup

- [ ] Keep the live Måndagsdartarna setup safe; clone for Multi-Cup development.
- [ ] Support a prospective client at the same venue with similar Nakka configuration, running at least two and sometimes five or six cups weekly.

This is a requirements and decisions record, not a fresh code audit or a complete inventory of every historical Beauty task.
