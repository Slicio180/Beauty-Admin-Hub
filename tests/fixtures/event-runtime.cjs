// Synthetic fixture only. No exported credentials, network transport or real Sheet access.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../apps-script/event-control-test-write');
const clone = structuredClone;
function harness(options = {}) {
  const ctx = vm.createContext({ module: { exports: {} } });
  for (const file of ['DateEncoding.gs', 'Preflight.gs', 'Adapter.gs']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }
  const adapter = ctx.module.exports;
  const number = n => ({ userEnteredValue: { numberValue: n }, effectiveValue: { numberValue: n } });
  const text = s => ({ userEnteredValue: { stringValue: s }, effectiveValue: { stringValue: s } });
  const headers = {
    Control: ['START DATE', 'LAST RESET'],
    'PLAYER STATUS DATA': ['PLAYER', 'OLD NAME', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE'],
    "PLAYER'S MASTER LIST": ['PLAYERS'],
    "TONIGHT'S PLAYERS": ['PLAYERS', 'NEW PLAYERS', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE', 'WHERE FROM'],
    'Form responses 2': ['Timestamp', 'VÄLJ DITT NAMN', 'Skriv ditt fullständiga namn', 'Foto- och videomedgivande', 'Meddelande', 'WHERE FROM']
  };
  const state = {
    spreadsheetId: adapter.approved.sheetId,
    properties: { title: adapter.approved.title, locale: 'en_GB', timeZone: 'Europe/Berlin' },
    sheets: Object.entries(headers).map(([title, values], i) => ({
      properties: { title, sheetId: i + 10, sheetType: 'GRID', gridProperties: {
        rowCount: title === "TONIGHT'S PLAYERS" ? 100 : 8, columnCount: Math.max(values.length, 6)
      } },
      data: [{ startRow: 0, startColumn: 0, rowData: [{ values: values.map(text) }] }]
    }))
  };
  const sheet = title => state.sheets.find(s => s.properties.title === title);
  const rows = title => sheet(title).data[0].rowData;
  rows('Control').push({ values: [
    { ...number(72690), userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } } },
    number(46319.5)
  ] });
  rows('PLAYER STATUS DATA').push(
    { values: [text('New Name'), text('Old Name'), text('OUT'), text('NEJ'), text('private fixture message')] },
    { values: [text('Ordinary Player'), {}, text('IN')] },
    { values: [{}, {}, {}, {}, {}, text('garbage outside A:E')] }
  );
  rows("TONIGHT'S PLAYERS").push({ values: [
    { userEnteredValue: { formulaValue: '=1+1' }, effectiveValue: { stringValue: 'New Name' } },
    {}, { ...text('OUT'), dataValidation: { condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'IN' }] } } }
  ] });
  rows("PLAYER'S MASTER LIST").push({ values: [text('New Name')] });
  rows('Form responses 2').push({ values: [number(46319.4), text('New Name')] });
  const before = clone(state);
  const calls = { metadata: 0, cells: 0, locks: 0, releases: 0, waits: 0, writes: [] };
  const runtime = {
    config: adapter.approved,
    writesEnabled: options.writesEnabled ?? true, // ONLY the injected fake runtime; Route.gs remains false.
    lock: {
      tryLock(ms) { assert.equal(ms, 0); calls.locks++; return options.locked !== false; },
      releaseLock() { calls.releases++; }
    },
    nowSerial() { return 46320.25; },
    waitForRecalculation() { calls.waits++; },
    client: {
      getMetadata(id) {
        assert.equal(id, adapter.approved.sheetId); calls.metadata++;
        const snapshot = clone(state);
        options.metadata?.(snapshot, calls.metadata);
        return snapshot;
      },
      getCells(id, ranges) {
        assert.equal(id, adapter.approved.sheetId); assert.equal(ranges.length, 5); calls.cells++;
        const snapshot = clone(state);
        options.read?.(snapshot, calls.cells);
        return snapshot;
      },
      batchUpdate(body, id) {
        assert.equal(id, adapter.approved.sheetId);
        calls.writes.push(clone(body));
        if (options.throwWrite) throw new Error('synthetic uncertain transport');
        // Independent fake Sheets request interpreter, not the adapter's verification function.
        for (const request of body.requests) {
          if (request.updateCells) {
            const u = request.updateCells, rg = u.range;
            assert.equal(u.fields, 'userEnteredValue');
            const target = state.sheets.find(s => s.properties.sheetId === rg.sheetId);
            const data = target.data[0].rowData;
            u.rows.forEach((row, ri) => row.values.forEach((cell, ci) => {
              const r = rg.startRowIndex + ri, c = rg.startColumnIndex + ci;
              data[r] ??= { values: [] };
              while (data[r].values.length <= c) data[r].values.push({});
              const old = data[r].values[c] || {};
              const value = clone(cell.userEnteredValue || {});
              data[r].values[c] = { ...old, userEnteredValue: value, effectiveValue: clone(value) };
              delete data[r].values[c].formattedValue;
            }));
          } else if (request.deleteDimension) {
            const rg = request.deleteDimension.range;
            assert.equal(rg.dimension, 'ROWS');
            const target = state.sheets.find(s => s.properties.sheetId === rg.sheetId);
            target.data[0].rowData.splice(rg.startIndex, rg.endIndex - rg.startIndex);
            target.properties.gridProperties.rowCount -= rg.endIndex - rg.startIndex;
          } else throw new Error('unexpected request');
        }
      }
    }
  };
  const input = {
    action: 'save', confirmed: true, date: '2099-01-12', expectedDate: '2099-01-05',
    expectedVersion: '["test-event:v1",72690,46319.5]'
  };
  return { adapter, runtime, input, calls, state, before, run: change => adapter.handle({ ...input, ...change }, runtime) };
}
module.exports = { harness };
