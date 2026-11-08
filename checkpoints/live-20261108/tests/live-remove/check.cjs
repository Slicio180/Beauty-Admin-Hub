const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('live-remove/LiveRemove.gs','utf8');
const formula=JSON.parse(source.match(/const expected=("[^\n]+);/)[1]);
function fixture(o={}){
 const stamp=new Date('2026-11-08T00:27:11Z'),eventDate=new Date('2026-11-09T00:00:00Z'),reset=new Date('2026-11-07T22:39:00Z'),oldStamp=new Date('2026-11-02T18:00:00Z'),date='2026-11-09';
 const writes=[],posts=[],props=new Map(),cache=new Map(),blank=(n,w)=>Array.from({length:n},()=>Array(w).fill(''));
 const values={Control:[['START DATE','LAST RESET'],[eventDate,reset]],'PLAYER STATUS DATA':[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Test Player','Old Name','IN','JA','message','HUB'],['Other','','OUT','NEJ','other','MOBIL']],"PLAYER'S MASTER LIST":[['PLAYERS'],['Test Player'],['Other']],'Form responses 2':[['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM'],[stamp,'Test Player','','JA, JAG GODKÄNNER','message','HUB'],[stamp,'Other','','NEJ, JAG GODKÄNNER INTE','other','MOBIL'],[oldStamp,'Test Player','','JA, JAG GODKÄNNER','historical','MOBIL']],"TONIGHT'S PLAYERS":[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Test Player','','IN','JA','message','HUB'],['Other','','OUT','NEJ','other','MOBIL'],...blank(997,6)]};
 let entries=[{tpid:'t001',name:'Test Player',lpid:'l001',index:1},{tpid:'t002',name:'Other',lpid:'l002',index:2}],authExpired=false;
 const league=[{name:'Test Player',lpid:'l001'},{name:'Other',lpid:'l002'}];
 if(o.absent)entries=entries.slice(1);if(o.duplicateEntry)entries.push({tpid:'t003',name:'Test Player'});if(o.duplicateLeague)league.push({name:'Test Player',lpid:'l003'});
 if(o.hiddenLink)entries.forEach(r=>delete r.lpid);
 if(o.duplicateResponse)values['Form responses 2'].push(values['Form responses 2'][1].slice());
 if(o.numericTimestamp)values['Form responses 2'][1][0]=(stamp-Date.UTC(1899,11,30))/86400000;
 const raw={tdid:'t_UsRG_9574',lgid:'lg_tM2v_3523',title:'AIK MÅNDAGSDARTARNA 2026-11-09',status:20,t_date:eventDate.getTime()/1000,updateTime:1};
 if(o.wrongEvent)raw.tdid='wrong';if(o.started)raw.status=30;if(o.bracket)raw.rr_table=[['t001','t002']];
 const sheets={},forms={};for(const [name,v] of Object.entries(values))forms[name]=blank(v.length,v[0].length);forms["TONIGHT'S PLAYERS"][1][0]=o.wrongFormula?'=BAD':formula;
 if(o.formulaSource)forms['PLAYER STATUS DATA'][1][2]='=BAD';
 const serial=v=>typeof v==='number'?v:(v-Date.UTC(1899,11,30))/86400000;
 function range(name,r,c,h=1,w=1){return {
  getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>values[name]?.[r-1+i]?.[c-1+j]??'')),
  clearContent:()=>{writes.push([name,r,c,h,w]);if(o.sheetFailure)throw Error('failure');for(let i=0;i<h;i++)for(let j=0;j<w;j++)values[name][r-1+i][c-1+j]='';},
  setValues:rows=>{writes.push([name,r,c,h,w]);for(let i=0;i<h;i++){values[name][r-1+i]??=[];for(let j=0;j<w;j++)values[name][r-1+i][c-1+j]=rows[i][j];}},
  getDisplayValues:()=>range(name,r,c,h,w).getValues().map(row=>row.map(v=>v instanceof Date?v.toISOString():String(v))),
  getFormulas:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>forms[name]?.[r-1+i]?.[c-1+j]||'')),getNumberFormats:()=>blank(h,w),
 };}
 for(const name of Object.keys(values))sheets[name]={getRange:(...args)=>range(name,...args),getLastRow:()=>values[name].length,getLastColumn:()=>values[name][0].length,getMaxRows:()=>values[name].length,getSheetId:()=>name};
 function flush(){
  const names=values['Form responses 2'].slice(1).filter(r=>serial(r[0])>=serial(values.Control[1][1])&&serial(r[0])<serial(values.Control[1][0])+1).map(r=>r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1]).filter(Boolean);
  const rows=[...new Set(names)].map(name=>{const s=values['PLAYER STATUS DATA'].find(r=>r[0]===name);return [name,'',s?.[2]||'',s?.[3]||'',s?.[4]||'',s?.[5]||''];});
  values["TONIGHT'S PLAYERS"]=[values["TONIGHT'S PLAYERS"][0],...rows,...blank(999-rows.length,6)];
 }
 const ss={getId:()=> 'sheet',getSpreadsheetLocale:()=> 'en_GB',getSpreadsheetTimeZone:()=> 'Africa/Ceuta',getSheetByName:n=>sheets[n],insertSheet:name=>{values[name]=[];return {getRange:(...args)=>range(name,...args)};}};
 const c=vm.createContext({console,Date,Set,Map,BEAUTY_LIVE_TARGET_:{sheetId:'sheet',eventId:'t_UsRG_9574',leagueId:'lg_tM2v_3523',date},
  beautyLiveLoginGuard_:()=>{if(o.wrongProject)throw Error('wrong project');},beautyHubAuthRequire_:token=>{if(authExpired||token!=='session'){const e=Error('auth');e.name='HubAuthError';throw e;}return {uid:'owner',sessionBinding:'session'};},
  SpreadsheetApp:{openById:id=>{assert.equal(id,'sheet');return ss;},flush},LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock:()=>{}})},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  Utilities:{formatDate:(d,z,f)=>f==='yyyy-MM-dd'?d.toISOString().slice(0,10):f.includes('HH:mm:ss.SSS')?d.toISOString().slice(0,-1):'20261108-004000',getUuid:()=> 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',sleep(){},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(alg,v)=>[...crypto.createHash(alg).update(v).digest()]},
  beautyLiveRegistrationKey_:v=>String(v||'').normalize('NFC').trim().toLowerCase(),beautyLiveEventRead_:()=>({status:'MATCHED',event:{id:'t_UsRG_9574'},eventDate:date}),
  beautyLiveDashboardRead_:()=>({success:true,eventDate:date,players:values["TONIGHT'S PLAYERS"].slice(1).filter(r=>r[0]||r[1]).map(r=>({player:r[0],newPlayer:r[1],status:r[2],consent:r[3],message:r[4],whereFrom:r[5]}))}),
 });
 c.beautyLiveRegistrationApi_=(path,payload)=>{
  if(payload){posts.push(JSON.parse(JSON.stringify(payload)));assert.equal(path,'tournament/entry/update');entries=entries.filter(e=>!payload.remove.includes(e.tpid));if(o.postFailure)throw Error('network after commit');if(o.otherChanged)entries[0].index=7;if(o.concurrentSheet)values['PLAYER STATUS DATA'][2][4]='changed by mobile';return {result:0,removed:o.badReceipt?0:1,added:[],updated:0};}
  if(path.startsWith('tournament/get'))return {result:0,tournament:{...raw}};
  if(path.startsWith('league/entry/list'))return {result:0,list:JSON.parse(JSON.stringify(league))};
  if(path.startsWith('tournament/entry/list'))return {result:0,list:JSON.parse(JSON.stringify(entries))};throw Error('unexpected '+path);
 };
 vm.runInContext(source,c);
 const input={player:'Test Player',eventDate:date};
 return {c,input,values,posts,props,cache,raw,writes,league,preview:()=>c.beautyLiveRemove_('preview',input,'session'),save:p=>c.beautyLiveRemove_('save',{...input,ticket:p.ticket,confirmed:'true'},'session'),get entries(){return entries;},expire:()=>authExpired=true};
}
test('preview uses live reset window: advance registration identified; no writes',()=>{const f=fixture(),p=f.preview();assert.equal(p.success,true,JSON.stringify(p));assert.equal(p.tpid,'t001');assert.equal(p.identity.lpid,'l001');assert.equal(f.posts.length,0);assert.equal(f.writes.length,0);});
test('remove exact entry, preserve league, master, OLD NAME and older response',()=>{const f=fixture(),before=JSON.stringify(f.values["PLAYER'S MASTER LIST"]),old=JSON.stringify(f.values['Form responses 2'][3]),league=JSON.stringify(f.league),r=f.save(f.preview());assert.equal(r.success,true,JSON.stringify(r));assert.deepEqual(f.posts,[{tdid:'t_UsRG_9574',remove:['t001']}]);assert.equal(f.entries[0].name,'Other');assert.equal(f.values['Form responses 2'][1][1],'');assert.equal(f.values['Form responses 2'][1][3],'JA, JAG GODKÄNNER');assert.equal(f.values['PLAYER STATUS DATA'][1][1],'Old Name');assert.equal(JSON.stringify(f.values["PLAYER'S MASTER LIST"]),before);assert.equal(JSON.stringify(f.values['Form responses 2'][3]),old);assert.equal(JSON.stringify(f.league),league);assert.equal(r.data.players.length,1);assert.ok(f.values[r.backup].length);assert.ok(!f.props.has('BEAUTY_LIVE_REMOVE_PENDING'));assert.equal(JSON.parse(f.props.get('BEAUTY_LIVE_REMOVE_LAST')).state,'VERIFIED');});
for(const status of ['OUT','STANDBY'])test('removes '+status+' without changing other players',()=>{const f=fixture();f.values['PLAYER STATUS DATA'][1][2]=status;f.values["TONIGHT'S PLAYERS"][1][2]=status;assert.equal(f.save(f.preview()).success,true);assert.equal(f.values['PLAYER STATUS DATA'][2][2],'OUT');});
test('numeric response timestamp selects same reset window',()=>{const f=fixture({numericTimestamp:true});assert.equal(f.save(f.preview()).success,true);});
test('hidden league link still permits exact reviewed tpid',()=>{const f=fixture({hiddenLink:true});assert.equal(f.save(f.preview()).success,true);});
test('already absent event entry: sheet-only cleanup, no Nakka mutation',()=>{const f=fixture({absent:true}),p=f.preview();assert.equal(p.tpid,null);assert.equal(f.save(p).success,true);assert.equal(f.posts.length,0);});
for(const options of [{wrongEvent:true},{started:true},{bracket:true},{duplicateEntry:true},{duplicateLeague:true},{duplicateResponse:true},{wrongFormula:true},{formulaSource:true}])test('blocks before writes '+JSON.stringify(options),()=>{const f=fixture(options);assert.equal(f.preview().success,false);assert.equal(f.posts.length,0);assert.equal(f.writes.length,0);});
test('authentication, malformed input and missing confirmation block',()=>{const f=fixture();assert.equal(f.c.beautyLiveRemove_('preview',f.input,'wrong').code,'AUTH_REQUIRED');for(const input of [{},{...f.input,extra:'x'},{...f.input,eventDate:'2026-11-16'}])assert.equal(f.c.beautyLiveRemove_('preview',input,'session').success,false);assert.equal(f.c.beautyLiveRemove_('save',{...f.input,ticket:'a'.repeat(32),confirmed:'false'},'session').code,'INVALID_REMOVE');assert.equal(f.writes.length,0);});
test('busy and pending registration/status/removal block',()=>{assert.equal(fixture({busy:true}).preview().code,'REMOVE_BUSY');for(const key of ['BEAUTY_LIVE_STATUS_PENDING','BEAUTY_LIVE_REGISTRATION_PENDING','BEAUTY_LIVE_REMOVE_PENDING']){const f=fixture();f.props.set(key,'{}');assert.equal(f.preview().code,'REMOVE_REVIEW');assert.equal(f.writes.length,0);}});
test('changing sheet/event after preview consumes ticket with no removal',()=>{for(const mutate of [f=>f.values['PLAYER STATUS DATA'][1][2]='OUT',f=>f.raw.updateTime++,f=>f.values.Control[1][1]=new Date('2026-11-08T23:00:00Z')]){const f=fixture(),p=f.preview();mutate(f);assert.equal(f.save(p).success,false);assert.equal(f.save(p).code,'REMOVE_STALE');assert.equal(f.posts.length,0);}});
test('ticket bound to session, expiry, confirmation; cannot reuse',()=>{for(const mutate of [r=>r.session='other',r=>r.uid='other',r=>r.expires=0]){const f=fixture(),p=f.preview(),key=[...f.cache.keys()][0],r=JSON.parse(f.cache.get(key));mutate(r);f.cache.set(key,JSON.stringify(r));assert.equal(f.save(p).code,'REMOVE_STALE');assert.equal(f.posts.length,0);}const f=fixture(),p=f.preview();assert.equal(f.save(p).success,true);assert.equal(f.save(p).code,'REMOVE_STALE');assert.equal(f.posts.length,1);});
for(const options of [{postFailure:true},{badReceipt:true},{otherChanged:true},{concurrentSheet:true},{sheetFailure:true}])test('uncertain save leaves backup and blocks retries '+JSON.stringify(options),()=>{const f=fixture(options),r=f.save(f.preview());assert.equal(r.code,'REMOVE_UNCERTAIN');assert.ok(f.values[r.backup].length);assert.ok(f.props.has('BEAUTY_LIVE_REMOVE_PENDING'));assert.equal(f.preview().code,'REMOVE_REVIEW');assert.equal(f.posts.length,1);assert.equal(f.values['Form responses 2'][1][1],'Test Player');});
test('no league deletion route is accepted',()=>{const f=fixture();assert.throws(()=>f.c.beautyLiveRemoveFetch_('league/entry/update',null,{lgid:'lg_tM2v_3523',remove:['l001']}),/TARGET/);assert.equal(f.posts.length,0);});
test('all server and browser scripts parse',()=>{for(const f of JSON.parse(fs.readFileSync('live-remove/prepared.json')).files){if(f.type==='SERVER_JS')new vm.Script(f.source);if(f.type==='HTML')for(const block of f.source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(block[1]);}});
module.exports={fixture};
