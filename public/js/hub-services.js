/* Desktop Hub boundary. No network client or configurable remote endpoint.
 * Mock mode is allowed only on loopback and explicitly selected by preview.html.
 * This is an offline UI preview, not authentication or live-write qualification.
 */
const BeautyHubServices = (() => {
  const endpoint = 'https://beauty.invalid/hub?page=hubdata';
  const loopback = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname);
  const mode = loopback && document.currentScript?.dataset.mode === 'mock' ? 'mock' : 'blocked';
  const masterPlayers = ['Demo Anna', 'Demo Björn', 'Demo Charlie', 'Demo Dani'];
  const players = [
    { player: 'Demo Anna', newPlayer: '', status: 'IN', consent: 'JA', message: '', whereFrom: 'DEMO' },
    { player: 'Demo Björn', newPlayer: '', status: 'STANDBY', consent: 'NEJ',
      message: 'This is a fictional message for testing the message popup.', whereFrom: 'DEMO' },
    { player: 'Demo Charlie', newPlayer: '', status: 'OUT', consent: 'JA', message: '', whereFrom: 'DEMO' }
  ];
  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv');
  const copy = value => JSON.parse(JSON.stringify(value));
  const response = data => ({ ok: true, json: async () => copy(data) });
  const failure = error => response({ success: false, error });
  async function request(raw, options = {}) {
    if (options.signal?.aborted) throw new Error('Aborted');
    if (mode !== 'mock') throw new Error('The Hub is disconnected. Open the local preview.');
    const url = new URL(raw);
    if (url.origin !== 'https://beauty.invalid' || url.pathname !== '/hub' ||
        url.username || url.password || url.hash ||
        (options.method && options.method !== 'GET')) throw new Error('Blocked request');
    const page = url.searchParams.get('page');
    const keys = { hubdata: ['page'], attentionrefresh: ['page'], nakkaevent: ['page'], eventcontrol: ['page'], nakkahealth: ['page'], hubstatus: ['page', 'player', 'status'],
      hubregister: ['page', 'selectedName', 'newName', 'consent', 'message', 'identityChoice', 'identityBase', 'identityDetail', 'identityConfirmedName'] }[page];
    if (!keys || [...url.searchParams.keys()].some(key => !keys.includes(key)) ||
        [...url.searchParams.keys()].some(key => url.searchParams.getAll(key).length !== 1)) {
      throw new Error('Blocked route or configuration');
    }
    if (page === 'nakkaevent') return response({success:true,status:'MATCHED',eventDate:'2026-10-26',event:{id:'t_DEMO_0000',date:'2026-10-26',title:'DEMO — Monday darts'}});
    if (page === 'attentionrefresh') return response({success:true,attention:{available:true,eventDate:'2026-10-26',items:[],complete:true,checkedAt:'2026-10-26T18:00:00Z'}});
    if (page === 'eventcontrol') return response({ success: true, mode: 'mock', inspectionOnly: true, writesEnabled: false, eventDate: '2026-10-26', eventDateDisplay: '26 October 2026', lastResetDisplay: 'Demo only', spreadsheet: { title: 'OFFLINE DEMO', timeZone: 'Europe/Berlin', locale: 'en_GB' }, resetPlan: { visiblePlayers: players.length, responseRows: 0, deleteStatusRows: players.length, retainNameCorrectionRows: 0, clearRetainedEventCells: 0 }, blockers: [], warnings: ['Fictional demonstration. No spreadsheet is connected.'] });
    if (page === 'nakkahealth') return response({ status: 'UNAVAILABLE',
      message: 'DEMO — Nakka has not been contacted.', timestamp: new Date().toISOString() });
    if (page === 'hubdata') return response({ success: true, mode: 'mock',
      eventDate: '2026-10-26', eventDateDisplay: 'DEMO — 26 October 2026',
      players, masterPlayers, playerCount: players.length, attention:{available:true,eventDate:'2026-10-26',items:[],complete:true,checkedAt:'2026-10-26T18:00:00Z'} });
    if (page === 'hubstatus') {
      const matches = players.filter(p => normalize(p.player) === normalize(url.searchParams.get('player')));
      const status = url.searchParams.get('status');
      if (matches.length !== 1 || !['IN', 'OUT', 'STANDBY'].includes(status)) return failure('Invalid player or status.');
      matches[0].status = status;
      return response({ success: true, mode: 'mock', status });
    }
    const selected = url.searchParams.get('selectedName');
    const newRoute = selected === 'MITT NAMN FINNS INTE I LISTAN';
    let name = (newRoute ? url.searchParams.get('newName') : selected) || '';
    name = name.trim().replace(/\s+/g, ' ');
    const rawConsent = url.searchParams.get('consent');
    const consent = ({ 'JA, JAG GODKÄNNER': 'JA', 'NEJ, JAG GODKÄNNER INTE': 'NEJ' })[rawConsent] || rawConsent;
    const message = url.searchParams.get('message') || '';
    if (!name || name.length > 120 || message.length > 2000 || !['JA', 'NEJ'].includes(consent)) return failure('Check the name, message and consent.');
    const input = Object.fromEntries(url.searchParams);
    const decision = BeautyNameResolution.resolve(input, masterPlayers, players.map(p => p.player));
    if (!decision.success) return response(decision);
    name = decision.player;
    if (decision.isNew) masterPlayers.push(name);
    players.push({ player: name, newPlayer: decision.isNew ? name : '', status: 'IN', consent, message, whereFrom: 'DEMO' });
    return response({ success: true, mode: 'mock', player: name });
  }
  return Object.freeze({ endpoint, mode, request });
})();
