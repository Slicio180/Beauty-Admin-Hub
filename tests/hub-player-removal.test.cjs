const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const base='apps-script/registration-identity-test/remote-app/';
function fixture(o={}){
 const stamp=new Date('2026-10-27T12:00:00Z'),date='2026-10-27',writes=[],posts=[],props=new Map([['N01_API_USER','fixture'],['N01_API_PASSWORD','fixture']]),cache=new Map();
 const blank=(n,w)=>Array.from({length:n},()=>Array(w).fill(''));
 const values={Control:[['START DATE','LAST RESET'],[stamp,stamp]],'PLAYER STATUS DATA':[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Test Player','Old Name','IN','JA','message','HUB'],['Other','','OUT','NEJ','other','MOBIL']],"PLAYER'S MASTER LIST":[['PLAYERS'],['Test Player'],['Other']],'Form responses 2':[['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM'],[stamp,'Test Player','','JA, JAG GODKÄNNER','message','HUB'],[stamp,'Other','','NEJ, JAG GODKÄNNER INTE','other','MOBIL']],"TONIGHT'S PLAYERS":[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Test Player','','IN','JA','message','HUB'],['Other','','OUT','NEJ','other','MOBIL'],...blank(97,6)]};
 let entries=[{tpid:'t001',name:'Test Player',lpid:'l001',index:1},{tpid:'t002',name:'Other',lpid:'l002',index:2}],released=0,authExpired=false;
 if(o.absent)entries=entries.slice(1);if(o.duplicateEntry)entries.push({tpid:'t003',name:'Test Player'});
 const raw={tdid:'t_QHaG_7792',lgid:'lg_tM2v_3523',title:'Beauty Registration TEST event DO NOT USE LIVE',status:20,t_date:stamp.getTime()/1000,updateTime:1};
 if(o.oldTitle)raw.title='Beauty Hub TEST — DO NOT USE LIVE';if(o.live)raw.tdid='t_live_9999';if(o.started)raw.status=30;if(o.bracket)raw.rr_table=[['t001','t002']];
 const sheets={};
 function range(name,r,c,h=1,w=1){return {
  getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>values[name]?.[r-1+i]?.[c-1+j]??'')),
  clearContent:()=>{writes.push([name,r,c,h,w]);if(o.sheetFailure)throw Error('private');for(let i=0;i<h;i++)for(let j=0;j<w;j++)values[name][r-1+i][c-1+j]='';},
  setValues:rows=>{writes.push([name,r,c,h,w]);for(let i=0;i<h;i++){values[name][r-1+i]??=[];for(let j=0;j<w;j++)values[name][r-1+i][c-1+j]=rows[i][j];}},
  getDisplayValues:()=>range(name,r,c,h,w).getValues().map(row=>row.map(v=>v instanceof Date?v.toISOString():String(v))),
 };}
 for(const name of Object.keys(values))sheets[name]={getRange:(r,c,h,w)=>range(name,r,c,h,w)};
 const snapshot=()=>Object.fromEntries(Object.entries(values).filter(([n])=>!n.startsWith('REMOVE-')).map(([n,v])=>[n,{values:v.map(r=>r.slice()),display:v.map(r=>r.map(x=>x instanceof Date?x.toISOString():String(x))),formulas:blank(v.length,v[0].length),formats:blank(v.length,v[0].length),id:n}]));
 function flush(){
  const names=values['Form responses 2'].slice(1).map(r=>r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1]).filter(Boolean);
  const rows=names.map(name=>{const s=values['PLAYER STATUS DATA'].find(r=>r[0]===name);return [name,'',s?.[2]||'',s?.[3]||'',s?.[4]||'',s?.[5]||''];});
  values["TONIGHT'S PLAYERS"]=[values["TONIGHT'S PLAYERS"][0],...rows,...blank(99-rows.length,6)];
 }
 const ss={getSpreadsheetTimeZone:()=> 'Europe/Berlin',getSheetByName:n=>sheets[n],insertSheet:name=>{values[name]=[];return {getRange:(r,c,h,w)=>range(name,r,c,h,w)};}};
 const context={console,Date,Set,Map,BEAUTY_IDENTITY_WRITES_ENABLED_:true,SHEET_ID:'test-sheet',beautyHubRequestToken_:'session',
  beautyHubTestGuard_:()=>{if(o.wrongProject)throw Error('wrong project');},
  beautyHubAuthRequire_:()=>{if(authExpired){const e=Error('auth');e.name='HubAuthError';throw e;}return {uid:'owner',sessionBinding:'session'};},
  SpreadsheetApp:{openById:id=>{assert.equal(id,'test-sheet');return ss;},flush},
  LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock:()=>released++})},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  Utilities:{formatDate:(d,z,f)=>f==='yyyy-MM-dd'?d.toISOString().slice(0,10):'20261027-120000',getUuid:()=> 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',base64Encode:v=>Buffer.from(v).toString('base64'),sleep(){}},
  beautyHubEventDateValid_:v=>typeof v==='string'&&/^20\d\d-\d\d-\d\d$/.test(v),beautyHubEventKey_:v=>String(v||'').normalize('NFC').trim().toLowerCase(),
  beautyHubEventSnapshot_:snapshot,beautyHubEventVersion_:(s,d)=>JSON.stringify({s,d}),
  beautyHubNakkaEvent_:()=>({status:'MATCHED',event:{id:'t_QHaG_7792'},eventDate:date}),
  getBeautyHubData_:()=>({success:true,eventDate:date,players:values["TONIGHT'S PLAYERS"].slice(1).filter(r=>r[0]||r[1]).map(r=>({player:r[0],newPlayer:r[1],status:r[2],consent:r[3],message:r[4],whereFrom:r[5]}))}),
  beautyHubAttentionRemember_:(n,d,r)=>{props.set('attention',r.code||r.status);},
 };
 const c=vm.createContext(context);
 vm.runInContext(fs.readFileSync(base+'HubTestNakkaTransfer.gs','utf8'),c);
 c.beautyHubTransferHash_=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 c.beautyHubTransferFetch_=(url,authorization,payload)=>{
  assert.equal(authorization,'Basic '+Buffer.from('fixture:fixture').toString('base64'));
  if(payload){posts.push(JSON.parse(JSON.stringify(payload)));assert.equal(url,'tournament/entry/update');if(o.postFailure)throw Error('private');entries=entries.filter(e=>!payload.remove.includes(e.tpid));if(o.otherChanged)entries[0].index=7;return {result:0,removed:o.badReceipt?0:1,added:[],updated:0};}
  if(url.startsWith('tournament/get'))return {result:0,tournament:{...raw}};
  if(url.startsWith('league/entry/list'))return {list:o.duplicateLeague?[{name:'Test Player',lpid:'l001'},{name:'Test Player',lpid:'l003'}]:[{name:'Test Player',lpid:'l001'},{name:'Other',lpid:'l002'}]};
  if(url.startsWith('tournament/entry/list'))return {list:JSON.parse(JSON.stringify(entries))};
  throw Error('unexpected '+url);
 };
 vm.runInContext(fs.readFileSync(base+'HubTestRemove.gs','utf8').replace('BEAUTY_HUB_REMOVE_ENABLED_ = true','BEAUTY_HUB_REMOVE_ENABLED_ = '+(o.disabled?'false':'true')),c);
 const input={player:'Test Player',eventDate:date};
 return {c,input,values,posts,props,cache,raw,writes,preview:()=>c.beautyHubRemove_('preview',input),save:p=>c.beautyHubRemove_('save',{...input,ticket:p.ticket,confirmed:'true'}),get entries(){return entries;},get released(){return released;},expire:()=>authExpired=true};
}
test('removal preview is read-only and exposes exact event entry ID and league profile',()=>{const f=fixture(),p=f.preview();assert.equal(p.success,true);assert.equal(p.tpid,'t001');assert.equal(p.identity.lpid,'l001');assert.equal(f.posts.length,0);assert.equal(f.writes.length,0);assert.equal(f.released,1);});
test('removal targets exactly one Nakka event entry then clears only selected registration names and event metadata',()=>{const f=fixture(),before=JSON.stringify(f.values["PLAYER'S MASTER LIST"]),r=f.save(f.preview());assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);assert.deepEqual(f.posts,[{tdid:'t_QHaG_7792',remove:['t001']}]);assert.equal(f.entries[0].name,'Other');assert.equal(f.entries[0].index,2);assert.equal(f.values['Form responses 2'][1][1],'');assert.equal(f.values['Form responses 2'][1][3],'JA, JAG GODKÄNNER');assert.equal(f.values['PLAYER STATUS DATA'][1][0],'Test Player');assert.equal(f.values['PLAYER STATUS DATA'][1][1],'Old Name');assert.equal(JSON.stringify(f.values["PLAYER'S MASTER LIST"]),before);assert.equal(r.data.players.length,1);assert.equal(r.data.players[0].player,'Other');assert.equal(f.props.get('attention'),'REMOVED');assert.ok([...f.props.keys()].some(k=>k.startsWith('BEAUTY_NAKKA_REMOVED_ENTRY_')));});
test('removal permits OUT and STANDBY without treating either as IN',()=>{for(const status of ['OUT','STANDBY']){const f=fixture();f.values['PLAYER STATUS DATA'][1][2]=status;f.values["TONIGHT'S PLAYERS"][1][2]=status;const p=f.preview();assert.equal(p.statusInHub,status);assert.equal(f.save(p).success,true);}});
test('positively absent Nakka entry removes only the Hub registration with no provider POST',()=>{const f=fixture({absent:true}),p=f.preview();assert.equal(p.tpid,null);assert.equal(f.save(p).success,true);assert.equal(f.posts.length,0);});
test('wrong target, started tournament, bracket placement and ambiguous identities block before writes',()=>{for(const o of [{oldTitle:true},{live:true},{started:true},{bracket:true},{duplicateEntry:true},{duplicateLeague:true}]){const f=fixture(o),p=f.preview();assert.equal(p.success,false,JSON.stringify(o));assert.equal(f.posts.length,0);assert.equal(f.writes.length,0);}});
test('malformed removal, missing confirmation, extra fields and disabled gate reject without write',()=>{const f=fixture();for(const input of [{}, {...f.input,live:'yes'},{...f.input,eventDate:'bad'}])assert.equal(f.c.beautyHubRemove_('preview',input).success,false);assert.equal(f.c.beautyHubRemove_('save',{...f.input,ticket:'a'.repeat(32),confirmed:'false'}).code,'INVALID_REMOVE');assert.equal(fixture({disabled:true}).preview().code,'REMOVE_DISABLED');assert.equal(f.posts.length,0);});
test('busy lock and expired auth do not read or write provider state',()=>{assert.equal(fixture({busy:true}).preview().code,'REMOVE_BUSY');const f=fixture();f.expire();assert.equal(f.preview().code,'AUTH_REQUIRED');assert.equal(f.posts.length,0);assert.equal(f.released,1);});
test('stale snapshot, status, date and Nakka version invalidate confirmation and consume ticket',()=>{for(const mutate of [f=>f.values['PLAYER STATUS DATA'][1][2]='OUT',f=>f.raw.updateTime++,f=>f.values.Control[1][0]=new Date('2026-10-28T12:00:00Z')]){const f=fixture(),p=f.preview();mutate(f);assert.equal(f.save(p).success,false);assert.equal(f.save(p).code,'REMOVE_STALE');assert.equal(f.posts.length,0);}});
test('confirmation is bound to session and owner; expired or reused tickets cannot remove twice',()=>{const f=fixture(),p=f.preview();const key=[...f.cache.keys()][0],cached=JSON.parse(f.cache.get(key));cached.session='other';f.cache.set(key,JSON.stringify(cached));assert.equal(f.save(p).code,'REMOVE_STALE');assert.equal(f.posts.length,0);const g=fixture(),q=g.preview();assert.equal(g.save(q).success,true);assert.equal(g.save(q).code,'REMOVE_STALE');assert.equal(g.posts.length,1);});
test('Nakka timeout and wrong receipt retain registration, save uncertain journal, never retry and raise attention',()=>{for(const o of [{postFailure:true},{badReceipt:true},{otherChanged:true}]){const f=fixture(o),r=f.save(f.preview());assert.equal(r.code,'REMOVE_UNCERTAIN');assert.equal(f.values['Form responses 2'][1][1],'Test Player');assert.equal(f.posts.length,1);assert.equal(f.props.get('attention'),'REMOVE_UNCERTAIN');assert.equal(f.preview().code,'REMOVE_REVIEW');assert.equal(f.posts.length,1);assert.ok(r.backup);assert.ok(r.journal);}});
test('partial Sheet failure after verified Nakka removal remains uncertain with immutable recovery copy',()=>{const f=fixture({sheetFailure:true}),r=f.save(f.preview());assert.equal(r.code,'REMOVE_UNCERTAIN');assert.equal(f.entries.some(e=>e.tpid==='t001'),false);assert.ok(f.values[r.backup].length);assert.equal(f.props.get('attention'),'REMOVE_UNCERTAIN');assert.equal(f.preview().code,'REMOVE_REVIEW');});
test('removal numeric typography and standby orange override original grey theme',()=>{const css=fs.readFileSync('public/css/beauty-dashboard.css','utf8');assert.match(css,/status-standby \{ background:#d97900/);assert.match(css,/summary-card strong \{ font-family:'AIK Siffror'/);assert.match(css,/td:first-child \{ font-family:'AIK Siffror'/);const html=fs.readFileSync(base+'HubTest.html','utf8');assert.ok(html.includes(fs.readFileSync('public/assets/fonts/AIK-FONTS/AIKSiffror-Regular.woff2').toString('base64')));});

function ui(send){
 const events={},calls=[],updated=[];let active=true,generation=1,focused=0;
 class El{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.isConnected=false;this.disabled=false;}
  setAttribute(){} appendChild(e){this.children.push(e);e.parent=this;e.isConnected=this.isConnected;return e;}
  addEventListener(k,f){this.events[k]=f;} showModal(){this.isConnected=true;for(const e of this.children)e.isConnected=true;}
  close(){this.closed=true;} remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  focus(){focused++;}
 }
 const body=new El('body');body.isConnected=true;
 const doc={body,createElement:t=>new El(t),createTextNode:t=>({textContent:t}),addEventListener:(k,f)=>events[k]=f,dispatchEvent:event=>events[event.type]?.(event)};
 const c=vm.createContext({CustomEvent:class{constructor(type){this.type=type;}},URL,document:doc,window:{beautyHubData:{eventDate:'2026-10-27'}},BeautyHubServices:{endpoint:'https://beauty.invalid/hub?page=hubdata',request:async raw=>{const u=new URL(raw);calls.push(u);return {json:async()=>send(u)};}},BeautyHubAuth:{generation:()=>generation,isCurrent:g=>active&&g===generation},updateHub:d=>updated.push(d)});
 vm.runInContext(fs.readFileSync('public/js/hub-player-removal.js','utf8'),c);
 const preview={success:true,ticket:'a'.repeat(32),player:'Test Player',event:{title:'TEST',date:'2026-10-27'},identity:{lpid:'l001'},tpid:'t001',statusInHub:'IN'};
 return {c,body,calls,updated,preview,open:()=>c.window.BeautyPlayerRemoval.open({player:'Test Player'},new El('opener')),lock:()=>{active=false;generation++;events['beauty-hub-locked']();},get focused(){return focused;}};
}
test('removal dialog requires checkbox then sends one confirmed save and blocks close while saving',async()=>{
 let finish;const h=ui(u=>u.searchParams.get('page')==='removepreview'?h.preview:new Promise(resolve=>finish=resolve));
 await h.open();const panel=h.body.children[0],label=panel.children.find(e=>e.tag==='label'),check=label.children[0],save=panel.children.find(e=>e.textContent==='REMOVE FROM EVENT');
 assert.equal(save.disabled,true);check.checked=true;check.events.change();assert.equal(save.disabled,false);
 const pending=save.events.click();await save.events.click();assert.equal(h.calls.length,2);assert.equal(h.calls[1].searchParams.get('confirmed'),'true');assert.equal(h.calls[1].searchParams.get('eventDate'),'2026-10-27');
 panel.events.cancel({preventDefault(){}});assert.equal(panel.closed,undefined);assert.equal(save.disabled,true);
 finish({success:true,readbackVerified:true,data:{players:[]},journal:'reference',backup:'recovery'});await pending;assert.equal(h.updated.length,1);assert.equal(panel.children.some(e=>e.textContent==='REMOVE FROM EVENT'),false);assert.equal(panel.children[0].disabled,false);
});
test('late preview after sign-out cannot restore a confirmation or a player name',async()=>{
 let finish;const h=ui(()=>new Promise(resolve=>finish=resolve)),pending=h.open();for(let i=0;i<8&&!finish;i++)await Promise.resolve();h.lock();finish(h.preview);await pending;assert.equal(h.body.children.length,0);assert.equal(h.calls.length,1);assert.equal(h.updated.length,0);
});
test('uncertain removal discards confirm button and never resends a save',async()=>{
 const h=ui(u=>u.searchParams.get('page')==='removepreview'?h.preview:Promise.reject(Error('network')));await h.open();const panel=h.body.children[0],check=panel.children.find(e=>e.tag==='label').children[0],save=panel.children.find(e=>e.textContent==='REMOVE FROM EVENT');check.checked=true;check.events.change();await save.events.click();assert.equal(h.calls.length,2);assert.equal(h.updated.length,0);assert.equal(panel.children.some(e=>e.textContent==='REMOVE FROM EVENT'),false);assert.ok(panel.children.some(e=>e.textContent?.includes('Do not repeat')));
});

test('Removal preview reuses the validated Sheet snapshot instead of rereading the Hub and master list',()=>{
 const f=fixture();let reads=0;f.c.getBeautyHubData_=()=>{reads++;throw Error('redundant full read');};const p=f.preview();assert.equal(p.success,true);assert.equal(p.statusInHub,'IN');assert.equal(reads,0);assert.equal(f.posts.length,0);assert(p.timing.steps.some(s=>s.stage==='sheet-snapshot'));
});

test('Confirmed absent entry can finish guarded Hub removal with absence proof preserving its earlier transfer',()=>{
 const f=fixture({absent:true}),p=f.preview(),key='BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_l001';
 const prior=JSON.stringify({state:'ENTRY_VERIFIED_LINK_UNEXPOSED',event:p.event,identity:p.identity,tpid:'t001'});
 f.props.set(key,prior);const r=f.save(p);assert.equal(r.success,true);assert.equal(f.posts.length,0);assert.equal(f.props.get(key),prior);
 const proof=JSON.parse(f.props.get('BEAUTY_NAKKA_REMOVED_ENTRY_t_QHaG_7792_t001'));
 assert.equal(proof.basis,'ENTRY_ALREADY_ABSENT_AND_VERIFIED');assert.equal(proof.priorTransfer,prior);assert.equal(proof.journal,r.journal);
});
test('Absent-entry removal proof cannot bless uncertain mismatched historical transfers',()=>{
 for(const change of [r=>r.state='ATTEMPTED',r=>r.event.date='2026-10-28',r=>r.identity.lpid='x123',r=>r.tpid='bad']){
  const f=fixture({absent:true}),p=f.preview(),r={state:'VERIFIED',event:JSON.parse(JSON.stringify(p.event)),identity:JSON.parse(JSON.stringify(p.identity)),tpid:'t001'};change(r);
  const prior=JSON.stringify(r);f.props.set('BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_l001',prior);assert.equal(f.save(p).success,true);
  assert.equal([...f.props.keys()].some(k=>k.startsWith('BEAUTY_NAKKA_REMOVED_ENTRY_')),false);assert.equal(f.posts.length,0);
 }
});
test('Removing a reviewed replacement preserves proof for both its current ID and the original confirmed transfer',()=>{
 const f=fixture(),p=f.preview(),key='BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_l001';
 const prior=JSON.stringify({state:'VERIFIED',event:p.event,identity:p.identity,tpid:'z001'});f.props.set(key,prior);
 const review={kind:'STAFF_REVIEWED_CURRENT_ENTRY',journalHash:f.c.beautyHubTransferHash_(prior),event:p.event,identity:p.identity,tpid:p.tpid,uid:'owner',reviewedUTC:'2026-10-27T12:00:00Z',auditKey:'BEAUTY_NAKKA_REVIEW_HISTORY_'+'a'.repeat(32)};
 const text=JSON.stringify(review);f.props.set('BEAUTY_NAKKA_REVIEW_t_QHaG_7792_l001',text);f.props.set(review.auditKey,text);
 assert.equal(f.save(p).success,true);assert.equal(f.posts.length,1);assert.equal(f.props.get(key),prior);
 const proof=JSON.parse(f.props.get('BEAUTY_NAKKA_REMOVED_ENTRY_t_QHaG_7792_z001'));
 assert.equal(proof.basis,'REVIEWED_REPLACEMENT_REMOVED_AND_ORIGINAL_ABSENT');assert.equal(proof.removedEntryId,'t001');assert.equal(proof.priorTransfer,prior);
 assert.ok(f.props.get('BEAUTY_NAKKA_REMOVED_ENTRY_t_QHaG_7792_t001'));
});
