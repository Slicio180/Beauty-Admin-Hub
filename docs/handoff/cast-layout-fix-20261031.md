# Combined footer and equal-card correction —31October2026
Owner screenshots15:03:45and15:05:29 show oversized Grupp heading and variable
card row heights with four groups per page. The earlier grid used fractional
tracks and min-height100%, stretching cards to consume space. Replaced venue
pool tracks with fixed236px for three-row pages and288px for four-row pages,
independent of four/six page size; align-content:start,min-height0,height:auto.
Blank fourth rows retained in mixed pages. Empty area stays below. Smaller
22px AIK Condensed bold Grupp heading; Bana26px unchanged.

Includes the pending footer correction (single reserved footer, hidden duplicate
player footer, centred paging and protected fullscreen errors) from prior ZIP.
Accepts either exact installed PoolCards or optional prior Footer correction.
No need to install both packages. Google preparer accepts either last verified
PoolCards or exact Footer outputs. Does not accept unrelated/mixed edits.

648tests/52files PASS. Existing layout contract extended; no additional test
count invented for CSS edits. Both profile installers, repeat guard and mock
19-file readback rehearsed. Real native pixel sizing/review and actual new
Google readback remain PENDING. No commit, push, provider/production mutation.

Owner15:11:38 screenshot: fullscreen title left of physical screen centre.
Grouped event+buttons into right-side header actions and replaced five grid
tracks with equal flexible sides around the title. Event caption ellipsises
inside its own track; full event text remains in DOM. Main title stays in centre
track, logo left, controls right; narrow controls wrap without covering title.
Existing footer/CSS contract extended, test count unchanged. Device recheck pending.
