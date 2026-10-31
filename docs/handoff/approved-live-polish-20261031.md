# Approved Live follow-up — 31 October 2026
Starts from installed LiveRefine with owner local656tests PASS and full19GoogleTEST
readback at2026-10-31T15:36:54.150Z, branch recovery/2026-10-28, checkpointad64659.

Owner approved the raster mockup after screenshots16:40,16:44,16:48. Code only
this scope: one3px yellow BANA line,133.333% of labelwidth, top-5px relative to
labelbox (closer than prior-7px); no border/glow/second pseudo-line. Name font
uses floor(row*.44), with bounded two lines leaving at least4px row breathing
room.52px row gives22px font and23px line-height;51px gives22/23; shortest40px
row gives17/18. Width truncation remains existing measured full-stop behavior;
event average stays at right and no third name line is added.

Selected view title replaces BEAUTYLIVE in original main header at46px desktop,
38px below1100width,26px small. Playercount border/background removed, number
same46/38/26size and yellow, SPELARE white. Fullscreentitle/count40/32/26.
No repeated lower heading. Controls and dropdown dock to tab row outside fullscreen.
On fullscreenchange the SAME title/count/actions nodes move into selected panel,
keeping browser fullscreen menu access, listeners and countupdates. Exiting docks
back. Collapsing selected tab hides controls/count and shows neutral BEAUTYLIVE.
Nested menu, automatic feeds, independent windows and paired pool fit retained.

658offline tests/52files PASS, including real node movement in DOM testdouble,
menu access after fullscreen transitions, collapsed/reopened views, geometry
budget on narrow/mixed/compact sizes. Pixel-perfect AIK glyph fit and actual
Google/browser acceptance still pending. Generated mockup is not native evidence.
Six-hour login/session request remains ON HOLD. No production changes, Git
commit/push, Nakka provider writes or arbitrary event migration.
