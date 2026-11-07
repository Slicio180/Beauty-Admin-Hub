# Guided Nakka troubleshooting — 2 November 2026

Scope: existing Identity TEST Nakka menu; production untouched.

## Observed baseline (owner device)
- Albert removal preview: 12 seconds (19:25 screenshot).
- Albert confirmation: 37 seconds; removed, league profile retained (19:28 screenshot).
- Alessio confirmation: 25 seconds reported by owner; subsequent read-only comparison showed Hub 0 / Nakka 2, then verified remaining names Eric and Axel.
- After owner manually removed the two Nakka-only TEST entries: Hub 0 / Nakka 0 at 19:36 Stockholm time.

## Implementation
- Whole attention tile opens the existing Nakka menu at its attention section; no separate attention popup in Google TEST.
- Ordered event/players diagnosis, per-player guarded review, and expandable name comparison plus API status. Missing and uncertain entries use existing preview/session/ticket/confirmation guards. Identity ambiguity, uncertain league creation and removal remain blocked with explicit next steps rather than invented recovery actions.
- Success, uncertainty and failures schedule a fresh read-only attention check; an already-running check cannot swallow the post-operation refresh.
- Only read, event, health and comparison transport requests run concurrently. Identical reads are coalesced only while in flight. Writes and ticket-producing operations wait for earlier reads; later reads wait for the write. No persistent client cache.
- Fresh fixed-target provider GETs use fetchAll; adds/removals never enter a batch. No automatic batch retry or fallback after a batch failure.
- Removal derives Hub player rows from the already validated Sheet snapshot, avoiding repeated Hub/master-list reads. Fresh full Sheet snapshots, typed recovery archive, preservation checks and both Nakka readbacks remain.
- Staff timing separates total client wait, server time, Nakka read batches and removal Sheet stages. No credentials, names or provider bodies enter timing metadata.

## Qualification
Local synthetic regression and inventory must pass before the package is released. No Google/Nakka calls, commits, pushes or deployments are performed by the installer. Actual latency improvement and native guided-menu acceptance remain PENDING until the owner uploads four files to Beauty — Remote Identity TEST and measures the same operations. No response-time claim is made from offline fixtures.

Google upload order: HubTestNakkaTransfer.gs, HubTestAttention.gs, HubTestRemove.gs, HubTest.html. Keep all TEST Hub, remote and kiosk tabs closed while the coordinated update is applied, then reopen the TEST Hub.
