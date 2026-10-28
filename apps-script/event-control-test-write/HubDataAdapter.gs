/* TEST-only Hub data reader. No write API and no production fallback. */
var BeautyTestHubDataAdapter = (() => {
  const APPROVED = Object.freeze({
    mode: 'test-hub-readonly',
    sheetId: '1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo',
    title: 'TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE',
    locale: 'en_GB',
    timeZone: 'Europe/Berlin'
  });

  function identity(snapshot) {
    if (!snapshot ||
        snapshot.spreadsheetId !== APPROVED.sheetId ||
        snapshot.properties?.title !== APPROVED.title ||
        snapshot.properties?.locale !== APPROVED.locale ||
        snapshot.properties?.timeZone !== APPROVED.timeZone) {
      throw new Error('BLOCKED');
    }
  }

  function grid(snapshot, title) {
    const sheet = snapshot.sheets?.find(item => item.properties?.title === title);
    if (!sheet || !Array.isArray(sheet.data) || sheet.data.length !== 1) throw new Error('LAYOUT');
    return sheet.data[0].rowData || [];
  }

  function text(cell) {
    return String(
      cell?.formattedValue ??
      cell?.effectiveValue?.stringValue ??
      cell?.userEnteredValue?.stringValue ??
      ''
    ).trim();
  }

  function number(cell) {
    const value = cell?.effectiveValue?.numberValue;
    return Number.isFinite(value) ? value : null;
  }

  function handle(runtime) {
    try {
      if (!runtime ||
          runtime.config?.sheetId !== APPROVED.sheetId ||
          runtime.config?.title !== APPROVED.title ||
          runtime.config?.locale !== APPROVED.locale ||
          runtime.config?.timeZone !== APPROVED.timeZone) {
        throw new Error('BLOCKED');
      }

      const snapshot = runtime.client.getCells(APPROVED.sheetId, [
        "'Control'!A1:B2",
        "'TONIGHT''S PLAYERS'!A1:F100",
        "'PLAYER''S MASTER LIST'!A1:A1000"
      ]);
      identity(snapshot);

      const control = grid(snapshot, 'Control');
      const tonight = grid(snapshot, "TONIGHT'S PLAYERS");
      const master = grid(snapshot, "PLAYER'S MASTER LIST");

      const serial = number(control[1]?.values?.[0]);
      const eventDate = serial === null ? '' : BeautyEventDate.decode(serial);
      const eventDateDisplay = text(control[1]?.values?.[0]) || eventDate;

      const players = tonight.slice(1, 100).map(row => {
        const values = row?.values || [];
        return {
          player: text(values[0]),
          newPlayer: text(values[1]),
          status: text(values[2]) || 'IN',
          consent: text(values[3]),
          message: text(values[4]),
          whereFrom: text(values[5])
        };
      }).filter(player => player.player || player.newPlayer);

      const masterPlayers = master
        .slice(1)
        .map(row => text(row?.values?.[0]))
        .filter(Boolean);

      return {
        success: true,
        mode: 'test',
        identity: APPROVED,
        readOnly: true,
        eventDate,
        eventDateDisplay,
        players,
        masterPlayers,
        playerCount: players.length
      };
    } catch (error) {
      return {
        success: false,
        code: error.message === 'BLOCKED' ? 'BLOCKED' : 'UNAVAILABLE',
        error: 'TEST Hub data could not be verified.'
      };
    }
  }

  return Object.freeze({ approved: APPROVED, handle });
})();

if (typeof module !== 'undefined') module.exports = BeautyTestHubDataAdapter;
