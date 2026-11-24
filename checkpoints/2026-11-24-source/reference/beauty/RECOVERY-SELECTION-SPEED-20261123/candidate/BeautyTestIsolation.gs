/* TEST INSTALLATION CANDIDATE. Exact independently verified TEST tuples only; no LIVE release.
 * Approval is a source-reviewed exact tuple, never inferred from a saved selection,
 * a name containing TEST, or mutable connection/catalog properties.
 */
function beautyTestApprovedDestinations_() {
  return [{"sheetId": "1l9CVAuawT5oYRsJ1zJKH88YxGAbfJ0O-B13geNPEodY", "leagueId": "lg_M2wQ_4189", "eventId": "t_Ct8A_4669", "date": "2026-11-16"}, {"sheetId": "1N0kp0f2kOQETylULYI685JDZH3bVKq9lG_NhoAba8lk", "leagueId": "lg_M2wQ_4189", "eventId": "t_GgaQ_0921", "date": "2026-11-21"}];
}
function beautyTestDestinationGuard_(context) {
  const fail=()=>{throw Error('TEST isolation: destination is not independently verified. No operation allowed.');};
  if(ScriptApp.getScriptId()!=='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N')fail();
  if(!context || context.version!==1 || context.mode!=='league' ||
     typeof context.sheetId!=='string' || typeof context.leagueId!=='string' ||
     typeof context.eventId!=='string' || typeof context.date!=='string')fail();
  // Known production resources remain forbidden even if accidentally allowlisted.
  if(context.sheetId==='1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM' ||
     context.leagueId==='lg_tM2v_3523' || context.eventId==='t_yIw0_7809')fail();
  const approved=beautyTestApprovedDestinations_();
  if(!Array.isArray(approved) || !approved.some(a=>a &&
      ['sheetId','leagueId','eventId','date'].every(k=>
        typeof a[k]==='string' && a[k].length>0 && a[k]===context[k])))fail();
  return true;
}
/* Guard the request itself, not merely the selected screen context.
 * This covers the shared Hub POST gateway only. Direct/diagnostic adapters
 * still require review; GET endpoints are not certified by this guard.
 */
function beautyTestNakkaMutationGuard_(path,payload) {
  const endpoints={
    'league/entry/update':'lgid',
    'tournament/entry/update':'tdid',
    'tournament/update':'tdid',
    'tournament/assign/update':'tdid',
    'league/schedule/generate':'tdid'
  };
  const fail=()=>{throw Error('TEST isolation: Nakka write destination or operation is not approved.');};
  if(!payload){
    beautyTestNakkaReadGuard_(path);
    return;
  }
  if(typeof path!=='string' || !Object.prototype.hasOwnProperty.call(endpoints,path) ||
     typeof payload!=='object' || Array.isArray(payload))fail();
  const c=beautyContextRead_();
  beautyTestDestinationGuard_(c);
  const field=endpoints[path],expected=field==='tdid'?c.eventId:c.leagueId;
  if(!Object.prototype.hasOwnProperty.call(payload,field) || payload[field]!==expected)fail();
  for(const [key,value] of [['tdid',c.eventId],['lgid',c.leagueId]]){
    if(Object.prototype.hasOwnProperty.call(payload,key) && payload[key]!==value)fail();
  }
  // A tournament update must not move the event to another league or date.
  if(path==='tournament/update' && payload.set &&
     ['tdid','lgid','t_date'].some(k=>Object.prototype.hasOwnProperty.call(payload.set,k)))fail();
}

/* Bounded acceptance reads. Unknown GET operations are not assumed read-only.
 * end_group is a documented completion-status read, not a mutation.
 */
function beautyTestNakkaReadGuard_(path) {
 const fail=()=>{throw Error('TEST isolation: Nakka read destination or operation is not approved.');};
 if(typeof path!=='string'||path.length>500||path.includes('#'))fail();
 const parts=path.split('?');if(parts.length!==2)fail();
 const routes={'tournament/get':['tdid','entry'],'tournament/entry/list':['tdid'],
  'tournament/standings':['tdid'],'tournament/end_group':['tdid'],'league/get':['lgid'],
  'league/entry/list':['lgid','count'],'league/tournament/list':['lgid','count'],
  'league/stats':['lgid','kind'],'league/schedule/get':['tdid']};
 if(!Object.prototype.hasOwnProperty.call(routes,parts[0]))fail();
 const values=Object.create(null);
 for(const item of parts[1].split('&')){
  const pair=item.split('=');if(pair.length!==2)fail();
  let k,v;try{k=decodeURIComponent(pair[0]);v=decodeURIComponent(pair[1]);}catch(e){fail();}
  if(!routes[parts[0]].includes(k)||Object.prototype.hasOwnProperty.call(values,k))fail();values[k]=v;
 }
 const c=beautyContextRead_();beautyTestDestinationGuard_(c);
 const field=routes[parts[0]][0];if(values[field]!==c[field==='tdid'?'eventId':'leagueId'])fail();
 if(parts[0]==='league/stats'&&!['stats_list','rank_list'].includes(values.kind))fail();
 if(values.entry!==undefined&&values.entry!=='0')fail();
 if(values.count!==undefined&&!['100','1000'].includes(values.count))fail();
 return true;
}

/* Direct edit triggers can supply a Sheet without using the workbook proxy. */
function beautyTestMasterSheetGuard_(sheet) {
  const context=beautyContextRead_();
  beautyTestDestinationGuard_(context);
  if(!sheet || sheet.getName()!=="PLAYER'S MASTER LIST" ||
     sheet.getParent().getId()!=='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU')
    throw Error('TEST isolation: master list write destination is not approved.');
}
