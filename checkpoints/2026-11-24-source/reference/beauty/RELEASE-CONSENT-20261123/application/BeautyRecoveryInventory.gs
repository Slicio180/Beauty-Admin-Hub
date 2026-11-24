/* Manual editor diagnostic. Private; no web deployment required.
 * Reads only selected recovery properties and known workbooks.
 * No Nakka calls, saves, receipt clearing, migrations or workbook creation.
 */
function beautyRecoveryInventory20261113_() {
  const project='1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4';
  const original='1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM';
  if(ScriptApp.getScriptId()!==project)throw Error('STOP: Wrong project.');
  const props=PropertiesService.getScriptProperties();
  const select=()=>Object.entries(props.getProperties()).filter(([k])=>k==='BEAUTY_LIVE_EVENT_CONTEXT_V1'||/^BEAUTY_LIVE_(REGISTRATION|STATUS|REMOVE)_PENDING$/.test(k)||/^BEAUTY_LIVE_WORKBOOK_t_[\w]+(?:_PENDING)?$/.test(k)||/^BEAUTY_CONSENT_PENDING_/.test(k)||/^BEAUTY_(EVENT_SETTINGS|POOL_SEND|POOL_START)_/.test(k)).sort((a,b)=>a[0].localeCompare(b[0]));
  const hash=v=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
  const before=select(),lookup=Object.fromEntries(before),context=JSON.parse(lookup.BEAUTY_LIVE_EVENT_CONTEXT_V1||'null');
  if(!context||!/^[-\w]{20,150}$/.test(context.sheetId||''))throw Error('STOP: Missing valid event context. No writes made.');
  const receipt=([key,raw])=>{
    const out={key,proof:hash(raw)};let v;try{v=JSON.parse(raw);}catch(e){return {...out,state:'UNREADABLE'};}
    for(const field of ['state','stage','player','source','eventId','eventDate','sheetId','recordedUTC','failedUTC'])if(typeof v?.[field]==='string')out[field]=v[field];
    return out;
  };
  const ids=[...new Set([original,context.sheetId])];
  const read=id=>{
    const ss=SpreadsheetApp.openById(id),zone=ss.getSpreadsheetTimeZone(),out={id,role:id===original?'ORIGINAL':'SELECTED_EVENT',title:ss.getName(),timeZone:zone,tabs:[]};
    for(const name of ['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"]){
      const sh=ss.getSheetByName(name);if(!sh){out.tabs.push({name,missing:true});continue;}
      const rows=sh.getLastRow(),columns=sh.getLastColumn();
      if(rows>20000||columns>40)throw Error('STOP: Workbook exceeds bounded read. No writes made.');
      const range=sh.getRange(1,1,Math.max(rows,1),Math.max(columns,1)),values=range.getValues(),formulas=range.getFormulas();
      const tab={name,rows,columns,proof:hash({values,formulas})};
      if(name==='Control'){const v=values[1]||[];tab.eventDate=v[0] instanceof Date?Utilities.formatDate(v[0],zone,'yyyy-MM-dd'):String(v[0]??'');tab.resetBoundary=v[1] instanceof Date?v[1].toISOString():String(v[1]??'');}
      if(name==="TONIGHT'S PLAYERS")tab.players=values.slice(1).filter(r=>r[0]||r[1]).map(r=>({name:String(r[0]||r[1]).trim(),status:String(r[2]||'')}));
      out.tabs.push(tab);
    }
    return out;
  };
  const workbooks=ids.map(read),again=ids.map(read);
  if(hash(workbooks)!==hash(again)||hash(before)!==hash(select()))throw Error('STOP: Data changed during inventory. No writes made; inspect while idle.');
  const bindings=before.filter(([k])=>/^BEAUTY_LIVE_WORKBOOK_/.test(k)).map(([key,value])=>key.endsWith('_PENDING')?receipt([key,value]):{key,sheetId:/^[-\w]{20,150}$/.test(value)?value:'INVALID'});
  const pending=before.filter(([k])=>k!=='BEAUTY_LIVE_EVENT_CONTEXT_V1'&&!/^BEAUTY_LIVE_WORKBOOK_/.test(k)).map(receipt);
  const selected={};for(const f of ['version','mode','eventId','leagueId','date','sheetId','revision','title'])selected[f]=context[f];
  console.log(JSON.stringify({result:'READ_ONLY_RECOVERY_INVENTORY',checkedAt:new Date().toISOString(),context:selected,originalWorkbook:original,selectedUsesOriginal:context.sheetId===original,bindings,pending,propertyProof:hash(before),writesPerformed:false,nakkaCalls:0},null,2));
  for(const book of workbooks){console.log(JSON.stringify({...book,tabs:book.tabs.map(({players,...tab})=>({...tab,...(players?{playerCount:players.length}:{})}))}));for(const tab of book.tabs)if(tab.players)for(const player of tab.players)console.log(JSON.stringify({workbook:book.id,roster:player}));}
  console.log('READ_ONLY_INVENTORY_COMPLETE — no workbook, player, receipt or Nakka changes.');
}
