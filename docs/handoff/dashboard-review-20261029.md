# Dashboard review —29 October2026

TEST candidate for confirmed owner baseline59600f7, branch recovery/2026-10-28.
One Google HTML output changes; other18 current Google files stay byte-identical.

- Compact Message column: every nonempty message opens from READ in the existing popup.
- Source labels and Remove buttons have independent aligned tracks.
- Narrower status selectors, retaining20px labels and44px minimum control height.
- Table fits its container; player rows scroll vertically, with no sideways scrolling.
- Existing sticky column header/control-row behavior is retained.
- Column headings26px AIK Condensed Bold, padding8px top/bottom, shorter line height.
- Summary labels25px AIK Condensed Bold; totals50px AIK Siffror Regular.
- Long names wrap; all six columns remain. At narrower widths Source and Remove
  stack consistently within their cell. Native viewport review is still required.

575 existing regression tests pass. No new implementation-mirroring tests added
for this reversible presentation change. Generated Hub build passes.
No Nakka, registration/status backend or production changes.

Follow-up: Source heading and the fixed Source/Remove tracks centred inside the existing column. Owner baseline d8b4e87; Google layout upload readback verified2026-10-29T15:45:40.775Z. Same fonts, widths, sticky headers and control actions. Native visual check remains pending.

Combined polish follow-up29Oct2026, owner baseline d8b4e87. Includes the uninstalled
Source/Remove centring update. Registration names remain yellow; only the pinned
new-name option retains a yellow border with white text. Search field is white
with dark text; ordinary names have very faint separators. Summary cards are
more compact while retaining25px labels and50px totals. The separate review
banner is removed. A real REVIEW button sits inside Needs Attention and appears
for saved issues, unavailable/incomplete checks or refresh errors; a verified
clear event hides it. Existing checks and modal review remain unchanged; focus
returns to Dashboard if a cleared review button is no longer visible. Public
kiosk and remote source/styles are unaffected.575 tests and inventory to be
recorded in evidence/dashboard-polish-20261029; native review remains pending.
