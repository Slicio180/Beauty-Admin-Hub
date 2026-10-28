# Architecture and source map

VERIFIED (repository inspection); runtime deployment equivalence UNKNOWN / UNVERIFIED.

| Source | Responsibility | Boundary / risk |
|---|---|---|
| `public/index.html`, `public/css/style.css`, `public/js/app.js` | Static desktop Hub: dashboard, status, registration | app.js hardcodes production Apps Script URL; do not open as isolated TEST |
| `public/js/nakka-health.js` | Health card, timeout and refresh | Browser fetch through remote-app health route |
| `apps-script/remote-app/Code.js`, `RemoteRegistration.html` | GET routing, registrations, master/form sync, Hub data/status and Nakka health | Contains real Sheets/Form/Nakka mutation paths |
| `apps-script/automatic-nakka/` | Separate registration/kiosk project snapshot | Live ownership, trigger inventory and source parity unverified |
| `apps-script/nakka01/` | Nakka integration snapshot | Not a deployment target for this checkpoint |
| `apps-script/sheet-controls/` | Sheet control snapshot | Destructive/reset operations need separate review |
| `apps-script/event-control-test-write/Hub.html` | Separate packaged TEST Hub | Uses signed-in Apps Script RPC bridges |
| `Route.gs` in that TEST folder | Project-pinned RPC and two false gates | Builds injected Sheets clients; no doPost |
| `Adapter.gs`, `DateEncoding.gs`, `Preflight.gs` | Event state/version/snapshot safety, date encoding, preflight | Exact recovered hashes are evidence, not complete behavior coverage |
| `HubDataAdapter.gs`, `StatusAdapter.gs` | Bounded TEST reads and status adapter | Gate closure required; successful write path not qualified here |
| `docs/recovered-drive/`, `backups/` | Evidence / preservation fixtures | Never use to restart development; some tests deliberately hash fixtures |
| `tests/` | Node built-in test runner; fs/vm mocked harnesses | No installed dependencies required |

Normal static flow: browser → remote-app GET routes → Sheets/Form/Nakka. Isolated TEST flow: packaged Hub → Google Script RPC → project guard → adapter → pinned TEST Sheet. These are distinct frontends; a local static server does not make the public Hub safe.

## Desktop preview boundary, 2026-10-25

`public/js/hub-services.js` owns every desktop data/status/registration/health request. It has no network transport. `index.html` defaults to blocked. `preview.html` selects in-memory fixture mode on localhost/127.0.0.1/IPv6 loopback only. Both pages enforce `connect-src 'none'`. All registration/status changes disappear when the page reloads. No storage credentials, Nakka entries, Sheets updates or production fallback are introduced.

`npm run preview` serves only `public/` on 127.0.0.1:4173. The existing Google TEST Hub and all Apps Script sources are unchanged. An authenticated remote adapter is a later task; this preview is not that adapter. Original AIK fonts are copied from the user's supplied AIK-FONTS.zip to the local paths already referenced by the stylesheet.

## Identity TEST Hub connection — 2026-10-25

Identity TEST Hub is served at ?page=hub in the existing Remote TEST Apps Script, with pinned google.script.run read/register RPC. Source HUB is server-set; same Remote gate/lock. Offline public pages are unchanged. See docs/testing/HUB-IDENTITY-TEST-CONNECTION-20261025.md.

## Identity TEST status — 2026-10-25

Identity TEST status now has a separate true/false server gate and private status handler, invoked only through the pinned Hub bridge. Existing Remote project script lock is reused. Only the selected existing C cells in PLAYER STATUS DATA and TONIGHT'S PLAYERS are written; no appends or range rebuild. Previous disabled-status statements describe the earlier checkpoint. Public offline pages and Event Control TEST gates remain unchanged.

## Event Control inspection — 2026-10-25

Event Control buttons in the generated Identity TEST Hub now open a read-only inspection popup. Private HubTestEventPreview handler uses the same pinned project/sheet guard and script lock, bounded SpreadsheetApp reads, and explicitly reports inspectionOnly:true/writesEnabled:false. No event save action exists. Legacy Event Control adapter/date/preflight originals and their gates are unchanged.

## English Hub decision and date review — 2026-10-25

User decision: entire Hub is English; remote/kiosk remain Swedish. Shared Swedish identity originals are unchanged; deterministic generated English Hub derivatives preserve the same algorithm, sentinel and payload values. Hub labels show YES/NO and MOBILE while stored JA/NEJ/MOBIL remain canonical. Generated TEST HTML and public offline pages select English assets. Event Control shows date and explicit review safeguards; Event Details sidebar contains technical reset information. No event-save handler exists.

## Sidebar and date popup revision — 2026-10-25

Checkbox + confirmation popup replaces exact typed-date input. Simplified sidebar moves Beauty Live below Dashboard and renames Event Control Details. Dashboard retains player table and event action. 227 local regression cases; updated review assertions map to evidence/hub-menu-date-popup-20261025/review.tap. Event saving remains unavailable; browser review and Beauty Live functionality pending. See docs/testing/HUB-MENU-DATE-POPUP-20261025.md. Earlier evidence remains historical.
