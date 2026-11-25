# QG011 — recovery pending display

2026-11-25, private TEST v15 deployed at 22:05 Stockholm on the existing URL. Access remains Only myself, execute as owner. LIVE unchanged. Worker state remains paused.

The recovery dialog previously displayed a spinner whenever a saved player tone was orange/unknown, even with no browser request running. It now shows Check pending with visible problem/history and a read-only Check saved status action. Actual requests retain the existing 60-second deadline. Timeout messages are displayed directly, and recorded failure detail takes precedence over the generic registration message. No recovery, retry or provider-write decisions changed.

Targeted checks passed: pending vs active request, read-only refresh, timeout guidance, failure detail, verified-state precedence; existing registration failure-detail checks also passed. Saved editor source was reloaded and matched the intended transformed source exactly. Its SHA256 matches the local private candidate:

`57fec265161325cbf0f41e16d9305053889132702ce68a1eab8c1c9ed68bc8b6`

Native visual acceptance is pending a fresh TEST Hub login after reload. The historical TEST event/date mismatch remains unresolved; the original synthetic registration stays in review and must not be duplicated. Registration/removal and full LIVE promotion acceptance remain open. No temporary diagnostics remain in deployed source.

Native follow-up after user sign-in: opened Recovery and the original Quota Native request. The bounded read initially showed Checking, then completed to Issue not solved / The saved registration needs checking, with Resolve issue, Close and Advanced controls. The check finished during the observed 15-second wait. This verifies the dialog returns to a usable result in v15; the original registration remains REVIEW, not a successful registration. No repeat repair or registration was submitted.

Date-policy decision remains open: the current acceptance validates the provider status and selected event identity but does not reject a past event date before saving a queue job. Responses use processing-time wall clock and Tonight filters through the selected event date. Blocking stale-event submissions versus explicitly assigning them to the selected event has different production semantics; no date policy or timestamp rewrite has been installed.
