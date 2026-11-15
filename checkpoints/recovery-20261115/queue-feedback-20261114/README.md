# Current work — 14 November 2026 morning

Installed baseline: Hub32, mobile34, kiosk61. Owner reports8players now: fresh message with three trailing spaces accepted after last night's seven-player closeout. Preserve all eight. One-space recovery and fresh registration native PASS; three-space acceptance owner-confirmed. No new independent eight-player Nakka comparison evidence supplied.

## Bounded candidate PREPARED NOT DEPLOYED

Beauty-Queue-Feedback-and-Readback-20261114.cjs updates Hub ONLY: LiveHubView, LiveHub, LiveRegistrationQueue. No added source, scope changes, runtime job execution, event switch, property cleanup, sheet/player/Nakka/Git or credential-file operation by installer. Existing source/deployment/access guards and exact optional diagnostic preservation retained.

- Recheck clicks while background poll is busy are remembered locally and dispatched once when free. Repeated clicks for the same waiting/running job are deduplicated. Unsent requests are cancelled on logout or event/session change. Sent uncertain requests are NOT automatically retried. Background polls do not clear terminal feedback. COMPLETE, REVIEW and NOT_STARTED responses are distinct. Progress/status text announces waiting/checking/result.
- Final readback records fixed check identifiers: displayRead,response,master,statusRecord,displayIdentity,displayStatus,displayConsent,displayMessage,displaySource. Failure messages identify the check without exposing submitted contents or exception details. Failed readback duration is recorded too. Earlier failure code is cleared before each worker attempt.
- Registration-only dashboard verification skips response-history loading, rankings/statistics and master selector loading. Current control/roster/status reads and all exact raw response/status checks remain. Whitespace handling preserved. Ordinary dashboard behavior remains unchanged. No native speed improvement claimed yet.

## Validation

PASS local25 queue scenarios and9 real auth/context/route integration scenarios with simulated external transports. New actual panel tests cover click during unresolved polling, double clicks, REVIEW/COMPLETE/NOT_STARTED, retained terminal feedback, logout/event-change cancellation and lost response without automatic replay. Actual legacy feature gate + recovery button marker tested together. Existing panel regression PASS. Backend tests cover field-specific codes, failed timing, raw whitespace preservation including three spaces, true display mismatches, transport errors without private exception content, and actual verification-only dashboard avoiding unnecessary reads. Installer/publisher tests PASS: exact source preservation, syntax, drift guards, idempotence, lost reply and access verification. Native candidate checks PENDING.

## Agreed order — do not jump between features

Finish this bounded queue-feedback/diagnostic/read reduction update and its native verification first. Then tackle COMPLETE RECOVERY as one workstream with a single implementation/test checklist. User explicitly requested this sequence. Include Transfer Players, reusable Nakka import, legacy/partial-save recovery, interrupted event recovery and remaining issue-resolution paths. Clearly separate implemented, native-tested and missing capabilities.

Transfer Players is NOT presently a working rendered control; old nakkaTransferOpen ID is blocked by the legacy gate. It will NOT automatically appear when needed. This installer does NOT restore Transfer Players or implement Nakka import. Avoid claiming all recovery paths or the historical six fixes are complete.

## Next native check

Owner runs this one installer and provides result; reload Hub after verified publication. Preserve eight registrations. Check dashboard/read-only queue status first. If an authentic review job exists, click once while polling and confirm immediate feedback followed by one explicit result; do not fabricate a production failure or remove records to create a test. Otherwise test this recovery UI through controlled nonproduction fault injection before closing its native audit. Measure registration acceptance/worker/display times separately across channels during authorized registrations. Overall performance and recovery audit remain OPEN.

GitHub last verified checkpoint remains53076ac4789135fc353ad1ec39de825b310a8c41 on backup/live-checkpoint-20261114. This new candidate is saved in the handover, not claimed deployed or uploaded to GitHub. Main and Mac working copy unchanged.
