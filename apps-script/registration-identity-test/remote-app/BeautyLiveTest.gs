/* Read-only, owner-only Identity TEST casting feed. No provider calls or writes; uses sanitised last-good league cache. */
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
  const snapshot = beautyLiveStatsSnapshot_();
  return { statsAvailable: !!snapshot, statsFetchedAt: snapshot ? snapshot.fetchedAt : null, success: true, eventDate: data.eventDate, updatedAt: new Date().toISOString(), rankingAvailable: false,
    players: data.players.map(function(p) {
      const name = String(p.player || p.newPlayer || '').trim();
      const matches = snapshot ? snapshot.profiles.filter(function(q){return beautyPoolKey_(q.name) === beautyPoolKey_(name);}) : [];
      const profile = matches.length === 1 ? matches[0] : null;
      return { average: profile && typeof profile.average === 'number' ? profile.average : null, name: name, registeredAt: registrations[name] === undefined ? null : registrations[name], rank: null, points: profile && typeof profile.points === 'number' ? profile.points : null };
    }).filter(function(p) { return p.name; }) };
}

function beautyLiveTestUrl(token) {
  beautyHubTestGuard_();
  beautyHubAuthRequire_(token);
  return ScriptApp.getService().getUrl() + '?page=live';
}

/* Anonymous cast requests never trigger authenticated Nakka refreshes. The staff
 * statistics refresh publishes this shared snapshot; expired/failed data is not
 * represented as current. Rank deliberately remains unavailable until qualified.
 */
function beautyLiveStatsSnapshot_() {
  try {
    const snapshot = beautyPoolLastGood_();
    if (!snapshot || snapshot.leagueId !== 'lg_tM2v_3523' || !Array.isArray(snapshot.profiles)) return null;
    const at = Date.parse(snapshot.fetchedAt), age = Date.now() - at;
    const failed = Number(PropertiesService.getScriptProperties().getProperty('BEAUTY_LEAGUE_STATS_FAILED') || 0);
    if (!Number.isFinite(at) || age < 0 || age >= 300000 || failed > at) return null;
    return snapshot;
  } catch (e) { return null; }
}

/* Fixed public TEST stage page. Opener is staff-authorized and date matched. */
function beautyStageTestUrl(token){
  beautyHubTestGuard_();beautyHubAuthRequire_(token);
  const hub=getBeautyHubData_();if(hub?.success!==true||!/^\d{4}-\d{2}-\d{2}$/.test(hub.eventDate))throw Error('Selected TEST date unavailable.');
  const response=UrlFetchApp.fetch('https://api.n01darts.com/api/v1/tournament/get?tdid=t_RqC2_2034',{method:'get',muteHttpExceptions:true,followRedirects:false});
  if(response.getResponseCode()!==200)throw Error('TEST event unavailable.');const data=JSON.parse(response.getContentText()),t=data?.tournament;
  if(data.result!==0||t?.tdid!=='t_RqC2_2034'||t.lgid!=='lg_tM2v_3523'||!Number.isFinite(t.t_date)||t.t_date<=0||Utilities.formatDate(new Date(t.t_date*1000),Session.getScriptTimeZone(),'yyyy-MM-dd')!==hub.eventDate)throw Error('Stage display does not match the selected Hub event.');
  beautyHubAuthRequire_(token);if(getBeautyHubData_()?.eventDate!==hub.eventDate)throw Error('Hub date changed while opening the display.');return ScriptApp.getService().getUrl()+'?page=stages';
}
