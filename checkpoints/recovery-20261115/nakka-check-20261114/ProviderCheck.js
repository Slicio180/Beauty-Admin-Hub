/* Owner-run, fixed TEST target; provider GET only. Never enables writes. */
function beautyTestNakkaRecoveryCheck20261114() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw Error('TEST_CHECK_BUSY');
  try {
    const binding = beautyTestRecoveryBindingCheck20261114();
    if (binding.result !== 'TEST_BINDING_READ_ONLY_VERIFIED') throw Error('TEST_BINDING_REQUIRED');
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty('BEAUTY_EVENT_CONTEXT_V1');
    const c = JSON.parse(raw || 'null');
    if (!c || c.revision !== '7badf194ceda4cff92e5a7205045b638' ||
        c.sheetId !== '17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE' ||
        c.leagueId !== 'lg_M2wQ_4189' || c.eventId !== 't_gINp_8026' ||
        c.date !== '2026-11-07' || c.mode !== 'league' || c.version !== 1) throw Error('TEST_CONTEXT_CHANGED');
    const user = props.getProperty('N01_API_USER'), password = props.getProperty('N01_API_PASSWORD');
    if (!user || !password) throw Error('NAKKA_CREDENTIALS_MISSING');
    let calls = 0;
    function get(path) {
      if (props.getProperty('BEAUTY_EVENT_CONTEXT_V1') !== raw) throw Error('TEST_CONTEXT_CHANGED');
      let response;
      try {
        calls++;
        response = UrlFetchApp.fetch('https://push.n01darts.com/api/v1/' + path, {
          method:'get', headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
          muteHttpExceptions:true, followRedirects:false
        });
      } catch (_) { throw Error('NAKKA_READ_UNAVAILABLE'); }
      if (response.getResponseCode() !== 200) throw Error('NAKKA_READ_HTTP_'+response.getResponseCode());
      let data;
      try { data = JSON.parse(response.getContentText()); } catch (_) { throw Error('NAKKA_READ_INVALID_JSON'); }
      if (!data || data.result !== 0) throw Error('NAKKA_READ_INVALID_RESULT');
      return data;
    }
    const league = get('league/get?lgid=lg_M2wQ_4189').league;
    if (!league || league.lgid !== c.leagueId || typeof league.title !== 'string' ||
        !/\bTEST\b/i.test(league.title) || !league.admin_id) throw Error('TEST_LEAGUE_IDENTITY_REVIEW');
    const event = get('tournament/get?tdid=t_gINp_8026&entry=0').tournament;
    if (!event || event.tdid !== c.eventId || event.lgid !== c.leagueId ||
        typeof event.title !== 'string' || !event.title.trim() || event.title !== c.title ||
        typeof event.t_date !== 'number' || !Number.isFinite(event.t_date) ||
        Utilities.formatDate(new Date(event.t_date*1000),'Europe/Stockholm','yyyy-MM-dd') !== c.date ||
        !event.admin_id || !Number.isInteger(event.status)) throw Error('TEST_EVENT_IDENTITY_REVIEW');
    const after = beautyTestRecoveryBindingCheck20261114();
    if (after.result !== 'TEST_BINDING_READ_ONLY_VERIFIED' || props.getProperty('BEAUTY_EVENT_CONTEXT_V1') !== raw) throw Error('TEST_CONTEXT_CHANGED');
    const report = {result:'TEST_NAKKA_EVENT_READ_ONLY_VERIFIED',checkedAt:new Date().toISOString(),
      league:{id:league.lgid,title:league.title,adminAccessConfirmed:true},
      event:{id:event.tdid,title:event.title,date:c.date,status:event.status},
      nakkaCalls:calls,providerEventVerified:true,propertiesWritten:false,sheetsWritten:false,
      providerWrites:0,recoveryWritesEnabled:false,productionChanged:false,
      scope:'Event identity only; no transfer, import, roster or failure-recovery verification'};
    console.log(JSON.stringify(report,null,2)); return report;
  } finally { lock.releaseLock(); }
}
