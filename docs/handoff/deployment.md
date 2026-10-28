# Deployment procedure

RECONSTRUCTED runbook; NOT QUALIFIED. This checkpoint is documentation/local-test work, not a deployable release. Complete missing deployment mapping and rehearsal first.

1. Obtain explicit approval for the exact environment and operation; production separately.
2. Record clean commit, inventory, green full suite, audit entry and reviewed diff. Resolve or explicitly accept documented failures before proceeding.
3. Independently inspect target project/deployment/Sheet identities, permissions, source and all triggers. Compare deployed files against reviewed repo; preserve and reconcile live-only changes. Record immutable source hashes and current deployment version/settings.
4. Export native backup and snapshots; verify restoration procedure without live mutation. Record frontend host and prior artifact. Hosting provider/process is currently UNKNOWN / UNVERIFIED: do not invent a publish command.
5. Build/upload only the reviewed target project's file set. Apps Script source folders are separate projects, not one combined upload. Never overwrite unrelated scripts or run setup/reset functions.
6. First qualify isolated TEST, with gates false. Use explicit separate controlled approval before any TEST write. Follow all ten write controls. Do not treat owner-only UI access as write authorization.
7. Record deployment ID, version, source digest and access/execution settings. Confirm gates false and perform only approved smoke checks. No default production smoke test may register or change status.
8. For production release obtain separate approval after TEST qualification, confirmed backup/rollback and security review. Preserve existing deployment URL/settings unless explicitly authorized otherwise.
9. Record outcome, observations, evidence hashes, gate state and release commit. If uncertain, stop and follow rollback guidance.
