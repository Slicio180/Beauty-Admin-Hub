const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '../Beauty-Admin-Hub/public/js/nakka-health.js'), 'utf8'
);
const ids = ['nakkaHealthCard', 'nakkaHealthDot', 'nakkaHealthText',
  'nakkaHealthMessage', 'nakkaHealthTimestamp', 'nakkaHealthRefresh'];
const initialTime = Date.parse('2026-10-23T18:00:00.000Z');
const health = (status = 'OK') => ({
  status, message: `Nakka health: ${status}`, timestamp: '2026-10-23T18:00:00.000Z'
});
const response = data => ({ ok: true, json: async () => data });

function fakeElement() {
  const classes = new Set(['waiting']);
  const listeners = new Map();
  const attributes = new Map();
  return {
    textContent: '', disabled: false, title: '', dateTime: '',
    classList: {
      add(...values) { values.forEach(value => classes.add(value)); },
      remove(...values) { values.forEach(value => classes.delete(value)); },
      contains(value) { return classes.has(value); }
    },
    setAttribute(key, value) { attributes.set(key, value); },
    getAttribute(key) { return attributes.get(key); },
    addEventListener(name, callback) { listeners.set(name, callback); },
    emit(name) { listeners.get(name)?.(); }
  };
}

async function settle() {
  for (let count = 0; count < 8; count += 1) await Promise.resolve();
}

function harness(options = {}) {
  let now = initialTime;
  let nextId = 1;
  const tasks = new Map();
  const requests = [];
  const elements = Object.fromEntries(ids.map(id => [id, fakeElement()]));
  const listeners = new Map();
  const document = {
    hidden: options.hidden ?? false,
    getElementById(id) { return id === options.missingId ? null : elements[id]; },
    addEventListener(name, callback) { listeners.set(name, callback); }
  };
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const schedule = (callback, delay, interval = 0) => {
    const id = nextId++;
    tasks.set(id, { callback, at: now + delay, interval });
    return id;
  };
  const context = vm.createContext({
    document, Date: FakeDate, URL, AbortController,
    BEAUTY_HUB_URL: 'https://script.google.com/macros/s/test/exec?page=hubdata',
    setTimeout: (callback, delay) => schedule(callback, delay),
    clearTimeout: id => tasks.delete(id),
    setInterval: (callback, delay) => schedule(callback, delay, delay),
    fetch(url, requestOptions) {
      requests.push({ url, options: requestOptions });
      return options.fetchImpl
        ? options.fetchImpl(url, requestOptions, requests.length)
        : Promise.resolve(response(health()));
    }
  });
  vm.runInContext(source, context, { filename: 'nakka-health.js' });
  return {
    elements, requests, tasks,
    async clickRefresh() { elements.nakkaHealthRefresh.emit('click'); await settle(); },
    async setHidden(hidden) {
      document.hidden = hidden;
      listeners.get('visibilitychange')?.();
      await settle();
    },
    async advance(milliseconds) {
      const until = now + milliseconds;
      while (true) {
        const next = [...tasks.entries()].filter(([, task]) => task.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, task] = next;
        now = task.at;
        if (task.interval) task.at += task.interval;
        else tasks.delete(id);
        task.callback();
        await settle();
      }
      now = until;
      await settle();
    }
  };
}

test('initial UI check calls only the read-only endpoint with an abort signal', async () => {
  const { elements, requests } = harness();
  assert.equal(elements.nakkaHealthText.textContent, 'CHECKING');
  assert.equal(elements.nakkaHealthCard.getAttribute('aria-busy'), 'true');
  await settle();
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('page'), 'nakkahealth');
  assert.equal(url.searchParams.size, 1);
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[0].options.signal.aborted, false);
  assert.equal(requests[0].options.headers, undefined);
  assert.equal(elements.nakkaHealthCard.getAttribute('aria-busy'), 'false');
});

for (const [state, cssClass] of [['OK', 'ok'], ['DEGRADED', 'degraded'], ['UNAVAILABLE', 'problem']]) {
  test(`UI renders ${state} with a clear indicator and checked time`, async () => {
    const { elements } = harness({ fetchImpl: async () => response(health(state)) });
    await settle();
    assert.equal(elements.nakkaHealthText.textContent, state);
    assert.equal(elements.nakkaHealthDot.classList.contains(cssClass), true);
    assert.equal(elements.nakkaHealthDot.classList.contains('waiting'), false);
    assert.equal(elements.nakkaHealthMessage.textContent, `Nakka health: ${state}`);
    assert.equal(elements.nakkaHealthTimestamp.dateTime, health().timestamp);
    assert.match(elements.nakkaHealthTimestamp.textContent, /^Checked: /);
  });
}

