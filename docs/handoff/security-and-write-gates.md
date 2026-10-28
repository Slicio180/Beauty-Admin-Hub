# Security and write rules

RECONSTRUCTED policy from restart instruction. VERIFIED source: both Route.gs gate constants are false. Deployed gates UNKNOWN / UNVERIFIED.

No GitHub push, production access/change, deployment or real TEST write is authorized by this framework task. Local mocked tests may inject booleans and fake clients; they never open the repository gates.

Every real TEST write must have all ten recorded controls:
1. Explicit approval identifying operation and exact TEST target.
2. Verified rollback protection.
3. Pre-write snapshot with hashes and relevant metadata.
4. Bounded mutation with expected cell/field delta.
5. Independent readback (separate reader, not only the write response).
6. Post-write diff proving only approved differences.
7. Evidence capture including uncertainty/failure outcomes.
8. Write gate returned to FALSE, confirmed in source and deployed version.
9. Audit entry with approval, target, results and evidence references.
10. Local Git commit linking the change and evidence.

Production requires separate explicit approval. A TEST approval never covers production. SAVE_UNCERTAIN forbids blind retries; stop, inspect independently, reconcile actual state and document the decision. Credentials belong in server-side Script Properties, never browser files, repository, URLs, evidence or logs. No credential values were required or emitted here. Repository-wide secret/security review remains outstanding.
