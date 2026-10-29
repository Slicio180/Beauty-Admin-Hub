# Approved white headings — 29 October 2026

Owner baseline:14ef9f7, recovery/2026-10-28. Previous Google TEST update readback
verified19 files at2026-10-29T18:39:45.047Z. Owner screenshot19:47 confirms30-row
stats layout, fixed columns and two-line long-name behaviour. TV review pending.

This patch changes presentation only:
- Beauty Live column headings:24px AIK Condensed Bold, pure white, centred in
  each individual column.18px below700px. Header40px high.
- A fine1px AIK-yellow vertical line after each panel's Poäng column, from
  headings through player rows. Existing grey Snitt/Poäng divider remains.
- Main Hub card labels and table headings pure white. Existing25px card labels,
  26px table headings and50px card totals retained.
- PLAYERS becomes REGISTERED PLAYERS; IN PLAYERS becomes PLAYERS IN.

No new backend behaviours, roster/date writes or Nakka calls. Prior stats refresh,
paging, popup and registration logic unchanged. Google overlay changes only
HubTest.html and BeautyLiveTest.html, preserving the other17 files.579 regressions
and inventory recorded; native colour/size review pending. Chromium unavailable
for local visual review, as recorded in the previous package.
