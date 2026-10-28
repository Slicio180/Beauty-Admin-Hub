const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/js/hub-services.js'), 'utf8');
function harness(mode = 'mock', hostname = '127.0.0.1') {
  const context = vm.createContext({ URL, Date, location: { hostname },
    document: { currentScript: { dataset: { mode } } },
    fetch() { throw new Error('NETWORK ACCESS FORBIDDEN'); } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/name-resolution-en.js'), 'utf8'), context);
  vm.runInContext(source, context);
  const service = vm.runInContext('BeautyHubServices', context);
  return { context, service, async request(page, params = {}, options) {
    const url = new URL(service.endpoint);
    url.search = new URLSearchParams({ page, ...params }).toString();
    return (await service.request(url.toString(), options)).json();
  } };
}
const registration = (name = 'Demo Dani', extra = {}) => ({ selectedName: name, newName: '', consent: 'JA', message: '', ...extra });
test('preview defaults to blocked and never falls back to network', async () => {
  const blocked = harness('');
  assert.equal(blocked.service.mode, 'blocked');
  await assert.rejects(blocked.request('hubdata'), /disconnected/);
});
test('preview rejects mock mode on non-loopback hosts', async () => {
  const h = harness('mock', 'example.com');
  assert.equal(h.service.mode, 'blocked');
  await assert.rejects(h.request('hubdata'));
});
test('preview refuses unknown mode and external endpoint configuration', async () => {
  await assert.rejects(harness('live').request('hubdata'));
  const h = harness();
  await assert.rejects(h.request('hubdata', { endpoint: 'https://example.com' }), /Blocked/);
});
test('preview returns fictional player data and defensive response copies', async () => {
  const h = harness(); const data = await h.request('hubdata');
  assert.equal(data.mode, 'mock'); assert.equal(data.playerCount, 3);
  assert(data.players.every(p => p.player.startsWith('Demo ')));
  data.players[0].player = 'changed'; data.masterPlayers.push('changed');
  assert.equal((await h.request('hubdata')).players[0].player, 'Demo Anna');
  assert.equal((await h.request('hubdata')).masterPlayers.length, 4);
});
test('preview status mutation persists only in its in-memory instance', async () => {
  const h = harness();
  assert.equal((await h.request('hubstatus', { player: 'Demo Anna', status: 'OUT' })).success, true);
  assert.equal((await h.request('hubdata')).players[0].status, 'OUT');
  assert.equal((await harness().request('hubdata')).players[0].status, 'IN');
});
test('preview rejects unknown players and invalid statuses without mutation', async () => {
  const h = harness();
  for (const params of [{ player: 'unknown', status: 'IN' }, { player: 'Demo Anna', status: 'YES' }]) {
    assert.equal((await h.request('hubstatus', params)).success, false);
  }
  assert.equal((await h.request('hubdata')).players[0].status, 'IN');
});
test('preview registers existing master player with consent and message', async () => {
  const h = harness();
  assert.equal((await h.request('hubregister', registration('Demo Dani', { consent: 'NEJ', message: '<b>text</b>' }))).success, true);
  const data = await h.request('hubdata');
  assert.equal(data.playerCount, 4); assert.equal(data.players[3].consent, 'NEJ');
  assert.equal(data.players[3].message, '<b>text</b>'); assert.equal(data.masterPlayers.length, 4);
});
test('preview registers a new fictional name and adds it to mock master', async () => {
  const h = harness();
  assert.equal((await h.request('hubregister', registration('MITT NAMN FINNS INTE I LISTAN', { newName: 'Demo Erika' }))).success, true);
  const data = await h.request('hubdata');
  assert.equal(data.players[3].newPlayer, 'Demo Erika'); assert(data.masterPlayers.includes('Demo Erika'));
});
test('preview normalizes duplicate names through the new-player route', async () => {
  const h = harness();
  const result = await h.request('hubregister', registration('MITT NAMN FINNS INTE I LISTAN', { newName: '  DEMO   anna ' }));
  assert.equal(result.success, false); assert.equal((await h.request('hubdata')).playerCount, 3);
});
test('preview requires a valid name and explicit consent before registration', async () => {
  const h = harness();
  for (const params of [registration('', {}), registration('Demo Dani', { consent: '' }), registration('Unknown'),
    registration('MITT NAMN FINNS INTE I LISTAN', { newName: ' ' })]) {
    assert.equal((await h.request('hubregister', params)).success, false);
  }
  assert.equal((await h.request('hubdata')).playerCount, 3);
});
test('preview reports Nakka as uncontacted and unavailable', async () => {
  const data = await harness().request('nakkahealth');
  assert.equal(data.status, 'UNAVAILABLE'); assert.match(data.message, /not been contacted/);
});
test('preview rejects remote URLs and non-GET methods', async () => {
  const h = harness();
  await assert.rejects(h.service.request('https://script.google.com/hub?page=hubdata'), /Blocked/);
  await assert.rejects(h.request('hubdata', {}, { method: 'POST' }), /Blocked/);
});
test('preview rejects unknown routes and duplicate query keys', async () => {
  const h = harness();
  await assert.rejects(h.request('not-a-route'), /Blocked/);
  await assert.rejects(h.service.request(h.service.endpoint + '&page=hubstatus'), /Blocked/);
});
test('preview respects aborted requests before mock mutation', async () => {
  const h = harness();
  await assert.rejects(h.request('hubstatus', { player: 'Demo Anna', status: 'OUT' }, { signal: { aborted: true } }), /Aborted/);
  assert.equal((await h.request('hubdata')).players[0].status, 'IN');
});
test('desktop entrypoints load closed service boundary before application scripts', () => {
  for (const name of ['index.html', 'preview.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');
    assert(html.indexOf('js/hub-services.js') < html.indexOf('js/app.js'));
    assert.match(html, /environment-banner/);
  }
  const index = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert(!index.includes('data-mode="mock"'));
  for (const name of ['app.js', 'nakka-health.js']) {
    const script = fs.readFileSync(path.join(__dirname, '../public/js', name), 'utf8');
    assert(!/\bfetch\s*\(|script\.google\.com/.test(script));
    assert.match(script, /BeautyHubServices\.request/);
  }
});

test('preview server serves mock entry with network-blocking policy', async t => {
  const server = require('../scripts/serve-preview.cjs').createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/);
  assert.match(await response.text(), /data-mode="mock"/);
});
test('preview server denies private source paths and write methods', async t => {
  const server = require('../scripts/serve-preview.cjs').createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/apps-script/remote-app/Code.js')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e%2fpackage.json')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});

// Minimal DOM harness executes the actual dashboard and registration event handler.
async function dashboard() {
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.listeners = {}; this.style = {};
      this.dataset = {}; this.textContent = ''; this.value = ''; this.className = '';
      const classes = () => new Set(this.className.split(/\s+/));
      this.classList = {
        add: (...items) => { this.className = [...new Set([...classes(), ...items])].join(' '); },
        remove: (...items) => { this.className = [...classes()].filter(x => !items.includes(x)).join(' '); },
        contains: item => classes().has(item)
      };
    }
    appendChild(e) { e.parent = this; this.children.push(e); return e; }
    replaceChildren() { this.children = []; }
    setAttribute(key, value) { (this.attrs ||= {})[key] = value; }
    focus() { h.context.document.activeElement = this; }
    addEventListener(type, fn) { this.listeners[type] = fn; }
    async emit(type) { await this.listeners[type]?.({ target: this, preventDefault() {} }); }
    remove() { this.parent.children = this.parent.children.filter(x => x !== this); }
    querySelectorAll(selector) {
      return this.children.flatMap(e => [ ...(e.className.split(/\s+/).includes(selector.slice(1)) ? [e] : []), ...e.querySelectorAll(selector) ]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  }
  const elements = Object.fromEntries(['currentEventDate', 'currentEventStatus', 'playerCount', 'playersTableBody',
    'beautyHealthDot', 'beautyHealthText', 'beautyHealthMessage', 'registerPlayerButton'].map(id => [id, new Element()]));
  const h = harness();
  const body = new Element();
  h.context.document = { currentScript: { dataset: {mode: 'mock'} }, body,
    getElementById: id => elements[id], createElement: tag => new Element(tag),
    addEventListener() {}, removeEventListener() {} };
  h.context.BeautyIdentityDialog = { submit: async (send, data) => {
    const result = await send(data);
    if (result.code === 'NAME_CONFLICT') return send({ ...data, identityChoice: 'existing', identityBase: result.baseName });
    return result;
  } };
  h.context.window = {}; h.context.console = console;
  h.context.setInterval = () => 0; h.context.setTimeout = () => 0;
  h.context.alert = () => { throw new Error('Unexpected alert'); };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8'), h.context);
  for (let i = 0; i < 12; i++) await Promise.resolve();
  return { ...h, elements, body };
}
test('actual dashboard renders mock data and identifies backend as demo', async () => {
  const h = await dashboard();
  assert.equal(h.elements.playerCount.textContent, '3');
  assert.equal(h.elements.beautyHealthText.textContent, 'DEMO');
  assert.equal(h.elements.playersTableBody.children.length, 3);
});
test('actual registration form sends long consent labels through mock boundary', async () => {
  const h = await dashboard();
  await h.elements.registerPlayerButton.emit('click');
  const all = (element) => [element, ...element.children.flatMap(all)];
  const nodes = all(h.body);
  nodes.find(e => e.id === 'hubRegisterPlayer').value = 'Demo Dani';
  await nodes.find(e => e.dataset.value === 'NEJ, JAG GODKÄNNER INTE').emit('click');
  await nodes.find(e => e.className === 'hub-kiosk-submit').emit('click');
  assert.equal(h.elements.playerCount.textContent, '4');
  assert.equal((await h.request('hubdata')).players[3].consent, 'NEJ');
  assert.equal(h.body.children.length, 0);
});


test('actual registration errors open dismissible message popup and preserve the form', async () => {
  const h = await dashboard();
  await h.elements.registerPlayerButton.emit('click');
  const all = element => [element, ...element.children.flatMap(all)];
  const nodes = all(h.body);
  const player = nodes.find(e => e.id === 'hubRegisterPlayer');
  player.value = 'Demo Anna';
  await nodes.find(e => e.dataset.value === 'JA, JAG GODKÄNNER').emit('click');
  await nodes.find(e => e.className === 'hub-kiosk-submit').emit('click');
  assert.equal(h.body.children.length, 2);
  const popup = h.body.querySelector('.message-popup');
  assert(popup);
  assert.match(popup.querySelector('.message-popup-text').textContent, /already registered/);
  assert.equal(nodes.find(e => e.className === 'hub-register-error').style.display, 'none');
  assert.equal(h.elements.playerCount.textContent, '3');
  assert.equal((await h.request('hubdata')).playerCount, 3);
  await popup.querySelector('.message-popup-close').emit('click');
  assert.equal(h.body.children.length, 1);
  assert.equal(player.value, 'Demo Anna');
});

test('actual Hub form and identity dialog create a distinct mock player after confirmation', async () => {
 const h = await dashboard();
 vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/identity-dialog-en.js'), 'utf8'), h.context);
 await h.elements.registerPlayerButton.emit('click');
 const all = element => [element, ...element.children.flatMap(all)];
 const nodes=all(h.body);nodes.find(e=>e.id==='hubRegisterPlayer').value='MITT NAMN FINNS INTE I LISTAN';
 nodes.find(e=>e.className==='hub-kiosk-new-name').value='Demo Anna';
 await nodes.find(e=>e.dataset.value==='JA, JAG GODKÄNNER').emit('click');
 const pending=nodes.find(e=>e.className==='hub-kiosk-submit').emit('click');
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(h.elements.playerCount.textContent,'3');
 const identity=h.body.querySelector('.identity-dialog');assert(identity);
 identity.children.find(e=>e.textContent==='I AM A DIFFERENT PERSON').emit('click');
 const detail=identity.querySelector('.identity-detail');detail.value='Karla';await detail.emit('input');
 const confirm=identity.querySelector('.identity-detail-area').children.find(e=>e.tagName==='button');
 await confirm.emit('click');assert.equal(h.elements.playerCount.textContent,'3');await confirm.emit('click');await pending;
 assert.equal(h.elements.playerCount.textContent,'4');const data=await h.request('hubdata');
 assert.equal(data.players[0].player,'Demo Anna');assert.equal(data.players[3].player,'Demo Anna (Karla)');
});
