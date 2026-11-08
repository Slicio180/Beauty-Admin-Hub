/* Owner-run connection check. No web endpoint or write operations. */
function beautyLivePreflight() {
  const target = {
    scriptId: '1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4',
    sheetId: '1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',
    leagueId: 'lg_tM2v_3523',
    eventId: 't_UsRG_9574',
    date: '2026-11-09',
    title: 'AIK MÅNDAGSDARTARNA 2026/11/09'
  };

  if (ScriptApp.getScriptId() !== target.scriptId) {
    throw new Error('Wrong project. Run only in Beauty — Hub LIVE.');
  }

  const checks = [];
  function check(name, pass) {
    checks.push({ name: name, pass: pass === true });
  }

  function readSheets(path) {
    const response = UrlFetchApp.fetch(
      'https://sheets.googleapis.com/v4/spreadsheets/' +
      target.sheetId + path,
      {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
        },
        muteHttpExceptions: true,
        followRedirects: false
      }
    );

    if (response.getResponseCode() !== 200) {
      throw new Error(
        'Google Sheets HTTP ' + response.getResponseCode() +
        ': ' + response.getContentText()
      );
    }

    return JSON.parse(response.getContentText());
  }

  const spreadsheet = readSheets(
    '?fields=spreadsheetId,sheets(properties(title))'
  );

  check(
    'spreadsheet_identity',
    spreadsheet.spreadsheetId === target.sheetId
  );

  const sheetNames = (spreadsheet.sheets || []).map(function(sheet) {
    return sheet.properties.title;
  });

  [
    "PLAYER'S MASTER LIST",
    'PLAYER STATUS DATA',
    "TONIGHT'S PLAYERS",
    'Control'
  ].forEach(function(name) {
    check('sheet_present:' + name, sheetNames.includes(name));
  });

  let controlDate = null;

  if (sheetNames.includes('Control')) {
    const cells = readSheets(
      '/values/' + encodeURIComponent("'Control'!A2") +
      '?valueRenderOption=UNFORMATTED_VALUE' +
      '&dateTimeRenderOption=SERIAL_NUMBER'
    );

    const value = cells.values && cells.values[0]
      ? cells.values[0][0]
      : null;

    if (typeof value === 'number' && Number.isFinite(value)) {
      controlDate = new Date(
        Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000
      ).toISOString().slice(0, 10);
    } else if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      controlDate = value;
    }
  }

  check('selected_date_is_9_November', controlDate === target.date);

  const response = UrlFetchApp.fetch(
    'https://lbc.n01darts.com/n01/tournament/n01_tournament.php' +
    '?cmd=get_data&tdid=' + encodeURIComponent(target.eventId),
    {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: false
    }
  );

  check('nakka_readable', response.getResponseCode() === 200);

  if (response.getResponseCode() !== 200) {
    throw new Error(
      'Nakka HTTP ' + response.getResponseCode() +
      ': ' + response.getContentText()
    );
  }

  let event;
  try {
    const payload = JSON.parse(response.getContentText());
    event = payload && (payload.tournament || payload);
  } catch (error) {
    throw new Error('Nakka returned an invalid JSON response.');
  }

  if (!event || typeof event !== 'object') {
    throw new Error('Nakka returned no event data.');
  }

  check('event_identity', event.tdid === target.eventId);
  check('league_identity', event.lgid === target.leagueId);
  check('event_title', event.title === target.title);

  const eventDate =
    typeof event.t_date === 'number' && event.t_date > 0
      ? Utilities.formatDate(
          new Date(event.t_date * 1000),
          'Europe/Stockholm',
          'yyyy-MM-dd'
        )
      : null;

  check('event_date', eventDate === target.date);
  check('event_not_started', [10, 20, 25].includes(event.status));
  check(
    'singles_league_event',
    event.league === 1 && event.team_games === 0
  );

  const result = {
    check: 'BEAUTY_LIVE_PREFLIGHT_V4',
    recordedUTC: new Date().toISOString(),
    result: checks.every(function(item) { return item.pass; })
      ? 'CONNECTION_CHECKS_PASS'
      : 'NEEDS_ATTENTION',
    productionReady: false,
    writesEnabled: false,
    deploymentCreated: false,
    controlDate: controlDate,
    eventDate: eventDate,
    checks: checks
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}