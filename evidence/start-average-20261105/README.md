# Round Robin START averages — 2026-11-05

Cause: verified cast metadata always emitted lg_ group IDs while native Round Robin uses rr_. Match format from the original verified send audit, requiring exactly one supported group mode. Frozen averages and exact membership checks remain unchanged. Unknown averages remain unknown. No Nakka or production writes.

Baseline: 731 tests passing. Updated: 733 tests passing; inventory PASS. New VM integration tests join verified metadata to native Round Robin live projection, check 46.21 and 40.83, missing averages, Fixtures compatibility and ambiguous mode rejection. Google TEST save and visual acceptance pending.

Owner runtime evidence preceding this patch: 2026-11-05 20:03:49 local execution succeeded with success/readbackVerified/reconciled true and providerWrites 0. Original audit POOL-3015b0364c854724bd05; receipt POOL-0afd7471f01f448f8336. Do not resend pools. Google-only temporary owner runner and userinfo.email scope remain outside this local patch.

Hub has no Start competition control. This patch changes display metadata only. Start in the named Nakka TEST event after display acceptance; Hub start control remains a separate feature.
