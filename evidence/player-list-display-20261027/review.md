# TEST player display review — AUD-099 candidate

Baseline owner checkpoint: 110306c / AUD-098, 383 passing tests.

Changed only Remote Identity TEST mobile Tonight list HTML: total-player tile derived from the displayed event list, hidden during load/failure; zero shown for empty data; old/closed requests ignored; long player names wrap. No new endpoint or public player data, no registration/backend/Nakka write behavior changes.

Beauty Live code unchanged. Offline checks cover wide/narrow counts 0,1,15,16,30,31,45,46,60,61,90, unique numbered grid slots, and existing scroll behavior. Wide columns 1–15:1; 16–30:2; 31–45:3; 46+:4. Narrow screen uses two columns. Columns are balanced, not filled to 15 before the next column. More than 60 enables auto-scroll; a narrow list over 30 can require manual scrolling.

Messages: offline actual Hub/MOBIL/KIOSK routes preserve a >4KB multiline message in response-sheet column E and exclude it from Nakka add payload. Hub uses READ above 30 characters; popup retains literal text/newlines, wraps long words and scrolls. Live feed continues to exclude private messages.

Native evidence collected for AUD-098, not yet committed as bulk acceptance: owner saved all six matching Remote Identity TEST files; remote Emilia Dåderman success; compare snapshot 27Oct22:38:06 Hub8/Nakka8/same8/no-only/no-duplicates (Adam, Alessio, Anders, Cevin, Emilia, Frederik, Isak, Matt); kiosk Joel Larsson success confirms saved registration/Nakka entry. Owner reports larger different-player batch and long messages across platforms. Do not mark unseen native long-message content, >15 Beauty Live columns, source badges or cross-source duplicate checks passed.

Pending native: save updated RemoteRegistration.html; mobile Tonight count vs names including reopen; Beauty Live >15 screenshot at venue dimensions; open long-message READ for each source in Hub. Exact provider LPID still unavailable. No production/JDC changes, no Google upload/deployment or API writes by this block.
