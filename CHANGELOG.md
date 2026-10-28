# Changelog

## HANDOFF-2026-10-25 — local framework checkpoint

RECONSTRUCTED framework: requirements, per-case test inventory, coverage gaps, architecture/environment/data/API maps, runbooks, security rules, audit and handoff/release checklists.

VERIFIED changes: repaired Nakka UI test relative path; added 11 mocked gate/identity/project regressions; added dependency-free npm test scripts. Preserved recovered application sources and both false gates. Recorded initial failure and subsequent green regression evidence. No deployment, remote mutation or GitHub push.

## EVENT-BEHAVIOR-2026-10-25 — local behavioral extension

VERIFIED locally: 35 new Event Control cases execute the real recovered adapter/preflight against a synthetic in-memory Sheets client. Covers input/gate/identity rejection, lock contention/release, no-op, stale diagnostics, bounded exact reset requests, canonical comparison, preservation/readback corruption and uncertainty without retry. Full regression: 114 PASS / 0 FAIL. Inventory and audit updated; initial fixture failure retained and explained. Application files and source gates unchanged; no deployment, push or real API operation.
