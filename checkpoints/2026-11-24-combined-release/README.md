# Combined Beauty release — 24 November 2026

This assembles the ten already-agreed components on verified LIVE v43. No AIK Internal CP006 or multi-club features are included.

Application identity: `52c9703a29d17620071384af399fddda562d81cefdecc62abab75415f4fe6fa9` (37 GS/HTML files, excluding the environment manifest). Immutable private TEST version 2 and all 38 staged LIVE files were independently read back and match exactly. The private TEST manifest uses MYSELF; intended LIVE uses ANYONE_ANONYMOUS. Other manifest fields are identical. The new scopes support owner-bound triggers and account-email verification; TEST authorization is complete. Google now requires the actual new LIVE permission grant; the running LIVE deployment remains v43 and no LIVE clock is installed. Deployment of the existing URL and runtime verification follow that grant.

[Acceptance and precise limits](ACCEPTANCE.md) · [Public coverage](PUBLIC-COVERAGE.json)

The source includes the final cast-label RPC correction and accepts omitted default group labels only after validating authenticated access, verified pool identities, board/group bounds and unchanged draw identity. The legacy loaded Hub can complete its label-only retry without resending pools. 323 distinct local checks pass, including five cross-file RPC/label checks; affected planner/client/restoration tests and syntax were rerun.

`application/` contains 35 public GS/HTML files and the intended LIVE manifest. Two historical recovery files stay private; their full hashes are in PUBLIC-COVERAGE.json. Native helper code and raw private evidence are excluded. The three display regression harnesses that depend on captured event records also stay private. Published tests that refer to private baseline/fixture paths require the private continuation package; this is source evidence, not a standalone public deployment package. `assemble.py` likewise uses preserved private baseline inputs. Its output was compared with the installed candidate and all 38 files matched; immutable version 2 also matched after freeze.

The old 908-file checkpoint remains intact. This publication is a child of its safe public commit, not a push of the old local repository history.
