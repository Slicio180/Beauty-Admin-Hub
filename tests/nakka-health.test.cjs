const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const backendSource = fs.readFileSync(
  path.join(__dirname, '../apps-script/remote-app/Code.js'),
  'utf8'
);
const leagueUrl =
  'https://push.n01darts.com/api/v1/league/entry/list?lgid=lg_tM2v_3523';
const cacheKey = 'beauty:nakka-health:v1';
const apiUser = 'health-test-user';
const apiPassword = 'health-test-secret';

function harness(options = {}) {
  const calls = { fetches: [], cachePuts: [], lockWaits: [], releases: 0, forbidden: [] };
  const cached = new Map(options.cached ? [[cacheKey, JSON.stringify(options.cached)]] : []);
  const forbiddenService = new Proxy({}, {
    get(_target, property) {
      calls.forbidden.push(String(property));
      throw new Error(`Unexpected live service call: ${String(property)}`);
    }
  });
  const context = vm.createContext({
    console,
    SpreadsheetApp: forbiddenService,
    FormApp: forbiddenService,
    ScriptApp: forbiddenService,
    HtmlService: forbiddenService,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            if (options.missingCredentials) return null;
            return name === 'N01_API_USER' ? apiUser :
              name === 'N01_API_PASSWORD' ? apiPassword : null;
          }
        };
      }
    },
    Utilities: {
      base64Encode(value) { return Buffer.from(value).toString('base64'); },
      sleep() { throw new Error('Health checks must not retry or sleep.'); }
    },
    CacheService: {
      getScriptCache() {
        if (options.cacheError) throw new Error('Private cache failure');
        return {
          get(key) { return cached.get(key) ?? null; },
          put(key, value, ttl) {
            calls.cachePuts.push({ key, value, ttl });
            if (options.cachePutError) throw new Error('Private cache write failure');
            cached.set(key, value);
          }
        };
      }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock(milliseconds) {
            calls.lockWaits.push(milliseconds);
            return !options.lockBusy;
          },
          releaseLock() { calls.releases += 1; }
        };
      }
    },
    UrlFetchApp: {
      fetch(url, requestOptions) {
        calls.fetches.push({ url, options: requestOptions });
        if (options.fetchError) throw new Error(options.fetchError);
        return {
          getResponseCode() { return options.httpStatus ?? 200; },
          getContentText() {
            return options.body ?? JSON.stringify({ result: 0, list: [] });
          }
        };
      }
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return { text, setMimeType(type) { this.mimeType = type; return this; } };
      }
    }
  });
  vm.runInContext(backendSource, context, { filename: 'remote-app/Code.js' });
  return { context, calls };
}

