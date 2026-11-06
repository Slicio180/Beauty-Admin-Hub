# Native Round Robin TEST compatibility — 5 November 2026

Owner screenshots and public read-only API inspection confirm registration TEST t_QHaG_7792 enables rr_setting.round_robin=1 and has an empty rr_table. Fixtures is disabled. The prior planner only supported lg_setting.league=1, so 718 passing synthetic tests did not qualify the actual registration TEST format.

This correction supports native rr_setting/rr_table separately from existing Fixtures. Native Round Robin performs no league/schedule API calls. The full group setting is retained, only group count/size change. Placement-dependent rr_seq/rr_order/rr_board/rr_disable are cleared with the new table per the provider contract. Knockout game rules, final overrides, round limits, entries, event identity and status are preserved. Format review labels native pairings correctly.

All existing staff identity, session, date, roster, statistics, occupied table/results/ranks, optimistic revision, approval expiry, audit and no-retry guards remain. Six new executable cases cover native saves, both knockout rules, invalid formats, occupied/stale state, uncertain readback and mixed 3/4-player groups.

API reference: https://push.n01darts.com/api/v1/n01_api_manual_en.html (settings and brackets; rr_table companion fields; Fixtures scheduling restrictions).

Local full test and reproducible installer results are included in the package verification folder. Google upload and native send/readback acceptance remain PENDING. Production unchanged; no Git commit or push.
