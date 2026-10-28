# Release and checkpoint structure

RECONSTRUCTED policy. Current checkpoint: HANDOFF-2026-10-25, local framework only, NOT release-qualified.

Each checkpoint records base and result commits, branch, clean/dirty state, environment, test command/runtime, counts and failure disposition, source/evidence digests, requirement/test inventory revision, gate values, approval references and remaining blockers. Preserve failed evidence. Git commit identifies checkpoint; no tag, push or deployment is implied.

Suggested progression: framework baseline → critical behavior coverage → safe local/browser sandbox → security/integration specification → controlled isolated TEST qualification → rollback rehearsal → independent programmer handoff → separately approved release.

Release gate: full local suite green; important requirements have demonstrated behavioral coverage; no unresolved critical defects; current environment map and source parity; backup/restoration rehearsal; independent reviewer can follow README without verbal instructions; all remote operations explicitly authorized. Counts alone never satisfy this gate.

EVENT-BEHAVIOR-2026-10-25 extends base 54f6f65 with behavioral tests only: 114 local cases, no application change, still NOT release-qualified. See evidence/event-control-2026-10-25/checkpoint.json and the Git commit containing it.
