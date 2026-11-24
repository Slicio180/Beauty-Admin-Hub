# Beauty source checkpoint — 24 November 2026

This checkpoint resumes the interrupted, owner-approved GitHub save. It preserves 882 selected source, test, patch and source-manifest files from the checkpoint 80 continuation package and its four source packages. Every included file retains its original bytes. Original TEST, Alternate Format TEST, the scoped release application and AIK Internal remain distinct.

## Start here

| Snapshot | Location | Status |
| --- | --- | --- |
| Consent/formula release | [Application](reference/beauty/RELEASE-CONSENT-20261123/application/) and [complete frozen manifest](reference/beauty/RELEASE-CONSENT-NATIVE-20261123/final-acceptance/FROZEN-APPLICATION.json) | Scoped native TEST accepted; full 33-file application frozen; LIVE promotion pending |
| Public release coverage | [File-by-file coverage](RELEASE-PUBLIC-COVERAGE.json) | 31 unchanged application files public; two historical recovery files retained privately |
| LIVE v42 baseline | [Captured source](reference/beauty/RELEASE-AUDIT-20261123/live-v42-readback/) | Historical verified baseline; this backup performs no deployment |
| Original TEST | [Selected 23 November readback](reference/beauty/RELEASE-AUDIT-20261123/original-test-readback/) | Later sign-in, monitoring, instructions, speed, import and formula work; not a complete production release |
| Alternate Format TEST | [Selected 23 November readback](reference/beauty/RELEASE-AUDIT-20261123/alternate-test-readback/) | Later pool, roster and CSS work; reconciliation with Original TEST remains open |
| AIK Internal | [Separate source package](source-packages-expanded/AIK-Internal-Development-20261115/AIK-Internal/) | Separate tournament/master-list workstream; no Monday data integration |
| Earlier display, speed and isolation work | [Expanded source packages](source-packages-expanded/) | Historical source and test snapshots; retain their original acceptance scope |
| Remaining work | [Current status](../2026-11-24-status/STATUS.md) | The wider project is unfinished |

## Preservation and publication scope

The owner approved publication of internal project/workbook identifiers and credential-handling source. Actual passwords, OAuth tokens, private registration/consent/message records, raw operational evidence and account-bearing historical fixtures are excluded. The complete original source and evidence remain in the owner's private continuation package.

The frozen application contains two historical recovery files with captured player/account context: `BeautyRestoreOriginal.gs` and `LiveRegistrationRecovery.gs`. Their exact names, sizes and SHA-256 values are recorded in the frozen manifest and public coverage report. Their source is preserved privately, unchanged. The public subset is not the complete deployment artifact and must not be deployed as a substitute.

Firebase client configuration remains unchanged where it is part of the application. It is project configuration, not a password or server authorization credential; see [Firebase's API key documentation](https://firebase.google.com/docs/projects/api-keys). No Firebase settings or access restrictions were changed by this backup.

`SOURCE-INVENTORY.json` records every copied file, its size, SHA-256 and Git blob identity. Historical manifests may reference private files omitted from this public view. Some tests require those private fixtures or their original folder layout; do not alter assertions or report the full historical test count as reproduced by this subset.

## Release rule

The application accepted in TEST must reach LIVE byte for byte, with no change of a single comma. Keep environment configuration separate. A code change requires renewed TEST acceptance. GitHub publication is a backup action; it is not owner approval for LIVE deployment.

No Google source, workbook, Form, Nakka event, trigger, credential or deployment was changed during this save. The latest recorded LIVE version is 42. Completed recovery fixtures remain complete and must not be replayed.
