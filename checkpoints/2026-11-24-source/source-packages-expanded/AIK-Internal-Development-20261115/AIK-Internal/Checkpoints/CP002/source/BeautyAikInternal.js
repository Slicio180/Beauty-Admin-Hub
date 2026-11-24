/* AIK Internal v1: TEST-only roster and immutable event drafts.
 * Separate workbook. Never changes active Beauty context or calls Nakka.
 */
function beautyAikText_(value,max){
 if(typeof value!=='string')throw Error('Text required.');
 const text=value.normalize('NFC').trim().replace(/\s+/g,' ');
 if(!text||text.length>max||/[\u0000-\u001f\u007f]/.test(text)||/^[=+@-]/.test(text))throw Error('Invalid text.');
 return text;
}
function beautyAikDraft_(input,players){
 if(!input||!['singles','doubles'].includes(input.format)||!['km','cup'].includes(input.kind))throw Error('Choose singles/doubles and KM/cup.');
 const title=beautyAikText_(input.title,100),date=input.date;
 if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid event date.');
 const url=String(input.tournamentUrl||'').trim();
 if(url&&!/^https:\/\/n01darts\.com\/n01\/tournament\/comp\.php\?id=t_[A-Za-z0-9_]+$/.test(url))throw Error('Use a Nakka tournament URL, not a league URL.');
 if(!Array.isArray(input.entries)||input.entries.length<2||input.entries.length>128)throw Error('Select at least two entries (maximum 128).');
 const size=input.format==='doubles'?2:1,used=new Set();
 const entries=input.entries.map(ids=>{
  if(!Array.isArray(ids)||ids.length!==size)throw Error('Each doubles team needs exactly two players.');
  return ids.map(id=>{
   const player=players.find(p=>p.id===id&&p.active===true);
   if(!player||used.has(id))throw Error('Unknown, inactive or repeated player.');
   used.add(id);return {id:player.id,name:player.name};
  });
 });
 if(!/^[a-f0-9-]{36}$/.test(input.requestId||''))throw Error('Invalid save identifier.');
 return {id:input.requestId,branch:'aik-internal',providerMode:'tournament',kind:input.kind,format:input.format,title,date,tournamentUrl:url,providerVerified:false,status:'DRAFT',entries};
}
function beautyAikWorkbook_(){
 const prop=PropertiesService.getScriptProperties(),raw=prop.getProperty('BEAUTY_AIK_INTERNAL_TEST_V1');
 if(!raw) return null;
 const receipt=JSON.parse(raw);
 if(receipt.status!=='READY')throw Error('AIK workbook setup is incomplete. Inspect the setup receipt; do not create another workbook.');
 if(receipt.id===beautyHubBaseSheet_()||receipt.id===beautyContextRead_()?.sheetId)throw Error('AIK workbook must be separate.');
 const ss=SpreadsheetApp.openById(receipt.id);
 if(ss.getSheetByName('AIK CONFIG')?.getRange('A1').getValue()!=='BEAUTY_AIK_INTERNAL_TEST_V1')throw Error('AIK workbook identity mismatch.');
 return ss;
}
function beautyAikRead_(ss){
 function rows(name){const sheet=ss.getSheetByName(name);if(!sheet)throw Error('Missing AIK sheet: '+name);return sheet.getLastRow()<2?[]:sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues();}
 return {configured:true,players:rows('AIK MASTER').map(r=>({id:r[0],name:r[1],active:r[2]===true})),events:rows('AIK EVENTS').map(r=>JSON.parse(r[1]))};
}
function beautyAikInternal(action,input,token){
 beautyHubTestGuard_();beautyHubAuthRequire_(token);
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid input.');
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Busy. Try again.');
 try{
  beautyHubAuthRequire_(token);
  let ss=beautyAikWorkbook_();
  if(action==='setup'){
   if(ss)return beautyAikRead_(ss);
   const props=PropertiesService.getScriptProperties();
   props.setProperty('BEAUTY_AIK_INTERNAL_TEST_V1',JSON.stringify({status:'CREATING',at:new Date().toISOString()}));
   ss=SpreadsheetApp.create('Beauty AIK Internal TEST');
   props.setProperty('BEAUTY_AIK_INTERNAL_TEST_V1',JSON.stringify({status:'INITIALIZING',id:ss.getId()}));
   ss.getSheets()[0].setName('AIK CONFIG').getRange('A1').setValue('BEAUTY_AIK_INTERNAL_TEST_V1');
   ss.insertSheet('AIK MASTER').getRange(1,1,1,3).setValues([['PLAYER_ID','NAME','ACTIVE']]);
   ss.insertSheet('AIK EVENTS').getRange(1,1,1,3).setValues([['EVENT_ID','DRAFT_JSON','CREATED_UTC']]);
   SpreadsheetApp.flush();
   props.setProperty('BEAUTY_AIK_INTERNAL_TEST_V1',JSON.stringify({status:'READY',id:ss.getId()}));
   return beautyAikRead_(ss);
  }
  if(!ss){if(action==='read')return {configured:false,players:[],events:[]};throw Error('Create the separate AIK workbook first.');}
  const state=beautyAikRead_(ss);
  if(action==='read')return state;
  if(action==='addPlayer'){
   const name=beautyAikText_(input.name,100),key=name.toLocaleLowerCase('sv-SE');
   if(state.players.some(p=>p.name.toLocaleLowerCase('sv-SE')===key))throw Error('Player already exists.');
   ss.getSheetByName('AIK MASTER').appendRow([Utilities.getUuid(),name,true]);
  }else if(action==='saveDraft'){
   const draft=beautyAikDraft_(input,state.players),old=state.events.find(e=>e.id===draft.id);
   if(old){if(JSON.stringify(old)!==JSON.stringify(draft))throw Error('Save identifier already used for a different draft.');return state;}
   ss.getSheetByName('AIK EVENTS').appendRow([draft.id,JSON.stringify(draft),new Date().toISOString()]);
  }else throw Error('Unsupported AIK action.');
  SpreadsheetApp.flush();return beautyAikRead_(ss);
 }finally{lock.releaseLock();}
}
