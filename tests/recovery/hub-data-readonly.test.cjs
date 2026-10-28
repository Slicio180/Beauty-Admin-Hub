const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../apps-script/event-control-test-write');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('TEST Hub data adapter is pinned to isolated sheet', () => {
  const s = read('HubDataAdapter.gs');
  assert.match(s, /1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo/);
  assert.match(s, /TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE/);
  assert.match(s, /Europe\/Berlin/);
  assert.match(s, /en_GB/);
});

test('TEST Hub data adapter contains no write API', () => {
  const s = read('HubDataAdapter.gs');
  assert.doesNotMatch(s, /batchUpdate|updateCells|appendCells|deleteDimension|setValue|setValues|SpreadsheetApp/);
});

test('TEST Hub data adapter reads bounded ranges only', () => {
  const s = read('HubDataAdapter.gs');
  assert.match(s, /Control'!A1:B2/);
  assert.match(s, /TONIGHT''S PLAYERS'!A1:F100/);
  assert.match(s, /PLAYER''S MASTER LIST'!A1:A1000/);
});

test('Route exposes read-only TEST Hub RPC', () => {
  const s = read('Route.gs');
  assert.match(s, /function beautyTestHubData\(\)/);
  assert.match(s, /BeautyTestHubDataAdapter\.handle/);
});

test('Hub routes hubdata through TEST RPC', () => {
  const s = read('Hub.html');
  assert.match(s, /const BeautyTestHubDataServices/);
  assert.match(s, /\.beautyTestHubData\(\)/);
  assert.match(s, /typeof BeautyTestHubDataServices === 'undefined'/);
});

test('TEST status dropdown remains disabled', () => {
  const s = read('Hub.html');
  assert.match(s, /const testStatusMode/);
  assert.match(s, /testStatusMode \|\|/);
});

test('Event Control write gate remains closed', () => {
  const s = read('Route.gs');
  assert.match(s, /const BEAUTY_TEST_WRITES_APPROVED_ = false;/);
});
