/* Included only in the separately packaged TEST Hub, never by index.html.
 * Google Script RPC only: no URLs, fetch, external configuration or fallback.
 */
const BeautyTestEventServices = (() => {
  const identity = Object.freeze({ mode: 'test-event-control',
    sheetId: '1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo',
    title: 'TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE',
    locale: 'en_GB', timeZone: 'Europe/Berlin' });
  function validDate(value) { try { BeautyEventDate.encode(value); return true; } catch (error) { return false; } }
  async function request(options) {
    if (typeof BEAUTY_DEV_CONFIG !== 'undefined' || typeof BEAUTY_TEST_CONFIG !== 'undefined') throw new Error('External configuration blocked.');
    if (options.signal?.aborted) throw new Error('Aborted');
    let input;
    if (options.method === 'GET') input = { action: 'load' };
    else if (options.method === 'POST' && options.headers?.['Content-Type'] === 'application/json') {
      const data = JSON.parse(options.body);
      if (!data || Object.keys(data).sort().join(',') !== 'confirmed,date,expectedDate,expectedVersion,page' || data.page !== 'eventcontrol') throw new Error('Invalid TEST save');
      input = { action: 'save', date: data.date, expectedDate: data.expectedDate, expectedVersion: data.expectedVersion, confirmed: data.confirmed };
    } else throw new Error('Invalid TEST method');
    const result = await new Promise((resolve, reject) => {
      google.script.run.withSuccessHandler(resolve).withFailureHandler(() => reject(new Error('TEST service unavailable.'))).beautyTestEvent(input);
    });
    if (result?.success === true && (result.mode !== 'test' || !result.identity ||
        Object.keys(result.identity).sort().join(',') !== Object.keys(identity).sort().join(',') ||
        Object.keys(identity).some(key => result.identity[key] !== identity[key]) || typeof result.writesEnabled !== 'boolean')) {
      throw new Error('TEST identity mismatch');
    }
    return { ok: true, json: async () => result };
  }
  return Object.freeze({ mode: 'test', identity, validDate, request });
})();
