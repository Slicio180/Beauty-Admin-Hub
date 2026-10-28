# Pool review display correction — 28 October 2026

Owner installed seeded pools at c434716, then pushed and byte-verified all18
Google TEST files at22:27:18.636Z. Native load showed current league statistics
and60 IN mappings, but rendering stopped with undefined.toFixed.

The client incorrectly assumed the optional average field was always present.
At the RPC boundary, absent/null/non-finite/out-of-range averages now become
explicit null (Unseeded). Measured numeric zero remains0.00. The server remains
authoritative for the actual frozen draw and statistics; no average is invented.
This covers mappings and frozen roster/pool players. Selecting an identity now
uses the actual DOM parentElement instead of the synthetic-fixture parent field.

505 tests/39 files, build and inventory PASS, including omitted/null/zero values,
rendered frozen means and identity-selection changes using DOM parentElement.
Native retest pending. Backend allocation, identities, groups, match cards,
registrations and write guards are unchanged. Google overlay is HubTest.html
only, preserving the other17 current files. New local checkpoint pending owner.

Apply guarded installer from clean c434716, prepare a fresh18-file Google clone,
push the reviewed stage, full readback, refresh DEV Hub and retry loading stats.
First confirm all60 mapping rows render and compare known three-dart averages
against Nakka before generating a preview. No Nakka handoff is authorised by
this display test. Source-return reason for the absent property is unproven;
the correction removes the unsafe client assumption and tests that boundary.
