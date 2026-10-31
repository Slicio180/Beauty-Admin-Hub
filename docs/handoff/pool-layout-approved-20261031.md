# Approved pool screen —31October2026

Approved in chat: four slim Swedish tabs (Kvällens spelare, Gruppspel,
Slutspel1, Slutspel2), two columns × three equal pool cards. Two examples:
all six groups with three players; five groups with three plus one with four.
The mixed view has a completely empty fourth row in the smaller groups, including
no row number. Row count is based on the visible page, not offscreen groups.
Mockup images are illustrative; results, averages, ranks and names are never
hard-coded from those images. Original AIK assets are embedded by existing build.

BeautyVenuePools renders only the public pool tab; existing legacy renderer is
retained for its separate overview/board workflows. Header retains verified
planned Bana labels and conditional shared-board Grupp. Start is frozen baseline,
Nu is current weighted group average from existing feed. Both remain dashes when
unknown, never clock times. Match-cell averages and player overall averages are
unchanged provider/live projections. Legs totals sum exact result/live scores;
multiple/invalid cells cause a dash. V–F and Rank are Nakka standing values and
may wait for the next full refresh; ranking is never inferred from player order.
Only rank1/2 are yellow. Row-position numbers white. Active match highlight is
translucent yellow in both cells, removed as current on stale/offline/paused data.

Name formatting uses first whitespace-delimited word, surname remainder, and
separate average. Two bounded name lines; overflow measured with actual font and
shortened using a literal period. Full identity is retained in title/aria and a
click/tap/keyboard dialog inside fullscreen. No registration identity is changed.
Card minimum heights protect legibility; shorter screens can scroll vertically
rather than shrinking text below the minimum. On narrow phones the grid becomes
one column and tables may scroll horizontally. No automated pool vertical scroll
is introduced: existing12-second page rotation remains; knockout auto scroll is
unchanged. Helskärm remains INSIDE the opened panel, not in the top tab bar.

646offline tests/52files pass. Six new cases cover all-three/mixed rows, page
scope, provider rank, totals, pair highlight, zero/missing averages, text safety,
and CSS/fullscreen contracts. Existing640cases retain names, provider, shell,
knockout, auth and registration checks. Native browser/device layout, actual
Google readback and real live-game acceptance remain PENDING. No claim of pixel
perfect acceptance from image generation. No provider, production or GitHub write.

Installer is a guarded follow-up on the installed Complete build atad64659.
Accepts either exact Complete alone or exact Complete plus optional Names patch;
refuses a mixed/unrecognised profile, unrelated tracked edits and symlinks. It
backs up, applies only payload, rebuilds, tests, inventory and checks outputs.
On failure restores payload paths. Does not commit; standalone folder preserved.
Updated Google preparer replaces the obsolete Complete/Names prepare sequence;
it only stages a clone of fixed TEST, no upload. All19files read back after owner
upload. Production is never a target. Do not rerun old installers/preparers.
