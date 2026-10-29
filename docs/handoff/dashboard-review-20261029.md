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
