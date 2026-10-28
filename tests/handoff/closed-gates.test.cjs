// New handoff regression coverage. Injected clients only; no Google/Nakka calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../../apps-script/event-control-test-write');
function adapter(file) {
  const ctx = vm.createContext({ module: { exports: {} } });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
  return ctx.module.exports;
}
for (const gate of [undefined, null, false, 0, 1, 'true']) {
  test(`status gate rejects non-boolean approval ${String(gate)}`, () => {
    const a = adapter('StatusAdapter.gs');
    const client = new Proxy({}, { get() { throw new Error('client must not be accessed'); } });
    const r = a.handle({ player: 'Example Player', status: 'IN' }, {
      config: a.approved, writesEnabled: gate, client
    });
    assert.equal(r.code, 'WRITES_DISABLED');
  });
}
for (const field of ['sheetId', 'title', 'locale', 'timeZone']) {
  test(`status rejects wrong ${field} before accessing client`, () => {
    const a = adapter('StatusAdapter.gs');
    let accesses = 0;
    const r = a.handle({ player: 'Example Player', status: 'IN' }, {
      config: { ...a.approved, [field]: 'WRONG' }, writesEnabled: true,
      get client() { accesses++; throw new Error('must not access'); }
    });
    assert.equal(r.code, 'BLOCKED');
    assert.equal(accesses, 0);
  });
}
test('all TEST RPCs reject a different script project before service access', () => {
  let calls = 0;
  const ctx = vm.createContext({
    ScriptApp: { getScriptId: () => 'WRONG' },
    Sheets: new Proxy({}, { get() { calls++; throw new Error('unexpected service'); } })
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'Route.gs'), 'utf8'), ctx);
  for (const name of ['beautyTestStatus', 'beautyTestHubData', 'beautyTestEvent']) {
    assert.equal(ctx[name]({}).code, 'BLOCKED');
  }
  assert.equal(calls, 0);
});
