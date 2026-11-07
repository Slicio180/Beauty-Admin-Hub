# Control inventory and acceptance gates

Goal: a full event-management workspace that fits the organiser's actual Nakka workflow. “Documented API” does not mean implemented, deployed or natively verified. Current scope derives from owner screenshots and requirements; an exhaustive signed-in Nakka Admin walkthrough is still required before full parity can be claimed.

| Control | Current implementation | Required acceptance |
|---|---|---|
| Event overview | Synthetic UI | Native current event, revision, stale state |
| Players/entries | Synthetic read display | Add, withdraw, rename, identity linkage, locks |
| Event setup | Inventory only | Formats, legs/sets, round overrides, event lifecycle |
| Seeded pool draw | Existing Hub remains separate | Reusable adapter and reviewed draw integration |
| Pool completion | Per-pool flags in engine | Native end-group and standings comparison |
| Qualification rules | Top count/rest generator and manual swap editor with revision history | Custom per-size rules and native guide comparison |
| Finished-pool assignment | Engine and rehearsal UI | Native partial assignment while RR games continue |
| Assignment while other pools play | Engine/HTTP tests | Preserve earlier KO games, correct source/rank binding |
| Opening cross-pool pairings | Tested guide layouts | All supported capacities and manual guides |
| Structural byes | Engine tests | Native participant/scorer comparison |
| Bracket presentation | Opening-round rehearsal UI | All rounds, semifinal/final and third-place views |
| Automatic progression | Delegated to future native result API | Native game/score progression readback |
| Manual badges | Proposal, guards, rehearsal write/readback | Native key/status mapping, clear/reassign behaviour |
| Automatic badges | Config proposals plus autonomous synthetic queue, breaks, board reuse, pause/resume | Native provider service/held-status mapping and board availability qualification |
| Shared boards across stages | Shared-range rehearsal with shared occupancy and alternating opportunity | Native shared-board arbitration still needs qualification |
| Multiple events/shared players | Pending | Collision/priority behaviour |
| Referees | Pending | Manual, automatic, source/eligibility rules |
| Automatic round scope/final | Pending native validation | Provider final/third-place rules and manual final assignment |
| Match result entry | Proposal only; blocked | Native mirror results, progression, stats and format checks |
| Existing result correction/clear | Pending | Descendant matches, statistics and reversal semantics |
| Watch game | Pending | Canonical provider links and return behaviour |
| Small score view | Pending | Supported provider route/embedding |
| Edit/remove game data | Pending | Match identity, consequences, confirmation and recovery |
| Release game lock | Proposal only; blocked | Exact provider match and observable unlock receipt |
| Manual ranks/ties | Pending | Pool completion/rank override/assignment invalidation |
| Match order / simultaneous games | Pending | Native RR guide, concurrency and board routing |
| Announcements / memos | Pending | Provider endpoints, preservation and readback |
| Start/complete/copy event | Pending | Correct target, paid capacity, preserved data and lifecycle |
| Audit/review/uncertainty | Durable core and rehearsal | Hosted persistence, authenticated actor, recovery console |
| Staff roles/login/logout | Host contract only | Real authentication and permissions; independent cast access |
| Full Nakka parity | Not achieved | Complete signed-in inventory plus native/device acceptance |

Priority order: finish core safety and guide coverage; authenticated read-only native diagnostics; incremental qualification qualification; badges/autopilot qualification; match controls and remaining inventory; interface/device review; integration package only after acceptance. Monday scope is not expanded by this project.
