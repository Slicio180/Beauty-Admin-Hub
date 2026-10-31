# Four-group fill —31October2026
Owner baseline: LiveApproved,658testsPASS,19GoogleTESTfiles readback verified
2026-10-31T16:03:22.415Z, branchrecovery/2026-10-28, checkpointad64659.

Removed the small SPELARE span beside count, from both source shell routes.
The same live counter is docked normal/fullscreen: yellow number remains;
KVÄLLENS SPELARE heading and accessible Antal spelare label remain.

Four-group selection with a full two-column/two-row page expands player row
space to fill actual stagePreview height. Pixel remainder shared across tracks;
identical pair sizes have equal heights (at most1px difference). Mixed groups
retain matched neighbour row count, lower3/3pairs stay proportionally shorter.
Typography capped at existing52px-row values so stretching cards does not create
huge names or averages, while vertical spacing grows. Six-group sizing remains
unchanged. Short viewports use existing readable minimum and scroll fallback.
Narrow single-column mode and final partial pages retain natural sizing.
ResizeObserver calls same fit function with selected size stored ongrid.

Start/Nu captions use header/4 pixels, numeric average header/2 pixels: normal
12/24px andcompact10/20px. White Start/yellow Nu unchanged; no data mutation.
659offline tests/52filesPASS, inventoryPASS; newGoogle upload and native
review pending. Owner-invoked updater backs up and validates exact LiveApproved
baseline, then stages/uploads/readsback fixedGoogleTEST19files, preserves13
otherfiles. No Git commit/push, production or Nakka writes. Six-hourloginheld.
