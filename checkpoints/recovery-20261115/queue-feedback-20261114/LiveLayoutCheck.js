function beautyLiveLayoutCheck_() {
  beautyLiveLoginGuard_();
  const ss = SpreadsheetApp.openById(BEAUTY_LIVE_TARGET_.sheetId);
  const result = {};

  for (const name of [
    'Control', 'PLAYER STATUS DATA', "TONIGHT'S PLAYERS"
  ]) {
    const sheet = ss.getSheetByName(name);
    result[name] = sheet ? {
      lastRow: sheet.getLastRow(),
      headers: sheet.getRange('A1:F1').getDisplayValues()[0]
    } : { missing: true };
  }

  console.log(JSON.stringify(result, null, 2));
}