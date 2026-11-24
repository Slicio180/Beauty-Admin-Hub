/* Read-only inspection. No event save function or event-write gate is exposed. */
function beautyHubTestEventPreview_(input) {
  beautyHubTestGuard_();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) {
    throw new Error('Invalid Event Control inspection input.');
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { success: false, code: 'BUSY', error: 'Another operation is running. Try reading again shortly.' };
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (ss.getId() !== SHEET_ID) throw new Error('identity');
    const headers = {
      Control: ['START DATE', 'LAST RESET'],
      'PLAYER STATUS DATA': ['PLAYER', 'OLD NAME', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE'],
      "TONIGHT'S PLAYERS": ['PLAYERS', 'NEW PLAYERS', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE', 'WHERE FROM'],
      "PLAYER'S MASTER LIST": ['PLAYERS'],
      'Form responses 2': ['Timestamp', 'VÄLJ DITT NAMN', 'Skriv ditt fullständiga namn', 'Foto- och videomedgivande', 'Meddelande', 'WHERE FROM']
    };
    const sheets = {}, blockers = [], warnings = [];
    for (const [title, expected] of Object.entries(headers)) {
      const sheet = ss.getSheetByName(title);
      if (!sheet) { blockers.push('Missing sheet: ' + title); continue; }
      sheets[title] = sheet;
      const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) blockers.push('Headers need review: ' + title);
    }
    if (Object.keys(sheets).length !== Object.keys(headers).length) {
      return { success: true, mode: 'test', inspectionOnly: true, writesEnabled: false, blockers, warnings, resetPlan: null };
    }
    const zone = ss.getSpreadsheetTimeZone();
    if (zone !== 'Europe/Berlin') blockers.push('Time zone needs review: ' + zone);
    const control = sheets.Control.getRange(2, 1, 1, 2);
    const values = control.getValues()[0], display = control.getDisplayValues()[0];
    const date = values[0] instanceof Date && !isNaN(values[0].getTime())
      ? Utilities.formatDate(values[0], zone, 'yyyy-MM-dd') : '';
    if (!date) blockers.push('Control A2 is not a valid date.');
    if (control.getFormulas()[0].some(Boolean)) blockers.push('Control A2/B2 contains a formula.');
    const store = sheets['PLAYER STATUS DATA'], tonight = sheets["TONIGHT'S PLAYERS"];
    const rowCount = store.getLastRow(), columns = Math.max(6, store.getLastColumn());
    const tonightRows = tonight.getLastRow();
    let resetPlan = null;
    if (rowCount > 1000 || columns > 100 || rowCount * columns > 50000 || tonightRows > 1000) {
      blockers.push('The sheet size exceeds this bounded inspection.');
    } else {
      const range = store.getRange(1, 1, Math.max(1, rowCount), columns);
      const data = range.getDisplayValues(), formulas = range.getFormulas();
      let retained = 0, deleted = 0, garbage = 0, retainedSources = 0;
      for (const row of data.slice(1)) {
        if (String(row[0] || '').trim() && String(row[1] || '').trim()) {
          retained++; if (String(row[5] || '').trim()) retainedSources++;
        } else { deleted++; if (!String(row[0] || '').trim()) garbage++; }
      }
      if (formulas.some(row => row.some(Boolean))) blockers.push('Formulas in PLAYER STATUS DATA need review before a reset.');
      const tonightRange = tonight.getRange(1, 1, Math.max(1, tonightRows), 6);
      const tonightData = tonightRange.getDisplayValues();
      const visible = tonightData.slice(1).filter(row => row[0] || row[1]).length;
      if (visible > 99) blockers.push('More than 99 event players: the legacy reset limit needs review.');
      const statusFormulas = tonightRange.getFormulas().slice(1, 100).filter(row => row[2]).length;
      if (statusFormulas) blockers.push('Status formulas in Tonight\'s Players would be replaced by the legacy reset.');
      if (retainedSources) warnings.push('The legacy reset retains source column F on ' + retainedSources + ' retained name-correction rows. This rule needs review.');
      resetPlan = { deleteStatusRows: deleted, deleteBlankOrGarbageRows: garbage,
        retainNameCorrectionRows: retained, clearRetainedEventCells: retained * 3,
        retainedSourceRows: retainedSources, visiblePlayers: visible,
        clearTonightRange: 'C2:C100', updateControlCells: ['A2', 'B2'],
        responseRows: sheets['Form responses 2'].getLastRow(),
        preserveMasterList: true, preserveResponses: true };
    }
    return { success: true, mode: 'test', inspectionOnly: true, writesEnabled: false,
      spreadsheet: { id: ss.getId(), title: ss.getName(), timeZone: zone, locale: ss.getSpreadsheetLocale() },
      eventDate: date, eventDateDisplay: display[0], lastResetDisplay: display[1],
      resetPlan, blockers, warnings, checkedAt: new Date().toISOString() };
  } catch (error) {
    return { success: false, code: 'READ_FAILED', error: 'Event Control could not be read. No changes were requested.' };
  } finally { lock.releaseLock(); }
}
