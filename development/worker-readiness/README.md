# QG013 worker readiness — 26 November 2026

LIVE deployment inspected: version46, existing speed-release description and URL. One owner beautyCombinedBackgroundClock trigger on HEAD; last run displayed 17:40:15, error rate0.36% (execution metric, not registration reliability). No LIVE changes.

Acceptance TEST project19QRTWTPQjNFQD4k23MBnd3HzwQMxcfnno4yMnz_WEFIQNT-_NKBMkAbn: zero triggers. Installed queue baseline SHA256 0a0d9447f5707a8edb3d7a564f58b293eef01e6a892c55de8e69e738bb6e2552; quota dependency SHA256 8a8448c915cbfb7c9f31cf1604584b71e2eaf8a85eacf3678e87a8d36db4c19c match saved evidence.

Change in beautyQueueBackgroundReady_: immediately before trigger lookup insert `if(!beautyQuotaBackgroundAllowed_(config))return false;`. Existing project/owner/enabled/unique-trigger checks remain. Expired TEST permission cannot be classified as ready; LIVE does not need TEST expiry.

14 local cases pass using actual queue/quota functions; registration date/replay/midnight regression passes. Run `node development/worker-readiness/tests.cjs PATH_TO_COMPLETE_CANDIDATE`.

Saved to isolated acceptance TEST HEAD only. First save did not persist when reloaded; detected before deployment, repeated and waited for Saved to Drive. Full reload and clipboard readback then exactly matched candidate SHA256 d1f13b6209d481ad1979707ae3e51ac790a77308f7f80461c48a39a1d621ad29. Not yet deployed or natively exercised with active worker. No registration/provider writes, new triggers or permission changes.

Complete private baseline restored from saved ZIP and verified SHA256 c3205927a0e51146a007733e3591f707024bdc81cae64f5d6f0807f4f6e7e034. Historical baseline preserved. Remaining gates are in ../quota-guard/RELEASE-READINESS-20261126.md. Full installed-source comparison remains pending; only changed queue and dependency verified so far.
