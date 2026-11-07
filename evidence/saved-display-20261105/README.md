# Saved pool display correction — 2026-11-05

Owner screenshot after installing the 744-test flow confirms automatic saved-pool load and four workflow steps. It also reveals START NaN in both saved groups. Google RPC omits null optional fields; the request boundary normalized preview draw averages, but missed workflow.draw.

Correction normalizes both paths, preserving measured zero and excluding omitted/invalid averages as unknown. Frozen averages are not refreshed or changed. Expected current saved groups: START 46.21 and 40.83.

Adds an explicit instruction when no available board is selected; selections remain the organiser's choice. Verified saved status uses the verified indicator and saved group cards restore the shared compact card style, show every player’s frozen average beside their name and put the pool START average in the gold header row. Board choices follow the player rows.

Local baseline 744 PASS; updated 746 PASS and inventory PASS. New VM cases cover omitted averages through saved workflow RPC, measured zero, all-unknown group, clear board instruction and zero provider writes. Google TEST screen acceptance remains pending. No server service change, event start or pool resend.
