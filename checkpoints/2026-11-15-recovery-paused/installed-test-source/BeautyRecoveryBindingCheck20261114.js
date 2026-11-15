/* Owner-run diagnostic only. No provider calls or workbook/property writes. */
function beautyTestRecoveryBindingCheck20261114() {
  const expected = {
    scriptId: '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',
    sheetId: '17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE',
    leagueId: 'lg_M2wQ_4189', eventId: 't_gINp_8026', date: '2026-11-07'
  };
  if (ScriptApp.getScriptId() !== expected.scriptId) throw Error('TEST_PROJECT_REQUIRED');
  if (Session.getActiveUser().getEmail().toLowerCase() !== 'alessiotampella@gmail.com') throw Error('TEST_OWNER_REQUIRED');
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('BEAUTY_EVENT_CONTEXT_V1');
  let c;
  try { c = JSON.parse(raw || 'null'); } catch (_) { throw Error('INVALID_TEST_CONTEXT'); }
  const report = {
    result: 'TEST_BINDING_REVIEW_REQUIRED', checkedAt: new Date().toISOString(),
    scriptId: expected.scriptId,
    selected: c ? {sheetId:c.sheetId, leagueId:c.leagueId, eventId:c.eventId, date:c.date, revision:c.revision, mode:c.mode} : null,
    propertiesWritten:false, sheetsWritten:false, nakkaCalls:0,
    providerEventVerified:false, recoveryWritesEnabled:false
  };
  const matched = c && c.version === 1 && c.mode === 'league' && /^[a-f0-9]{32}$/.test(c.revision || '') &&
    ['sheetId','leagueId','eventId','date'].every(k => c[k] === expected[k]);
  if (!matched) { console.log(JSON.stringify(report,null,2)); return report; }
  // Open only the previously captured TEST workbook after exact binding checks.
  const ss = SpreadsheetApp.openById(expected.sheetId);
  if (ss.getId() !== expected.sheetId) throw Error('TEST_WORKBOOK_IDENTITY');
  const control = ss.getSheetByName('Control');
  if (!control) throw Error('TEST_CONTROL_MISSING');
  const value = control.getRange('A2').getValue();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw Error('TEST_DATE_INVALID');
  const date = Utilities.formatDate(value, 'Europe/Stockholm', 'yyyy-MM-dd');
  report.workbook = {id:ss.getId(), date, requiredTabs:{}};
  for (const title of ['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"])
    report.workbook.requiredTabs[title] = Boolean(ss.getSheetByName(title));
  // Re-read the binding after the workbook reads to detect an event switch.
  if (props.getProperty('BEAUTY_EVENT_CONTEXT_V1') !== raw) throw Error('TEST_CONTEXT_CHANGED');
  if (date === expected.date && Object.values(report.workbook.requiredTabs).every(Boolean)) report.result = 'TEST_BINDING_READ_ONLY_VERIFIED';
  console.log(JSON.stringify(report,null,2));
  return report;
}
