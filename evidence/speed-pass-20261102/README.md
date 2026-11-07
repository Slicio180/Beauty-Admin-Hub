# Beauty TEST: Sheet call reduction, 2 November 2026

Scope: Identity TEST only. No Google upload, Nakka mutation, production change, commit or deployment performed by this package.

## Native baseline supplied by owner
- Existing players registered from mobile, kiosk and Hub; source, consent and message checks passed.
- Albert changed OUT / STANDBY / IN; screenshots show correct values and IN counts. Reload persistence was requested but not separately stated by the owner.
- Duplicate attempts via mobile, kiosk, Hub and kiosk new-name path rejected; roster stayed unchanged.
- Albert removal preview 7.4s total / 5.8s server. Removal 28.4s total / 22.7s server. Sheet stage timings 3.5 + 5.0 + 2.5 + 3.3 + 0.7 = 15.0s; Nakka removal 0.3s. Some remaining time is uninstrumented.
- Removal left Adam and Alessio; re-registration of Albert succeeded; fresh attention check reported none.
- New players from kiosk, mobile and Hub appeared once in both lists. All three source, consent NO and message checks passed.
- Kiosk-created player appeared on mobile picker, Hub-created player appeared on kiosk picker.
- Mobile new-player submission approximately 17s, Hub 24s; kiosk not timed. Mobile/kiosk Hub rows became visible before thank-you.
- Final comparison: six matched names, Hub only 0, Nakka only 0, duplicate names 0. Fresh attention check: no alerts.
- Name comparison and League badges do not prove the exact permanent LPID where the API omits it.

## Implementation
- Reuse only the workbook object for one Apps Script invocation; never cache cell values, date, rosters or provider responses.
- Combine roster header and data reads, preserving bounds and header validation and observing changes on every call.
- Reuse last-row metadata within one read, including full recovery snapshots. Snapshot values, displayed values, formulas, number formats, dimensions and sheet IDs remain checked.
- Repaint all 99 status cells with one setValues including blank tail cells; remove the redundant preceding clearContent to avoid an intermediate blank status column.
- No change to recovery archives, journal durability, auth, fresh prewrite and postwrite checks, exact target identity, receipt checks, no-retry rules or explicit confirmation.

## Qualification and limitations
Local suite and strict inventory results are supplied with the package.
Two new executable tests cover fresh roster changes despite handle reuse, rejection of changed headers, and preservation of IN/OUT/STANDBY and blank tails without an intermediate clear.
Native speed benefit is not established. This is a conservative first pass, not a claim that 17–28 second operations are resolved. Retest the same devices and operations after owner uploads to TEST.
Remaining acceptance: uncertain-transfer troubleshooting, different-person identity choice, exact exposed LPID checks, and device performance after this update.
