const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),checks=[],clone=v=>structuredClone(v);
const read=(folder,name)=>fs.readFileSync(path.join(root,folder,name),'utf8');
const test=(name,fn)=>{try{fn();checks.push(name);}catch(e){console.error(name);throw e;}};
function fixture(folder='candidate',options={}){
 const eventDate='2026-11-21',name='Beauty Local Synthetic',ctx={version:1,mode:'league',leagueId:'lg_M2wQ_4189',eventId:'t_GgaQ_0921',date:eventDate,title:'Beauty TEST Removal Recovery 2026-11-21',sheetId:'1N0kp0f2kOQETylULYI685JDZH3bVKq9lG_NhoAba8lk',revision:'ac044ca8097c46e2b672c5917627fa2a'};
 const raw={tdid:ctx.eventId,lgid:ctx.leagueId,title:ctx.title,status:20,t_date:1795258800,updateTime:123,admin_id:'synthetic-admin',team_games:0};
 let current=clone(ctx),date=eventDate,authFailAt=0,authCount=0,hook=()=>{},seq=0,fetchFailure=null;
 const rows=[{name,status:'IN'}],entries=options.empty?[]:[{name,tpid:'T001',lpid:'L001'}],league=[{name,lpid:'L001'}],requests=[],batches=[],properties={},cache=new Map(),writes=[];
 const sheetData={Control:{values:[['DATE'],[new Date('2026-11-21T12:00:00Z')]]},
  'Form responses 2':{values:[['TIME','NAME','NEW','CONSENT','MESSAGE','SOURCE'],[new Date('2026-11-21T12:00:00Z'),name,'','NEJ, JAG GODKÄNNER INTE','','HUB']],formulas:[Array(6).fill(''),Array(6).fill('')]},
  'PLAYER STATUS DATA':{display:[['PLAYER','OLD','STATUS','CONSENT','MESSAGE','SOURCE'],[name,'','IN','NEJ','','HUB']]},
  "TONIGHT'S PLAYERS":{display:[['PLAYERS','NEW PLAYERS','STATUS','CONSENT','MESSAGE','SOURCE'],[name,'','IN','NEJ','','HUB']]}};
 const c=vm.createContext({console,Date,JSON,Math,Object,Array,Number,String,Set,Map,Proxy,Error,RegExp,Boolean,encodeURIComponent,decodeURIComponent,
  BEAUTY_IDENTITY_WRITES_ENABLED_:true,beautyHubRequestToken_:'synthetic-session',beautyBackgroundInvocation_:null});
 for(const n of ['HubEventContext.gs','HubTestNakkaTransfer.gs','HubTestRemove.gs'])vm.runInContext(read(folder,n),c,{filename:n});
 const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('base64url');
 const authorize=()=>{authCount++;if(authCount===authFailAt){const e=Error('AUTH_REQUIRED');e.name='HubAuthError';throw e;}return {uid:'synthetic-user',sessionBinding:'synthetic-session'};};
 Object.assign(c,{beautyContextRead_:()=>clone(current),beautyContextAssert_:()=>{if(current?.revision!==ctx.revision)throw Error('context changed');},
  beautyHubTestGuard_:()=>{},beautyHubNakkaAuthorize_:authorize,beautyHubAuthRequire_:authorize,beautyHubTransferTarget_:()=>current.eventId,
  beautyHubLeagueId_:()=>current.leagueId,beautyContextStandalone_:()=>current.mode==='tournament',beautyHubNakkaDate_:()=>({date,zone:'Europe/Berlin'}),
  beautyHubActiveTestTarget_:()=>({id:current.eventId,title:current.title,date:current.date}),beautyHubNakkaHubRows_:()=>clone(rows),beautyHubCreationNeedsReview_:()=>false,
  beautyPoolAuth_:()=> 'synthetic-auth',beautyHubTransferHash_:hash,beautyHubEventKey_:v=>String(v||'').normalize('NFC').trim().toLowerCase(),
  beautyHubEventDateValid_:v=>/^20\d\d-\d\d-\d\d$/.test(v),beautyHubSpreadsheet_:()=>({getSpreadsheetTimeZone:()=> 'Europe/Berlin'}),beautyHubEventSnapshot_:()=>clone(sheetData),
  beautyTestNakkaReadGuard_:p=>{if(!p.includes(current.eventId)&&!p.includes(current.leagueId))throw Error('wrong destination');},beautyTestNakkaMutationGuard_:(p,b)=>{if(b&&b.tdid!==current.eventId)throw Error('wrong mutation');},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='N01_API_USER'?'synthetic':k==='N01_API_PASSWORD'?'local-only':properties[k]??null,setProperty:(k,v)=>{writes.push([k,v]);properties[k]=v;},getProperties:()=>({...properties})})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  Utilities:{formatDate:d=>new Date(d.getTime()+3600000).toISOString().slice(0,10),base64Encode:s=>Buffer.from(s).toString('base64'),getUuid:()=>String(++seq).padStart(32,'0')}});
 c.beautyHubNakkaEvent_=()=>{c.beautyHubTestGuard_();c.beautyHubNakkaAuthorize_();return c.beautyContextMatch_();};
 const response=(p,req)=>{
  if(req.method==='post'){
   const body=JSON.parse(req.payload);assert.deepEqual(Object.keys(body).sort(),['add','tdid']);assert.equal(body.add.length,1);
   entries.push({name:body.add[0].name,lpid:body.add[0].lpid,tpid:'T002'});
   if(fetchFailure)throw Error(fetchFailure);
   return {result:0,added:[{name:body.add[0].name,tpid:'T002'}]};
  }
  if(fetchFailure)throw Error(fetchFailure);
  if(p.startsWith('tournament/get?'))return {result:0,tournament:clone(raw)};
  if(p.startsWith('tournament/entry/list?'))return {result:0,list:clone(entries)};
  if(p.startsWith('league/entry/list?'))return {result:0,list:clone(league)};
  throw Error('Unexpected route '+p);
 };
 const wrap=d=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(d)});
 c.UrlFetchApp={fetch:(url,opt)=>{const p=url.split('/api/v1/')[1];requests.push({path:p,method:opt.method});hook('single',p);return wrap(response(p,opt));},
  fetchAll:list=>{batches.push(clone(list));const result=list.map(req=>{assert.equal(req.method,'get');assert.equal(req.payload,undefined);assert.equal(req.followRedirects,false);const p=req.url.split('/api/v1/')[1];requests.push({path:p,method:req.method});return wrap(response(p,req));});hook('batch');return result;}};
 return {c,ctx,raw,rows,entries,league,requests,batches,properties,writes,cache,name,eventDate,sheetData,
  state:(allowMissing=false,allowClosed=false)=>c.beautyHubTransferState_(name,'synthetic-auth',allowMissing,allowClosed),
  remove:()=>c.beautyHubRemoveState_({player:name,eventDate},'synthetic-auth').state,
  preview:()=>c.beautyHubNakkaTransferRun_('preview',{player:name}),save:t=>c.beautyHubNakkaTransferRun_('save',{player:name,ticket:t,confirmed:'true'}),
  hook:fn=>hook=fn,context:()=>current,editContext:fn=>fn(current),date:v=>date=v,authFail:n=>authFailAt=n,failFetch:s=>fetchFailure=s};
}
test('Current selected-event transfer state is identical with four GETs reduced to three',()=>{
 const a=fixture('baseline'),b=fixture();assert.equal(JSON.stringify(a.state()),JSON.stringify(b.state()));assert.equal(a.requests.length,4);assert.equal(b.requests.length,3);assert.equal(b.batches.length,1);
});
test('Removal state, full-entry fingerprint and immutable snapshot are identical with one fewer GET',()=>{
 const a=fixture('baseline'),b=fixture();assert.equal(JSON.stringify(a.remove()),JSON.stringify(b.remove()));assert.equal(a.requests.length,4);assert.equal(b.requests.length,3);
});
test('Ordinary default context match still performs its independent event fetch',()=>{const f=fixture();assert.equal(f.c.beautyContextMatch_().status,'MATCHED');assert.equal(f.requests.length,1);});
test('Mixed installation with old context helpers falls back safely to four GETs',()=>{const f=fixture();delete f.c.beautyContextEventValidate_;vm.runInContext(read('baseline','HubEventContext.gs').slice(read('baseline','HubEventContext.gs').indexOf('function beautyContextEvent_(c)'),read('baseline','HubEventContext.gs').indexOf('function beautyContextTarget_()')),f.c);assert(f.state());assert.equal(f.requests.length,4);});
test('New context helpers with old transfer/removal preserve normal behavior',()=>{const f=fixture('baseline');vm.runInContext(read('candidate','HubEventContext.gs').slice(read('candidate','HubEventContext.gs').indexOf('function beautyContextEvent_(c)'),read('candidate','HubEventContext.gs').indexOf('function beautyContextTarget_()')),f.c);assert(f.state());assert.equal(f.requests.length,4);});
for(const [label,edit]of[
 ['wrong event',f=>f.raw.tdid='t_wrong'],['wrong league',f=>f.raw.lgid='lg_wrong'],['wrong date',f=>f.raw.t_date=1],['invalid date',f=>f.raw.t_date='not-a-number'],
 ['missing administrator',f=>delete f.raw.admin_id],['doubles event',f=>f.raw.team_games=1],['wrong title',f=>f.raw.title='Different event'],['invalid update time',f=>f.raw.updateTime='123'],
 ['closed registration',f=>f.raw.status=40],['missing player',f=>f.rows.length=0],['OUT player',f=>f.rows[0].status='OUT'],['duplicate Hub identity',f=>f.rows.push(clone(f.rows[0]))],
 ['duplicate league identity',f=>f.league.push({name:f.name,lpid:'L002'})],['missing league identity',f=>f.league.length=0],['duplicate league id',f=>f.league.push({name:'Other',lpid:'L001'})],
 ['invalid league id',f=>f.league[0].lpid='INVALID'],['duplicate event identity',f=>f.entries.push({name:f.name,tpid:'T002',lpid:'L001'})],['wrong linked identity',f=>f.entries[0].lpid='L002'],
 ['invalid event id',f=>f.entries[0].tpid='INVALID'],['conflicting event name',f=>f.entries[0].name='Someone else']
])test('State refuses '+label+' before any mutation',()=>{for(const folder of ['baseline','candidate']){const f=fixture(folder);edit(f);assert.throws(()=>f.state());assert.equal(f.requests.filter(r=>r.method==='post').length,0);assert.equal(f.writes.length,0);}});
for(const [label,edit]of[
 ['event id',c=>c.eventId='t_other'],['date',c=>c.date='2026-11-22'],['revision',c=>c.revision='different'],['sheet',c=>c.sheetId='other-sheet'],['title',c=>c.title='Changed title'],['league',c=>c.leagueId='lg_other']
])test('Context '+label+' changing during batched reads is rejected',()=>{const f=fixture();f.hook(stage=>{if(stage==='batch')f.editContext(edit);});assert.throws(()=>f.state());assert.equal(f.writes.length,0);});
test('Fresh Control date is still verified after the provider read',()=>{const f=fixture();f.hook(stage=>{if(stage==='batch')f.date('2026-11-22');});assert.throws(()=>f.state());});
test('Authorization failure before batch sends no provider request',()=>{const f=fixture();f.authFail(1);assert.throws(()=>f.state(),/AUTH_REQUIRED/);assert.equal(f.requests.length,0);});
test('Authorization expiry after batch prevents state acceptance',()=>{const f=fixture();f.authFail(2);assert.throws(()=>f.state(),/AUTH_REQUIRED/);assert.equal(f.writes.length,0);});
test('Provider failure never triggers serial fallback or retries',()=>{const f=fixture();f.failFetch('offline');assert.throws(()=>f.state(),/offline/);assert.equal(f.batches.length,1);assert.equal(f.requests.length,1);});
test('Missing batched event cannot trigger another event fetch',()=>{const f=fixture();f.c.beautyHubNakkaReads_=()=>[{}, {list:[]},{list:[]}];assert.throws(()=>f.state());assert.equal(f.requests.length,0);});
test('Closed-event read-only verification remains allowed when requested',()=>{const f=fixture();f.raw.status=40;assert.equal(f.state(false,true).event.status,40);});
test('Missing league identity is allowed only by the existing creation/review flag',()=>{const f=fixture();f.league.length=0;f.entries.length=0;assert.equal(f.state(true).identity.lpid,'');});
test('Standalone tournament retains two-request batch and no league query',()=>{const f=fixture();f.editContext(c=>{c.mode='tournament';c.leagueId='';});f.raw.lgid='';f.entries[0].lpid=undefined;assert.equal(f.state().identity.lpid,'');assert.equal(f.requests.length,2);assert(!f.requests.some(r=>r.path.startsWith('league/')));});
for(const key of ['table','group_table','final_table'])test('Removal still rejects entry placed in '+key,()=>{const f=fixture();f.raw[key]={players:['T001']};assert.throws(()=>f.remove(),/BRACKET/);assert.equal(f.writes.length,0);});
test('Removal still rejects duplicate response rows',()=>{const f=fixture();f.sheetData['Form responses 2'].values.push(clone(f.sheetData['Form responses 2'].values[1]));assert.throws(()=>f.remove(),/IDENTITY/);assert.equal(f.requests.length,0);});
test('Removal still rejects response formulas',()=>{const f=fixture();f.sheetData['Form responses 2'].formulas[1][1]='=IMPORTDATA()';assert.throws(()=>f.remove(),/LAYOUT/);assert.equal(f.requests.length,0);});
test('Preview and save keep fresh state, event prewrite check, journal barrier and exact readback',()=>{
 const a=fixture('baseline',{empty:true}),b=fixture('candidate',{empty:true});
 for(const f of [a,b]){const p=f.preview();assert.equal(p.status,'PREVIEW');assert.equal(f.requests.filter(r=>r.method==='post').length,0);const r=f.save(p.ticket);assert.equal(r.status,'TRANSFERRED');assert.equal(r.readbackVerified,true);assert.equal(f.requests.filter(r=>r.method==='post').length,1);const journal=JSON.parse(f.properties[r.journal]);assert.equal(journal.state,'VERIFIED');assert.equal(journal.tpid,'T002');assert.equal(f.save(p.ticket).code,'STALE_TRANSFER');}
 assert.equal(a.requests.length-b.requests.length,2);
});
test('Changed provider state invalidates the original preview without sending',()=>{const f=fixture('candidate',{empty:true}),p=f.preview();f.raw.updateTime++;assert.equal(f.save(p.ticket).code,'STALE_TRANSFER');assert.equal(f.requests.filter(r=>r.method==='post').length,0);});
test('A lost POST response retains ATTEMPTED journal and cannot add again',()=>{
 const f=fixture('candidate',{empty:true}),p=f.preview();f.hook((stage,route)=>{if(route==='tournament/entry/update')f.failFetch('lost reply');});const r=f.save(p.ticket);assert.equal(r.code,'TRANSFER_UNCERTAIN');const prior=f.properties[r.journal];assert.equal(JSON.parse(prior).state,'ATTEMPTED');f.failFetch(null);f.hook(()=>{});const reviewed=f.preview();assert.equal(reviewed.status,'PRESENT_AFTER_ATTEMPT');assert.equal(f.properties[r.journal],prior);assert.equal(f.requests.filter(r=>r.method==='post').length,1);
});
test('All automatic registration controllers and all write guards remain unchanged',()=>{
 for(const n of ['HubTestAutoRegister.gs','Code.gs','BeautyTestIsolation.gs','HubTestBackgroundRecovery.gs','HubTestAttention.gs','HubTestRemovalRecovery.gs'])assert.equal(read('baseline',n),read('candidate',n),n);
 for(const name of ['beautyHubTransferFetch_','beautyHubNakkaTransferRun_']){
  const extract=s=>s.slice(s.indexOf('function '+name+'('),s.indexOf('\nfunction ',s.indexOf('function '+name+'(')+1)<0?undefined:s.indexOf('\nfunction ',s.indexOf('function '+name+'(')+1));
  assert.equal(extract(read('baseline','HubTestNakkaTransfer.gs')),extract(read('candidate','HubTestNakkaTransfer.gs')));
 }
});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0,scope:'Composed actual context, transfer state, transfer preview/save and removal state with synthetic local platform/provider services; no native registration/removal latency claim.'};
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});fs.writeFileSync(path.join(root,'evidence/state-read-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:result.result,checks:result.checks}));
