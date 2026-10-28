/* Server-only approval gates. No Script Properties, URL input or client-supplied
 * configuration can select a spreadsheet, project, endpoint or write mode.
 * Keep closed until the reviewed TEST execution is explicitly approved.
 */
const BEAUTY_TEST_PROJECT_ID_ = '1Yz1OG9kbvBGnvJBxuuYHc07g5LibW-oCsJP2a39J-4AJRhZZ9SYJFcnb';
const BEAUTY_TEST_WRITES_APPROVED_ = false;
const BEAUTY_TEST_STATUS_WRITES_APPROVED_ = false;

function beautyTestStatus(input) {
  if (!BEAUTY_TEST_PROJECT_ID_ || ScriptApp.getScriptId() !== BEAUTY_TEST_PROJECT_ID_) {
    return { success: false, code: 'BLOCKED', error: 'Dedicated TEST project has not been approved.' };
  }

  return BeautyTestStatusAdapter.handle(input, {
    config: BeautyTestStatusAdapter.approved,
    writesEnabled: BEAUTY_TEST_STATUS_WRITES_APPROVED_ === true,
    client: {
      getCells(id, ranges) {
        return Sheets.Spreadsheets.get(id, {
          ranges,
          includeGridData: true,
          fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties(title,sheetId),data(startRow,startColumn,rowData(values(formattedValue,userEnteredValue,effectiveValue))))'
        });
      },
      updateStatus(args) {
        return Sheets.Spreadsheets.batchUpdate({
          requests: [{
            updateCells: {
              range: {
                sheetId: args.sheetId,
                startRowIndex: args.rowIndex,
                endRowIndex: args.rowIndex + 1,
                startColumnIndex: 2,
                endColumnIndex: 3
              },
              rows: [{
                values: [{
                  userEnteredValue: { stringValue: args.status }
                }]
              }],
              fields: 'userEnteredValue'
            }
          }]
        }, args.spreadsheetId);
      }
    }
  });
}

function beautyTestHubData() {
  if (!BEAUTY_TEST_PROJECT_ID_ || ScriptApp.getScriptId() !== BEAUTY_TEST_PROJECT_ID_) {
    return { success: false, code: 'BLOCKED', error: 'Dedicated TEST project has not been approved.' };
  }
  return BeautyTestHubDataAdapter.handle({
    config: BeautyTestHubDataAdapter.approved,
    client: {
      getCells(id, ranges) {
        return Sheets.Spreadsheets.get(id, {
          ranges,
          includeGridData: true,
          fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties(title),data(startRow,startColumn,rowData(values(formattedValue,userEnteredValue,effectiveValue))))'
        });
      }
    }
  });
}

function beautyTestEvent(input) {
  // Pin a dedicated TEST project before even constructing Google Sheet clients.
  if (!BEAUTY_TEST_PROJECT_ID_ || ScriptApp.getScriptId() !== BEAUTY_TEST_PROJECT_ID_) {
    return { success: false, code: 'BLOCKED', error: 'Dedicated TEST project has not been approved.' };
  }
  let lock;
  return BeautyTestEventAdapter.handle(input, {
    config: BeautyTestEventAdapter.approved, writesEnabled: BEAUTY_TEST_WRITES_APPROVED_,
    lock: {
      tryLock(ms) { lock = LockService.getScriptLock(); return lock.tryLock(ms); },
      releaseLock() { lock.releaseLock(); }
    },
    client: {
      getMetadata(id) {
        return Sheets.Spreadsheets.get(id, { includeGridData: false,
          fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties)' });
      },
      getCells(id, ranges) {
        return Sheets.Spreadsheets.get(id, { ranges, includeGridData: true,
          fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties,data(startRow,startColumn,rowData(values(formattedValue,userEnteredValue,effectiveValue,userEnteredFormat,dataValidation))))' });
      },
      batchUpdate(body, id) { return Sheets.Spreadsheets.batchUpdate(body, id); }
    },
    nowSerial() {
      // B2 is a wall-clock timestamp in the pinned Sheet timezone. A2 uses only
      // the pure integer encoder; no Date object is ever sent to a cell setter.
      const parts = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd HH:mm:ss.SSS');
      const time = parts.slice(11).split(/[:.]/).map(Number);
      return BeautyEventDate.encode(parts.slice(0, 10)) +
        (time[0] * 3600000 + time[1] * 60000 + time[2] * 1000 + time[3]) / 86400000;
    },
    waitForRecalculation() { Utilities.sleep(1000); }
  });
}

// Only the separate, owner-only TEST project serves this packaged Hub. No
// doPost or public write endpoint; Google Script RPC uses the signed-in owner.
function doGet(e) {
  if (e?.parameter && Object.keys(e.parameter).length) throw new Error('External configuration rejected.');
  return HtmlService.createHtmlOutputFromFile('Hub').setTitle('Beauty Hub — TEST ONLY');
}
function logBeautyBaselineReadOnly() {
  const r = beautyTestEvent({ action: 'load' });
  if (!r || r.success !== true || r.mode !== 'test' || r.writesEnabled !== false) {
    throw new Error('Closed-gate TEST load unavailable; keep writes disabled.');
  }
  const v = JSON.parse(r.version);
  if (v[0] !== 'test-event:v1' || !Number.isSafeInteger(v[1]) || !Number.isFinite(v[2])) {
    throw new Error('Numeric A2/B2 baseline unavailable.');
  }
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    state: r,
    controlA2Serial: v[1],
    controlB2Serial: v[2]
  }, null, 2));
}
