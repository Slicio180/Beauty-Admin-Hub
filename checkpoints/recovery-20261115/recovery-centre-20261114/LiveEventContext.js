/* LIVE event selection. Selection never starts matches or changes Nakka data.
 * One original workbook with verified event archives and interrupted-switch recovery.
 * Paired kiosk/mobile routes share this context and the same ScriptLock.
 */
const BEAUTY_LIVE_CONTEXT_KEY_='BEAUTY_LIVE_EVENT_CONTEXT_V1';
const BEAUTY_LIVE_BASE_ = Object.freeze({version:1,mode:'league',sheetId:'1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',eventId:'t_UsRG_9574',leagueId:'lg_tM2v_3523',date:'2026-11-09',title:'AIK MÅNDAGSDARTARNA 2026/11/09',revision:'live-20261109'});
var beautyLivePinned_;
function beautyLiveContextRead_(){
 const raw=PropertiesService.getScriptProperties().getProperty(BEAUTY_LIVE_CONTEXT_KEY_);
 if(!raw)return {...BEAUTY_LIVE_BASE_};
 const c=JSON.parse(raw);
 if(c.version!==1||!['league','tournament'].includes(c.mode)||!/^[-\w]{20,150}$/.test(c.sheetId||'')||!/^t_[\w]{1,80}$/.test(c.eventId||'')||!/^[-\w]{32}$/.test(c.revision||'')||!beautyHubEventDateValid_(c.date)||typeof c.title!=='string'||!c.title.trim()||c.title.length>300||c.mode==='league'&&!/^lg_[\w]{1,80}$/.test(c.leagueId||'')||c.mode==='tournament'&&c.leagueId!=='')throw Error('Invalid saved LIVE event context.');
 if(c.sheetId===BEAUTY_LIVE_BASE_.sheetId&&(c.eventId!==BEAUTY_LIVE_BASE_.eventId||c.leagueId!==BEAUTY_LIVE_BASE_.leagueId||c.date!==BEAUTY_LIVE_BASE_.date)){const ready=JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_ORIGINAL_WORKBOOK_READY_V1')||'null');if(!ready||ready.state!=='VERIFIED'||ready.eventId!==c.eventId||ready.date!==c.date||ready.sheetId!==c.sheetId||ready.revision!==c.revision)throw Error('Original workbook binding has not been verified.');}
 return c;
}
function beautyLiveTarget_(){
 if(PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1'))throw Error('Event switching needs verification. Open League / Tournament and use RECHECK EVENT SWITCH.');
 const restore=JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_ORIGINAL_RESTORE_20261113')||'null');if(restore?.state==='ATTEMPTED')throw Error('Workbook restoration is in progress or needs owner review. No player operation performed.');
 const c=beautyLiveContextRead_();
 if(beautyLivePinned_&&c.revision!==beautyLivePinned_.revision){const e=Error('The selected event changed. Reload before continuing.');e.name='EventContextError';throw e;}
 if(!beautyLivePinned_)beautyLivePinned_=c;
 return beautyLivePinned_;
}
function beautyContextAssert_(){beautyLiveTarget_();}
function beautyContextToken_(){return beautyLiveTarget_().revision;}
function beautyContextStandalone_(){return beautyLiveTarget_().mode==='tournament';}
function beautyLiveBrand_(){const c=beautyLiveTarget_();return c.mode==='league'&&c.leagueId===BEAUTY_LIVE_BASE_.leagueId?'monday':'club';}
function beautyHubEventDateValid_(date){return typeof date==='string'&&/^20\d\d-\d\d-\d\d$/.test(date)&&!isNaN(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;}
function beautyLivePendingSwitch_(){
 beautyQueueWriteGuard_(null,true);
 const props=PropertiesService.getScriptProperties().getProperties();
 for(const [key,value] of Object.entries(props)){
  if(!value)continue;
  if(/^BEAUTY_LIVE_(REGISTRATION|REMOVE|STATUS)_PENDING$/.test(key)||/^BEAUTY_CONSENT_PENDING_/.test(key))throw Error('Resolve the unfinished registration, removal or status save before switching.');
  if(/^BEAUTY_(EVENT_SETTINGS|POOL_SEND|POOL_START)_/.test(key)){
   const row=JSON.parse(value);if(row?.state==='ATTEMPTED')throw Error('Review the unfinished event operation before switching.');
  }
 }
}
function beautyLiveContextCatalog_(){
 const raw=PropertiesService.getScriptProperties().getProperty('BEAUTY_LIVE_CONNECTIONS_V1');
 const rows=raw?JSON.parse(raw):[{id:BEAUTY_LIVE_BASE_.leagueId,title:'AIK Måndagsdartarna 2026/2027',mode:'league'}];
 if(!Array.isArray(rows)||rows.length>50||rows.some(r=>!r||!['league','tournament'].includes(r.mode)||!(r.mode==='league'?/^lg_[\w]{1,80}$/:/^t_[\w]{1,80}$/).test(r.id||'')||typeof r.title!=='string'||!r.title.trim()||r.title.length>300)||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Saved competition list needs review.');
 return rows;
}
function beautyLiveContextProvider_(kind,id){
 if(!['league','tournament'].includes(kind)||!(kind==='league'?/^lg_[\w]{1,80}$/:/^t_[\w]{1,80}$/).test(id))throw Error('Invalid competition.');
 const data=beautyLiveRegistrationApi_((kind==='league'?'league/get?lgid=':'tournament/get?tdid=')+id),v=data[kind];
 if(!v||(kind==='league'?v.lgid:v.tdid)!==id||typeof v.title!=='string'||!v.title.trim()||v.title.length>300||!v.admin_id)throw Error('The configured Nakka account must administer this competition.');
 if(kind==='tournament'&&((v.lgid||'')!==''||v.team_games!==0||!Number.isFinite(v.t_date)))throw Error('Choose a standalone singles tournament.');
 const date=kind==='league'?null:Utilities.formatDate(new Date(v.t_date*1000),'Europe/Stockholm','yyyy-MM-dd');
 if(kind==='tournament'&&!beautyHubEventDateValid_(date))throw Error('Set a valid event date in Nakka first.');
 return {id,title:v.title,mode:kind,date};
}
function beautyLiveContextFind_(leagueId,date){
 if(!beautyHubEventDateValid_(date)||!beautyLiveContextCatalog_().some(r=>r.mode==='league'&&r.id===leagueId))throw Error('Choose a saved league and date.');
 beautyLiveContextProvider_('league',leagueId);
 const list=beautyLiveRegistrationApi_('league/tournament/list?lgid='+leagueId+'&count=1000').list;
 if(!Array.isArray(list)||list.length>=1000)throw Error('The event list is incomplete.');
 const ids=new Set();return list.filter(e=>{
  if(!e||!/^t_[\w]{1,80}$/.test(e.tdid)||e.lgid!==leagueId||ids.has(e.tdid))throw Error('Invalid league event list.');ids.add(e.tdid);
  if(!e.t_date)return false;if(!Number.isFinite(e.t_date))throw Error('An event date needs review.');
  return Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')===date;
 }).map(e=>({id:e.tdid,title:e.title,date}));
}
function beautyLiveContextEvent_(c){
 const e=beautyLiveRegistrationApi_('tournament/get?tdid='+c.eventId).tournament;
 if(!e||e.tdid!==c.eventId||(e.lgid||'')!==c.leagueId||!e.admin_id||e.team_games!==0||typeof e.title!=='string'||!e.title.trim()||e.title.length>300||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==c.date)throw Error('The Nakka event changed. Check it again.');
 return e;
}
function beautyLiveWorkspace_(c){
 const current=beautyLiveTarget_();
 // Never create a workbook automatically. New-event archive/reset is a separate step.
 if(c.eventId!==current.eventId||c.leagueId!==current.leagueId||c.date!==current.date)throw Error('New-event switching is paused until the single-workbook archive/reset is ready. No workbook created.');
 const ss=SpreadsheetApp.openById(current.sheetId),date=ss.getSheetByName('Control').getRange('A2').getValue();
 if(!(date instanceof Date)||Utilities.formatDate(date,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')!==c.date)throw Error('Saved workbook date changed.');
 return current.sheetId;
}
function beautyLiveContextService_(action,input,token){
 let lock;
 try{
  beautyLiveLoginGuard_();const user=beautyHubAuthSessionRequire_(token);
  if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Invalid event selection.');
  if(action==='recover'){
   if(Object.keys(input).some(k=>k!=='_context'))throw Error('Invalid recovery request.');
   lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Another Hub operation is running.');
   beautyHubAuthSessionRequire_(token);
   if(JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_ORIGINAL_RESTORE_20261113')||'null')?.state==='ATTEMPTED')throw Error('Original restoration needs owner review first.');
   return beautyEventSwitchRecover_(user);
  }
  const pending=PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1');
  if(pending&&action==='list'){
   if(Object.keys(input).some(k=>k!=='_context'))throw Error('Invalid event selection.');
   const j=JSON.parse(pending);return {success:true,switchPending:true,active:JSON.parse(j.beforeContext),connections:[],context:JSON.parse(j.beforeContext).revision};
  }
  const previous=beautyLiveTarget_();
  if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Invalid event selection.');
  if(action!=='list'&&input._context!==previous.revision)throw Error('The selected event changed. Reload before continuing.');
  const clean={...input};delete clean._context;
  const fields={list:'',check:'kind,url',add:'ticket',remove:'id,mode',find:'date,leagueId',activate:'date,eventId,leagueId,mode'}[action];
  if(fields===undefined||Object.keys(clean).sort().join(',')!==fields||Object.values(clean).some(v=>typeof v!=='string'||v.length>500))throw Error('Invalid event selection.');
  if(action==='list')return {success:true,connections:beautyLiveContextCatalog_(),active:previous,context:previous.revision};
  if(action==='find')return {success:true,events:beautyLiveContextFind_(clean.leagueId,clean.date),date:clean.date};
  if(action==='check'){
   if(!['league','tournament'].includes(clean.kind))throw Error('Invalid competition type.');
   const item=beautyLiveContextProvider_(clean.kind,beautyContextUrl_(clean.kind,clean.url)),ticket=Utilities.getUuid().replace(/-/g,'');
   CacheService.getScriptCache().put('beauty-live-connect:'+ticket,JSON.stringify({item,uid:user.uid,context:previous.revision,expires:Date.now()+300000}),300);
   return {success:true,item,ticket};
  }
  lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('Another Hub operation is running.');
  beautyHubAuthRequire_(token);beautyLivePendingSwitch_();
  if(action==='remove'){
   beautyContextAssert_();
   const active=beautyLiveTarget_(),rows=beautyLiveContextCatalog_();
   if(!['league','tournament'].includes(clean.mode)||!rows.some(r=>r.id===clean.id&&r.mode===clean.mode))throw Error('Saved competition not found. Reload the list.');
   if(clean.id===(active.mode==='league'?active.leagueId:active.eventId))throw Error('Switch to another competition before removing the active one.');
   const next=rows.filter(r=>!(r.id===clean.id&&r.mode===clean.mode)),text=JSON.stringify(next),p=PropertiesService.getScriptProperties();
   p.setProperty('BEAUTY_LIVE_CONNECTIONS_V1',text);
   if(p.getProperty('BEAUTY_LIVE_CONNECTIONS_V1')!==text)throw Error('Removal readback failed. Reload the list before continuing.');
   return {success:true,connections:next,active,context:active.revision};
  }
  if(action==='add'){
   const cache=CacheService.getScriptCache(),v=JSON.parse(cache.get('beauty-live-connect:'+clean.ticket)||'null');
   if(!v||v.uid!==user.uid||v.context!==previous.revision||Date.now()>=v.expires)throw Error('Connection review expired. Check the URL again.');
   const item=beautyLiveContextProvider_(v.item.mode,v.item.id),rows=beautyLiveContextCatalog_().filter(r=>r.id!==item.id).concat(item),text=JSON.stringify(rows);
   if(rows.length>50||text.length>8000)throw Error('Saved competition list is full.');
   const p=PropertiesService.getScriptProperties();p.setProperty('BEAUTY_LIVE_CONNECTIONS_V1',text);if(p.getProperty('BEAUTY_LIVE_CONNECTIONS_V1')!==text)throw Error('Connection readback failed.');
   cache.remove('beauty-live-connect:'+clean.ticket);return {success:true,item};
  }
  const c={version:1,...clean,revision:previous.sheetId===BEAUTY_LIVE_BASE_.sheetId&&clean.eventId===previous.eventId&&clean.date===previous.date?previous.revision:Utilities.getUuid().replace(/-/g,'')};
  if(!beautyHubEventDateValid_(c.date)||!/^t_[\w]{1,80}$/.test(c.eventId)||!['league','tournament'].includes(c.mode)||c.mode==='league'&&!/^lg_[\w]{1,80}$/.test(c.leagueId)||c.mode==='tournament'&&c.leagueId!=='')throw Error('Invalid event identity.');
  if(!beautyLiveContextCatalog_().some(r=>r.mode===c.mode&&r.id===(c.mode==='league'?c.leagueId:c.eventId)))throw Error('Connect this competition first.');
  c.title=beautyLiveContextEvent_(c).title;
  beautyContextAssert_();return beautyEventSwitch_(c,user);
 }catch(e){const pending=PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_SWITCH_PENDING_V1');return {success:false,code:'EVENT_SELECTION_FAILED',error:(pending?'RECHECK EVENT SWITCH: ':'')+e.message};}
 finally{if(lock)lock.releaseLock();}
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

// Historical owner diagnostics retain their original Monday target.
const BEAUTY_LIVE_TARGET_=BEAUTY_LIVE_BASE_;
