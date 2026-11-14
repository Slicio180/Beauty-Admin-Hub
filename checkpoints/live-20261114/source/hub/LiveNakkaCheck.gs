
/* Run from the LIVE editor. Fixed-target, GET-only API check; no secrets logged. */
function beautyLiveNakkaCheck_() {
  if (ScriptApp.getScriptId() !== '1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4') {
    throw new Error('Wrong project. Run only in Beauty — Hub LIVE.');
  }
  const properties = PropertiesService.getScriptProperties();
  const user = properties.getProperty('N01_API_USER');
  const password = properties.getProperty('N01_API_PASSWORD');
  if (!user || !password) throw new Error('Nakka API properties are missing.');
  const authorization = 'Basic ' + Utilities.base64Encode(user + ':' + password);
  function read(path) {
    let response;
    try {
      response = UrlFetchApp.fetch('https://push.n01darts.com/api/v1/' + path, {
        method: 'get',
        headers: { Authorization: authorization },
        muteHttpExceptions: true,
        followRedirects: false
      });
    } catch (error) {
      throw new Error('Nakka connection failed. No writes attempted.');
    }
    const status = response.getResponseCode();
    if (status !== 200) throw new Error('Nakka API returned HTTP ' + status + '. No writes attempted.');
    let data;
    try { data = JSON.parse(response.getContentText()); }
    catch (error) { throw new Error('Nakka returned an unreadable response.'); }
    if (!data || data.result !== 0) throw new Error('Nakka did not confirm this API request.');
    return data;
  }
  const league = read('league/get?lgid=lg_tM2v_3523').league;
  const event = read('tournament/get?tdid=t_UsRG_9574').tournament;
  const members = read('league/entry/list?lgid=lg_tM2v_3523').list;
  const entries = read('tournament/entry/list?tdid=t_UsRG_9574').list;
  const eventDate = event && Number.isFinite(event.t_date)
    ? Utilities.formatDate(new Date(event.t_date * 1000), 'Europe/Stockholm', 'yyyy-MM-dd')
    : null;
  const checks = {
    league_identity: !!league && league.lgid === 'lg_tM2v_3523',
    event_identity: !!event && event.tdid === 't_UsRG_9574',
    event_league: !!event && event.lgid === 'lg_tM2v_3523',
    event_date: eventDate === '2026-11-09',
    event_title: !!event && event.title === 'AIK MÅNDAGSDARTARNA 2026-11-09',
    event_not_started: !!event && [10, 20, 25].includes(event.status),
    singles_league_event: !!event && event.league === 1 && event.team_games === 0,
    league_entries_readable: Array.isArray(members),
    event_entries_readable: Array.isArray(entries)
  };
  const result = {
    check: 'BEAUTY_LIVE_NAKKA_API_READ_CHECK',
    recordedUTC: new Date().toISOString(),
    result: Object.values(checks).every(Boolean) ? 'API_READ_CHECKS_PASS' : 'NEEDS_ATTENTION',
    writesAttempted: false,
    writeAccessVerified: false,
    productionReady: false,
    eventTitle: event.title,
    eventDate: eventDate,
    leaguePlayerCount: Array.isArray(members) ? members.length : null,
    eventPlayerCount: Array.isArray(entries) ? entries.length : null,
    checks: checks
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
