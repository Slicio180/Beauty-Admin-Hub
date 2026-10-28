# Rollback procedure

RECONSTRUCTED; restoration rehearsal UNKNOWN / UNVERIFIED. Source rollback and data rollback are separate operations. Do not assume reverting Git restores Apps Script or Sheets.

Before deployment record exact prior Apps Script version, deployment settings, frontend bundle/host, native spreadsheet backup, snapshot hashes, formulas/validations, trigger inventory and approval. Missing recovery material blocks release.

If an approved operation fails: close write gates, stop repeat requests and capture state independently. Determine whether any mutation occurred. Compare with the pre-write snapshot; record deviations and unknowns. Obtain approval for any real restoration not already explicitly covered. Restore the previous deployment version/settings and frontend artifact through verified host-specific steps. A full Sheet copy can change IDs and integrations; do not overwrite the whole sheet as a default rollback. Review a bounded data-restoration plan preserving subsequent legitimate changes, formulas and validations. Independently read back, compare expected state, confirm gates FALSE, retain failure and recovery evidence and commit the audit. Never erase a failed run to make the audit appear green.

No exact hosting command or automated rollback is claimed. Qualify this procedure in isolated TEST before a release can be called programmer-safe.