const failures = [
  ['HTTP failure', async () => ({ ok: false, status: 500, json() { throw new Error('Must not read failed HTTP body'); } })],
  ['network failure', async () => { throw new Error('Private network details'); }],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw new Error('Private JSON body'); } })],
  ['null response', async () => response(null)],
  ['unknown status', async () => response({ ...health(), status: 'PRIVATE' })],
  ['blank message', async () => response({ ...health(), message: ' ' })],
  ['invalid timestamp', async () => response({ ...health(), timestamp: 'not-a-date' })]
];
for (const [name, fetchImpl] of failures) {
  test(`UI handles ${name} without exposing raw errors`, async () => {
    const { elements } = harness({ fetchImpl });
    await settle();
    assert.equal(elements.nakkaHealthText.textContent, 'UNAVAILABLE');
    assert.equal(elements.nakkaHealthDot.classList.contains('problem'), true);
    assert.equal(elements.nakkaHealthMessage.textContent.includes('Private'), false);
    assert.equal(elements.nakkaHealthTimestamp.dateTime, new Date(initialTime).toISOString());
    assert.equal(elements.nakkaHealthCard.getAttribute('aria-busy'), 'false');
  });
}

test('UI aborts after 15 seconds and can recover on a later manual refresh', async () => {
  const ui = harness({ fetchImpl: (_url, options, attempt) => attempt > 1
    ? Promise.resolve(response(health()))
    : new Promise((_resolve, reject) => options.signal.addEventListener('abort',
      () => reject(new Error('Aborted')))) });
  await ui.advance(14999);
  assert.equal(ui.elements.nakkaHealthText.textContent, 'CHECKING');
  await ui.advance(1);
  assert.equal(ui.requests[0].options.signal.aborted, true);
  assert.equal(ui.elements.nakkaHealthText.textContent, 'UNAVAILABLE');
  assert.match(ui.elements.nakkaHealthMessage.textContent, /timed out/);
  await ui.advance(45000);
  await ui.clickRefresh();
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.elements.nakkaHealthText.textContent, 'OK');
});

test('manual refresh is limited to once per minute and resets the old OK indicator', async () => {
  let finish;
  const ui = harness({ fetchImpl: (_url, _options, attempt) => attempt === 1
    ? Promise.resolve(response(health()))
    : new Promise(resolve => { finish = resolve; }) });
  await settle();
  assert.equal(ui.elements.nakkaHealthRefresh.disabled, true);
  await ui.advance(59999);
  await ui.clickRefresh();
  assert.equal(ui.requests.length, 1);
  await ui.advance(1);
  assert.equal(ui.elements.nakkaHealthRefresh.disabled, false);
  await ui.clickRefresh();
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.elements.nakkaHealthText.textContent, 'CHECKING');
  assert.equal(ui.elements.nakkaHealthDot.classList.contains('ok'), false);
  finish(response(health()));
  await settle();
});

test('automatic refresh uses five minutes, independent of Beauty polling', async () => {
  const ui = harness();
  await settle();
  await ui.advance(299999);
  assert.equal(ui.requests.length, 1);
  await ui.advance(1);
  assert.equal(ui.requests.length, 2);
  await ui.advance(300000);
  assert.equal(ui.requests.length, 3);
});

test('an unresolved request does not overlap manual or scheduled requests', async () => {
  let finish;
  const ui = harness({ fetchImpl: () => new Promise(resolve => { finish = resolve; }) });
  await ui.clickRefresh();
  await ui.advance(300000);
  await ui.clickRefresh();
  assert.equal(ui.requests.length, 1);
  finish(response(health()));
  await settle();
});

test('hidden tabs skip polling and check overdue health when visible again', async () => {
  const ui = harness();
  await settle();
  await ui.setHidden(true);
  await ui.advance(300000);
  assert.equal(ui.requests.length, 1);
  await ui.setHidden(false);
  assert.equal(ui.requests.length, 2);
  await ui.setHidden(true);
  await ui.advance(1000);
  await ui.setHidden(false);
  assert.equal(ui.requests.length, 2);
});

test('a tab initially hidden waits until it becomes visible', async () => {
  const ui = harness({ hidden: true });
  await settle();
  assert.equal(ui.requests.length, 0);
  await ui.setHidden(false);
  assert.equal(ui.requests.length, 1);
});

test('missing health markup does not affect the rest of the Hub', async () => {
  const ui = harness({ missingId: 'nakkaHealthCard' });
  await settle();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.tasks.size, 0);
});
