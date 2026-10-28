/* Separate TEST-only adapter. All I/O is injected; no legacy configuration or
 * production fallback is consulted. The real route's write gate starts closed.
 */
var BeautyTestEventAdapter = (() => {
  const APPROVED = Object.freeze({ mode: 'test-event-control',
    sheetId: '1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo',
    title: 'TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE',
    locale: 'en_GB', timeZone: 'Europe/Berlin' });
  const fail = (code, diagnostic) => ({ success: false, code, ...(diagnostic ? { diagnostic } : {}), error: ({
    BLOCKED: 'TEST identity or configuration rejected.', INVALID: 'Invalid event request.',
    BUSY: 'Another operation is running. Reload before saving.',
    STALE: 'The TEST baseline changed. Reload and confirm again.',
    WRITES_DISABLED: 'TEST writes await explicit approval.',
    UNAVAILABLE: 'Could not verify TEST state. Reload before saving.',
    SAVE_UNCERTAIN: 'Save could not be verified. Inspect TEST state before any further write. Never retry automatically.'
  })[code] });
  // Compare every field without depending on API object-key insertion order.
  // Tags retain primitive types, explicit undefined, array holes/length and -0;
  // JSON snapshots never need functions, nonfinite numbers or exotic objects.
  function canonical(value) {
    if (value === null) return ['null'];
    const type = typeof value;
    if (type === 'undefined') return ['undefined'];
    if (type === 'string' || type === 'boolean') return [type, value];
    if (type === 'number' && Number.isFinite(value)) return [type, Object.is(value, -0) ? '-0' : String(value)];
    if (type !== 'object' || (!Array.isArray(value) && Object.prototype.toString.call(value) !== '[object Object]')) {
      throw new Error('INVALID_SNAPSHOT_VALUE');
    }
    return [Array.isArray(value) ? 'array' : 'object', Array.isArray(value) ? value.length : null,
      Object.keys(value).sort().map(key => [key, canonical(value[key])])];
  }
  function comparison(value) { return JSON.stringify(canonical(value)); }
  function configGuard(config) {
    if (!config || Object.keys(config).sort().join(',') !== Object.keys(APPROVED).sort().join(',') ||
        Object.keys(APPROVED).some(key => config[key] !== APPROVED[key])) throw new Error('BLOCKED');
  }
  function identity(snapshot) {
    if (snapshot?.spreadsheetId !== APPROVED.sheetId || snapshot.properties?.title !== APPROVED.title ||
        snapshot.properties?.timeZone !== APPROVED.timeZone || snapshot.properties?.locale !== APPROVED.locale) {
      throw new Error('BLOCKED');
    }
  }
  function validVersion(value, expectedDate) {
    if (typeof value !== 'string' || !value || value.length > 1024) return false;
    try {
      const parts = JSON.parse(value);
      return Array.isArray(parts) && parts.length === 3 && parts[0] === 'test-event:v1' &&
        (parts[1] === null ? expectedDate === '' : BeautyEventDate.decode(parts[1]) === expectedDate) &&
        (parts[2] === null || (typeof parts[2] === 'number' && Number.isFinite(parts[2]))) && JSON.stringify(parts) === value;
    } catch (error) { return false; }
  }
  function grid(snapshot, title) {
    return snapshot.sheets.find(sheet => sheet.properties.title === title).data[0].rowData || [];
  }
  function cell(snapshot, title, row, column) { return grid(snapshot, title)[row]?.values?.[column] || {}; }
  function scalar(cell) {
    const entered = cell.userEnteredValue || {}, effective = cell.effectiveValue || {};
    if (Object.keys(entered).length === 0 && Object.keys(effective).length === 0) return null;
    if (Object.keys(entered).join(',') !== 'numberValue' || Object.keys(effective).join(',') !== 'numberValue' ||
        !Number.isFinite(entered.numberValue) || entered.numberValue !== effective.numberValue) throw new Error('INVALID_CONTROL');
    return entered.numberValue;
  }
  function state(snapshot, writesEnabled) {
    const a = cell(snapshot, 'Control', 1, 0), b = cell(snapshot, 'Control', 1, 1);
    const serial = scalar(a), reset = scalar(b);
    const date = serial === null ? '' : BeautyEventDate.decode(serial);
    if (a.userEnteredFormat?.numberFormat?.type !== 'DATE') throw new Error('DATE_FORMAT');
    const version = JSON.stringify(['test-event:v1', serial, reset]);
    return { success: true, mode: 'test', identity: APPROVED, eventDate: date, version, writesEnabled };
  }
  function capture(runtime) {
    let snapshot;
    const report = BeautyTestSheetPreflight.run(BeautyTestSheetPreflight.approved, {
      getMetadata(id) { const result = runtime.client.getMetadata(id); identity(result); return result; },
      getCells(id, ranges) {
        const result = runtime.client.getCells(id, ranges); identity(result); snapshot = result; return result;
      }
    });
    if (report.status !== 'READ_ONLY_PREFLIGHT_COMPLETE' || !snapshot) throw new Error('PREFLIGHT');
    for (const layout of report.layout) {
      const actual = snapshot.sheets.find(sheet => sheet.properties.title === layout.title)?.properties;
      if (!actual || actual.sheetId !== layout.sheetId || actual.gridProperties?.rowCount !== layout.rows ||
          actual.gridProperties?.columnCount !== layout.columns) throw new Error('LAYOUT_CHANGED');
    }
    return { snapshot, report, state: state(snapshot, runtime.writesEnabled === true) };
  }
  function text(cell) {
    return String(cell?.formattedValue ?? cell?.effectiveValue?.stringValue ?? cell?.userEnteredValue?.stringValue ?? '').trim();
  }
  function update(sheetId, row, column, values) {
    return { updateCells: { range: { sheetId, startRowIndex: row, endRowIndex: row + values.length,
      startColumnIndex: column, endColumnIndex: column + values[0].length },
    rows: values.map(values => ({ values })), fields: 'userEnteredValue' } };
  }
  function plan(snapshot, report, date, resetSerial) {
    if (!Number.isFinite(resetSerial) || resetSerial <= 0) throw new Error('INVALID_CLOCK');
    const tab = title => snapshot.sheets.find(sheet => sheet.properties.title === title).properties.sheetId;
    const requests = [update(tab('Control'), 1, 0, [[BeautyEventDate.controlDateCell(date)]])];
    const deleted = [], retained = [];
    const rows = grid(snapshot, 'PLAYER STATUS DATA');
    // Preserve the legacy bottom-up reset rules, including garbage rows and
    // populated cells outside A:E when locating the final used row.
    for (let row = report.proposedResetEffects.lastStatusRow - 1; row >= 1; row--) {
      if (text(rows[row]?.values?.[0]) && text(rows[row]?.values?.[1])) {
        retained.push(row);
        requests.push(update(tab('PLAYER STATUS DATA'), row, 2, [[{}, {}, {}]]));
      } else {
        deleted.push(row);
        requests.push({ deleteDimension: { range: { sheetId: tab('PLAYER STATUS DATA'), dimension: 'ROWS',
          startIndex: row, endIndex: row + 1 } } });
      }
    }
    requests.push(update(tab('Control'), 1, 1, [[{ userEnteredValue: { numberValue: resetSerial } }]]));
    // After a full reset all retained C values are blank and ordinary rows are
    // deleted: the legacy status map is empty regardless of formula row order.
    requests.push(update(tab("TONIGHT'S PLAYERS"), 1, 2, Array.from({ length: 99 }, () => [{}])));
    const store = snapshot.sheets.find(sheet => sheet.properties.title === 'PLAYER STATUS DATA');
    if (store.properties.gridProperties.rowCount - deleted.length < 2) throw new Error('RESET_LAYOUT');
    return { requests, deleted, retained, date, resetSerial };
  }
  function stored(cell) {
    // Preserve the existing normalization for omitted/empty cell fields.
    return comparison([cell?.userEnteredValue || {}, cell?.userEnteredFormat || {}, cell?.dataValidation || {}]);
  }
  function verify(before, after, mutation) {
    if (scalar(cell(after, 'Control', 1, 0)) !== BeautyEventDate.encode(mutation.date) ||
        scalar(cell(after, 'Control', 1, 1)) !== mutation.resetSerial) throw new Error('CONTROL_READBACK');
    for (const sheet of before.sheets) {
      const title = sheet.properties.title, next = after.sheets.find(s => s.properties.title === title);
      const isStatus = title === 'PLAYER STATUS DATA';
      const expectedRows = sheet.properties.gridProperties.rowCount - (isStatus ? mutation.deleted.length : 0);
      if (!next || next.properties.sheetId !== sheet.properties.sheetId || next.properties.gridProperties.rowCount !== expectedRows ||
          next.properties.gridProperties.columnCount !== sheet.properties.gridProperties.columnCount) throw new Error('GRID_READBACK');
      const expected = grid(before, title).map(row => ({ values: (row.values || []).map(c => ({ ...c })) }));
      if (isStatus) {
        for (const row of mutation.retained) for (let col = 2; col <= 4; col++) {
          if (!expected[row]) expected[row] = { values: [] };
          expected[row].values[col] = { ...expected[row].values[col], userEnteredValue: {} };
        }
        for (const row of mutation.deleted) expected.splice(row, 1);
      }
      const rows = Math.max(expected.length, grid(after, title).length, title === "TONIGHT'S PLAYERS" ? 100 : 2);
      for (let r = 0; r < rows; r++) for (let c = 0; c < sheet.properties.gridProperties.columnCount; c++) {
        let wanted = expected[r]?.values?.[c];
        if (title === 'Control' && r === 1 && c < 2) wanted = { ...wanted,
          userEnteredValue: { numberValue: c === 0 ? BeautyEventDate.encode(mutation.date) : mutation.resetSerial } };
        if (title === "TONIGHT'S PLAYERS" && r >= 1 && r <= 99 && c === 2) wanted = { ...wanted, userEnteredValue: {} };
        if (stored(wanted) !== stored(cell(after, title, r, c))) throw new Error('PRESERVATION_READBACK');
      }
    }
  }
  function handle(input, runtime) {
    try { configGuard(runtime?.config); } catch (error) { return fail('BLOCKED'); }
    let save;
    try {
      save = input?.action === 'save';
      const keys = save ? 'action,confirmed,date,expectedDate,expectedVersion' : 'action';
      if (!input || Object.keys(input).sort().join(',') !== keys || (!save && input.action !== 'load')) throw new Error();
      if (save) {
        BeautyEventDate.encode(input.date);
        if (input.expectedDate !== '') BeautyEventDate.encode(input.expectedDate);
        if (input.confirmed !== true || !validVersion(input.expectedVersion, input.expectedDate)) throw new Error();
      }
    } catch (error) { return fail('INVALID'); }
    if (save && runtime.writesEnabled !== true) return fail('WRITES_DISABLED');
    let locked = false, writing = false;
    try {
      locked = runtime.lock.tryLock(0);
      if (!locked) return fail('BUSY');
      const baseline = capture(runtime);
      if (!save) return baseline.state;
      if (input.expectedDate !== baseline.state.eventDate) return fail('STALE', 'BASELINE_DATE_MISMATCH');
      if (input.expectedVersion !== baseline.state.version) return fail('STALE', 'BASELINE_TOKEN_MISMATCH');
      if (input.date === baseline.state.eventDate) return { ...baseline.state, changed: false };
      const mutation = plan(baseline.snapshot, baseline.report, input.date, runtime.nowSerial());
      // Detect manual/other-project changes during planning, including metadata,
      // B2-only changes, reset rows, formulas and validation. ScriptLock cannot
      // lock out manual editors; the remaining API race is an execution gate.
      const recheck = capture(runtime);
      if (comparison(recheck.snapshot) !== comparison(baseline.snapshot)) return fail('STALE', 'PREWRITE_SNAPSHOT_MISMATCH');
      writing = true; // Set before the single call: a thrown reply may follow commit.
      runtime.client.batchUpdate({ requests: mutation.requests }, APPROVED.sheetId);
      runtime.waitForRecalculation();
      const first = capture(runtime);
      verify(baseline.snapshot, first.snapshot, mutation);
      runtime.waitForRecalculation();
      const second = capture(runtime);
      verify(baseline.snapshot, second.snapshot, mutation);
      if (comparison(first.snapshot) !== comparison(second.snapshot)) throw new Error('UNSTABLE_READBACK');
      return { ...second.state, changed: true, readbackVerified: true,
        reset: { deletedRows: mutation.deleted.length, retainedCorrectionRows: mutation.retained.length } };
    } catch (error) {
      return fail(writing ? 'SAVE_UNCERTAIN' : (error.message === 'BLOCKED' ? 'BLOCKED' : 'UNAVAILABLE'));
    } finally {
      if (locked) { try { runtime.lock.releaseLock(); } catch (error) { /* No automatic retry. */ } }
    }
  }
  return Object.freeze({ approved: APPROVED, handle });
})();
if (typeof module !== 'undefined') module.exports = BeautyTestEventAdapter;
