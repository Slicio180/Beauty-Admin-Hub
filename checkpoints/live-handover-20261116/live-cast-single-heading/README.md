# LIVE cast headings and wider tabs — prepared, not published

Requested 16 November 2026: remove the duplicate event/date beside the four tabs, use that width for longer tabs, and enlarge SPELARE/SNITT while retaining automatic fitting as the roster grows.

Only LiveCastView changes, through one scoped CSS block. The event/date remains in the top header. When the panel enters fullscreen and the outer header is absent, its own caption remains visible. Fullscreen and menu controls stay at the right of the normal navigation row; the four equal tabs flex into the released width.

The player-list labels receive an independent responsive size: 24–36px on wide compact layouts, 22–30px for dense rosters, and 18–24px below 1000px. Navigation label sizes and player-name sizes are unchanged.

## Scaling checked before changing the style

The existing JavaScript was inspected. It selects one to four columns, uses 8–16 rows on wide screens, measures the actual heading height, and fits player rows into the remaining height. Font readiness and screen resize trigger redraw. More than 32 total players sets the existing dense-roster flag.

All JavaScript is byte-for-byte identical before and after this patch. The model check covers 0, 8, 16, 32, 33 and 64 players. Source parsing and the existing heading-height/resize hooks passed. This is source and model verification, not a successful rendered browser test: Chromium could not launch because local socket creation was blocked. `check-layout.cjs` retains the attempted isolated visual check, with all remote requests disabled. Visual acceptance remains pending after publication.

## Install in the existing LIVE project

Download Beauty-LIVE-Cast-Headings-20261116.cjs to Downloads and run:

```sh
cd ~/Downloads && node Beauty-LIVE-Cast-Headings-20261116.cjs --approve-live
```

The installer accepts either the exact previously verified v40 source or the exact prepared workbook-repair source if that repair has already been installed. It preserves whichever version is present; it does not install, revert or remove the workbook repair. Unknown changes stop before upload. The fixed script/deployment identities, full source backup, readback and frozen-version publication checks are retained. Local release checks verified that only LiveCastView changes on both recognized baselines.

No production source was uploaded during preparation. No Apps Script function, Nakka write, spreadsheet write, player registration or event change was run for this UI task. A PRODUCTION_DEPLOYED_VERIFIED owner log is still required to confirm publication. The canonical Beauty-Handover.zip and GitHub were not changed; this separate checkpoint preserves the complete UI patch and its checks.
