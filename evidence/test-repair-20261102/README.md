# TEST regression repair — 2 November 2026

676/676 tests PASS; test inventory PASS (676 cases, 54 files). Recorded logs included. Removal target code requires the current dedicated registration TEST event title, matching its existing t_QHaG_7792 ID. No change to league, project/sheet identity guards, date/started/bracket checks, locks, single-use confirmation, uncertain-write handling or journal retention.

Only registration/transfer/attention/removal test fixtures migrated from the old event. Planner/stage fixtures and source remain on their separate target. Removal wrong-target test additionally rejects the obsolete event title. Live launcher test now exercises its actual current GET/date/auth checks and rejects wrong ID, league, title, invalid dates, HTTP failure, changed Hub date and expired authorization.

Installer tests in isolated copies now preserve only the original backup file needed by the preservation test, rather than excluding it with all other backups. The original hash assertion remains unchanged. Missing/changed originals are not manufactured or ignored. Installer requires both a clean post-install full suite and clean inventory; failures restore applied source files.

Native removal still needs controlled TEST browser/API acceptance after upload. Offline tests use mocked Sheets/Nakka. This does not prove production readiness. No Google/Nakka requests, commits, pushes or deployments performed.
