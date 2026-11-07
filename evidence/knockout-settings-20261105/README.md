# Native knockout settings correction — 5 November 2026

Read-only native TEST event response showed both t_setting and s2_setting omit drawMode. Both have valid limit=1, first to 2 legs and 13-round cap. t_setting.game_setting contains final override round=-1, first to 3 legs. Previous local fixture always supplied drawMode=0 and did not reflect this provider omission.

Validation now accepts an absent drawMode without adding or rewriting the field. Explicit values still must be numeric 0 or 1. Every other setting and final override remains byte-equivalent in the settings object, except approved bracket capacity changes. Existing legs/sets/schedule checks remain. Two new executable cases cover native omission and invalid explicit values.

Local evidence packaged with installer. Actual Google TEST handoff and provider write/readback acceptance remain pending. No remote writes and production unchanged.
