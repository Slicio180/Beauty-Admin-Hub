# Provider reference checked 6 November 2026

Primary source: https://push.n01darts.com/api/v1/n01_api_manual_en.html

Relevant documented endpoints: `tournament/get`, `tournament/standings`, `tournament/end_group`, `tournament/update`, `tournament/assign/update`, `tournament/badge/update`, `autopilot/get`, `autopilot/update`, `tournament/result/update`, `tournament/match/release`, match data and entry endpoints.

Qualification settings and actual bracket assignment are different operations. The engine prepares table updates for explicit reserved slots. Updates replace structured fields; optimistic revision checks and preserved unrelated values matter. Provider-written results handle progression. Automatic board allocation is provider autopilot, not a second local scheduling engine. Configuring it locally in rehearsal does not demonstrate actual automatic assignment. Finals/round-scope, active-game identities and native correction behaviour remain acceptance items.

No provider request or mutation was made by this development project. Documentation was read only; all executable checks use synthetic fixtures.
