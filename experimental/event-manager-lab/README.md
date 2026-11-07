# Event Manager — separate development project

Version 0.4.0 · 6 November 2026. This is an actively developed standalone project, **not a complete Nakka Admin replacement or an integration-ready release**. It has no connection to the current Hub, Google sheets, live events or Nakka credentials. No installation into the existing Hub is required.

## Run the isolated rehearsal

Requires Node 22+. From this folder:

```sh
npm test
npm start
```

Open http://127.0.0.1:4317 in your browser. All displayed people, pool states, operations and automatic allocation settings are rehearsal data. Starting the server creates a new synthetic event; restarting resets it. Completed operation audit files are temporary rehearsal data, removed on graceful server closure. The file journal implementation itself supports persistent storage when a future host supplies a durable directory.

Try Pools & qualifiers → review Pool 1 → approve → confirm. Open Slutspel to see its fixed positions. Simulate Pool 3 finishing and assign it; Pool 4 remains unfinished. Review manual badges only when both players of that match are known. Boards & badges also offers automatic allocation configuration review. It **does not run Nakka autopilot**. Enabling a stage runs the separate synthetic rehearsal scheduler.

## Implemented development components

- Reserved pool/rank guides, bound to approved event identity, membership and format; mixed sizes and larger guide layouts.
- Incremental qualification using completed-group flags, unique ranks, exact player membership, preserved existing brackets, protected active/result-bearing pairs and structural bye handling.
- Native-shaped manual badge and autopilot proposals, readback checks and shared-stage board ranges and a single occupied-board ledger in rehearsal.
- Synthetic automatic queue: distinct available boards, occupied-board/player holds, break delays, completed-match board reuse, pause/resume and manual finals. This scheduler refuses native event targets.
- Staff/session-bound expiring approval tickets, serialized confirmations, stale-state refusal, durable atomic event claims, before/after receipts and uncertain-operation blocking across coordinator restarts.
- Saved manual guide swaps with revision checks, immutable history, protected assigned matches and reopening tests.
- Local interface: overview, pools, Slutspel, badges/autopilot, matches inventory, integration notes and audit.
- Conservative result-entry and unlock proposal builders; the coordinator refuses these until native qualification. No actionable result or unlock UI is presented.

## Limits

See docs/CONTROL-INVENTORY.md and docs/INTEGRATION.md. Production transport, authenticated provider snapshots, correction/rollback semantics, game data, full setup, cross-event board conflicts, all formats and remaining controls are pending. A default guide can refuse layouts requiring manual resolution; no claim of universal native guide parity. The manual editor currently swaps two positions within a stage; full rule/capacity editing remains pending. The current UI is English; multilingual is pending. Branding uses plain Event Manager labels; no renamed historical project IDs.

Optional browser check: install dev dependencies, provide Chromium (`CHROMIUM_PATH` if needed), run `npm run test:browser`. Automated Chromium launch was blocked by this execution environment; **browser/device visual acceptance is pending**. Node and loopback HTTP tests are recorded separately.

Monday's existing kiosk, remote, Hub and skin work remains separate. Do not point this development server at real events.

To retain rehearsal guide revisions across server restarts, provide a dedicated local directory:

```sh
EVENT_MANAGER_DATA_DIR=./audit-data npm start
```

Guide revisions and operation journals are retained there; synthetic event results/assignments reset when restarting the rehearsal server. This does not create a production database.

Automatic badges: read docs/AUTO-BADGES.md. After assigning ready qualifiers, enable a stage in Boards & badges; local automatic ticks assign eligible matches. Simulate a match finishing to see its board pass to the waiting queue, or advance the rehearsal clock to test breaks. Pause blocks new assignments and preserves existing badges.
