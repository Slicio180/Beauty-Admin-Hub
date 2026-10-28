const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../apps-script/event-control-test-write');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('status write gate is false by default', () => {
  assert.match(read('Route.gs'), /const BEAUTY_TEST_STATUS_WRITES_APPROVED_ = false;/);
});

test('Event Control write gate remains false', () => {
  assert.match(read('Route.gs'), /const BEAUTY_TEST_WRITES_APPROVED_ = false;/);
});

test('status adapter is pinned to TEST identity', () => {
  const s = read('StatusAdapter.gs');
  assert.match(s, /1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo/);
  assert.match(s, /TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE/);
  assert.match(s, /Europe\/Berlin/);
  assert.match(s, /en_GB/);
});

test('status adapter only accepts IN OUT STANDBY', () => {
  const code = read('StatusAdapter.gs');
  const context = { module: { exports: {} } };
  vm.createContext(context);
  vm.runInContext(code, context);
  const adapter = context.module.exports;

  const runtime = { config: adapter.approved, writesEnabled: false };

  assert.equal(adapter.handle({ player: 'Test Player', status: 'IN' }, runtime).code, 'WRITES_DISABLED');
  assert.equal(adapter.handle({ player: 'Test Player', status: 'OUT' }, runtime).code, 'WRITES_DISABLED');
  assert.equal(adapter.handle({ player: 'Test Player', status: 'STANDBY' }, runtime).code, 'WRITES_DISABLED');
  assert.equal(adapter.handle({ player: 'Test Player', status: 'DELETE' }, runtime).code, 'INVALID');
});

test('closed gate prevents client access entirely', () => {
  const code = read('StatusAdapter.gs');
  const context = { module: { exports: {} } };
  vm.createContext(context);
  vm.runInContext(code, context);
  const adapter = context.module.exports;

  let touched = false;
  const result = adapter.handle(
    { player: 'Test Player', status: 'OUT' },
    {
      config: adapter.approved,
      writesEnabled: false,
      client: {
        getCells() { touched = true; },
        updateStatus() { touched = true; }
      }
    }
  );

  assert.equal(result.code, 'WRITES_DISABLED');
  assert.equal(touched, false);
});

test('Route exposes dedicated TEST status RPC', () => {
  const s = read('Route.gs');
  assert.match(s, /function beautyTestStatus\(input\)/);
  assert.match(s, /BeautyTestStatusAdapter\.handle/);
  assert.match(s, /BEAUTY_TEST_STATUS_WRITES_APPROVED_ === true/);
});

test('Hub has TEST status bridge but dropdown stays disabled while gated', () => {
  const s = read('Hub.html');
  assert.match(s, /const BeautyTestStatusServices/);
  assert.match(s, /BeautyTestStatusServices\.save/);
  assert.match(s, /const testStatusMode/);
  assert.match(s, /select\.disabled =[\s\S]*testStatusMode/);
});
