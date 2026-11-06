/* Identity TEST: fixed event identity and date matching. No Nakka or spreadsheet writes. */
function beautyHubNakkaDate_() {
  const ss = (typeof beautyHubSpreadsheet_==='function'?beautyHubSpreadsheet_():SpreadsheetApp.openById(SHEET_ID));
  if (ss.getId() !== SHEET_ID) throw new Error('identity');
  const zone = ss.getSpreadsheetTimeZone();
  if (zone !== 'Europe/Berlin') throw new Error('zone');
  const cell = ss.getSheetByName('Control').getRange('A2');
  const value = cell.getValue();
  if (cell.getFormula() || !(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('date');
  return {date: Utilities.formatDate(value, zone, 'yyyy-MM-dd'), zone: zone};
}
function beautyHubNakkaEvent_(input) {
  beautyHubTestGuard_();
  beautyHubNakkaAuthorize_();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Unexpected event input.');
  const answer = (status, message, date, event) => ({success:true, status:status, message:message,
    eventDate:date || '', event:event || null, readOnly:true, checkedAt:new Date().toISOString()});
  let selected;
  try { selected = beautyHubNakkaDate_(); } catch(e) { return answer('UNAVAILABLE','The TEST event date could not be read.'); }
  const props = PropertiesService.getScriptProperties();
  const user = props.getProperty('N01_API_USER'), password = props.getProperty('N01_API_PASSWORD');
  if (!user || !password) return answer('UNAVAILABLE','Nakka API credentials are not configured.',selected.date);
  let response;
  try {
    response = UrlFetchApp.fetch('https://push.n01darts.com/api/v1/league/tournament/list?lgid=lg_tM2v_3523&count=100', {
      method:'get', headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
      muteHttpExceptions:true, followRedirects:false
    });
  } catch(e) { return answer('UNAVAILABLE','Nakka events could not be reached.',selected.date); }
  const code = response.getResponseCode();
  if (code !== 200) return answer('UNAVAILABLE',code === 401 || code === 403 ? 'Nakka authentication failed.' : 'Nakka event lookup failed (HTTP '+code+').',selected.date);
  let data;
  try { data = JSON.parse(response.getContentText()); } catch(e) { return answer('UNAVAILABLE','Nakka returned an unreadable event response.',selected.date); }
  if (!data || data.result !== 0 || !Array.isArray(data.list) || data.list.length >= 100)
    return answer('UNAVAILABLE','The Nakka event list is invalid or may be incomplete. No event selected.',selected.date);
  const matches = [];
  for (const event of data.list) {
    if (!event || typeof event !== 'object' || Array.isArray(event))
      return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    // Undated events cannot match a calendar date. Do not coerce strings.
    if (event.t_date === undefined || event.t_date === null || event.t_date === '' || event.t_date === 0) continue;
    if (typeof event.t_date !== 'number' || !Number.isFinite(event.t_date) || event.t_date < 0)
      return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    const date = new Date(event.t_date * 1000);
    if (!Number.isFinite(date.getTime())) return answer('UNAVAILABLE','A Nakka event date needs review. No event selected.',selected.date);
    if (Utilities.formatDate(date,selected.zone,'yyyy-MM-dd') === selected.date) matches.push(event);
  }
  beautyHubNakkaAuthorize_();
  try { if (beautyHubNakkaDate_().date !== selected.date) return answer('STALE','The Hub date changed during lookup. Check again.'); }
  catch(e) { return answer('UNAVAILABLE','The TEST event date could not be rechecked.'); }
  // A live Monday tournament can share this date. It must never become the TEST target.
  if (matches.some(event => typeof event.tdid !== 'string' || !/^t_[A-Za-z0-9_]{1,80}$/.test(event.tdid)))
    return answer('UNAVAILABLE','The matching Nakka event details need review.',selected.date);
  const targets = matches.filter(event => event.tdid === 't_QHaG_7792');
  if (!targets.length) return answer('NOT_FOUND','The dedicated TEST event does not match this Hub date. No event selected.',selected.date);
  if (targets.length !== 1 || data.list.filter(event => event.tdid === 't_QHaG_7792').length !== 1)
    return answer('AMBIGUOUS','The dedicated TEST event appears more than once. No event selected.',selected.date);
  const match = targets[0];
  if (match.title !== 'Beauty Registration TEST event DO NOT USE LIVE' || (match.lgid !== undefined && match.lgid !== 'lg_tM2v_3523'))
    return answer('UNAVAILABLE','The matching Nakka event details need review.',selected.date);
  return answer('MATCHED','The dedicated TEST event matches the selected Hub date. No players have been synced.',selected.date,
    {id:match.tdid,title:match.title,date:selected.date,url:'https://n01darts.com/n01/league/season.php?id='+encodeURIComponent(match.tdid)});
}

/* Compare names only. Equal names are not proof of permanent player identity. */
function beautyHubNakkaCompareNames_(hub, nakka) {
  const key = value => value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const groups = new Map();
  for (const [side, rows] of [['hub',hub],['nakka',nakka]]) {
    for (const row of rows) {
      const k = key(row.name);
      if (!groups.has(k)) groups.set(k,{hub:[],nakka:[]});
      groups.get(k)[side].push(row);
    }
  }
  const result = {both:[],hubOnly:[],nakkaOnly:[],ambiguous:[]};
  for (const [k, group] of groups) {
    if (group.hub.length > 1 || group.nakka.length > 1) {
      result.ambiguous.push({name:(group.hub[0]||group.nakka[0]).name,hubCount:group.hub.length,nakkaCount:group.nakka.length});
    } else if (group.hub.length && group.nakka.length) result.both.push({name:group.hub[0].name,status:group.hub[0].status});
    else if (group.hub.length) result.hubOnly.push({name:group.hub[0].name,status:group.hub[0].status});
    else result.nakkaOnly.push({name:group.nakka[0].name});
  }
  for (const rows of Object.values(result)) rows.sort((a,b)=>a.name.localeCompare(b.name,'sv-SE'));
  return result;
}
function beautyHubNakkaHubRows_() {
  const ss = (typeof beautyHubSpreadsheet_==='function'?beautyHubSpreadsheet_():SpreadsheetApp.openById(SHEET_ID));
  if (ss.getId() !== SHEET_ID) throw new Error('identity');
  const sheet = ss.getSheetByName("TONIGHT'S PLAYERS");
  const count = sheet.getLastRow();
  if (count > 1001) throw new Error('size');
  // Read headers and roster together, freshly on every call.
  const rows = sheet.getRange(1,1,Math.max(1,count),3).getDisplayValues();
  if (JSON.stringify(rows[0]) !== JSON.stringify(['PLAYERS','NEW PLAYERS','STATUS'])) throw new Error('headers');
  if (count < 2) return [];
  return rows.slice(1).filter(row=>row[0]||row[1]).map(row=>{
    const name = String(row[0]||row[1]||'').trim();
    if (!name || name.length > 120 || /[\x00-\x1f\x7f]/.test(name)) throw new Error('name');
    return {name:name,status:String(row[2]||'').trim().slice(0,40)};
  });
}
function beautyHubNakkaCompare_(input) {
  beautyHubTestGuard_();
  beautyHubNakkaAuthorize_();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Unexpected comparison input.');
  const eventResult = beautyHubNakkaEvent_({});
  if (eventResult.status !== 'MATCHED') return eventResult;
  const fail = message => ({success:true,status:'UNAVAILABLE',message:message,eventDate:eventResult.eventDate,event:null,readOnly:true,checkedAt:new Date().toISOString()});
  let hub;
  try { hub = beautyHubNakkaHubRows_(); } catch(e) { return fail('The TEST player list could not be read safely.'); }
  const props = PropertiesService.getScriptProperties(),user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');
  if (!user||!password) return fail('Nakka API credentials are not configured.');
  let response,data;
  try {
    response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/tournament/entry/list?tdid='+encodeURIComponent(eventResult.event.id),{
      method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false});
    if(response.getResponseCode()!==200)return fail('Nakka event players could not be read (HTTP '+response.getResponseCode()+').');
    data=JSON.parse(response.getContentText());
  } catch(e) { return fail('Nakka returned no readable player list.'); }
  if (!data||data.result!==0||!Array.isArray(data.list)||data.list.length>1000) return fail('Nakka returned an invalid or oversized player list.');
  const nakka=[];
  for (const row of data.list) {
    if (!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||/[\x00-\x1f\x7f]/.test(row.name))return fail('A Nakka player name needs review.');
    nakka.push({name:row.name.trim()});
  }
  beautyHubNakkaAuthorize_();
  try {
    if(beautyHubNakkaDate_().date!==eventResult.eventDate||JSON.stringify(beautyHubNakkaHubRows_())!==JSON.stringify(hub))
      return {success:true,status:'STALE',message:'The Hub date or players changed during comparison. Compare again.',event:null,readOnly:true,checkedAt:new Date().toISOString()};
  } catch(e) { return fail('The TEST player list could not be rechecked.'); }
  return Object.assign({},eventResult,{status:'COMPARED',message:'Name comparison only. All Hub statuses are included. No players have been synced.',hubCount:hub.length,nakkaCount:nakka.length,
    comparison:beautyHubNakkaCompareNames_(hub,nakka),checkedAt:new Date().toISOString()});
}
