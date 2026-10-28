/* Read-only, owner-only Identity TEST casting feed. No Nakka calls or writes. */
function beautyLiveTestData() {
  beautyHubTestGuard_();
  const data = getBeautyHubData_();
  if (!data || data.success !== true || !Array.isArray(data.players)) throw new Error('TEST data unavailable');
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Form responses 2');
  const registrations = Object.create(null);
  if (sheet && sheet.getLastRow() >= 2) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    for (const row of rows) {
      if (!(row[0] instanceof Date) || isNaN(row[0].getTime())) continue;
      if (Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') !== data.eventDate) continue;
      const selected = String(row[1] || '').trim();
      const name = selected === 'MITT NAMN FINNS INTE I LISTAN' ? String(row[2] || '').trim() : selected;
      const time = row[0].getTime();
      if (name && (registrations[name] === undefined || time < registrations[name])) registrations[name] = time;
    }
  }
  return { success: true, eventDate: data.eventDate, updatedAt: new Date().toISOString(), rankingAvailable: false,
    players: data.players.map(function(p) {
      const name = String(p.player || p.newPlayer || '').trim();
      return { name: name, registeredAt: registrations[name] === undefined ? null : registrations[name], rank: null, points: null };
    }).filter(function(p) { return p.name; }) };
}

function beautyLiveTestUrl(token) {
  beautyHubTestGuard_();
  beautyHubAuthRequire_(token);
  return ScriptApp.getService().getUrl() + '?page=live';
}
