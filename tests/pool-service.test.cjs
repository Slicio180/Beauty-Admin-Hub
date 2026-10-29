const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const root='apps-script/registration-identity-test/remote-app/';
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(options={}){
 let now=Date.parse('2026-10-28T22:00:00Z'),serial=0;const calls=[],values=new Map(),cache=new Map(),audits=[];
 const profiles=Array.from({length:8},(_,i)=>({lpid:'L'+String(i).padStart(3,'0'),name:'Player '+i}));
 const players=profiles.map((p,i)=>({player:p.name,newPlayer:'',status:i<6?'IN':i===6?'OUT':'STANDBY'}));
 const stats=Object.fromEntries(profiles.map((p,i)=>[p.lpid,{score:5000+i*300,darts:300,a:0,acnt:0,pt:3}]));
 const ranking=Object.fromEntries(profiles.map(p=>[p.lpid,{t_a:{pt:1},t_b:{pt:2}}]));
 let event={tdid:'t_RqC2_2034',lgid:'lg_tM2v_3523',title:'Beauty Hub TEST — DO NOT USE LIVE',status:20,t_date:1793124000,updateTime:100,league:1,team_games:0,
 lg_setting:{auto_schedule:1,league:1,robin_count:7,robin_player_count:4,turnaround:0,include_leg:0,include_set:0,include_set_leg:0,limit:1,low_win:0,limit_leg_count:2,drawMode:0,limit_set_count:2,limit_set_leg_count:2,startScore:501,match_type:'01',limit_rounds:0,overkill:0,rounds:15,changeFirst:0,exitResult:0,autoNext:1,setOrder:0,schedule:[],point_w:2,point_d:1,point_l:0,priority_win:0,exclude_from_stats:0,game_setting:[],pt_setting:[]},
 lg_table:[],lg_result:[],lg_rank:[],t_order:{preserved:true},badge:{},entry_list:profiles.map((p,i)=>({tpid:'E'+String(i).padStart(3,'0'),name:p.name,index:i,c:'SE'}))};
 let schedule=[];
 const props={getProperty:k=>values.has(k)?values.get(k):null,setProperty(k,v){values.set(k,v);},deleteProperty:k=>values.delete(k)};
 const account={uid:'staff',sessionBinding:'session'};
 const context=vm.createContext({console,Set,Map,Date:class extends Date{constructor(...args){super(...args.length?args:[now]);}static now(){return now;}},
  BEAUTY_IDENTITY_WRITES_ENABLED_:true,SHEET_ID:'test-sheet',beautyHubRequestToken_:'token',
  beautyHubTestGuard_(){if(options.guard)throw Error('guard');},beautyHubAuthRequire_(){if(options.auth)throw Error('auth');return account;},
  beautyHubTransferHash_:v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('base64url'),
  Utilities:{base64Encode:s=>Buffer.from(s).toString('base64'),getUuid:()=> (++serial).toString(16).padStart(8,'0')+'0'.repeat(24),formatDate:()=> '2026-10-27'},
  PropertiesService:{getScriptProperties:()=>props},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock:()=>!options.busy,releaseLock(){}})},
  getBeautyHubData_:()=>({success:true,eventDate:options.date||'2026-10-27',players:copy(players)}),beautyHubNakkaDate_:()=>({date:options.date||'2026-10-27'}),
  SpreadsheetApp:{openById:()=>({getId:()=> 'test-sheet',insertSheet(name){const rows=[];audits.push({name,rows});return {getRange:()=>({setValues(v){rows.push(...copy(v));},getValues:()=>copy(rows)})};}}),flush(){}},
  beautyHubTransferEntries_({list}){if(!Array.isArray(list))throw Error('entries');return list.map(p=>({tpid:p.tpid,name:p.name,lpid:p.lpid||''})).sort((a,b)=>a.tpid.localeCompare(b.tpid));},
  beautyHubTransferFetch_(path,auth,payload){
   calls.push({path,payload:copy(payload||null)});if(options.fail?.(path,payload,calls))throw Error('PRIVATE provider credentials');
   if(path.startsWith('league/entry/list?')){const u=new URL('https://x/'+path);return {list:copy(profiles.slice(Number(u.searchParams.get('skip')),Number(u.searchParams.get('skip'))+100))};}
   if(path.startsWith('league/get?'))return {league:{lgid:'lg_tM2v_3523',title:'AIK MÅNDAGSDARTARNA 2026/2027'}};
   if(path.includes('kind=stats_list'))return {stats:copy(stats)};
   if(path.includes('kind=rank_list'))return {stats:copy(ranking)};
   if(path.startsWith('tournament/get?'))return {tournament:copy(event)};
   if(path.startsWith('league/schedule/get?'))return {tdid:event.tdid,swiss:0,schedule:copy(schedule)};
   if(path==='tournament/update'){
    assert.equal(payload.expect_update_time,event.updateTime);assert.equal(payload.tdid,'t_RqC2_2034');event={...event,...copy(payload.set),updateTime:event.updateTime+1};options.afterGroups?.(event);return {result:0};
   }
   if(path==='league/schedule/generate'){
    assert.deepEqual(copy(payload),{tdid:'t_RqC2_2034',mode:'robin'});schedule=event.lg_table.map(g=>{const p=g.filter(Boolean),cards=[];for(let a=0;a<p.length;a++)for(let b=a+1;b<p.length;b++)cards.push({p:[p[a],p[b]],lsid:cards.length.toString(36).padStart(4,'0'),t:''});return cards;});options.afterCards?.(event,schedule);return {result:0};
   }
   throw Error('Unexpected path '+path);
  }});
 values.set('N01_API_USER','test');values.set('N01_API_PASSWORD','test');
 vm.runInContext(fs.readFileSync(root+'HubTestPools.gs','utf8'),context);
 const call=(action,input)=>copy(context.beautyHubPool_(action,input));
 const load=()=>call('poolload',{refresh:'true'});
 const draw=()=>{const l=load();assert.equal(l.success,true,JSON.stringify(l));return call('pooldraw',{bindings:JSON.stringify(l.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:'[3,3]'});};
 const prepare=()=>{const d=draw();assert.equal(d.success,true,JSON.stringify(d));const p=call('poolprepare',{ticket:d.ticket});assert.equal(p.success,true,JSON.stringify(p));return {d,p};};
 return {context,call,load,draw,prepare,calls,values,cache,audits,profiles,players,stats,ranking,options,account,get event(){return event;},get schedule(){return schedule;},advance:ms=>now+=ms,setSchedule:v=>schedule=v};
}
test('pool stats qualify score/darts keyed by LPID; points stay separate and unknown is not zero',()=>{
 const f=fixture();f.stats.L000.score=0;f.stats.L001.darts=0;f.stats.L002.acnt=1;f.ranking['']={irrelevant:{pt:99}};
 const r=f.load();assert.equal(r.success,true);assert.equal(r.stats.profiles[0].average,0);assert.equal(r.stats.profiles[0].points,3);assert.equal(r.stats.profiles[1].average,null);assert.equal(r.stats.profiles[2].average,null);assert.match(r.stats.profiles[2].reason,/Manual/);assert.equal(r.mappings.length,6);assert.ok(f.calls.every(c=>!c.payload));
});
test('pool stats retain durable last-good on outage and block fresh draw after refresh failure',()=>{
 const f=fixture();const first=f.load();f.advance(60001);f.options.fail=path=>path.includes('stats_list');const r=f.load();assert.equal(r.stats.fresh,false);assert.deepEqual(r.stats.profiles,first.stats.profiles);assert.equal(f.context.beautyPoolStats_('auth',false).fresh,false);
 f.advance(60001);f.options.fail=null;assert.equal(f.load().stats.fresh,true);assert.ok([...f.values.keys()].filter(k=>/^BEAUTY_LEAGUE_STATS_[a-f0-9]/.test(k)).length<20);
});
test('pool stats reject inconsistent points and invalid numeric totals without replacing last-good',()=>{
 for(const change of [f=>f.stats.L000.darts='300',f=>f.stats.L000.score=-1,f=>f.ranking.L000.t_b.pt=99]){const f=fixture();f.load();f.advance(60001);change(f);assert.equal(f.load().stats.fresh,false);}
});
test('pool league profiles paginate and reject repeated IDs or a truncated over-limit list',()=>{
 const f=fixture();for(let i=8;i<201;i++)f.profiles.push({lpid:i.toString(36).padStart(4,'0'),name:'Extra '+i});
 assert.equal(f.context.beautyPoolProfiles_('auth').length,201);assert.equal(f.calls.length,3);
 f.profiles[100].lpid=f.profiles[0].lpid;assert.throws(()=>f.context.beautyPoolProfiles_('auth'),/Ambiguous/);
});
test('pool mappings expose ambiguity and missing entry without silently choosing a league identity',()=>{
 const f=fixture();f.profiles.push({lpid:'dupe',name:'Player 0'});f.event.entry_list.splice(1,1);const r=f.load();assert.equal(r.mappings[0].lpid,'');assert.equal(r.mappings[0].average,null);assert.equal(r.mappings[0].leagueCandidates.length,2);assert.equal(r.mappings[1].tpid,'');assert.equal(r.mappings[0].linkExposed,false);
 const d=f.call('pooldraw',{bindings:JSON.stringify(r.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:'[3,3]'});assert.equal(d.success,true);assert.equal(d.draw.roster.length,6);
 const p=f.call('poolprepare',{ticket:d.ticket});assert.equal(p.success,false);assert.match(p.error,/Every IN player/);assert.equal(f.calls.filter(c=>c.payload).length,0);
});
test('pool handoff verifies all groups and cards, preserves settings and inactive entries, and blocks duplicate send',()=>{
 const f=fixture(),before=copy(f.event),{d,p}=f.prepare();assert.equal(p.expectedCards,6);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.audits.length,0);
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);assert.equal(f.audits.length,2);assert.equal(f.calls.filter(c=>c.payload).length,2);assert.deepEqual(f.event.entry_list,before.entry_list);assert.equal(f.event.status,20);assert.equal(f.event.lg_setting.startScore,501);assert.equal(f.event.lg_setting.limit_leg_count,2);assert.deepEqual(f.event.t_order,before.t_order);assert.equal(f.event.lg_setting.robin_count,2);assert.equal(f.event.lg_setting.robin_player_count,3);assert.equal(f.schedule.flat().length,6);assert.equal(f.event.lg_table.flat().length,6);
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.call('poolprepare',{ticket:d.ticket}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,2);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_RqC2_2034')).state,'VERIFIED');
});
test('pool manual swap is server-owned, consumes old ticket, preserves frozen averages and invalidates approval',()=>{
 const f=fixture(),{d,p}=f.prepare(),a=d.draw.pools[0].players[0],b=d.draw.pools[1].players[0];
 const r=f.call('pooladjust',{ticket:p.ticket,change:JSON.stringify({playerId:a.id,targetPool:1,swapWith:b.id})});assert.equal(r.success,true);assert.equal(r.draw.frozenAt,d.draw.frozenAt);assert.equal(r.draw.manualChanges.length,1);assert.equal(f.call('poolsave',{ticket:r.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
});
test('pool source additions withdrawals renames and date changes invalidate a reviewed draw',()=>{
 for(const change of [f=>f.players[0].status='OUT',f=>f.players[6].status='IN',f=>f.players[0].player='Changed',f=>f.options.date='2026-10-28']){const f=fixture(),d=f.draw();change(f);const r=f.call('poolprepare',{ticket:d.ticket});assert.equal(r.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);}
});
test('pool tickets expire and are bound to staff session; unconfirmed sends never mutate',()=>{
 for(const change of [f=>f.advance(300001),f=>f.account.uid='other',f=>f.account.sessionBinding='other']){const f=fixture(),{p}=f.prepare();change(f);assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);}
 const f=fixture(),{p}=f.prepare();assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'false'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
});
test('pool existing groups results cards started events and unsupported formats block handoff',()=>{
 for(const change of [f=>f.event.lg_table=[['E000']],f=>f.event.lg_result=[1],f=>f.setSchedule([[{p:['E000','E001']}]]),f=>f.event.status=30,f=>f.event.lg_setting.turnaround=1,f=>f.event.league=0]){const f=fixture(),d=f.draw();change(f);const r=f.call('poolprepare',{ticket:d.ticket});assert.equal(r.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);}
});
test('pool event concurrency or league identity changes after approval block every provider write',()=>{
 for(const change of [f=>f.event.updateTime++,f=>f.event.entry_list.pop(),f=>f.event.lg_setting.startScore=301,f=>f.profiles[0].name='Renamed']){const f=fixture(),{p}=f.prepare();change(f);assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);}
});
test('pool failures in either provider phase retain attempted journal and block retry without leaking errors',()=>{
 for(const phase of ['tournament/update','league/schedule/generate']){const f=fixture(),{p}=f.prepare();f.options.fail=(path,payload)=>!!payload&&path===phase;const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.doesNotMatch(r.error,/PRIVATE/);assert.match(r.error,/Do not retry/);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_RqC2_2034')).state,'ATTEMPTED');const count=f.calls.filter(c=>c.payload).length;assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,count);assert.equal(f.audits.length,1);}
});
test('pool unexpected setting changes or missing duplicate foreign pairings fail full readback',()=>{
 for(const mutation of [(t,s)=>s[0].pop(),(t,s)=>s[0][1]=s[0][0],(t,s)=>s[0][0].p[0]='E007',(t,s)=>t.lg_setting.limit_leg_count=3,(t,s)=>t.entry_list.pop()]){const f=fixture(),{p}=f.prepare();f.options.afterCards=mutation;const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_RqC2_2034')).state,'ATTEMPTED');}
});
test('pool audit failure occurs before Nakka mutation and cannot report successful send',()=>{
 const f=fixture(),{p}=f.prepare();f.context.beautyPoolAudit_=()=>{throw Error('audit unavailable');};const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.values.has('BEAUTY_POOL_SEND_t_RqC2_2034'),false);
});
test('pool structural comparison ignores JSON object order while preserving array order',()=>{
 const f=fixture();assert.equal(f.context.beautyPoolEqual_({a:1,b:2},{b:2,a:1}),true);assert.equal(f.context.beautyPoolEqual_([1,2],[2,1]),false);
});
test('pool routes require exact inputs, staff authentication and the write gate',()=>{
 const f=fixture();assert.equal(f.call('poolload',{refresh:'true',url:'x'}).success,false);f.options.auth=true;assert.equal(f.load().success,false);assert.equal(f.calls.length,0);
 const g=fixture(),{p}=g.prepare();g.context.BEAUTY_IDENTITY_WRITES_ENABLED_=false;assert.equal(g.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(g.calls.filter(c=>c.payload).length,0);
});
test('pool five-player exception and mixed 4/3 divisions generate the exact rectangular table and pair coverage',()=>{
 for(const [n,sizes]of [[5,[5]],[7,[4,3]],[8,[4,4]]]){
  const f=fixture();f.players.forEach((p,i)=>p.status=i<n?'IN':'OUT');const l=f.load();const d=f.call('pooldraw',{bindings:JSON.stringify(l.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:JSON.stringify(sizes)});assert.equal(d.success,true);
  const p=f.call('poolprepare',{ticket:d.ticket});assert.equal(p.success,true);f.options.afterCards=(event,cards)=>cards.flat().forEach(c=>c.r=1);
  const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.ok(f.event.lg_table.every(g=>g.length===Math.max(...sizes)));assert.equal(f.event.lg_table.flat().filter(Boolean).length,n);assert.equal(f.schedule.flat().length,sizes.reduce((s,n)=>s+n*(n-1)/2,0));
 }
});
test('pool event started between group save and fixture generation blocks the second mutation and records uncertainty',()=>{
 const f=fixture(),{p}=f.prepare();f.options.afterGroups=event=>event.status=30;const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.uncertain,true);assert.equal(f.calls.filter(c=>c.payload).length,1);assert.equal(f.schedule.length,0);
});
test('pool bracket-building status25 permits statistics and frozen preview without a provider mutation',()=>{
 const f=fixture();f.event.status=25;f.event.lg_setting.auto_schedule=true;
 const d=f.draw();assert.equal(d.success,true,JSON.stringify(d));assert.equal(d.draw.roster.length,6);
 const p=f.call('poolprepare',{ticket:d.ticket});assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.event.status,25);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.audits.length,0);
});
test('pool status25 approved handoff retains bracket-building state and boolean auto_schedule through full readback',()=>{
 const f=fixture();f.event.status=25;f.event.lg_setting.auto_schedule=true;const before=copy(f.event),{p}=f.prepare();
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);assert.equal(f.event.status,25);assert.equal(f.event.lg_setting.auto_schedule,true);assert.deepEqual(f.event.entry_list,before.entry_list);
 const posts=f.calls.filter(c=>c.payload);assert.equal(posts.length,2);assert.equal(Object.hasOwn(posts[0].payload.set,'status'),false);assert.equal(f.schedule.flat().length,6);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_RqC2_2034')).state,'VERIFIED');
});
test('pool status25 still refuses existing groups brackets results ranks and match cards before every provider write',()=>{
 for(const change of [f=>f.event.lg_table=[['E000']],f=>f.event.t_table=[['E000']],f=>f.event.lg_result=[1],f=>f.event.lg_rank=[1],f=>f.setSchedule([[{p:['E000','E001'],lsid:'ab01',t:''}]])]){
  const f=fixture();f.event.status=25;change(f);const d=f.draw();assert.equal(d.success,true);const p=f.call('poolprepare',{ticket:d.ticket});assert.equal(p.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.audits.length,0);
 }
});
test('pool active finished unknown and string states cannot load or prepare despite status25 support',()=>{
 for(const status of [30,40,0,26,'25']){const f=fixture();f.event.status=status;assert.equal(f.load().success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);}
 const f=fixture();f.event.status=25;const {p}=f.prepare();f.event.status=30;assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
});
