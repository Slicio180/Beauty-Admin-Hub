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
 const pairingMethod=input.format==='doubles'?(input.pairingMethod||'manual'):null;
 if(pairingMethod&&!['fair','similar','random','manual'].includes(pairingMethod))throw Error('Invalid pairing method.');
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
   used.add(id);return {id:player.id,name:player.name,...(player.rating?{rating:JSON.parse(JSON.stringify(player.rating))}:{})};
  });
 });
 if(!/^[a-f0-9-]{36}$/.test(input.requestId||''))throw Error('Invalid save identifier.');
 return {id:input.requestId,branch:'aik-internal',providerMode:'tournament',kind:input.kind,format:input.format,pairingMethod,title,date,tournamentUrl:url,providerVerified:false,status:'DRAFT',entries};
}
function beautyAikBulkReview_(text,players){
 if(typeof text!=='string'||text.length>60000)throw Error('Paste up to 500 names, one per line.');
 const lines=text.split(/\r\n|\n|\r/);if(lines.length>500)throw Error('Paste up to 500 lines at a time.');
 const known=new Set(players.map(p=>p.name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'))),seen=new Set(),accepted=[],skipped=[],invalid=[];
 lines.forEach((line,i)=>{
  if(!line.trim())return;
  try{if(line.includes('\t'))throw Error('Paste one column only.');const name=beautyAikText_(line,100),key=name.toLocaleLowerCase('sv-SE');
   if(known.has(key)||seen.has(key)){skipped.push({line:i+1,name,reason:known.has(key)?'Already in AIK list':'Repeated in pasted list'});return;}
   seen.add(key);accepted.push(name);
  }catch(e){invalid.push({line:i+1,reason:e.message});}
 });
 return {accepted,skipped,invalid};
}
function beautyAikDraftChanged_(old,draft){
 const previous={...old,pairingMethod:old.pairingMethod||(old.format==='doubles'?'manual':null)};
 return Object.keys(draft).some(key=>JSON.stringify(previous[key])!==JSON.stringify(draft[key]));
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
 const latest=name=>{const out={};if(ss.getSheetByName(name))for(const row of rows(name))out[row[0]]=JSON.parse(row[1]);return out;};
 const ratings=latest('AIK RATINGS'),plans=latest('AIK PLANS');
 return {configured:true,players:rows('AIK MASTER').map(r=>({id:r[0],name:r[1],active:r[2]===true,...(ratings[r[0]]?{rating:ratings[r[0]]}:{})})),events:rows('AIK EVENTS').map(r=>JSON.parse(r[1])),plans};
}
function beautyAikInternal(action,input,token){
 beautyHubTestGuard_();beautyHubAuthRequire_(token);
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid input.');
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Busy. Try again.');
 try{
  beautyHubAuthRequire_(token);
  let ss=beautyAikWorkbook_();
  if(action==='setup'){
   if(ss){beautyAikPlanningSheets_(ss);return beautyAikRead_(ss);}
   const props=PropertiesService.getScriptProperties();
   props.setProperty('BEAUTY_AIK_INTERNAL_TEST_V1',JSON.stringify({status:'CREATING',at:new Date().toISOString()}));
   ss=SpreadsheetApp.create('Beauty AIK Internal TEST');
   props.setProperty('BEAUTY_AIK_INTERNAL_TEST_V1',JSON.stringify({status:'INITIALIZING',id:ss.getId()}));
   ss.getSheets()[0].setName('AIK CONFIG').getRange('A1').setValue('BEAUTY_AIK_INTERNAL_TEST_V1');
   ss.insertSheet('AIK MASTER').getRange(1,1,1,3).setValues([['PLAYER_ID','NAME','ACTIVE']]);
   ss.insertSheet('AIK EVENTS').getRange(1,1,1,3).setValues([['EVENT_ID','DRAFT_JSON','CREATED_UTC']]);
   beautyAikPlanningSheets_(ss);
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
  }else if(action==='bulkAddPlayers'){
   const review=beautyAikBulkReview_(input.text,state.players);
   if(review.invalid.length)throw Error('Review and remove invalid lines before adding players.');
   if(review.accepted.length){const sheet=ss.getSheetByName('AIK MASTER');sheet.getRange(sheet.getLastRow()+1,1,review.accepted.length,3).setValues(review.accepted.map(name=>[Utilities.getUuid(),name,true]));}
   SpreadsheetApp.flush();return Object.assign(beautyAikRead_(ss),{bulkAdded:review.accepted.length});
  }else if(action==='setRating'){
   const player=state.players.find(p=>p.id===input.id);
   if(!player)throw Error('Player not found.');
   if(input.rating!==null){if(input.rating?.source!=='manual')throw Error('Automatic statistics import is not connected.');AikPoolPlanner.rating({...player,rating:input.rating});}
   const sh=ss.getSheetByName('AIK RATINGS');if(!sh)throw Error('Run AIK setup to add planning storage.');
   if(JSON.stringify(player.rating||null)!==JSON.stringify(input.rating))sh.appendRow([player.id,JSON.stringify(input.rating),new Date().toISOString()]);
  }else if(action==='savePlan'){
   const event=state.events.find(e=>e.id===input.eventId);if(!event)throw Error('Tournament not found.');
   AikPoolPlanner.validate(event,input);
   const plan={...input,status:'REVIEWED_LOCAL'},sh=ss.getSheetByName('AIK PLANS');if(!sh)throw Error('Run AIK setup to add planning storage.');
   if(JSON.stringify(state.plans[event.id])!==JSON.stringify(plan))sh.appendRow([event.id,JSON.stringify(plan),new Date().toISOString()]);
  }else if(action==='saveDraft'){
   const old=state.events.find(e=>e.id===input.requestId);
   const players=old?state.players.map(p=>{const saved=old.entries.flat().find(q=>q.id===p.id);return saved?{...p,rating:saved.rating||null}:p;}):state.players;
   const draft=beautyAikDraft_(input,players);
   if(old){if(beautyAikDraftChanged_(old,draft))throw Error('Save identifier already used for a different draft.');return state;}
   ss.getSheetByName('AIK EVENTS').appendRow([draft.id,JSON.stringify(draft),new Date().toISOString()]);
  }else throw Error('Unsupported AIK action.');
  SpreadsheetApp.flush();return beautyAikRead_(ss);
 }finally{lock.releaseLock();}
}

// Explicit setup only; never provisions storage from a read request.
function beautyAikPlanningSheets_(ss){
 for(const name of ['AIK RATINGS','AIK PLANS']){
  const header=['RECORD_ID','DATA_JSON','UPDATED_UTC'];let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name);
  if(!sh.getLastRow())sh.getRange(1,1,1,3).setValues([header]);
  if(JSON.stringify(sh.getRange(1,1,1,3).getValues()[0])!==JSON.stringify(header))throw Error('Unexpected AIK planning sheet layout.');
 }
 SpreadsheetApp.flush();
}