function assertHealth(result, expectedStatus) {
  assert.equal(result.status, expectedStatus);
  assert.equal(typeof result.message, 'string');
  assert.ok(result.message.length > 0 && result.message.length <= 240);
  assert.match(result.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.ok(Number.isFinite(Date.parse(result.timestamp)));
  const serialized = JSON.stringify(result);
  for (const secret of [apiUser, apiPassword, Buffer.from(`${apiUser}:${apiPassword}`).toString('base64')]) {
    assert.equal(serialized.includes(secret), false, 'Health output must not contain credentials.');
  }
  assert.equal(serialized.includes('Private'), false, 'Internal errors must not reach the browser.');
}

test('health route returns JSON and uses only one authenticated league GET', () => {
  const { context, calls } = harness();
  const output = context.doGet({ parameter: { page: 'nakkahealth', player: 'Ignore', status: 'OUT' } });
  assert.equal(output.mimeType, 'application/json');
  assertHealth(JSON.parse(output.text), 'OK');
  assert.equal(calls.fetches.length, 1);
  const request = calls.fetches[0];
  assert.equal(request.url, leagueUrl);
  assert.equal(request.options.method.toLowerCase(), 'get');
  assert.equal(request.options.muteHttpExceptions, true);
  assert.equal(request.options.followRedirects, false);
  assert.equal(request.options.payload, undefined);
  assert.equal(request.options.headers.Authorization,
    `Basic ${Buffer.from(`${apiUser}:${apiPassword}`).toString('base64')}`);
  assert.deepEqual(calls.forbidden, []);
});

const cases = [
  ['empty readable league', {}, 'OK'],
  ['populated readable league', { body: JSON.stringify({ result: 0, list: [{ name: 'Private player data' }] }) }, 'OK'],
  ['missing credentials', { missingCredentials: true }, 'UNAVAILABLE'],
  ['HTTP 401', { httpStatus: 401, body: `Private ${apiPassword}` }, 'UNAVAILABLE'],
  ['HTTP 403', { httpStatus: 403 }, 'UNAVAILABLE'],
  ['HTTP 500', { httpStatus: 500, body: 'Private upstream error' }, 'DEGRADED'],
  ['HTTP 429', { httpStatus: 429 }, 'DEGRADED'],
  ['HTTP 408', { httpStatus: 408 }, 'UNAVAILABLE'],
  ['HTTP 504', { httpStatus: 504 }, 'UNAVAILABLE'],
  ['invalid JSON', { body: 'Private malformed JSON' }, 'DEGRADED'],
  ['API rejection', { body: JSON.stringify({ result: 1, list: [] }) }, 'DEGRADED'],
  ['missing API result', { body: JSON.stringify({ list: [] }) }, 'DEGRADED'],
  ['missing list', { body: JSON.stringify({ result: 0 }) }, 'DEGRADED'],
  ['non-array list', { body: JSON.stringify({ result: 0, list: {} }) }, 'DEGRADED'],
  ['null API response', { body: 'null' }, 'DEGRADED'],
  ['address unavailable', { fetchError: `Address unavailable: Private ${apiPassword}` }, 'UNAVAILABLE'],
  ['network error', { fetchError: 'Private network failure' }, 'UNAVAILABLE'],
  ['native fetch timeout', { fetchError: 'Timeout: Private upstream request' }, 'UNAVAILABLE']
];

for (const [name, options, expectedStatus] of cases) {
  test(`league health handles ${name}`, () => {
    const { context, calls } = harness(options);
    assertHealth(context.checkNakkaLeagueHealth_(), expectedStatus);
    assert.equal(calls.fetches.length, options.missingCredentials ? 0 : 1);
    assert.deepEqual(calls.forbidden, []);
  });
}

test('health response is cached for 60 seconds across requests', () => {
  const { context, calls } = harness();
  const first = context.getNakkaHealth_();
  const second = context.getNakkaHealth_();
  assertHealth(first, 'OK');
  assertHealth(second, 'OK');
  assert.equal(second.timestamp, first.timestamp);
  assert.equal(calls.fetches.length, 1);
  assert.equal(calls.cachePuts.length, 1);
  assert.equal(calls.cachePuts[0].key, cacheKey);
  assert.equal(calls.cachePuts[0].ttl, 60);
  assert.equal(calls.lockWaits.every(value => value === 0), true);
  assert.equal(calls.releases, 1);
});

test('cached degraded result is returned without another Nakka request', () => {
  const cached = { status: 'DEGRADED', message: 'Nakka API returned HTTP 500.', timestamp: '2026-10-23T18:00:00.000Z' };
  const { context, calls } = harness({ cached });
  assertHealth(context.getNakkaHealth_(), 'DEGRADED');
  assert.equal(calls.fetches.length, 0);
});

test('an in-flight health probe does not block or trigger a second request', () => {
  const { context, calls } = harness({ lockBusy: true });
  assertHealth(context.getNakkaHealth_(), 'DEGRADED');
  assert.equal(calls.fetches.length, 0);
  assert.deepEqual(calls.lockWaits, [0]);
  assert.equal(calls.releases, 0);
});

test('cache failure prevents an unthrottled upstream probe', () => {
  const { context, calls } = harness({ cacheError: true });
  assertHealth(context.getNakkaHealth_(), 'UNAVAILABLE');
  assert.equal(calls.fetches.length, 0);
});

test('cache write failure preserves a successful result and releases the lock', () => {
  const { context, calls } = harness({ cachePutError: true });
  assertHealth(context.getNakkaHealth_(), 'OK');
  assert.equal(calls.fetches.length, 1);
  assert.equal(calls.releases, 1);
});

test('failed upstream request also releases the health lock', () => {
  const { context, calls } = harness({ fetchError: `Private ${apiPassword}` });
  assertHealth(context.getNakkaHealth_(), 'UNAVAILABLE');
  assert.equal(calls.fetches.length, 1);
  assert.equal(calls.releases, 1);
});
