# Native qualifier count readback — 5 November 2026

Owner sent approved seven-player native Round Robin TEST groups and Top 2 / remaining rules once. UI reported uncertain after provider mutation. A fresh public GET confirmed both groups, four-slot knockouts, original game rules and assignment flags saved; top-level assign_setting.t_count and s2_count came back as decimal strings "2" instead of numeric 2. The strict response comparison stopped before creating the verified receipt. No resend was attempted.

The correction normalizes only top-level qualifier count strings matching integers 1–99. Other fields and flags remain exact; changed counts, malformed numeric strings and rule differences are rejected.

A private owner-run Apps Script editor function beautyPoolReconcileAttempt_ reads the original ATTEMPTED journal and original approval audit, validates target/date/roster/draw/format, compares a fresh event to the exact approved change, writes a linked readback receipt, rechecks provider revision/data and marks the journal VERIFIED. It sends no provider mutation, never clears the send lock and does not regenerate groups. Any mismatch leaves the attempt locked. The trailing underscore excludes google.script.run access.

Three new local executable cases cover native strings, zero-provider-write reconciliation and mismatch preservation. Device reconciliation acceptance pending. Production unchanged.
