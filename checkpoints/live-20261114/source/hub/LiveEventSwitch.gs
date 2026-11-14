/* One operational workbook, one append-only event history tab. No Nakka writes. */
const BEAUTY_EVENT_SWITCH_KEY_='BEAUTY_EVENT_SWITCH_PENDING_V1';
const BEAUTY_EVENT_HISTORY_TAB_='BEAUTY EVENT HISTORY';
function beautyEventHash_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function beautyEventDataHash_(snapshot){const {event,...data}=snapshot;return beautyEventHash_(data);}
function beautyEventExternalWritesClosed_(){
 const ss=SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId);
 for(const sheet of ss.getSheets()){const url=sheet.getFormUrl();if(url&&FormApp.openByUrl(url).isAcceptingResponses())throw Error('The linked Google Form still accepts responses. Close that Google Form before switching events. Kiosk and mobile registration remain available for the current event.');}
}
function beautyEventSheets_(suffix,body){const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+BEAUTY_LIVE_BASE_.sheetId+suffix,{method:body?'post':'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},...(body?{contentType:'application/json',payload:JSON.stringify(body)}:{}),muteHttpExceptions:true,followRedirects:false});if(r.getResponseCode()!==200)throw Error('Workbook request was not confirmed. Use RECHECK EVENT SWITCH.');return JSON.parse(r.getContentText());}
function beautyEventCell_(c){const v=c?.userEnteredValue||{};for(const k of ['formulaValue','stringValue','numberValue','boolValue'])if(k in v)return [k,v[k]];return null;}
function beautyEventRows_(matrix){return matrix.map(row=>({values:row.map(c=>c?{userEnteredValue:{[c[0]]:c[1]}}:{})}));}
function beautyEventTrim_(matrix){while(matrix.length>1&&!matrix[matrix.length-1].some(Boolean))matrix.pop();return matrix;}
function beautyEventRead_(context,bookId){
 const id=bookId||BEAUTY_LIVE_BASE_.sheetId,ss=SpreadsheetApp.openById(id),names=['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS"];
 const sheets=names.map(name=>{const s=ss.getSheetByName(name);if(!s)throw Error('Required event tab missing.');return s;});
 if(sheets[0].getLastColumn()>2||sheets[1].getLastColumn()>6||sheets[2].getLastColumn()>6||sheets[1].getLastRow()>20000||sheets[2].getLastRow()>10000)throw Error('Event sheet layout exceeds reviewed limits.');
 const metaUrl='https://sheets.googleapis.com/v4/spreadsheets/'+id+'?fields=sheets(properties(title,gridProperties(rowCount)))';
 const mr=UrlFetchApp.fetch(metaUrl,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});if(mr.getResponseCode()!==200)throw Error('Fresh workbook dimensions unavailable.');
 const meta=JSON.parse(mr.getContentText()),rowCount=name=>{const n=meta.sheets?.find(s=>s.properties.title===name)?.properties.gridProperties.rowCount;if(!Number.isInteger(n)||n<1||n>20000)throw Error('Workbook dimensions exceed reviewed limits.');return n;};
 const specs=[[names[0],2,2],[names[1],rowCount(names[1]),6],[names[2],rowCount(names[2]),6],[names[3],Math.min(1000,rowCount(names[3])),6]];
 const ranges=specs.map(([n,r,c])=>"'"+n.replace(/'/g,"''")+"'!A1:"+String.fromCharCode(64+c)+r),suffix='?includeGridData=true&'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&fields='+encodeURIComponent('sheets(properties(title),data(startRow,startColumn,rowData(values(userEnteredValue))))');
 let data;
 if(id===BEAUTY_LIVE_BASE_.sheetId)data=beautyEventSheets_(suffix);
 else{const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+id+suffix,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});if(r.getResponseCode()!==200)throw Error('Existing event workbook cannot be read.');data=JSON.parse(r.getContentText());}
 const grids=specs.map(([n,r,c])=>{const s=data.sheets.find(s=>s.properties.title===n);if(!s)throw Error('Incomplete workbook read.');const a=Array.from({length:r},()=>Array(c).fill(null));for(const d of s.data||[])for(const [ri,row]of (d.rowData||[]).entries())for(const [ci,v]of (row.values||[]).entries())if(ri+(d.startRow||0)<r&&ci+(d.startColumn||0)<c)a[ri+(d.startRow||0)][ci+(d.startColumn||0)]=beautyEventCell_(v);return a;});
 const [control,responses,status,display]=grids;
 if(control[1]?.[0]?.[0]!=='numberValue'||new Date((control[1][0][1]-25569)*86400000).toISOString().slice(0,10)!==context.date)throw Error('Workbook event date differs.');
 if(display[1][0]?.[0]!=='formulaValue')throw Error('Roster formula missing.');
 if(responses.slice(1).some(r=>r.some(c=>c?.[0]==='formulaValue'))||status.slice(1).some(r=>r.some(c=>c?.[0]==='formulaValue'))||display.slice(1).some(r=>r[2]?.[0]==='formulaValue'))throw Error('Formula found in event source data.');
 return {version:1,event:{mode:context.mode,eventId:context.eventId,leagueId:context.leagueId,date:context.date,title:context.title},control,responses:beautyEventTrim_(responses),status:beautyEventTrim_(status),displayC:beautyEventTrim_(display.slice(1).map(r=>[r[2]])),rosterFormula:display[1][0][1]};
}
// Use direct API reads after API writes. SpreadsheetApp may retain earlier reads.
function beautyEventArchiveValues_(range){
 if(range.endsWith('20001')){const meta=beautyEventSheets_('?fields=sheets(properties(title,gridProperties(rowCount)))'),n=meta.sheets?.find(s=>s.properties.title===BEAUTY_EVENT_HISTORY_TAB_)?.properties.gridProperties.rowCount;if(!Number.isInteger(n)||n<1)throw Error('Archive dimensions unavailable.');range=range.replace(/20001$/,String(Math.min(n,20001)));}
 const data=beautyEventSheets_('/values/'+encodeURIComponent("'"+BEAUTY_EVENT_HISTORY_TAB_+"'!"+range)+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
 if(data.values!==undefined&&!Array.isArray(data.values))throw Error('Invalid archive readback.');return data.values||[];
}
function beautyEventHistoryIndex_(){
 const rows=beautyEventArchiveValues_('A1:E20001');
 if(rows.length>20000||JSON.stringify(rows[0])!==JSON.stringify(['EVENT ID','SNAPSHOT ID','PART','PARTS','SHA256']))throw Error('Event history layout needs review.');
 if(rows.slice(1).some(r=>r.length!==5||typeof r[0]!=='string'||typeof r[1]!=='string'||!Number.isInteger(r[2])||!Number.isInteger(r[3])||typeof r[4]!=='string'))throw Error('Incomplete event history index.');
 return rows;
}
function beautyEventHistory_(){
 const ss=SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId);let sh=ss.getSheetByName(BEAUTY_EVENT_HISTORY_TAB_);const header=['EVENT ID','SNAPSHOT ID','PART','PARTS','SHA256','SNAPSHOT DATA'];
 if(!sh){sh=ss.insertSheet(BEAUTY_EVENT_HISTORY_TAB_);SpreadsheetApp.flush();}
 const current=beautyEventArchiveValues_('A1:F1');
 if(!current.length){
  // Recover only a completely empty tab; never overwrite an unknown layout.
  if(beautyEventArchiveValues_('A1:F20001').length)throw Error('Event history header missing.');
  try{beautyEventSheets_(':batchUpdate',{requests:[{updateCells:{start:{sheetId:sh.getSheetId(),rowIndex:0,columnIndex:0},rows:beautyEventRows_([header.map(v=>['stringValue',v])]),fields:'userEnteredValue'}}]});}catch(e){}
 }
 if(JSON.stringify(beautyEventArchiveValues_('A1:F1'))!==JSON.stringify([header]))throw Error('Event history header not verified.');
 return sh;
}
function beautyEventSave_(snapshot){
 const sh=beautyEventHistory_(),index=beautyEventHistoryIndex_(),text=JSON.stringify(snapshot),proof=beautyEventHash_(snapshot),id=Utilities.getUuid().replace(/-/g,''),chars=Array.from(text),parts=Math.ceil(chars.length/12000),start=index.length;
 if(parts>200||start+parts>20000)throw Error('Event snapshot exceeds archive limit.');
 const rows=Array.from({length:parts},(_,i)=>[snapshot.event.eventId,id,i,parts,proof,chars.slice(i*12000,(i+1)*12000).join('')]),requests=[];
 const meta=beautyEventSheets_('?fields=sheets(properties(sheetId,gridProperties(rowCount)))').sheets.find(s=>s.properties.sheetId===sh.getSheetId());if(!meta)throw Error('Archive tab metadata missing.');
 if(start+parts>meta.properties.gridProperties.rowCount)requests.push({appendDimension:{sheetId:sh.getSheetId(),dimension:'ROWS',length:start+parts-meta.properties.gridProperties.rowCount}});
 requests.push({updateCells:{start:{sheetId:sh.getSheetId(),rowIndex:start,columnIndex:0},rows:beautyEventRows_(rows.map(r=>r.map(v=>[typeof v==='number'?'numberValue':'stringValue',v]))),fields:'userEnteredValue'}});
 try{beautyEventSheets_(':batchUpdate',{requests});}catch(e){/* Verify once via a fresh API request; never repeat the append here. */}
 if(JSON.stringify(beautyEventArchiveValues_('A'+(start+1)+':F'+(start+parts)))!==JSON.stringify(rows))throw Error('Event archive write not verified. Active event was not cleared.');
 return {id,proof,eventId:snapshot.event.eventId};
}
function beautyEventLoad_(eventId,snapshotId){
 if(!SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName(BEAUTY_EVENT_HISTORY_TAB_))return null;
 const rows=beautyEventHistoryIndex_(),found=rows.map((r,i)=>({r,row:i+1})).slice(1).filter(v=>v.r[0]===eventId&&(!snapshotId||v.r[1]===snapshotId));if(!found.length)return null;
 const id=snapshotId||found[found.length-1].r[1],selected=found.filter(v=>v.r[1]===id),count=selected[0].r[3],proof=selected[0].r[4];
 if(!Number.isInteger(count)||count<1||count>200||selected.length!==count||selected.some((v,i)=>v.row!==selected[0].row+i||v.r[2]!==i||v.r[3]!==count||v.r[4]!==proof))throw Error('Event history is incomplete; active data retained.');
 const parts=beautyEventArchiveValues_('A'+selected[0].row+':F'+selected[selected.length-1].row);
 if(parts.length!==count||parts.some((r,i)=>r.length!==6||typeof r[5]!=='string'||JSON.stringify(r.slice(0,5))!==JSON.stringify(selected[i].r)))throw Error('Archive data differs from its index.');
 const snapshot=JSON.parse(parts.map(r=>r[5]).join(''));if(snapshot.event.eventId!==eventId||beautyEventHash_(snapshot)!==proof)throw Error('Event history checksum differs.');return snapshot;
}
function beautyEventTargetSnapshot_(current,target,prior){
 const result=prior?JSON.parse(JSON.stringify(prior)):{...JSON.parse(JSON.stringify(current)),event:{mode:target.mode,eventId:target.eventId,leagueId:target.leagueId,date:target.date,title:target.title},responses:[current.responses[0]],status:[current.status[0]],displayC:[[null]]};
 if(prior&&(prior.event.eventId!==target.eventId||prior.event.leagueId!==target.leagueId||prior.event.mode!==target.mode||prior.event.date!==target.date||prior.rosterFormula!==current.rosterFormula))throw Error('Saved event identity or roster formula differs.');
 if(JSON.stringify(result.responses[0])!==JSON.stringify(current.responses[0])||JSON.stringify(result.status[0])!==JSON.stringify(current.status[0]))throw Error('Event column headers differ.');
 if(!prior){const serial=Date.parse(target.date+'T00:00:00Z')/86400000+25569;result.control[1]=[['numberValue',serial],['numberValue',36526]];}
 result.event.title=target.title;
 const key=r=>String(r[0]?.[1]||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'),seen=new Set();
 for(const r of result.status.slice(1)){const k=key(r);if(!k||seen.has(k))throw Error('Ambiguous archived status identity.');seen.add(k);}
 const currentSeen=new Set();for(const row of current.status.slice(1)){const k=key(row);if(!k||currentSeen.has(k))throw Error('Ambiguous current status identity.');currentSeen.add(k);const existing=result.status.find((r,i)=>i&&key(r)===k);if(existing){if(existing[1]&&row[1]&&JSON.stringify(existing[1])!==JSON.stringify(row[1]))throw Error('Name alias conflict needs review.');if(!existing[1])existing[1]=row[1];}else result.status.push([row[0],row[1],null,null,null,null]);}
 return result;
}
function beautyEventApply_(before,after){
 const ss=SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId),requests=[];
 for(const [name,oldRows,newRows,startRow,startCol,width]of [['Control',before.control,after.control,0,0,2],['Form responses 2',before.responses,after.responses,0,0,6],['PLAYER STATUS DATA',before.status,after.status,0,0,6],["TONIGHT'S PLAYERS",before.displayC,after.displayC,1,2,1]]){
  const sh=ss.getSheetByName(name),end=startRow+Math.max(oldRows.length,newRows.length);if(end>sh.getMaxRows())requests.push({appendDimension:{sheetId:sh.getSheetId(),dimension:'ROWS',length:end-sh.getMaxRows()}});
  requests.push({repeatCell:{range:{sheetId:sh.getSheetId(),startRowIndex:startRow,endRowIndex:end,startColumnIndex:startCol,endColumnIndex:startCol+width},cell:{},fields:'userEnteredValue'}});
  requests.push({updateCells:{start:{sheetId:sh.getSheetId(),rowIndex:startRow,columnIndex:startCol},rows:beautyEventRows_(newRows),fields:'userEnteredValue'}});
 }
 const response=ss.getSheetByName('Form responses 2');requests.push({repeatCell:{range:{sheetId:response.getSheetId(),startRowIndex:1,startColumnIndex:0,endColumnIndex:1},cell:{userEnteredFormat:{numberFormat:{type:'DATE_TIME',pattern:'dd/mm/yyyy hh:mm:ss'}}},fields:'userEnteredFormat.numberFormat'}});
 beautyEventSheets_(':batchUpdate',{requests});
}
function beautyEventSwitchFinish_(journal){
 const p=PropertiesService.getScriptProperties(),before=beautyEventLoad_(journal.before.eventId,journal.before.id),after=beautyEventLoad_(journal.after.eventId,journal.after.id);if(!before||!after||beautyEventHash_(before)!==journal.before.proof||beautyEventHash_(after)!==journal.after.proof)throw Error('Saved switch snapshots are missing or changed.');
 if(journal.target.sheetId!==BEAUTY_LIVE_BASE_.sheetId||after.event.eventId!==journal.target.eventId||after.event.date!==journal.target.date)throw Error('Switch target identity differs.');
 const raw=p.getProperty(BEAUTY_LIVE_CONTEXT_KEY_);if(raw!==journal.beforeContext&&raw!==JSON.stringify(journal.target))throw Error('Selected event changed outside this switch.');
 let actual;try{actual=beautyEventRead_(journal.target);}catch(e){actual=beautyEventRead_(JSON.parse(journal.beforeContext));}
 let proof=beautyEventDataHash_(actual),beforeProof=beautyEventDataHash_(before),afterProof=beautyEventDataHash_(after);
 if(proof!==afterProof&&proof===beforeProof){
  beautyEventExternalWritesClosed_();beautyEventSwitchValidateTarget_(journal.target);
  // Recheck after external validation, immediately before the atomic batch.
  if(beautyEventDataHash_(beautyEventRead_(JSON.parse(journal.beforeContext)))!==beforeProof)throw Error('Active workbook changed during switch verification. No write attempted.');
  try{beautyEventApply_(before,after);}catch(e){/* Determine outcome from readback. */}
  actual=beautyEventRead_(journal.target);proof=beautyEventDataHash_(actual);
 }
 if(proof!==afterProof)throw Error('Active workbook differs from both saved switch states. No repeat write attempted.');
 const ready={state:'VERIFIED',eventId:journal.target.eventId,date:journal.target.date,sheetId:BEAUTY_LIVE_BASE_.sheetId,revision:journal.target.revision};
 p.setProperties({[BEAUTY_LIVE_CONTEXT_KEY_]:JSON.stringify(journal.target),BEAUTY_ORIGINAL_WORKBOOK_READY_V1:JSON.stringify(ready),['BEAUTY_LIVE_WORKBOOK_'+journal.target.eventId]:BEAUTY_LIVE_BASE_.sheetId});
 if(p.getProperty(BEAUTY_LIVE_CONTEXT_KEY_)!==JSON.stringify(journal.target)||p.getProperty('BEAUTY_ORIGINAL_WORKBOOK_READY_V1')!==JSON.stringify(ready)||p.getProperty('BEAUTY_LIVE_WORKBOOK_'+journal.target.eventId)!==BEAUTY_LIVE_BASE_.sheetId)throw Error('Event switch binding not verified.');
 p.setProperty('BEAUTY_EVENT_SWITCH_LAST_V1',JSON.stringify({...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString()}));p.deleteProperty(BEAUTY_EVENT_SWITCH_KEY_);if(p.getProperty(BEAUTY_EVENT_SWITCH_KEY_)!==null)throw Error('Event switch receipt not cleared. Recheck the switch.');beautyLivePinned_=journal.target;
 return {success:true,active:journal.target,context:journal.target.revision,eventSwitchVerified:true};
}
function beautyEventSwitch_(target,user){
 const p=PropertiesService.getScriptProperties(),current=beautyLiveTarget_();if(current.sheetId!==BEAUTY_LIVE_BASE_.sheetId)throw Error('Restore the active event to the original workbook first.');
 if(target.eventId===current.eventId&&target.leagueId===current.leagueId&&target.mode===current.mode&&target.date===current.date)return {success:true,active:current,context:current.revision,eventSwitchVerified:true};
 beautyEventExternalWritesClosed_();
 const beforeText=p.getProperty(BEAUTY_LIVE_CONTEXT_KEY_),before=beautyEventRead_(current);let saved=beautyEventLoad_(target.eventId);
 if(!saved){const legacy=p.getProperty('BEAUTY_LIVE_WORKBOOK_'+target.eventId);if(legacy){if(legacy===BEAUTY_LIVE_BASE_.sheetId)throw Error('This event binding has no verified archive. Review before switching.');saved=beautyEventRead_(target,legacy);}else if(target.eventId===BEAUTY_LIVE_BASE_.eventId)throw Error('Historical base event needs a reviewed archive before opening.');}
 const after=beautyEventTargetSnapshot_(before,target,saved),targetContext={...target,sheetId:BEAUTY_LIVE_BASE_.sheetId};
 const beforeRef=beautyEventSave_(before),afterRef=beautyEventSave_(after);
 if(p.getProperty(BEAUTY_LIVE_CONTEXT_KEY_)!==beforeText||beautyEventHash_(beautyEventRead_(current))!==beforeRef.proof)throw Error('Current event changed during archive; no active data cleared.');
 const journal={state:'ATTEMPTED',uid:user.uid,beforeContext:beforeText,before:beforeRef,after:afterRef,target:targetContext,recordedUTC:new Date().toISOString()};p.setProperty(BEAUTY_EVENT_SWITCH_KEY_,JSON.stringify(journal));if(p.getProperty(BEAUTY_EVENT_SWITCH_KEY_)!==JSON.stringify(journal))throw Error('Switch journal not verified.');
 return beautyEventSwitchFinish_(journal);
}
function beautyEventSwitchRecover_(user){const raw=PropertiesService.getScriptProperties().getProperty(BEAUTY_EVENT_SWITCH_KEY_);if(!raw){const c=beautyLiveContextRead_();beautyLivePinned_=c;return {success:true,active:c,context:c.revision,eventSwitchVerified:true};}const j=JSON.parse(raw);if(j.state!=='ATTEMPTED'||!j.before||!j.after||!j.target)throw Error('Event switch receipt needs owner review.');return beautyEventSwitchFinish_(j);}

// Fixed GET-only validation for the exact journalled target. Never a general guard bypass.
function beautyEventSwitchValidateTarget_(target){
 beautyLiveLoginGuard_();
 const p=PropertiesService.getScriptProperties(),journal=JSON.parse(p.getProperty(BEAUTY_EVENT_SWITCH_KEY_)||'null');
 if(!journal||journal.state!=='ATTEMPTED'||JSON.stringify(journal.target)!==JSON.stringify(target)||!/^t_[A-Za-z0-9_]{1,80}$/.test(target.eventId)||!beautyHubEventDateValid_(target.date))throw Error('Recovery target does not match the pending switch.');
 const user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');if(!user||!password)throw Error('Nakka credentials missing.');
 const r=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/tournament/get?tdid='+encodeURIComponent(target.eventId),{method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false});
 if(r.getResponseCode()!==200)throw Error('Recovery target check unavailable. No player data changed.');
 const data=JSON.parse(r.getContentText()),e=data.tournament;
 if(data.result!==0||!e||e.tdid!==target.eventId||(e.lgid||'')!==target.leagueId||!e.admin_id||e.team_games!==0||typeof e.title!=='string'||!e.title.trim()||e.title.length>300||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==target.date)throw Error('The Nakka recovery target changed. No player data changed.');
 return e;
}
