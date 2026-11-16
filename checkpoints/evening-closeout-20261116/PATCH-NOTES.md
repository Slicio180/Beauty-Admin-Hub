# Pending third-place parser correction

The provider can return a partially populated third-place row as an indexed object rather than a complete two-element array. Rejecting that normal intermediate state aborts the shared projection for all competition views.

The patch accepts only row positions 0 and 1, normalises absent positions to the existing pending-player state, and retains validation of supplied player identities and values. It does not invent an opponent, score or result. No styles, polling, registration or draw logic change.

Validation retained with the private working source: 30 offline checks, including the original failure, both pending positions, complete pairs, transition to a known opponent, malformed rows, identity mismatches, unrelated live matches and finished matches. These are not native browser or installed-source verification.

The patch uses zero context to avoid including operational configuration. Apply only to the reconciled matching source in TEST; do not force an application to a different baseline. Broader stage isolation, automatic snapshot renewal and compact comparison-message recovery remain separate work.
