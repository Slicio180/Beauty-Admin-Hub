# Beauty request audit and TEST v8 receipt

25 November 2026, 15:06 Europe/Stockholm. QG004 installed in the existing private Release TEST deployment. Google confirmed Version 8 successfully deployed. Only myself access and execute-as owner preserved. LIVE unchanged; TEST worker configuration not changed.

## Findings from current source

| Path | URL Fetch use | Decision |
| --- | --- | --- |
| Login | One Firebase verification per sign-in; session checks use cache/properties | Preserve authentication |
| Dashboard | One Sheets batch request per successful refresh, normally every 15 seconds while visible; statistics reused from saved snapshot | Existing failure backoff retained; no roster caching added |
| Nakka comparison | Five fetches per complete check: roster, Control date, public event, entry list, roster verification | Scheduled interval reduced from 30 to 120 seconds |
| Health display | Two fetches on cache miss; successful display result shared for 60 seconds per context | Existing cache retained |
| Statistics refresh | One roster request plus four league requests for a successful league refresh; normally every four minutes while visible, server attempt throttle 60 seconds | Separate future review; no freshness change |
| Queue | Five-second UI pump can process pending jobs; an empty queue is not itself five-second provider polling | Preserve existing processing and no-replay rules |
| Background worker | Pending-job recovery, discovery and rating work depend on state | TEST remains paused; no production scheduling change |

Five fetches every 30 seconds implies 600 scheduled comparison fetches per hour per visible tab; every 120 seconds implies 150. This is a 75% reduction in that scheduled component, not a measured account-wide saving. Manual checks, opening the Hub/panel, visibility changes, roster changes, operation completion and busy retries can add requests. Multiple tabs/projects share the account's allowance. Provider-side changes may now take up to two minutes to appear through the scheduled comparison.

Manual COMPARE LISTS and action/roster-triggered checks remain immediate. Fresh before/after verification reads were preserved. Dashboard player refresh remains at 15 seconds. No data caching or authentication change was introduced by QG004.

## Verification and installation

Only LiveHubView.html differs from TEST v7. The private builder validated every baseline hash. All server and inline scripts parse. Existing 14 synchronous quota checks, asynchronous dashboard backoff/retention checks, sign-in mapping checks and status-card checks passed locally. These are mocked checks, not a live load measurement.

Saved source was reloaded from Google and matched SHA256:

`6b4e3b82837762a817a63d953bc608193369c97bab5e9832fe86933eb12b7dc0`

Google reported deployment successfully updated: Version 8, 25 Nov 2026, 15:06. Authenticated runtime acceptance remains pending. Quota reset has not been rechecked or claimed. No new provider probe or synthetic event write was performed for this update.

## Remaining work

Measure real usage after quota recovery; inspect multi-tab duplication and failure/busy retry frequency before adding more caching. Validate registration, consent, status, removal, and recovery in native TEST. The artifact includes earlier unaccepted pool/rating/English work and is not approved for LIVE promotion. Public repository changes are limited to overlay/documentation; private assembled source is excluded.
