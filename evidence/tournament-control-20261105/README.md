# Tournament control — fixed Identity TEST only

5 November 2026. Staff Event Control and the running Pool Planner can open a compact two-column qualifier review. This first increment supports the two saved pools in t_QHaG_7792, running native RR, approved top-two/rest rules, all groups complete, unique provider ranks, exact membership, blank knockout brackets and no knockout results/guides/orders. Other draw sizes are explicitly refused.

Provider tournament/end_group completion flags must agree with complete standings. Review uses standings win/lose (legacy w/l fallback). The top two per pool advance to Slutspel 1; remaining players enter Slutspel 2. Rank tier then pool order feeds a standard seed layout. With two pools, Slutspel 1 opens cross-pool. Proposed opening matches and byes appear before approval. Byes advance only over structurally empty subtrees; unresolved matches never advance a winner. Secondary-stage bye priority follows rank then saved pool order and is visible in review.

A staff/session-bound five-minute ticket, fresh full-event/standings comparison, prewrite audit, durable ATTEMPTED journal, optimistic updateTime guard, one fixed-target tournament/update of t_table and s2_table, full unrelated-field preservation check, receipt and verified journal protect the write. No automatic retry after uncertainty. No actual provider mutation has been performed during development. Existing provider credentials stay server-side.

Primary API reference checked 5 Nov 2026: https://push.n01darts.com/api/v1/n01_api_manual_en.html — tournament/update and bracket/bye caveats. Assignment settings save rules, not the actual knockout players. The API requires writers to advance byes explicitly.

Not included: badge/board routing, autopilot, automatic tournament progression controls, manual result editing, game deletion or unlock. Nakka remains the scoring engine. Production is unchanged. Owner Google upload and device/native assignment acceptance remain pending; synthetic tests do not prove a deployed write.

Baseline: 752/752 tests. Added executable provider-fixture checks cover mixed qualifiers, exact preservation, bye advancement, cross-pool pairings, duplicate/occupied/uncertain blocking, expiry/authentication, stale event/standings, changed rules and audit failures. Browser DOM fixtures cover review-only opens, explicit confirmation, single write, lock/dismiss handling and uncertainty. Actual browser/device layout acceptance is pending.
