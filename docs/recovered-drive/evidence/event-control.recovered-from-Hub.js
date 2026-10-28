/* Event date UI uses the same isolated service boundary as the dashboard. */
(() => {
  const byId = id => document.getElementById('eventControl' + id);
  const panel = byId('Panel');
  if (!panel) return;
  const input = byId('Date'), confirm = byId('Confirm'), save = byId('Save');
  const reload = byId('Reload'), cancel = byId('Cancel'), message = byId('Message');
  const testAdapter = typeof BeautyTestEventServices === 'undefined' ? null : BeautyTestEventServices;
  const mode = testAdapter ? 'test' : 'mock';
  const label = mode === 'test' ? 'TEST' : 'mock';
  const validDate = value => (testAdapter || BeautyServices).validDate(value);
  let writesEnabled = mode === 'mock';
  if (testAdapter) byId('Environment').textContent = 'TEST ONLY — ' + testAdapter.identity.title +
    ' | ' + testAdapter.identity.sheetId + ' | Europe/Berlin | en_GB';
  let current = null, currentVersion = null, busy = false, generation = 0;
  function controls() {
    save.disabled = busy || !writesEnabled || current === null || currentVersion === null || !confirm.checked ||
      !validDate(input.value) || input.value === current;
    reload.disabled = busy;
    cancel.disabled = busy;
    input.disabled = busy;
    confirm.disabled = busy;
    panel.setAttribute('aria-busy', String(busy));
  }
  async function request(options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mode === 'test' ? 45000 : 15000);
    try {
      // Race with abort as a faulty adapter may ignore the signal. Never retry saves.
      const aborted = new Promise((_, reject) => controller.signal.addEventListener('abort',
        () => reject(new Error('Request timed out. Reload before trying again.')), { once: true }));
      const response = await Promise.race([
        testAdapter ? testAdapter.request({ ...options, signal: controller.signal }) :
          BeautyServices.request(BeautyServices.endpoint + '?page=eventcontrol', { ...options, signal: controller.signal }), aborted
      ]);
      if (!response.ok) throw new Error('Event service unavailable. Reload before trying again.');
      const result = await Promise.race([response.json(), aborted]);
      if (!result || result.success !== true) {
        const failure = new Error('Event operation failed.'); failure.code = result?.code; throw failure;
      }
      if (result.mode !== mode || !(result.eventDate === '' || validDate(result.eventDate)) ||
          typeof result.version !== 'string' || !result.version || result.version.length > 1024) {
        throw new Error('Invalid event response. Reload before trying again.');
      }
      return result;
    } finally { clearTimeout(timeout); }
  }
  async function load() {
    if (busy) return;
    const token = ++generation;
    busy = true; current = null; currentVersion = null; confirm.checked = false;
    message.textContent = 'Loading ' + label + ' event…'; controls();
    try {
      const result = await request({ method: 'GET' });
      if (token !== generation) return;
      current = result.eventDate; currentVersion = result.version; input.value = current;
      writesEnabled = mode === 'mock' || result.writesEnabled === true;
      byId('Current').textContent = current || 'No event selected';
      message.textContent = mode === 'test' ? (writesEnabled ? 'TEST event loaded.' : 'TEST event loaded; writes await approval.') : 'Local mock event loaded.';
    } catch (error) { message.textContent = 'Could not load the ' + label + ' event. Reload before saving.'; }
    finally { busy = false; controls(); }
  }
  for (const id of ['Nav', 'Open']) byId(id).addEventListener('click', () => {
    panel.hidden = false; load();
  });
  cancel.addEventListener('click', () => {
    if (busy) return;
    generation++; confirm.checked = false; current = null; currentVersion = null; panel.hidden = true; controls();
  });
  reload.addEventListener('click', load);
  input.addEventListener('input', () => { confirm.checked = false; controls(); });
  confirm.addEventListener('change', controls);
  byId('Form').addEventListener('submit', async event => {
    event.preventDefault(); controls();
    if (save.disabled) return;
    busy = true; message.textContent = 'Saving ' + label + ' event…'; controls();
    try {
      const result = await request({ method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'eventcontrol', date: input.value, expectedDate: current, expectedVersion: currentVersion, confirmed: confirm.checked }) });
      if (result.eventDate !== input.value) throw new Error('Date mismatch');
      // Independently reload after a TEST save; never resend the mutation.
      const readback = mode === 'test' ? await request({ method: 'GET' }) : result;
      if (readback.eventDate !== result.eventDate || readback.version !== result.version ||
          (mode === 'test' && result.changed && result.readbackVerified !== true)) throw new Error('Readback mismatch');
      current = readback.eventDate;
      currentVersion = readback.version;
      writesEnabled = mode === 'mock' || readback.writesEnabled === true;
      byId('Current').textContent = current;
      message.textContent = result.changed ? (mode === 'test' ? 'TEST' : 'Mock') + ' event date saved; event data reset.' : 'Event date unchanged.';
      if (mode === 'mock' && typeof loadBeautyHubData === 'function') await loadBeautyHubData();
    } catch (error) {
      current = null;
      currentVersion = null;
      message.textContent = error.code === 'STALE' ? 'STALE: Event baseline changed. Reload and confirm again.' :
        error.code === 'SAVE_UNCERTAIN' ? 'SAVE_UNCERTAIN: Inspect TEST state before any further write. Reload; no automatic retry.' :
        'Save could not be confirmed. Reload and inspect the current event before trying again.';
    } finally { busy = false; confirm.checked = false; controls(); }
  });
})();
