/* Event selection. All provider URLs are constructed from validated IDs.
 * Connection checks are GET-only. Activation never starts Nakka matches.
 * The old TEST workbook remains the default until an organiser selects an event.
 */
var beautyContextPinned_;
function beautyHubBaseSheet_(){return '1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';}
function beautyContextRead_(){
 const raw=PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_CONTEXT_V1');
 if(!raw)return null;
 const c=JSON.parse(raw);
 if(c.version!==1||!['league','tournament'].includes(c.mode)||!/^[-\w]{20,150}$/.test(c.sheetId)||!/^[-\w]{32}$/.test(c.revision)||!/^20\d\d-\d\d-\d\d$/.test(c.date)||c.mode==='league'&&!/^lg_[\w]{1,80}$/.test(c.leagueId)||c.mode==='tournament'&&c.leagueId!=='')throw Error('Invalid saved event context.');
 if(c.eventId&&!/^t_[\w]{1,80}$/.test(c.eventId))throw Error('Invalid saved event.');
 return c;
}
function beautyHubWorkspaceId_(){const c=beautyContextRead_();beautyContextPinned_=c?.revision||'legacy';return c?.sheetId||beautyHubBaseSheet_();}
function beautyContextAssert_(){
 const now=beautyContextRead_()?.revision||'legacy';
 if(beautyContextPinned_!==undefined&&beautyContextPinned_!==now){const e=Error('The active event changed. Reload before continuing.');e.name='EventContextError';throw e;}
}
function beautyContextToken_(){beautyContextAssert_();return beautyContextRead_()?.revision||'legacy';}
function beautyHubLeagueId_(){beautyContextAssert_();return beautyContextRead_()?.leagueId??'lg_M2wQ_4189';}
function beautyHubScopeId_(){const c=beautyContextRead_();return c?.mode==='tournament'?c.eventId:beautyHubLeagueId_();}
function beautyContextStandalone_(){return beautyContextRead_()?.mode==='tournament';}
function beautyContextBind_(input,required){
 beautyContextAssert_();const expected=beautyContextToken_();
 if((required||input._context!==undefined)&&input._context!==expected)throw Error('The selected event changed. Reload before continuing.');
 const clean=Object.assign({},input);delete clean._context;return clean;
}
function beautyContextMasterWorkbook_(ss){
 if(ss.getId()===beautyHubBaseSheet_())return ss;
 const base=SpreadsheetApp.openById(beautyHubBaseSheet_());
 return new Proxy(ss,{get(target,key){
  if(key==='getSheetByName')return name=>name==="PLAYER'S MASTER LIST"?base.getSheetByName(name):target.getSheetByName(name);
  const value=target[key];return typeof value==='function'?value.bind(target):value;
 }});
}
function beautyContextUrl_(kind,url){
 if(typeof url!=='string'||url.length>500)throw Error('Paste a Nakka URL.');
 const match=/^https:\/\/n01darts\.com\/n01\/(league\/(?:portal|l_stats)|tournament\/comp|league\/season)\.(?:php|html)\?([^#]+)(?:#.*)?$/.exec(url.trim());
 if(!match)throw Error('Use the Nakka league or tournament page URL.');
 const values={};for(const part of match[2].split('&')){const p=part.split('=');const k=decodeURIComponent(p[0]);if(Object.prototype.hasOwnProperty.call(values,k))throw Error('Repeated URL parameter.');values[k]=decodeURIComponent(p.slice(1).join('='));}
 const id=kind==='league'?(values.lgid||values.id):values.id;
 if(kind==='league'? !/^lg_[\w]{1,80}$/.test(id||'')||!match[1].startsWith('league/'):!/^t_[\w]{1,80}$/.test(id||'')||match[1]!=='tournament/comp')throw Error('Use the correct league or standalone tournament URL.');
 return id;
}
function beautyContextProvider_(kind,id){
 const auth=beautyPoolAuth_();
 const data=beautyHubTransferFetch_((kind==='league'?'league/get?lgid=':'tournament/get?tdid=')+encodeURIComponent(id),auth);
 const v=kind==='league'?data.league:data.tournament;
 if(!v||(kind==='league'?v.lgid:v.tdid)!==id||typeof v.title!=='string'||!v.title.trim()||v.title.length>300||!v.admin_id)throw Error('The configured Nakka account must administer this competition.');
 if(kind==='tournament'&&(v.lgid||v.team_games!==0))throw Error('Choose a standalone singles tournament. League events belong in League.');
 const date=kind==='league'?null:Utilities.formatDate(new Date(v.t_date*1000),'Europe/Berlin','yyyy-MM-dd');
 if(kind==='tournament'&&(!Number.isFinite(v.t_date)||!beautyHubEventDateValid_(date)))throw Error('Set a valid event date in Nakka first.');
 return {id,title:v.title,mode:kind,date,updateTime:v.updateTime};
}
function beautyContextCatalog_(){
 const p=PropertiesService.getScriptProperties(),raw=p.getProperty('BEAUTY_CONNECTIONS_V1');
 const rows=raw?JSON.parse(raw):[{id:'lg_M2wQ_4189',title:'Beauty TEST — DO NOT USE LIVE',mode:'league'},{id:'lg_tM2v_3523',title:'AIK Måndagsdartarna 2026/2027',mode:'league'}];
 if(!Array.isArray(rows)||rows.length>50)throw Error('Connection list needs review.');return rows;
}
function beautyContextSaveCatalog_(rows){
 const text=JSON.stringify(rows);if(rows.length>50||text.length>8000)throw Error('Connection list is full.');
 const p=PropertiesService.getScriptProperties();p.setProperty('BEAUTY_CONNECTIONS_V1',text);
 if(p.getProperty('BEAUTY_CONNECTIONS_V1')!==text)throw Error('Connection could not be verified.');
}
function beautyContextFind_(leagueId,date){
 if(!/^lg_[\w]{1,80}$/.test(leagueId)||!beautyHubEventDateValid_(date))throw Error('Choose a league and date.');
 beautyContextProvider_('league',leagueId);
 const list=beautyHubTransferFetch_('league/tournament/list?lgid='+encodeURIComponent(leagueId)+'&count=1000',beautyPoolAuth_()).list;
 if(!Array.isArray(list)||list.length>=1000)throw Error('The event list may be incomplete. No event selected.');
 return list.filter(e=>{
  if(!e||!/^t_[\w]{1,80}$/.test(e.tdid)||e.lgid!==leagueId)throw Error('Invalid league event list.');
  if(!e.t_date)return false;if(!Number.isFinite(e.t_date))throw Error('An event date needs review.');
  return Utilities.formatDate(new Date(e.t_date*1000),'Europe/Berlin','yyyy-MM-dd')===date;
 }).map(e=>({id:e.tdid,title:e.title,date}));
}
function beautyContextEvent_(c){
 const e=beautyHubTransferFetch_('tournament/get?tdid='+encodeURIComponent(c.eventId),beautyPoolAuth_()).tournament;
 if(!e||e.tdid!==c.eventId||(e.lgid||'')!==c.leagueId||!e.admin_id||e.team_games!==0||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==c.date)throw Error('The event changed in Nakka. Check it again.');
 return e;
}
function beautyContextEventUrl_(id){return 'https://n01darts.com/n01/'+(beautyContextStandalone_()?'tournament/comp':'league/season')+'.php?id='+encodeURIComponent(id);}
function beautyContextMatch_(){
 beautyContextAssert_();const c=beautyContextRead_();if(!c)return null;
 const answer={success:true,eventDate:c.date,readOnly:true,checkedAt:new Date().toISOString()};
 if(!c.eventId){
  const matches=beautyContextFind_(c.leagueId,c.date);
  if(matches.length!==1)return {...answer,status:matches.length?'AMBIGUOUS':'NOT_FOUND',event:null,message:matches.length?'Choose the intended event.':'No event exists for this date. You can create one for this league.'};
  return {...answer,status:'NOT_FOUND',event:null,message:'An event exists. Open League / Tournament to select it.'};
 }
 const e=beautyContextEvent_(c);
 if(beautyHubNakkaDate_().date!==c.date)throw Error('Hub date does not match the selected event.');
 return {...answer,status:'MATCHED',message:'Selected event verified.',event:{id:c.eventId,title:e.title,date:c.date,url:beautyContextEventUrl_(c.eventId)},creationReviewRequired:beautyHubCreationNeedsReview_(c.date,{id:c.eventId,title:e.title})};
}
function beautyContextTarget_(){
 beautyContextAssert_();const c=beautyContextRead_();
 if(!c?.eventId||beautyHubNakkaDate_().date!==c.date)throw Error('Select the event before continuing.');
 return {id:c.eventId,title:c.title,date:c.date};
}
function beautyContextCreateWorkspace_(c){
 const props=PropertiesService.getScriptProperties(),key='BEAUTY_EVENT_WORKBOOK_'+(c.eventId||c.leagueId+'_'+c.date);
 const existing=props.getProperty(key);if(existing){const sheet=SpreadsheetApp.openById(existing);if(Utilities.formatDate(sheet.getSheetByName('Control').getRange('A2').getValue(),'Europe/Berlin','yyyy-MM-dd')!==c.date)throw Error('Saved event workspace date changed. Review before reopening.');return existing;}
 const source=SpreadsheetApp.openById(beautyHubBaseSheet_()),ss=SpreadsheetApp.create('Beauty TEST · '+c.title+' · '+c.date);
 ss.setSpreadsheetTimeZone('Europe/Berlin');ss.setSpreadsheetLocale('en_GB');
 // Record before any copying so a partial workspace is never silently retried.
 props.setProperty(key+'_PENDING',ss.getId());
 const originals=['Control','Form responses 2','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST"];
 for(const name of originals){const sheet=source.getSheetByName(name);if(!sheet)throw Error('Missing event template sheet.');sheet.copyTo(ss).setName(name);}
 for(const sheet of ss.getSheets())if(!originals.includes(sheet.getName()))ss.deleteSheet(sheet);
 const legacy=JSON.parse(props.getProperty('BEAUTY_SELECTED_TEST_EVENTlg_M2wQ_4189')||'null');
 const migrate=legacy?.id===c.eventId&&legacy.date===c.date&&Utilities.formatDate(source.getSheetByName('Control').getRange('A2').getValue(),'Europe/Berlin','yyyy-MM-dd')===c.date;
 const history=source.getSheetByName('Form responses 2').getDataRange().getValues().slice(1).filter(row=>migrate&&row[0] instanceof Date&&Utilities.formatDate(row[0],'Europe/Berlin','yyyy-MM-dd')===c.date);
 const status=source.getSheetByName('PLAYER STATUS DATA').getDataRange().getValues().slice(1);
 for(const name of ['Form responses 2','PLAYER STATUS DATA']){const sh=ss.getSheetByName(name);if(sh.getMaxRows()>1)sh.getRange(2,1,sh.getMaxRows()-1,sh.getMaxColumns()).clearContent();}
 if(history.length)ss.getSheetByName('Form responses 2').getRange(2,1,history.length,6).setValues(history.map(row=>row.slice(0,6).map(v=>typeof v==='string'&&v.startsWith('=')?"'"+v:v)));
 const kept=migrate?status:status.filter(row=>row[1]).map(row=>[row[0],row[1],'','','','']);
 if(kept.length)ss.getSheetByName('PLAYER STATUS DATA').getRange(2,1,kept.length,6).setValues(kept.map(row=>Array.from({length:6},(_,i)=>typeof row[i]==='string'&&row[i].startsWith('=')?"'"+row[i]:row[i]??'')));
 const tonight=ss.getSheetByName("TONIGHT'S PLAYERS");
 const sourceTonight=source.getSheetByName("TONIGHT'S PLAYERS");
 const formulas=sourceTonight.getDataRange().getFormulas();for(let row=1;row<formulas.length;row++)for(let col=0;col<formulas[row].length;col++)if(formulas[row][col])tonight.getRange(row+1,col+1).setFormula(formulas[row][col]);tonight.getRange(2,3,tonight.getMaxRows()-1,1).clearContent();
 if(migrate){const statuses=sourceTonight.getRange(2,3,Math.min(99,sourceTonight.getMaxRows()-1),1).getValues();tonight.getRange(2,3,statuses.length,1).setValues(statuses);}
 let formula=source.getSheetByName("TONIGHT'S PLAYERS").getRange('A2').getFormula();
 if(!formula.includes("'Form responses 2'!A2:A>=Control!A2"))throw Error('Unsupported event membership formula.');
 formula=formula.replace(",'Form responses 2'!A2:A>=Control!A2,'Form responses 2'!A2:A<Control!A2+1",'');
 tonight.getRange('A2').setFormula(formula);
 ss.getSheetByName('Control').getRange('A2').setValue(Utilities.parseDate(c.date,'Europe/Berlin','yyyy-MM-dd'));
 ss.getSheetByName('Control').getRange('B2').setValue(new Date());SpreadsheetApp.flush();
 if(Utilities.formatDate(ss.getSheetByName('Control').getRange('A2').getValue(),'Europe/Berlin','yyyy-MM-dd')!==c.date)throw Error('Event date readback failed.');
 props.setProperty(key,ss.getId());props.deleteProperty(key+'_PENDING');return ss.getId();
}
function beautyContextService_(action,input){
 const fail=e=>({success:false,error:e.name==='EventContextError'?e.message:'Could not complete this event selection. '+(e.publicMessage||'Reload and check the Nakka URL, account access and event date.')});
 let lock;
 try{
  beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);
  const fields={list:'',check:'kind,url',add:'ticket',find:'date,leagueId',activate:'date,eventId,leagueId,mode',draft:'date,leagueId'}[action];
  if(fields===undefined||!input||Object.keys(input).sort().join(',')!==fields||Object.values(input).some(v=>typeof v!=='string'||v.length>500))throw Error('input');
  if(action==='list')return {success:true,connections:beautyContextCatalog_(),active:beautyContextRead_(),context:beautyContextToken_()};
  if(action==='check'){
   if(!['league','tournament'].includes(input.kind))throw Error('kind');
   const id=beautyContextUrl_(input.kind,input.url),item=beautyContextProvider_(input.kind,id),ticket=Utilities.getUuid().replace(/-/g,'');
   CacheService.getScriptCache().put('beauty-connect:'+ticket,JSON.stringify({item,uid:beautyHubAuthRequire_(beautyHubRequestToken_).uid,expires:Date.now()+300000}),300);
   return {success:true,item,ticket};
  }
  if(action==='find')return {success:true,events:beautyContextFind_(input.leagueId,input.date),date:input.date};
  lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('busy');beautyHubAuthRequire_(beautyHubRequestToken_);
  if(action==='add'){
   const cached=JSON.parse(CacheService.getScriptCache().get('beauty-connect:'+input.ticket)||'null');
   if(!cached||cached.uid!==beautyHubAuthRequire_(beautyHubRequestToken_).uid||Date.now()>=cached.expires)throw Error('Review expired.');
   const item=beautyContextProvider_(cached.item.mode,cached.item.id),rows=beautyContextCatalog_().filter(r=>r.id!==item.id);
   rows.push(item);beautyContextSaveCatalog_(rows);CacheService.getScriptCache().remove('beauty-connect:'+input.ticket);return {success:true,item};
  }
  const mode=action==='draft'?'league':input.mode,leagueId=input.leagueId,eventId=action==='draft'?'':input.eventId,date=input.date;
  if(!['league','tournament'].includes(mode)||!beautyHubEventDateValid_(date)||mode==='league'&&!/^lg_[\w]{1,80}$/.test(leagueId)||mode==='tournament'&&(leagueId!==''||!eventId))throw Error('input');
  const record=beautyContextCatalog_().find(r=>r.id===(mode==='league'?leagueId:eventId)&&r.mode===mode);if(!record)throw Error('Connect this competition first.');
  const c={version:1,mode,leagueId,eventId,date,title:record.title,revision:Utilities.getUuid().replace(/-/g,'')};
  if(eventId){if(!/^t_[\w]{1,80}$/.test(eventId))throw Error('event');c.title=beautyContextEvent_(c).title;}
  else if(beautyContextFind_(leagueId,date).length)throw Error('An event now exists. Check again.');
  const pendingKey='BEAUTY_EVENT_WORKBOOK_'+(eventId||leagueId+'_'+date)+'_PENDING';
  if(PropertiesService.getScriptProperties().getProperty(pendingKey))throw Error('A workspace creation needs review.');
  c.sheetId=beautyContextCreateWorkspace_(c);
  // Publish a single complete context only after the workspace readback passes.
  const text=JSON.stringify(c),props=PropertiesService.getScriptProperties();props.setProperty('BEAUTY_EVENT_CONTEXT_V1',text);
  if(props.getProperty('BEAUTY_EVENT_CONTEXT_V1')!==text)throw Error('Activation needs review.');
  return {success:true,active:c,context:c.revision};
 }catch(e){return fail(e);}finally{if(lock)lock.releaseLock();}
}

function beautyHubEventScopeId_(){const c=beautyContextRead_();return c?(c.eventId||c.leagueId+'_'+c.date):'lg_M2wQ_4189';}

function beautyContextCreated_(event){
 const c=beautyContextRead_();if(!c)return;
 beautyContextAssert_();
 if(c.mode!=='league'||c.eventId||event.lgid!==c.leagueId||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==c.date)throw Error('Created event context changed.');
 const props=PropertiesService.getScriptProperties();
 props.setProperty('BEAUTY_EVENT_WORKBOOK_'+event.tdid,c.sheetId);
 c.eventId=event.tdid;c.title=event.title;
 const text=JSON.stringify(c);props.setProperty('BEAUTY_EVENT_CONTEXT_V1',text);
 if(props.getProperty('BEAUTY_EVENT_CONTEXT_V1')!==text)throw Error('Created event context could not be verified.');
}
