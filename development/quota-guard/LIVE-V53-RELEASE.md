# Beauty Hub LIVE v53 — approved layout baseline

The owner accepted the deployed layout on 27 November 2026. LIVE v53 is the current UI baseline; v47 remains the underlying functional release. This document supersedes v47's version status, not its functional acceptance record.

## Current interface

- Player Averages, the player-sort dropdown and Search players share one row, equal widths and heights, and matching AIK Display text styling.
- Pool Planner has five equal-width sections: Players In, Players per Pool, Pool Draw, Boards and Pools.
- The controls inside those sections align on a common 44-pixel-high row. The 3 and 4 buttons are compact and equal-sized.
- Boards 1–16 and Generate Preview stay together on one row. Narrow viewports may scroll the row horizontally.
- Pool Draw, the player selector and estimated-average input use yellow outlines and black backgrounds. The averages dialog uses compact fields and whole-number presentation.
- Player selection remains alphabetically sorted using Swedish collation. Kiosk and mobile registration retain the yellow missing-name button.

## Verification and limits

The native signed-in TEST dashboard measured all three controls at 220 × 44 pixels, at the same vertical position, with matching 20-pixel AIK Display text. The five planner inner controls measured 44 pixels high at the same vertical position. The preceding board-row check confirmed all 16 board buttons and Generate Preview on one line without overflow at the tested desktop width.

All 30 inline scripts parsed successfully. The changed Hub template was read back exactly from TEST and LIVE. Google confirmed version 53, and the published LIVE alignment stylesheet matched the tested stylesheet exactly. A fresh signed-in LIVE visual check was not repeated after the final reload; the owner subsequently reviewed LIVE and accepted the result.

The v48–v53 work changed interface templates and presentation only. It did not constitute another backend, registration-load or full-event acceptance run. It does not establish a 64-player capacity guarantee.

## Operator notes

Refresh the existing Hub to load the current layout. Player Averages now sits beside sorting and search. Generate Preview remains after board 16. Existing registration, recovery, draw and provisional-average lifecycle rules remain as documented in [the v47 release](LIVE-V47-RELEASE.md).

Keep this compact layout as the accepted baseline: size controls for their content, avoid unnecessary filler, and preserve consistent text and alignment.

## Handover

The complete current source and validation evidence are retained in the private checkpoint. Its latest Hub template is under `alignment-ui/application/LiveHubView.html`; `alignment-ui/before/LiveHubView.html` retains the preceding v52 template. Earlier folders are historical snapshots, not the current Hub template. Other application files retain their previously accepted versions.

Version 51 was briefly published and rolled back while the board-row requirement was clarified. Version 52 applied the clarified one-row board layout; version 53 aligned the dashboard controls and planner contents. Do not reintroduce the superseded wrapping layout.

Separate unfinished work remains outside this UI release: the combined 64-player event capacity assessment, Mobile Player Hub prototype integration/acceptance, and AIK Internal acceptance. Do not reopen completed Hub release checks merely because an older task list still includes them.
