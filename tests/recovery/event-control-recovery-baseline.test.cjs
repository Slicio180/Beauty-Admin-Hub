const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../apps-script/event-control-test-write');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const sha256 = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');

function loadDateEncoding() {
  const context = { module: { exports: {} }, console };
  vm.createContext(context);
  vm.runInContext(read('DateEncoding.gs'), context, { filename: 'DateEncoding.gs' });
  return context.module.exports;
}

test('qualified Adapter hash is exact', () => {
  assert.equal(sha256('Adapter.gs'), 'cedbba88cc6df4906d3ede28971bf07d4dc6e967438165dd9ea7d03ce5f7f309');
});

test('original recovered Drive Hub remains preserved exactly', () => {
  const preservedHub = path.resolve(
    __dirname,
    '../../backups/pre-hub-test-readonly-data-2026-10-24/Hub.html'
  );

  const preservedHash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(preservedHub))
    .digest('hex');

  assert.equal(
    preservedHash,
    '4f91f27c627801b936721e4265a7f166d22a37b9957ff1c4552abe2f54593a41'
  );
});

test('current TEST Hub contains the read-only Hub data bridge', () => {
  const hub = fs.readFileSync(path.join(root, 'Hub.html'), 'utf8');
  assert.match(hub, /BeautyTestHubDataServices/);
  assert.match(hub, /TEST Hub data is read-only/);
});

test('DateEncoding hash matches recovered script body', () => {
  assert.equal(sha256('DateEncoding.gs'), 'f78a76c407cac558eddd1de25df80624973454b57437a34e4785931d322c8634');
});

test('DateEncoding round-trips supported dates', () => {
  const d = loadDateEncoding();
  for (const date of ['1000-01-01','1899-12-30','1900-02-28','1900-03-01','2000-02-29','2026-10-24','2099-01-12','9999-12-31']) {
    assert.equal(d.decode(d.encode(date)), date);
  }
});

test('DateEncoding rejects impossible and fractional dates', () => {
  const d = loadDateEncoding();
  assert.throws(() => d.encode('2026-02-29'));
  assert.throws(() => d.encode('0999-12-31'));
  assert.throws(() => d.decode(123.5));
});

test('TEST route is pinned and write gate is closed', () => {
  const route = read('Route.gs');
  assert.match(route, /BEAUTY_TEST_PROJECT_ID_\s*=\s*'1Yz1OG9kbvBGnvJBxuuYHc07g5LibW-oCsJP2a39J-4AJRhZZ9SYJFcnb'/);
  assert.match(route, /BEAUTY_TEST_WRITES_APPROVED_\s*=\s*false/);
  assert.doesNotMatch(route, /function\s+doPost\s*\(/);
  assert.match(route, /External configuration rejected\./);
});

test('TEST manifest remains owner-only and Sheets v4', () => {
  const manifest = JSON.parse(read('appsscript.json'));
  assert.equal(manifest.timeZone, 'Europe/Berlin');
  assert.equal(manifest.runtimeVersion, 'V8');
  assert.deepEqual(manifest.webapp, { executeAs: 'USER_ACCESSING', access: 'MYSELF' });
  assert.ok(manifest.dependencies.enabledAdvancedServices.some(s => s.userSymbol === 'Sheets' && s.serviceId === 'sheets' && s.version === 'v4'));
});

test('Preflight remains pinned to TEST identity and bounded reads', () => {
  const src = read('Preflight.gs');
  assert.match(src, /mode:\s*'test-readonly'/);
  assert.match(src, /1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo/);
  assert.match(src, /MAX_CELLS\s*=\s*50000/);
  assert.match(src, /READ_ONLY_PREFLIGHT_COMPLETE/);
});

test('Adapter retains all stale diagnostics and no automatic retry', () => {
  const src = read('Adapter.gs');
  for (const token of ['BASELINE_DATE_MISMATCH','BASELINE_TOKEN_MISMATCH','PREWRITE_SNAPSHOT_MISMATCH','SAVE_UNCERTAIN']) {
    assert.match(src, new RegExp(token));
  }
  assert.match(src, /No automatic retry/);
});

test('Recovered TEST Hub clearly identifies isolated view', () => {
  const hub = read('Hub.html');
  assert.match(hub, /TEST Event Control only\. Dashboard player data and registration are unavailable in this test view\./);
  assert.match(hub, /Beauty Admin Hub/);
});
