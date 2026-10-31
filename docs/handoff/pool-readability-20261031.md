# Pool card typography —31October2026
Owner native16:12:21 screenshot: lowerBANA, restore thin text-width accent,
centreGRUPP, enlarge averages to approximately half a row, enlarge names and
move player group-event average to the right of its name if needed.

Header group heading is its own centred header child, independent of right-side
averages. BANA bottom-aligned with padding, so the single1px text-width pseudo
accent stays inside the clipped card instead of above its top boundary. Start
and Nu retain white/yellow and existing frozen/weighted semantics. Captions13px
with numeric values at half header height24px normal/20px compact. Missing values
remain dashes. No board labels or provider identities change.

Player identity cell has two columns: bounded first-name/surname lines left and
its pool event overall average right. Name font is floor(rowheight*.4), plus1px
lineheight; average target is floor(rowheight/2). At52px rows:20px names,21px
name lines and26px averages; at51px compact mixed rows:20px names/25px averages.
Match average stays below the score and uses the same target half-row height.
Very wide match averages reduce only as necessary to fit their cell, with a14px
minimum. Font readiness and viewport resize remeasure as in existing lifecycle.
No separate third name line; original full name/dialog remains accessible.
No new test count for a reversible typography change: existing layout tests now
check target average ratio, increased name size, centred group, header value
nodes and right-side event average structure.656tests/52files plus inventoryPASS.
Actual font pixel fit/native acceptance remainsPENDING; this is not a generated
mockup treated as browser evidence.

Menu feedback16:17/16:20: the three-line icon now anchors a compact dropdown
inside the header's fullscreen subtree. It overlays rather than consumes card
space. Escape, outside pointer and view/fullscreen changes close it; keyboard
focus returns to icon on Escape. A nested Lista dropdown contains sorting and
Visa snitt in place of the modal. Explanation paragraphs removed; freshness still
reported in the existing footer. Test-load control hidden/internal, normal load
always automatic. One Uppdatera action refreshes the selected player list or
competition feed, without starting or changing Nakka games. Auto live refresh
remains enabled; the redundant user checkbox is hidden. Group rotation and
4/6group selection shown only for pools. Unknown ranking remains disabled.
Two new executable menu cases; no tests added just for the font CSS.

Starts from installedLivePolish atad64659 with656tests and Google19-file readback
31Oct15:07:52.397Z. One-command updater backs up, installs, builds/tests/inventory,
stages only fixedGoogleTEST with exactLivePolishbaseline, pushes and reads back
all19files. Separate standalone retained, no Git commit/push, production or
Nakka mutations. Runtime board-label properties and draw identities untouched.
