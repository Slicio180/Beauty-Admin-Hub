/* TEST-only status adapter. All writes require an explicit false-by-default gate. */
var BeautyTestStatusAdapter = (() => {
  const APPROVED = Object.freeze({
    mode: 'test-status',
    sheetId: '1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo',
    title: 'TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE',
    locale: 'en_GB',
    timeZone: 'Europe/Berlin'
  });

  const STATUSES = Object.freeze(['IN', 'OUT', 'STANDBY']);

  function cleanName(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function validateInput(input) {
    if (!input ||
        Object.keys(input).sort().join(',') !== 'player,status' ||
        !cleanName(input.player) ||
        !STATUSES.includes(input.status)) {
      throw new Error('INVALID');
    }
    return { player: cleanName(input.player), status: input.status };
  }

  function handle(input, runtime) {
    let validated;
    try {
      validated = validateInput(input);
    } catch (error) {
      return { success: false, code: 'INVALID', error: 'Invalid TEST status request.' };
    }

    if (!runtime ||
        runtime.config?.sheetId !== APPROVED.sheetId ||
        runtime.config?.title !== APPROVED.title ||
        runtime.config?.locale !== APPROVED.locale ||
        runtime.config?.timeZone !== APPROVED.timeZone) {
      return { success: false, code: 'BLOCKED', error: 'TEST identity mismatch.' };
    }

    if (runtime.writesEnabled !== true) {
      return {
        success: false,
        code: 'WRITES_DISABLED',
        error: 'TEST status writes are disabled.',
        writesEnabled: false
      };
    }

    try {
      const snapshot = runtime.client.getCells(APPROVED.sheetId, [
        "'PLAYER STATUS DATA'!A1:F1000"
      ]);

      if (!snapshot ||
          snapshot.spreadsheetId !== APPROVED.sheetId ||
          snapshot.properties?.title !== APPROVED.title ||
          snapshot.properties?.locale !== APPROVED.locale ||
          snapshot.properties?.timeZone !== APPROVED.timeZone) {
        throw new Error('BLOCKED');
      }

      const sheet = snapshot.sheets?.find(
        item => item.properties?.title === 'PLAYER STATUS DATA'
      );

      if (!sheet || !Array.isArray(sheet.data) || sheet.data.length !== 1) {
        throw new Error('LAYOUT');
      }

      const rows = sheet.data[0].rowData || [];
      const text = cell => String(
        cell?.formattedValue ??
        cell?.effectiveValue?.stringValue ??
        cell?.userEnteredValue?.stringValue ??
        ''
      ).replace(/\s+/g, ' ').trim();

      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        const player = text(rows[i]?.values?.[0]);
        const oldName = text(rows[i]?.values?.[1]);

        if (player === validated.player || oldName === validated.player) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex < 1) {
        return {
          success: false,
          code: 'PLAYER_NOT_FOUND',
          error: 'Player was not found in TEST status data.',
          writesEnabled: true
        };
      }

      runtime.client.updateStatus({
        spreadsheetId: APPROVED.sheetId,
        sheetId: sheet.properties.sheetId,
        rowIndex,
        status: validated.status
      });

      const verify = runtime.client.getCells(APPROVED.sheetId, [
        "'PLAYER STATUS DATA'!A" + (rowIndex + 1) + ":C" + (rowIndex + 1)
      ]);

      if (!verify ||
          verify.spreadsheetId !== APPROVED.sheetId ||
          verify.properties?.title !== APPROVED.title) {
        throw new Error('READBACK');
      }

      const verifySheet = verify.sheets?.find(
        item => item.properties?.title === 'PLAYER STATUS DATA'
      );
      const statusCell = verifySheet?.data?.[0]?.rowData?.[0]?.values?.[2];
      const observed = text(statusCell);

      if (observed !== validated.status) {
        throw new Error('READBACK');
      }

      return {
        success: true,
        mode: 'test',
        player: validated.player,
        status: validated.status,
        writesEnabled: true,
        readbackVerified: true
      };
    } catch (error) {
      return {
        success: false,
        code: 'SAVE_UNCERTAIN',
        error: 'TEST status save could not be verified.',
        writesEnabled: true
      };
    }
  }

  return Object.freeze({
    approved: APPROVED,
    statuses: STATUSES,
    handle
  });
})();

if (typeof module !== 'undefined') module.exports = BeautyTestStatusAdapter;
