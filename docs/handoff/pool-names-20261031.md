# Fixed two-line pool names —31October2026
Owner: first name on top, surname below; shorten overflowing second line with a
full stop; keep all cards equal. Added only to public pool matrix cards. Split is
first word versus remainder of Nakka display name (no structured surname field).
Multipart/compound surname remainder is preserved before measured truncation.

Display-only module uses actual DOM text width after insertion; binary search
finds a fitting prefix plus one literal period. Grapheme segments avoid cutting
combining Swedish letters/emoji. A fitting line is not abbreviated; a single-name
player reserves the empty second line. An unusually long first word is bounded
the same way. Two21px name lines, separate18px average plus margin/padding; fixed
72px minimum table row. Existing table/grid stretching retains card alignment.
The full name remains in data, title and accessible name; keyboard Enter/Space
or click/tap opens a Swedish full-name dialog inside the fullscreen subtree.
Font readiness/resize rerenders and remeasures using existing shell lifecycle.
No fixed-name formatting is applied to organiser/player registration identities.

640tests/51files,3new name cases; original637cases pass, including unchanged
provider text safety and running averages. Test inventory and dated evidence
retained. Native pixel/device acceptance remains PENDING. No Google upload,
provider mutation, production or GitHub writes. Local package is a guarded patch
on the already-installed CompleteTEST build (baseheadad64659 with known source
changes). It does not rerun the original Complete installer or replace the
separate standalone folder. Other requested screenshot layout changes (2x3,
Legs/Rank/white position numbers/Alla matcher) are NOT included in this name-only
patch; Google upload stays paused until that design is reconciled. Do not imply
this patch already reproduces the full revised screenshot.
