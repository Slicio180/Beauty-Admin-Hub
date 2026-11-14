/* Narrow LIVE status control. Uses the existing PLAYER STATUS DATA source.
 * Does not create/delete players, modify consent/messages, or call Nakka writes.
 */
function beautyLiveStatusSetup_() {
  beautyLiveLoginGuard_();
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL,['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.external_request']);
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);
  if(ss.getId()!==beautyLiveTarget_().sheetId)throw Error('Wrong spreadsheet.');
  const result={check:'LIVE_STATUS_AUTHORIZATION',result:'READY_FOR_STATUS_REVIEW',writesPerformed:false};
  console.log(JSON.stringify(result));return result;
}
function beautyLiveStatus_(input,token) {
  beautyLiveLoginGuard_();
  const user=beautyHubAuthRequire_(token);
  const valid=['IN','OUT','STANDBY'];
  const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const fail=(code,error)=>({success:false,code,error});
  if(!input||Object.keys(input).sort().join(',')!=='eventDate,expectedStatus,player,status'||Object.values(input).some(v=>typeof v!=='string')||!key(input.player)||input.player.length>120||!valid.includes(input.status)||!valid.includes(input.expectedStatus)||input.eventDate!==beautyLiveTarget_().date)return fail('INVALID','Invalid status request.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','Another Hub operation is running. Reload before trying again.');
  let attempted=false;const properties=PropertiesService.getScriptProperties(),journalKey='BEAUTY_LIVE_STATUS_PENDING';
  try {
    beautyQueueWriteGuard_(input.player);beautyQueueLegacyBlock_(input.player);
    if(properties.getProperty(journalKey))return fail('STATUS_REVIEW_REQUIRED','A previous status save needs review. Do not repeat it.');
    const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId),store=ss.getSheetByName('PLAYER STATUS DATA'),tonight=ss.getSheetByName("TONIGHT'S PLAYERS"),control=ss.getSheetByName('Control');
    if(ss.getId()!==beautyLiveTarget_().sheetId||!store||!tonight||!control)return fail('LAYOUT','Required live sheets are missing.');
    const date=()=>{const v=control.getRange('A2').getValue();return v instanceof Date&&!isNaN(v.getTime())?Utilities.formatDate(v,'Europe/Stockholm','yyyy-MM-dd'):'';};
    if(date()!==input.eventDate)return fail('STALE_EVENT','The event date changed.');
    const rows=()=>{const n=store.getLastRow();if(n<2||n>1000)throw Error('STATUS_LAYOUT');return store.getRange(1,1,n,6).getDisplayValues();};
    const before=rows();if(key(before[0][2])!=='status')return fail('LAYOUT','Status column header is not recognised.');
    const matches=before.slice(1).map((values,i)=>({values,row:i+2})).filter(r=>key(r.values[0])===key(input.player));
    if(matches.length!==1)return fail('PLAYER_AMBIGUOUS_OR_MISSING','The player must have exactly one status record.');
    const found=matches[0];
    const names=()=>tonight.getRange(2,1,99,1).getDisplayValues().map(r=>String(r[0]||'').trim());
    if(names().filter(n=>key(n)===key(input.player)).length!==1)return fail('PLAYER_AMBIGUOUS_OR_MISSING','The player must appear once in Tonight’s Players.');
    const lastTonightRow = tonight.getLastRow();

if (lastTonightRow > 100 && tonight
  .getRange(101, 1, lastTonightRow - 100, 2)
  .getDisplayValues()
  .some(row => row.some(value => String(value || '').trim() !== ''))) {
  return fail('LAYOUT', 'Players exist below row 100, outside the current status-sync range.');
}
    if(found.values[2]!==input.expectedStatus)return fail('STALE_STATUS','This player’s status changed. Reload before saving.');
    const cell=store.getRange(found.row,3);
    if(cell.getFormula())return fail('FORMULA','The source status cell contains a formula.');
    if(tonight.getRange(2,3,99,1).getFormulas().some(r=>r[0]))return fail('FORMULA','Tonight’s status column contains formulas.');
    const fresh=store.getRange(found.row,1,1,6).getDisplayValues()[0];
    if(JSON.stringify(fresh)!==JSON.stringify(found.values)||date()!==input.eventDate)return fail('STALE_STATUS','The record changed while being checked.');
    if(input.status===input.expectedStatus)return {success:true,readbackVerified:true,player:input.player,status:input.status,data:beautyLiveDashboardRead_()};
    const journal={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:user.uid,eventDate:input.eventDate,player:input.player,row:found.row,beforeStatus:input.expectedStatus,afterStatus:input.status};
    properties.setProperty(journalKey,JSON.stringify(journal));
    if(properties.getProperty(journalKey)!==JSON.stringify(journal))throw Error('JOURNAL');
    attempted=true;cell.setValue(input.status);SpreadsheetApp.flush();
    // Follow the existing registration flow: rebuild only status column C using
    // the latest names and status records. Never rewrite formula columns A/B.
    // ScriptLock serialises Hub requests only, not the original registration apps.
    let verified=false;
    for(let attempt=0;attempt<3;attempt++){
      if(date()!==input.eventDate)throw Error('DATE_CHANGED');
      const orderedNames=names(),current=rows(),map=new Map();
      for(const r of current.slice(1))if(key(r[0])){if(map.has(key(r[0])))throw Error('DUPLICATE_STATUS_RECORD');map.set(key(r[0]),valid.includes(r[2])?r[2]:'');}
      if(map.get(key(input.player))!==input.status)throw Error('SOURCE_CHANGED');
      const values=orderedNames.map(n=>[n?(map.get(key(n))||''):'']);
      tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
      const latest=rows(),latestNames=names(),latestMap=new Map();
      for(const r of latest.slice(1))if(key(r[0])){if(latestMap.has(key(r[0])))throw Error('DUPLICATE_STATUS_RECORD');latestMap.set(key(r[0]),valid.includes(r[2])?r[2]:'');}
      const displayed=tonight.getRange(2,3,99,1).getDisplayValues();
      verified=JSON.stringify(orderedNames)===JSON.stringify(latestNames)&&latestNames.every((n,i)=>displayed[i][0]===(n?(latestMap.get(key(n))||''):''))&&latestMap.get(key(input.player))===input.status;
      if(verified)break;
    }
    const final=store.getRange(found.row,1,1,6).getDisplayValues()[0];
    if(!verified||date()!==input.eventDate||final[2]!==input.status||final.some((v,i)=>i!==2&&v!==found.values[i]))throw Error('READBACK');
    const data=beautyLiveDashboardRead_();
    const finalPlayers=data.players.filter(p=>key(p.player||p.newPlayer)===key(input.player));
    if(finalPlayers.length!==1||finalPlayers[0].status!==input.status)throw Error('DASHBOARD_READBACK');
    properties.setProperty('BEAUTY_LIVE_STATUS_LAST',JSON.stringify({...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString()}));
    properties.deleteProperty(journalKey);
    if(properties.getProperty(journalKey)!==null)throw Error('JOURNAL_CLEAR');
    return {success:true,readbackVerified:true,player:input.player,status:input.status,data};
  }catch(e){return fail(attempted?'SAVE_UNCERTAIN':'READ_FAILED',attempted?'The status save could not be fully verified. Stop and inspect PLAYER STATUS DATA and Tonight’s Players; do not repeat the save.':'The status record could not be checked. No status write was attempted.');}
  finally{lock.releaseLock();}
}
