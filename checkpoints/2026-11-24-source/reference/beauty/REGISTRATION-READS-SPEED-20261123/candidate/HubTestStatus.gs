/* Dedicated Identity TEST only. This gate does not enable Event Control writes. */
const BEAUTY_HUB_STATUS_WRITES_ENABLED_ = true;
function beautyHubTestStatus_(input) {
  beautyHubTestGuard_();
  const failure = (code, error) => ({ success: false, code, error });
  const valid = ['IN', 'OUT', 'STANDBY'];
  const key = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE');
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).sort().join(',') !== 'eventDate,expectedStatus,player,status' ||
      Object.values(input).some(v => typeof v !== 'string') ||
      !key(input.player) || input.player.length > 120 ||
      !valid.includes(input.status) || !valid.includes(input.expectedStatus) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) {
    return failure('INVALID', 'Ogiltig statusändring.');
  }
  if (BEAUTY_HUB_STATUS_WRITES_ENABLED_ !== true || BEAUTY_IDENTITY_WRITES_ENABLED_ !== true) {
    return failure('BLOCKED', 'Statusändringar är avstängda i TEST.');
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return failure('BUSY', 'En annan ändring pågår. Ladda om innan du försöker igen.');
  let attempted = false;
  try {
    beautyHubAuthRequire_(beautyHubRequestToken_);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (ss.getId() !== SHEET_ID) return failure('BLOCKED', 'Fel TEST-kalkylark.');
    const control = ss.getSheetByName('Control');
    const store = ss.getSheetByName('PLAYER STATUS DATA');
    const tonight = ss.getSheetByName("TONIGHT'S PLAYERS");
    if (!control || !store || !tonight) return failure('LAYOUT', 'TEST-blad saknas.');
    const date = () => {
      const value = control.getRange('A2').getValue();
      return value instanceof Date && !isNaN(value.getTime())
        ? Utilities.formatDate(value, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd') : '';
    };
    if (date() !== input.eventDate) return failure('STALE_EVENT', 'Spelkvällen har ändrats. Ladda om Hubben.');
    const locate = (sheet, isTonight) => {
      const count = sheet.getLastRow();
      if (count < 2 || count > 1000) return null;
      const rows = sheet.getRange(1, 1, count, 6).getDisplayValues();
      if (key(rows[0][2]) !== 'status') return null;
      const matches = rows.slice(1).map((values, index) => ({ values, row: index + 2 }))
        .filter(item => key(item.values[0] || (isTonight ? item.values[1] : '')) === key(input.player));
      return matches.length === 1 ? matches[0] : null;
    };
    const stored = locate(store, false), displayed = locate(tonight, true);
    if (!stored || !displayed) return failure('PLAYER_AMBIGUOUS_OR_MISSING', 'Spelaren saknas eller förekommer flera gånger. Ladda om och kontrollera listan.');
    if (stored.values[2] !== input.expectedStatus || displayed.values[2] !== input.expectedStatus) {
      return failure('STALE_STATUS', 'Status har ändrats sedan listan laddades. Ladda om före nästa ändring.');
    }
    const storeCell = store.getRange(stored.row, 3), tonightCell = tonight.getRange(displayed.row, 3);
    if (storeCell.getFormula() || tonightCell.getFormula()) return failure('FORMULA', 'Statuscellen innehåller en formel. Ingen ändring sparades.');
    // Change exactly two existing C cells. Never append, clear ranges or rebuild the list.
    if (input.status !== input.expectedStatus) {
      attempted = true;
      storeCell.setValue(input.status);
      tonightCell.setValue(input.status);
      SpreadsheetApp.flush();
    }
    const unchangedApartFromStatus = (sheet, old) => {
      const observed = sheet.getRange(old.row, 1, 1, 6).getDisplayValues()[0];
      return observed[2] === input.status && observed.every((v, i) => i === 2 || v === old.values[i]);
    };
    if (date() !== input.eventDate || !unchangedApartFromStatus(store, stored) || !unchangedApartFromStatus(tonight, displayed)) {
      return failure('SAVE_UNCERTAIN', 'Ändringen kunde inte verifieras. Ladda om och kontrollera båda statusfälten innan du försöker igen.');
    }
    const data = getBeautyHubData_();
    const observed = data.players.filter(p => key(p.player) === key(input.player));
    if (observed.length !== 1 || observed[0].status !== input.status || data.eventDate !== input.eventDate) {
      return failure('SAVE_UNCERTAIN', 'Hub-listans status kunde inte verifieras. Ladda om innan nästa ändring.');
    }
    return { success: true, mode: 'test', player: input.player, status: input.status,
      readbackVerified: true, data: Object.assign({}, data, { mode: 'test' }) };
  } catch (error) {
    return failure(attempted ? 'SAVE_UNCERTAIN' : 'READ_FAILED',
      'TEST-status kunde inte kontrolleras. Ladda om och kontrollera resultatet innan du försöker igen.');
  } finally {
    lock.releaseLock();
  }
}
