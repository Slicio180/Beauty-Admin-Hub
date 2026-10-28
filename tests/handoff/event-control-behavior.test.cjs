const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('../fixtures/event-runtime.cjs');
const tab = (s, title) => s.sheets.find(t => t.properties.title === title);
const cell = (s, title, r, c) => tab(s, title).data[0].rowData[r].values[c];
function noWrite(h, result, code, diagnostic) {
  assert.equal(result.code, code);
  if (diagnostic) assert.equal(result.diagnostic, diagnostic);
  assert.equal(h.calls.writes.length, 0);
  assert.deepEqual(h.state, h.before);
}
test('event load returns exact date/version with gate closed and no mutation', () => {
  const h = harness({ writesEnabled: false });
  const r = h.adapter.handle({ action: 'load' }, h.runtime);
  assert.equal(r.success, true); assert.equal(r.eventDate, '2099-01-05');
  assert.equal(r.version, h.input.expectedVersion); assert.equal(r.writesEnabled, false);
  assert.equal(h.calls.writes.length, 0); assert.deepEqual(h.state, h.before);
  assert.equal(h.calls.releases, 1);
});
for (const value of [false, 1, 'true']) {
  test(`event save denies non-boolean approval ${String(value)} before I/O`, () => {
    const h = harness({ writesEnabled: value });
    noWrite(h, h.run(), 'WRITES_DISABLED');
    assert.equal(h.calls.locks, 0); assert.equal(h.calls.metadata, 0); assert.equal(h.calls.cells, 0);
  });
}
test('event config rejects extra property before lock or reads', () => {
  const h = harness(); h.runtime.config = { ...h.adapter.approved, endpoint: 'unapproved' };
  noWrite(h, h.run(), 'BLOCKED'); assert.equal(h.calls.locks, 0);
});
for (const [name, patch] of [
  ['missing confirmation', { confirmed: false }],
  ['impossible date', { date: '2099-02-29' }],
  ['noncanonical version', { expectedVersion: '["test-event:v1", 72690,46319.5]' }],
  ['version date mismatch', { expectedVersion: '["test-event:v1",72691,46319.5]' }],
  ['unexpected field', { endpoint: 'unapproved' }]
]) {
  test(`event rejects ${name} before I/O`, () => {
    const h = harness(); noWrite(h, h.run(patch), 'INVALID'); assert.equal(h.calls.locks, 0);
  });
}
test('event lock contention returns BUSY without reading or releasing another lock', () => {
  const h = harness({ locked: false }); noWrite(h, h.run(), 'BUSY');
  assert.equal(h.calls.metadata, 0); assert.equal(h.calls.releases, 0);
});
test('event stale baseline date releases lock without write', () => {
  const h = harness(); noWrite(h, h.run({ expectedDate: '2099-01-06', expectedVersion: '["test-event:v1",72691,46319.5]' }), 'STALE', 'BASELINE_DATE_MISMATCH');
  assert.equal(h.calls.releases, 1);
});
test('event B2 token drift rejects stale caller without write', () => {
  const h = harness(); noWrite(h, h.run({ expectedVersion: '["test-event:v1",72690,46319.4]' }), 'STALE', 'BASELINE_TOKEN_MISMATCH');
});
test('event same date is no-op with no clock or write call', () => {
  const h = harness(); h.runtime.nowSerial = () => { throw new Error('must not read clock'); };
  const r = h.run({ date: h.input.expectedDate });
  assert.equal(r.success, true); assert.equal(r.changed, false);
  assert.equal(h.calls.writes.length, 0); assert.equal(h.calls.cells, 1);
});
for (const field of ['spreadsheetId', 'title', 'locale', 'timeZone']) {
  test(`event capture rejects wrong ${field} before mutation`, () => {
    const h = harness({ metadata(s) { if (field === 'spreadsheetId') s[field] = 'wrong'; else s.properties[field] = 'wrong'; } });
    noWrite(h, h.run(), 'BLOCKED'); assert.equal(h.calls.cells, 0); assert.equal(h.calls.releases, 1);
  });
}
test('event rejects external formula reference before mutation', () => {
  const h = harness({ read(s) { cell(s, "TONIGHT'S PLAYERS", 1, 0).userEnteredValue.formulaValue = '=IMPORTDATA("https://example.invalid")'; } });
  noWrite(h, h.run(), 'UNAVAILABLE');
});
test('event rejects over-limit preflight before cell read', () => {
  const h = harness({ metadata(s) { tab(s, 'PLAYER STATUS DATA').properties.gridProperties.rowCount = 10000; } });
  noWrite(h, h.run(), 'UNAVAILABLE'); assert.equal(h.calls.cells, 0);
});
test('event successful fake reset emits exact bounded requests and preserves unrelated data', () => {
  const h = harness(); const r = h.run();
  assert.equal(r.success, true); assert.equal(r.changed, true); assert.equal(r.readbackVerified, true);
  assert.equal(r.reset.deletedRows, 2); assert.equal(r.reset.retainedCorrectionRows, 1);
  assert.equal(h.calls.writes.length, 1); assert.equal(h.calls.cells, 4);
  assert.equal(h.calls.waits, 2); assert.equal(h.calls.releases, 1);
  const requests = JSON.parse(JSON.stringify(h.calls.writes[0].requests));
  const update = (sheetId, r, c, values) => ({ updateCells: {
    range: { sheetId, startRowIndex: r, endRowIndex: r + values.length, startColumnIndex: c, endColumnIndex: c + values[0].length },
    rows: values.map(values => ({ values })), fields: 'userEnteredValue'
  } });
  assert.deepEqual(requests, [
    update(10, 1, 0, [[{ userEnteredValue: { numberValue: 72697 } }]]),
    { deleteDimension: { range: { sheetId: 11, dimension: 'ROWS', startIndex: 3, endIndex: 4 } } },
    { deleteDimension: { range: { sheetId: 11, dimension: 'ROWS', startIndex: 2, endIndex: 3 } } },
    update(11, 1, 2, [[{}, {}, {}]]),
    update(10, 1, 1, [[{ userEnteredValue: { numberValue: 46320.25 } }]]),
    update(13, 1, 2, Array.from({ length: 99 }, () => [{}]))
  ]);
  for (const title of ["PLAYER'S MASTER LIST", 'Form responses 2']) assert.deepEqual(tab(h.state, title), tab(h.before, title));
  assert.deepEqual(cell(h.state, "TONIGHT'S PLAYERS", 1, 0), cell(h.before, "TONIGHT'S PLAYERS", 1, 0));
  assert.deepEqual(cell(h.state, "TONIGHT'S PLAYERS", 1, 2).dataValidation, cell(h.before, "TONIGHT'S PLAYERS", 1, 2).dataValidation);
});
function reorder(value) {
  if (Array.isArray(value)) return value.map(reorder);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).reverse().map(k => [k, reorder(value[k])]));
  return value;
}
test('event canonical comparison accepts reordered object keys through all readbacks', () => {
  const h = harness({ read(s, n) { if (n === 2 || n === 4) { const shuffled = reorder(s); for (const k of Object.keys(s)) delete s[k]; Object.assign(s, shuffled); } } });
  assert.equal(h.run().success, true); assert.equal(h.calls.writes.length, 1);
});
for (const [name, before, after] of [
  ['primitive type', 1, '1'], ['array order', ['a', 'b'], ['b', 'a']],
  ['explicit undefined', {}, { extra: undefined }], ['sparse array slot', Array(1), [undefined]],
  ['negative zero', 0, -0], ['array length', [], Array(1)]
]) {
  test(`event prewrite snapshot detects ${name} difference`, () => {
    const h = harness({ read(s, n) { s.syntheticComparisonMarker = n === 1 ? before : after; } });
    noWrite(h, h.run(), 'STALE', 'PREWRITE_SNAPSHOT_MISMATCH'); assert.equal(h.calls.releases, 1);
  });
}
test('event prewrite detects unrelated validation drift without mutation', () => {
  const h = harness({ read(s, n) { if (n === 2) cell(s, "TONIGHT'S PLAYERS", 1, 2).dataValidation.strict = true; } });
  noWrite(h, h.run(), 'STALE', 'PREWRITE_SNAPSHOT_MISMATCH');
});
test('event thrown writer returns SAVE_UNCERTAIN once and releases lock', () => {
  const h = harness({ throwWrite: true }); const r = h.run();
  assert.equal(r.code, 'SAVE_UNCERTAIN'); assert.match(r.error, /Never retry automatically/);
  assert.equal(h.calls.writes.length, 1); assert.equal(h.calls.releases, 1); assert.equal(h.calls.cells, 2);
});
for (const [name, corrupt] of [
  ['control value', s => { cell(s, 'Control', 1, 1).effectiveValue.numberValue = 1; }],
  ['unrelated formula', s => { cell(s, "TONIGHT'S PLAYERS", 1, 0).userEnteredValue.formulaValue = '=2+2'; }],
  ['validation', s => { cell(s, "TONIGHT'S PLAYERS", 1, 2).dataValidation.strict = true; }],
  ['grid size', s => { tab(s, 'PLAYER STATUS DATA').properties.gridProperties.rowCount++; }]
]) {
  test(`event readback detects changed ${name} and never retries`, () => {
    const h = harness({ read(s, n) { if (n >= 3) corrupt(s); } });
    assert.equal(h.run().code, 'SAVE_UNCERTAIN'); assert.equal(h.calls.writes.length, 1); assert.equal(h.calls.releases, 1);
  });
}
test('event unstable second readback returns SAVE_UNCERTAIN without retry', () => {
  const h = harness({ read(s, n) { if (n === 4) s.syntheticComparisonMarker = 'late drift'; } });
  assert.equal(h.run().code, 'SAVE_UNCERTAIN'); assert.equal(h.calls.writes.length, 1); assert.equal(h.calls.cells, 4);
});
