/* Standalone TEST preflight. No web routes, SpreadsheetApp, Nakka or write API.
 * Only the approved copied spreadsheet can be read. Existing mock guards remain unchanged.
 */
var BeautyTestSheetPreflight = (() => {
  const APPROVED = Object.freeze({
    mode: 'test-readonly',
    sheetId: '1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo',
    title: 'TEST — AIK MÅNDAGSDARTARNA CHECK IN LIST — DO NOT USE LIVE',
    timeZone: 'Europe/Berlin'
  });
  const HEADERS = Object.freeze({
    'PLAYER STATUS DATA': ['PLAYER', 'OLD NAME', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE'],
    "PLAYER'S MASTER LIST": ['PLAYERS'],
    Control: ['START DATE', 'LAST RESET'],
    "TONIGHT'S PLAYERS": ['PLAYERS', 'NEW PLAYERS', 'STATUS', 'FOTO&VIDEO', 'MEDDELANDE', 'WHERE FROM'],
    'Form responses 2': ['Timestamp', 'VÄLJ DITT NAMN', 'Skriv ditt fullständiga namn', 'Foto- och videomedgivande', 'Meddelande', 'WHERE FROM']
  });
  const MAX_CELLS = 50000;
  function assertConfig(config) {
    if (!config || Object.keys(config).sort().join(',') !== 'mode,sheetId,timeZone,title' ||
        Object.keys(APPROVED).some(key => config[key] !== APPROVED[key])) {
      throw new Error('BLOCKED: configuration must exactly match the approved read-only TEST identity and Europe/Berlin timezone.');
    }
  }
  function assertIdentity(snapshot) {
    if (!snapshot || snapshot.spreadsheetId !== APPROVED.sheetId || snapshot.properties?.title !== APPROVED.title) {
      throw new Error('BLOCKED: returned spreadsheet identity differs from the approved TEST identity.');
    }
  }
  function metadataReport(metadata) {
    assertIdentity(metadata);
    const blockers = [];
    if (metadata.properties.timeZone !== APPROVED.timeZone) {
      blockers.push({ code: 'TIMEZONE_MISMATCH', expected: APPROVED.timeZone,
        observed: metadata.properties.timeZone || null });
    }
    const sheets = metadata.sheets || [];
    const layout = Object.keys(HEADERS).map(title => {
      const matches = sheets.filter(sheet => sheet.properties?.title === title);
      const properties = matches[0]?.properties;
      const grid = properties?.gridProperties;
      const minimumRows = title === "TONIGHT'S PLAYERS" ? 100 : 2;
      const valid = matches.length === 1 && properties.sheetType === 'GRID' &&
        Number.isInteger(grid?.rowCount) && grid.rowCount >= minimumRows &&
        Number.isInteger(grid?.columnCount) && grid.columnCount >= HEADERS[title].length;
      if (!valid) blockers.push({ code: 'LAYOUT_MISMATCH', tab: title });
      return { title, sheetId: properties?.sheetId ?? null, rows: grid?.rowCount ?? null,
        columns: grid?.columnCount ?? null, valid };
    });
    return {
      status: blockers.length ? 'BLOCKED' : 'METADATA_VERIFIED',
      identity: { sheetId: metadata.spreadsheetId, title: metadata.properties.title,
        locale: metadata.properties.locale || null, timeZone: metadata.properties.timeZone || null,
        requiredTimeZone: APPROVED.timeZone },
      layout, blockers, writesEnabled: false, readyForWrites: false,
      integrationStatus: { scriptId: 'unknown', triggers: 'unknown', nakka: 'unknown' },
      proposedResetEffects: null,
      checkedAt: new Date().toISOString()
    };
  }
  function columnName(number) {
    let result = '';
    while (number > 0) {
      number--;
      result = String.fromCharCode(65 + number % 26) + result;
      number = Math.floor(number / 26);
    }
    return result;
  }
  function readRanges(report) {
    const status = report.layout.find(tab => tab.title === 'PLAYER STATUS DATA');
    // getLastRow() considers every column. Read this bounded grid to reproduce
    // legacy deletion rules, including garbage rows with data outside A:E.
    if (status.rows * status.columns + 611 > MAX_CELLS) {
      throw new Error('BLOCKED: complete reset inspection exceeds the bounded read limit.');
    }
    return ["'Control'!A1:B2", `'PLAYER STATUS DATA'!A1:${columnName(status.columns)}${status.rows}`,
      "'PLAYER''S MASTER LIST'!A1:A1", "'TONIGHT''S PLAYERS'!A1:F100", "'Form responses 2'!A1:F1"];
  }
  function cellText(cell) {
    if (cell?.formattedValue !== undefined) return String(cell.formattedValue).trim();
    const value = cell?.effectiveValue || cell?.userEnteredValue || {};
    return String(value.stringValue ?? value.numberValue ?? value.boolValue ?? '').trim();
  }
  function populated(cell) {
    return Boolean(cellText(cell) || cell?.userEnteredValue?.formulaValue || cell?.effectiveValue?.errorValue);
  }
  function gridFor(snapshot, title) {
    const sheet = snapshot.sheets?.find(sheet => sheet.properties?.title === title);
    const grids = sheet?.data;
    if (!sheet || !Array.isArray(grids) || grids.length !== 1 ||
        (grids[0].startRow || 0) !== 0 || (grids[0].startColumn || 0) !== 0) {
      throw new Error('BLOCKED: missing or ambiguous bounded grid for ' + title);
    }
    return grids[0].rowData || [];
  }
  function inspectSnapshot(metadata, cells) {
    const report = metadataReport(metadata);
    assertIdentity(cells);
    if (cells.properties.timeZone !== metadata.properties.timeZone ||
        cells.properties.locale !== metadata.properties.locale) {
      report.blockers.push({ code: 'METADATA_CHANGED_DURING_READ' });
    }
    const grids = {};
    for (const title of Object.keys(HEADERS)) {
      const rows = gridFor(cells, title);
      grids[title] = rows;
      const actual = (rows[0]?.values || []).slice(0, HEADERS[title].length).map(cellText);
      if (JSON.stringify(actual) !== JSON.stringify(HEADERS[title])) {
        report.blockers.push({ code: 'HEADER_MISMATCH', tab: title, expected: HEADERS[title], observed: actual });
      }
    }
    if (report.blockers.some(blocker => blocker.code !== 'TIMEZONE_MISMATCH')) {
      report.status = 'BLOCKED';
      return report;
    }
    const statusRows = grids['PLAYER STATUS DATA'];
    let lastRow = 1;
    for (let i = 1; i < statusRows.length; i++) {
      if ((statusRows[i].values || []).some(populated)) lastRow = i + 1;
    }
    let kept = 0, deleted = 0, garbage = 0, eventCells = 0;
    for (let i = 1; i < lastRow; i++) {
      const values = statusRows[i]?.values || [];
      const player = cellText(values[0]), oldName = cellText(values[1]);
      if (player && oldName) {
        kept++;
        eventCells += values.slice(2, 5).filter(populated).length;
      } else {
        deleted++;
        if (!player) garbage++;
      }
    }
    const tonight = grids["TONIGHT'S PLAYERS"].slice(1, 100);
    const formulaWarnings = [];
    for (const [title, rows] of Object.entries(grids)) {
      for (const row of rows) for (const cell of row.values || []) {
        const formula = cell.userEnteredValue?.formulaValue || '';
        if (/IMPORTRANGE|IMPORTXML|IMPORTDATA|IMPORTHTML|GOOGLEFINANCE|https?:\/\//i.test(formula)) {
          if (!formulaWarnings.includes(title)) formulaWarnings.push(title);
        }
      }
    }
    if (formulaWarnings.length) report.blockers.push({ code: 'EXTERNAL_FORMULA_REFERENCE', tabs: formulaWarnings });
    report.currentControl = {
      dateDisplay: cellText(grids.Control[1]?.values?.[0]),
      dateSerial: grids.Control[1]?.values?.[0]?.effectiveValue?.numberValue ?? null,
      lastResetDisplay: cellText(grids.Control[1]?.values?.[1]),
      dateInterpretation: 'Displayed value and raw serial only; no timezone conversion or correction.'
    };
    if (!Number.isInteger(report.currentControl.dateSerial)) {
      report.blockers.push({ code: 'CONTROL_DATE_REQUIRES_REVIEW' });
    }
    report.proposedResetEffects = {
      condition: 'Only if a later approved save changes the event date; same date is a no-op.',
      lastStatusRow: lastRow, preserveNameCorrectionRows: kept, deleteRows: deleted,
      deleteBlankOrGarbageRows: garbage, clearRetainedEventCells: kept * 3,
      currentlyPopulatedRetainedEventCells: eventCells,
      updateControlCells: ['A2', 'B2'], rebuildTonightRange: 'C2:C100',
      currentVisibleTonightRows: tonight.filter(row => cellText(row.values?.[0]) || cellText(row.values?.[1])).length,
      currentPopulatedTonightStatuses: tonight.filter(row => populated(row.values?.[2])).length,
      tonightStatusFormulasReplaced: tonight.filter(row => row.values?.[2]?.userEnteredValue?.formulaValue).length,
      futureTonightMembership: 'Not predicted: formula results depend on the future selected date.'
    };
    report.status = report.blockers.length ? 'BLOCKED' : 'READ_ONLY_PREFLIGHT_COMPLETE';
    return report;
  }
  function run(config, reader) {
    assertConfig(config); // Reject wrong ID/title/mode/timezone before invoking a reader.
    const metadata = reader.getMetadata(APPROVED.sheetId);
    const report = metadataReport(metadata);
    if (report.blockers.length) return report; // Includes timezone mismatch: no cell read.
    const ranges = readRanges(report);
    const cells = reader.getCells(APPROVED.sheetId, ranges);
    return inspectSnapshot(metadata, cells);
  }
  return Object.freeze({ approved: APPROVED, run, inspectSnapshot });
})();

// Run manually only in a separate TEST project after source review.
// The project manifest grants only spreadsheets.readonly and enables Sheets v4.
function preflightBeautyTestSheet() {
  return BeautyTestSheetPreflight.run(BeautyTestSheetPreflight.approved, {
    getMetadata(id) {
      return Sheets.Spreadsheets.get(id, {
        includeGridData: false,
        fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties)'
      });
    },
    getCells(id, ranges) {
      return Sheets.Spreadsheets.get(id, {
        ranges, includeGridData: true,
        fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties,data(startRow,startColumn,rowData(values(formattedValue,userEnteredValue,effectiveValue))))'
      });
    }
  });
}

if (typeof module !== 'undefined') module.exports = BeautyTestSheetPreflight;
function logBeautyTestPreflight() {
  const result = preflightBeautyTestSheet();
  console.log(JSON.stringify(result, null, 2));
}