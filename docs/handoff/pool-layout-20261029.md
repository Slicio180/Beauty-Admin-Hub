# Pool layout — 29 October 2026

TEST only. Owner baseline7eb8cc6, branch recovery/2026-10-28.
Approved mockup and refinements: large yellow Players in tile; white22px section
headings; compact black/yellow boards field; preferred arrangement only, with
actual3/4(and5ifneeded)-player group counts. No board overview or bottom controls.
Hub header stays visible. Existing planner and source freshness gates retained.

Cards sort by Bana then local Grupp. Edit numbers using label buttons; available
boards only, positive group numbers, reject duplicate board/group pairs. These
labels remain Hub planning metadata, retained across server swaps and included
in downloaded board plan. They do not set live Nakka boards or rename provider
groups. New draw/signout clears metadata. Editing clears any prepared approval.

Click player to open searchable list from other groups, choose to swap via
existing pooladjust RPC. Only two moved names yellow until next swap/new draw.
Frozen averages, capacity, server ticket validation and all send guards remain.
No source identity relinking or event mutation performed by this installer.
Identity warning visible only if current bindings are unresolved; full review
still available and acknowledgement popup remains required.

Native previous package acceptance: user confirmed generation popup and manual
swap worked. Previous retention beyond5minutes not explicitly confirmed.
This package:585 offline regressions PASS, inventory PASS; guarded installer,
repeat guard and mocked fixed19file Google clone/readback rehearsal. Real upload
and native visual/edit/download/swap/timing acceptance pending after install.
Production unchanged. No GitHub push.
