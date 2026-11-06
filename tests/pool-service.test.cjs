const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const root='apps-script/registration-identity-test/remote-app/';
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(options={}){
 let now=Date.parse('2026-10-28T22:00:00Z'),serial=0;const calls=[],values=new Map(),cache=new Map(),audits=[];
 const profiles=Array.from({length:8},(_,i)=>({lpid:'L'+String(i).padStart(3,'0'),name:'Player '+i}));
 const players=profiles.map((p,i)=>({player:p.name,newPlayer:'',status:i<6?'IN':i===6?'OUT':'STANDBY'}));
 const stats=Object.fromEntries(profiles.map((p,i)=>[p.lpid,{score:5000+i*300,darts:300,a:0,acnt:0,pt:3}]));
 const ranking=Object.fromEntries(profiles.map(p=>[p.lpid,{t_a:{pt:1},t_b:{pt:2}}]));
 let event={tdid:'t_QHaG_7792',lgid:'lg_tM2v_3523',title:'Beauty Registration TEST event DO NOT USE LIVE',status:20,t_date:1793124000,updateTime:100,league:1,team_games:0,
 lg_setting:{auto_schedule:1,league:1,robin_count:7,robin_player_count:4,turnaround:0,include_leg:0,include_set:0,include_set_leg:0,limit:1,low_win:0,limit_leg_count:2,drawMode:0,limit_set_count:2,limit_set_leg_count:2,startScore:501,match_type:'01',limit_rounds:0,overkill:0,rounds:15,changeFirst:0,exitResult:0,autoNext:1,setOrder:0,schedule:[],point_w:2,point_d:1,point_l:0,priority_win:0,exclude_from_stats:0,game_setting:[],pt_setting:[]},
 lg_table:[],lg_result:[],lg_rank:[],t_order:{preserved:true},badge:{},entry_list:profiles.map((p,i)=>({tpid:'E'+String(i).padStart(3,'0'),name:p.name,index:i,c:'SE'}))};
 let schedule=[];
 const props={getProperty:k=>values.has(k)?values.get(k):null,setProperty(k,v){values.set(k,v);},deleteProperty:k=>values.delete(k)};
 const account={uid:'staff',sessionBinding:'session'};
 const context=vm.createContext({console,Set,Map,Date:class extends Date{constructor(...args){super(...args.length?args:[now]);}static now(){return now;}},
  // Existing synthetic provider-path tests explicitly qualify unassigned entries;
  // real deployment has no qualification flag and remains blocked.
  BEAUTY_POOL_UNASSIGNED_ENTRIES_VERIFIED_:options.unassignedVerified!==false,
  BEAUTY_IDENTITY_WRITES_ENABLED_:true,SHEET_ID:'test-sheet',beautyHubRequestToken_:'token',
  beautyHubTestGuard_(){if(options.guard)throw Error('guard');},beautyHubAuthRequire_(){if(options.auth)throw Error('auth');return account;},
  beautyHubTransferHash_:v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('base64url'),
  Utilities:{base64Encode:s=>Buffer.from(s).toString('base64'),getUuid:()=> (++serial).toString(16).padStart(8,'0')+'0'.repeat(24),formatDate:()=> '2026-10-27'},
  PropertiesService:{getScriptProperties:()=>props},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock:()=>!options.busy,releaseLock(){}})},
  getBeautyHubData_:()=>({success:true,eventDate:options.date||'2026-10-27',players:copy(players)}),beautyHubNakkaDate_:()=>({date:options.date||'2026-10-27'}),
  SpreadsheetApp:{openById:()=>({getId:()=> 'test-sheet',getSheetByName(name){const a=audits.find(x=>x.name===name);return a?{getLastRow:()=>a.rows.length,getRange:()=>({getValues:()=>copy(a.rows)})}:null;},insertSheet(name){const rows=[];audits.push({name,rows});return {getRange:()=>({setValues(v){rows.push(...copy(v));},getValues:()=>copy(rows)})};}}),flush(){}},
  beautyHubTransferEntries_({list}){if(!Array.isArray(list))throw Error('entries');return list.map(p=>({tpid:p.tpid,name:p.name,lpid:p.lpid||''})).sort((a,b)=>a.tpid.localeCompare(b.tpid));},
  beautyHubTransferFetch_(path,auth,payload){
   calls.push({path,payload:copy(payload||null)});if(options.fail?.(path,payload,calls))throw Error('PRIVATE provider credentials');
   if(path.startsWith('league/entry/list?')){assert.equal(path,'league/entry/list?lgid=lg_tM2v_3523');return {list:copy(profiles)};}
   if(path.startsWith('league/get?'))return {league:{lgid:'lg_tM2v_3523',title:'AIK MÅNDAGSDARTARNA 2026/2027'}};
   if(path.includes('kind=stats_list'))return {stats:copy(stats)};
   if(path.includes('kind=rank_list'))return {stats:copy(ranking)};
   if(path.startsWith('tournament/end_group?'))return copy(options.completion);
   if(path.startsWith('tournament/standings?'))return copy(options.standings);
   if(path.startsWith('tournament/get?'))return {tournament:copy(event)};
   if(path.startsWith('league/schedule/get?'))return {tdid:event.tdid,swiss:0,schedule:copy(schedule)};
   if(path==='tournament/update'){
    assert.equal(payload.expect_update_time,event.updateTime);assert.equal(payload.tdid,'t_QHaG_7792');event={...event,...copy(payload.set),updateTime:event.updateTime+1};options.afterGroups?.(event);return {result:0};
   }
   if(path==='tournament/assign/update'){event.assign_setting=copy(payload.assign);event.updateTime++;options.afterAssignment?.(event);return {result:0,assign_setting:copy(event.assign_setting)};}
   if(path==='league/schedule/generate'){
    assert.deepEqual(copy(payload),{tdid:'t_QHaG_7792',mode:'robin'});schedule=event.lg_table.map(g=>{const p=g.filter(Boolean),cards=[];for(let a=0;a<p.length;a++)for(let b=a+1;b<p.length;b++)cards.push({p:[p[a],p[b]],lsid:cards.length.toString(36).padStart(4,'0'),t:''});return cards;});options.afterCards?.(event,schedule);return {result:0};
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
test('pool league profiles read the full unpaginated list and reject repeated IDs',()=>{
 const f=fixture();for(let i=8;i<201;i++)f.profiles.push({lpid:i.toString(36).padStart(4,'0'),name:'Extra '+i});
 assert.equal(f.context.beautyPoolProfiles_('auth').length,201);assert.equal(f.calls.length,1);
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
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.call('poolprepare',{ticket:d.ticket}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,2);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'VERIFIED');
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
 for(const phase of ['tournament/update','league/schedule/generate']){const f=fixture(),{p}=f.prepare();f.options.fail=(path,payload)=>!!payload&&path===phase;const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.doesNotMatch(r.error,/PRIVATE/);assert.match(r.error,/Do not retry/);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'ATTEMPTED');const count=f.calls.filter(c=>c.payload).length;assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,count);assert.equal(f.audits.length,1);}
});
test('pool unexpected setting changes or missing duplicate foreign pairings fail full readback',()=>{
 for(const mutation of [(t,s)=>s[0].pop(),(t,s)=>s[0][1]=s[0][0],(t,s)=>s[0][0].p[0]='E007',(t,s)=>t.lg_setting.limit_leg_count=3,(t,s)=>t.entry_list.pop()]){const f=fixture(),{p}=f.prepare();f.options.afterCards=mutation;const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'ATTEMPTED');}
});
test('pool audit failure occurs before Nakka mutation and cannot report successful send',()=>{
 const f=fixture(),{p}=f.prepare();f.context.beautyPoolAudit_=()=>{throw Error('audit unavailable');};const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.values.has('BEAUTY_POOL_SEND_t_QHaG_7792'),false);
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
 const posts=f.calls.filter(c=>c.payload);assert.equal(posts.length,2);assert.equal(Object.hasOwn(posts[0].payload.set,'status'),false);assert.equal(f.schedule.flat().length,6);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'VERIFIED');
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

test('pool unqualified excluded event entries block every write and retain explicit review list',()=>{
 const f=fixture({unassignedVerified:false}),{p}=f.prepare();assert.equal(p.unassignedEntries.length,2);assert.equal(p.unassignedEntries[0].name,'Player 6');
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.match(r.error,/Unassigned Nakka entries/);assert.equal(f.calls.filter(c=>c.payload).length,0);assert.equal(f.audits.length,0);
});

test('pool planning lasts thirty minutes while final approval retains five-minute expiry',()=>{
 const f=fixture(),d=f.draw();f.advance(360000);
 const adjusted=f.call('pooladjust',{ticket:d.ticket,change:JSON.stringify({playerId:d.draw.pools[0].players[0].id,targetPool:d.draw.pools[1].id,swapWith:d.draw.pools[1].players[0].id})});assert.equal(adjusted.success,true);assert.equal(f.calls.filter(c=>c.payload).length,0);
 f.advance(1800001);assert.equal(f.call('pooladjust',{ticket:adjusted.ticket,change:'{}'}).success,false);
 const g=fixture(),{p}=g.prepare();g.advance(300001);assert.equal(g.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(g.calls.filter(c=>c.payload).length,0);
});

test('competition format covers mixed groups without duplicate or excluded qualifiers and rounds bracket slots up',()=>{
 const f=fixture(),draw={pools:[3,4,5].map(n=>({players:Array(n).fill({})}))};
 const plan=copy(f.context.beautyPoolFormat_(f.event,draw,'top2-rest'));
 assert.deepEqual(plan.stage1,{qualifiers:6,slots:8,byes:2});assert.deepEqual(plan.stage2,{qualifiers:6,slots:8,byes:2});
 assert.deepEqual(plan.assignment.s2_custom,{'3':{type:'low',count:1},'4':{type:'low',count:2},'5':{type:'low',count:3}});
 assert.deepEqual(plan.set.t_table.map(r=>r.length),[8,4,2,1]);assert.equal(plan.set.t_setting.limit_leg_count,f.event.lg_setting.limit_leg_count);
 assert.throws(()=>f.context.beautyPoolFormat_(f.event,draw,'top2-bottom2'),/four-player/);
 assert.throws(()=>f.context.beautyPoolFormat_(f.event,{pools:[{players:[{},{},{}]}]},'top2-rest'),/at least two/);
 assert.throws(()=>f.context.beautyPoolFormat_(f.event,draw,'unknown'),/supported/);
});
test('competition format preserves existing knockout match settings and blocks incomplete settings',()=>{
 const f=fixture(),draw={pools:[{players:Array(4).fill({})},{players:Array(4).fill({})}]};
 f.event.t_setting={tournament:1,limit:1,limit_leg_count:5,drawMode:1,t3:1,customPreserved:42};
 const p=copy(f.context.beautyPoolFormat_(f.event,draw,'top2-bottom2'));
 assert.equal(p.set.t_setting.limit_leg_count,5);assert.equal(p.set.t_setting.customPreserved,42);assert.deepEqual(p.set.t3_table,[['',''],['']]);
 delete f.event.t_setting.limit_leg_count;assert.throws(()=>f.context.beautyPoolFormat_(f.event,draw,'top2-rest'),/incomplete/);
});
test('competition format preview is read only and verified send binds groups brackets and assignment rules',()=>{
 const f=fixture(),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(p.success,true,JSON.stringify(p));assert.equal(p.format.stage1.qualifiers,4);assert.equal(p.format.stage2.qualifiers,2);assert.equal(f.calls.some(c=>c.payload),false);
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);
 assert.equal(f.event.t_setting.t_player_count,4);assert.equal(f.event.s2_setting.t_player_count,2);assert.equal(f.event.assign_setting.s2_custom['3'].count,1);
 assert.deepEqual(f.calls.filter(c=>c.payload).map(c=>c.path),['tournament/update','tournament/assign/update','league/schedule/generate']);
 const count=f.calls.filter(c=>c.payload).length;assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,count);
});
test('competition format mismatched assignment readback retains attempted journal and never generates cards or retries',()=>{
 const f=fixture({afterAssignment:e=>e.assign_setting.s2_custom['3'].count=2}),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.equal(f.calls.some(c=>c.path==='league/schedule/generate'),false);
 assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'ATTEMPTED');
});
test('competition format rejects invalid rule before mutation and event edits invalidate approval',()=>{
 const f=fixture(),d=f.draw();assert.equal(f.call('poolprepare',{ticket:d.ticket,format:'top2-bottom2'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
 const p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});assert.equal(p.success,true);f.event.updateTime++;
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
});

test('unified planner rejects completed old target and wrong registration event identity without provider writes',()=>{
 for(const change of [e=>e.tdid='t_RqC2_2034',e=>e.title='Beauty Hub TEST — DO NOT USE LIVE',e=>e.status=40,e=>e.status=30,e=>e.lgid='other']){
  const f=fixture();change(f.event);const r=f.load();assert.equal(r.success,false);assert.equal(f.calls.some(c=>c.payload),false);
 }
 const f=fixture(),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});assert.equal(p.success,true,JSON.stringify(p));
 const saved=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(saved.success,true,JSON.stringify(saved));assert.ok(f.calls.filter(c=>c.payload).every(c=>c.payload.tdid==='t_QHaG_7792'));
 assert.equal(f.values.has('BEAUTY_POOL_SEND_t_RqC2_2034'),false);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'VERIFIED');
});

function nativeRobinFixture(options={}){
 const f=fixture(options),t=f.event;
 t.rr_setting={...copy(t.lg_setting),round_robin:1,limit_rounds:1,rounds:13,show_order:1};
 delete t.rr_setting.league;delete t.rr_setting.turnaround;
 delete t.lg_setting;delete t.lg_table;delete t.lg_result;delete t.lg_rank;
 t.rr_table=[];t.rr_result={};t.rr_rank={};
 t.rr_seq=[['old-placement']];t.rr_order={old:true};t.rr_board=['old'];t.rr_disable=[1];
 return f;
}
test('native Round Robin loads draws and saves groups without any Fixtures API call',()=>{
 const f=nativeRobinFixture(),before=copy(f.event),{p}=f.prepare();
 assert.equal(p.groupMode,'rr');assert.equal(p.expectedCards,6);assert.equal(f.calls.filter(c=>c.payload).length,0);
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));
 assert.equal(f.calls.filter(c=>c.payload).length,1);assert.ok(f.calls.every(c=>!c.path.startsWith('league/schedule/')));
 assert.equal(f.event.rr_table.length,2);assert.equal(f.event.rr_setting.robin_player_count,3);
 assert.deepEqual(f.event.rr_setting,{...before.rr_setting,robin_count:2,robin_player_count:3});
 for(const k of ['entry_list','rr_result','rr_rank','t_order','status'])assert.deepEqual(f.event[k],before[k]);
 for(const k of ['rr_seq','rr_order','rr_board','rr_disable'])assert.deepEqual(f.event[k],[]);
 assert.equal(f.event.lg_setting,undefined);assert.equal(f.event.lg_table,undefined);assert.equal(f.audits.length,2);
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);
});
test('native Round Robin format review sizes both knockouts and preserves native match rules',()=>{
 const f=nativeRobinFixture();f.event.t_setting={tournament:1,t_player_count:32,t3:1,limit:1,limit_leg_count:2,drawMode:0,game_setting:[{round:4,limit_leg_count:3}],limit_rounds:1,rounds:13};
 f.event.s2_setting={tournament:1,t_player_count:16,t3:0,limit:1,limit_leg_count:2,drawMode:0,limit_rounds:1,rounds:13};
 const before=copy(f.event),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(p.success,true,JSON.stringify(p));assert.equal(p.format.stage1.slots,4);assert.equal(p.format.stage2.slots,2);
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);
 assert.deepEqual(f.event.t_setting,{...before.t_setting,t_player_count:4});assert.deepEqual(f.event.s2_setting,{...before.s2_setting,t_player_count:2});
 assert.ok(f.calls.every(c=>!c.path.startsWith('league/schedule/')));assert.equal(f.calls.filter(c=>c.payload).length,2);
 assert.equal(f.event.assign_setting.s2_custom['3'].count,1);
});
test('native Round Robin rejects mixed formats disabled groups and unsupported modes before writes',()=>{
 for(const change of [f=>f.event.lg_setting={league:1},f=>f.event.rr_setting.round_robin=0,f=>f.event.rr_setting.swiss=1,f=>f.event.rr_setting.turnaround=1,f=>f.event.rr_setting.match_type='cricket']){
  const f=nativeRobinFixture();change(f);assert.equal(f.load().success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
 }
});
test('native Round Robin refuses occupied groups results and stale approvals before writes',()=>{
 for(const change of [f=>f.event.rr_table=[['E000']],f=>f.event.rr_result={saved:1},f=>f.event.rr_rank={saved:1}]){
  const f=nativeRobinFixture(),d=f.draw();change(f);assert.equal(f.call('poolprepare',{ticket:d.ticket}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
 }
 const f=nativeRobinFixture(),{p}=f.prepare();f.event.rr_setting.rounds=15;assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
});
test('native Round Robin readback mismatch retains attempt journal and never retries',()=>{
 const f=nativeRobinFixture({afterGroups:t=>t.rr_board=['unexpected']}),{p}=f.prepare();
 const r=f.call('poolsave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,false);assert.equal(r.uncertain,true);
 assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'ATTEMPTED');
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,1);
});
test('native Round Robin mixed group table pads empty slots and derives qualifiers from real players',()=>{
 const f=nativeRobinFixture();f.players[6].status='IN';const l=f.load();
 const d=f.call('pooldraw',{bindings:JSON.stringify(l.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:'[3,4]'});
 assert.equal(d.success,true,JSON.stringify(d));const p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(p.success,true,JSON.stringify(p));assert.deepEqual(p.table.map(g=>g.length),[4,4]);assert.deepEqual(p.table.map(g=>g.filter(Boolean).length),[3,4]);
 assert.equal(p.expectedCards,9);assert.equal(p.format.stage1.qualifiers,4);assert.equal(p.format.stage2.qualifiers,3);assert.equal(p.format.stage2.byes,1);
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);
 assert.equal(f.event.rr_setting.robin_count,2);assert.equal(f.event.rr_setting.robin_player_count,4);
});

test('league statistics refresh accepts the complete 105-player response without paging',()=>{
 const f=fixture();for(let i=8;i<105;i++)f.profiles.push({lpid:i.toString(36).padStart(4,'0'),name:'Additional '+i});
 const r=f.load();assert.equal(r.success,true);assert.equal(r.stats.fresh,true);assert.equal(r.stats.profiles.length,105);
 const reads=f.calls.filter(c=>c.path.startsWith('league/entry/list?'));assert.equal(reads.length,1);assert.equal(reads[0].path,'league/entry/list?lgid=lg_tM2v_3523');assert.equal(f.calls.filter(c=>c.payload).length,0);
});
test('full league identity list still rejects unsupported size and invalid identity fields',()=>{
 for(const change of [f=>{while(f.profiles.length<1000)f.profiles.push({lpid:f.profiles.length.toString(36).padStart(4,'0'),name:'Extra'});},f=>f.profiles[0].lpid=1000,f=>f.profiles[0].name='Bad\\nName'.replace('\\n','\n')]){
  const f=fixture();change(f);assert.throws(()=>f.context.beautyPoolProfiles_('auth'));assert.equal(f.calls.filter(c=>c.payload).length,0);
 }
});


test('native knockout settings may omit drawMode while preserving final override and round limit',()=>{
 const f=nativeRobinFixture();
 f.event.t_setting={tournament:1,t_player_count:32,t3:1,auto_continue:1,limit:1,limit_leg_count:2,limit_set_count:2,limit_set_leg_count:2,game_setting:[{round:-1,limit:1,match_type:'01',roundLimit:0,maxRound:15,overkill:0,limit_leg_count:3}],schedule:[],startScore:501,match_type:'01',limit_rounds:1,rounds:13};
 f.event.s2_setting={tournament:1,t_player_count:16,t3:0,auto_continue:1,limit:1,limit_leg_count:2,game_setting:[],schedule:[],startScore:501,match_type:'01',limit_rounds:1,rounds:13};
 const before=copy(f.event),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.calls.filter(c=>c.payload).length,0);
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);
 assert.deepEqual(f.event.t_setting,{...before.t_setting,t_player_count:4});assert.deepEqual(f.event.s2_setting,{...before.s2_setting,t_player_count:2});
 assert.equal(Object.hasOwn(f.event.t_setting,'drawMode'),false);assert.equal(Object.hasOwn(f.event.s2_setting,'drawMode'),false);
});
test('native knockout settings reject explicit invalid drawMode without external writes',()=>{
 for(const drawMode of [null,false,'0',2]){
  const f=nativeRobinFixture();f.event.t_setting={tournament:1,t_player_count:32,limit:1,limit_leg_count:2,drawMode};
  const d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});assert.equal(p.success,false);assert.equal(f.calls.filter(c=>c.payload).length,0);
 }
});

test('native qualifier readback accepts decimal count strings but rejects changed rules',()=>{
 const f=nativeRobinFixture({afterAssignment:t=>{t.assign_setting.t_count='2';t.assign_setting.s2_count='2';}}),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(p.success,true);assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);
 for(const value of ['3','02','2.0',true]){
  const g=nativeRobinFixture({afterAssignment:t=>{t.assign_setting.t_count=value;}}),draw=g.draw(),ready=g.call('poolprepare',{ticket:draw.ticket,format:'top2-rest'});
  assert.equal(g.call('poolsave',{ticket:ready.ticket,confirmed:'true'}).uncertain,true);
 }
});
function attemptedNativeFixture(){
 const f=nativeRobinFixture({afterAssignment:t=>{t.assign_setting.t_count='2';t.assign_setting.s2_count='2';throw Error('response unavailable');}}),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).uncertain,true);return f;
}
test('private attempted-send reconciliation verifies original audit without provider writes or retries',()=>{
 const f=attemptedNativeFixture(),before=copy(f.event),writes=f.calls.filter(c=>c.payload).length;
 const r=copy(f.context.beautyPoolReconcileAttempt_());assert.equal(r.success,true);assert.equal(r.providerWrites,0);assert.deepEqual(f.event,before);assert.equal(f.calls.filter(c=>c.payload).length,writes);
 assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'VERIFIED');assert.equal(f.audits.length,2);
 assert.throws(()=>f.context.beautyPoolReconcileAttempt_(),/No attempted/);
});
test('attempted-send reconciliation keeps the lock on mismatched event roster or audit',()=>{
 for(const change of [f=>f.event.assign_setting.s2_complete=false,f=>f.event.rr_table[0][0]='E007',f=>f.players[0].status='OUT',f=>f.audits[0].rows[1][1]='{}']){
  const f=attemptedNativeFixture(),writes=f.calls.filter(c=>c.payload).length;change(f);
  assert.throws(()=>f.context.beautyPoolReconcileAttempt_());assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_SEND_t_QHaG_7792')).state,'ATTEMPTED');assert.equal(f.calls.filter(c=>c.payload).length,writes);
 }
});

function savedNative(){const f=nativeRobinFixture(),d=f.draw(),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);return f;}
test('planner reload resumes verified native draw and Start changes only status once after explicit approval',()=>{
 const f=savedNative(),writes=f.calls.filter(c=>c.payload).length,loaded=f.call('poolload',{refresh:'false'});assert.equal(loaded.success,true,JSON.stringify(loaded));assert.equal(loaded.workflow.canStart,true);assert.equal(loaded.workflow.draw.pools.length,2);assert.equal(f.calls.filter(c=>c.payload).length,writes);
 const prepared=f.call('poolstartprepare',{});assert.equal(prepared.success,true,JSON.stringify(prepared));const before=copy(f.event),r=f.call('poolstart',{ticket:prepared.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);const after=copy(f.event);delete before.updateTime;delete after.updateTime;before.status=30;assert.deepEqual(after,before);
 assert.deepEqual(f.calls.filter(c=>c.payload).at(-1).payload.set,{status:30});assert.equal(f.call('poolstart',{ticket:prepared.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes+1);assert.equal(f.call('poolload',{refresh:'false'}).workflow.running,true);
});
test('planner Start blocks changed roster rules unauthenticated sessions expired tickets and missing confirmation',()=>{
 for(const change of [f=>f.players[0].status='OUT',f=>f.event.assign_setting.t_count=3,f=>f.options.auth=true,f=>f.advance(300001),f=>f.account.sessionBinding='other']){
  const f=savedNative(),p=f.call('poolstartprepare',{}),writes=f.calls.filter(c=>c.payload).length;change(f);assert.equal(f.call('poolstart',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes);
 }
 const f=savedNative(),p=f.call('poolstartprepare',{});assert.equal(f.call('poolstart',{ticket:p.ticket,confirmed:'false'}).success,false);assert.equal(f.event.status,20);
});
test('planner uncertain Start keeps a durable attempt and never repeats the provider mutation',()=>{
 const f=savedNative(),p=f.call('poolstartprepare',{});f.options.fail=(path,payload)=>path==='tournament/update'&&payload?.set.status===30;const r=f.call('poolstart',{ticket:p.ticket,confirmed:'true'});assert.equal(r.uncertain,true);const writes=f.calls.filter(c=>c.payload).length;assert.equal(f.call('poolstartprepare',{}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_START_t_QHaG_7792')).state,'ATTEMPTED');
});
test('planner stores a reviewed board match plan separately without re-sending saved pools',()=>{
 const f=savedNative(),draw=f.call('poolload',{refresh:'false'}).workflow.draw,writes=f.calls.filter(c=>c.payload).length;
 const input={available:[5,6],choices:draw.pools.map((p,i)=>({poolId:p.id,boards:[5+i]}))};
 const r=f.call('poolboardplan',{boardPlan:JSON.stringify(input)});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.workflow.boardPlan.matches.length,6);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_BOARDS_t_QHaG_7792')).plan,undefined);assert.equal(f.calls.filter(c=>c.payload).length,writes);assert.equal(f.call('poolstartprepare',{}).success,true);
 input.choices[0].boards=[7];assert.equal(f.call('poolboardplan',{boardPlan:JSON.stringify(input)}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes);
});

test('planner Start requires the four-player board decision and binds board edits into approval',()=>{
 const f=nativeRobinFixture();f.players[6].status='IN';const loaded=f.load();const d=f.call('pooldraw',{bindings:JSON.stringify(loaded.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:'[4,3]'}),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);
 assert.equal(f.call('poolstartprepare',{}).success,false);
 const input={available:[5,6,7],choices:d.draw.pools.map((p,i)=>({poolId:p.id,boards:i?[7]:[5,6]}))};
 assert.equal(f.call('poolboardplan',{boardPlan:JSON.stringify(input)}).success,true);const ready=f.call('poolstartprepare',{});assert.equal(ready.success,true);
 input.choices[0].boards=[5];assert.equal(f.call('poolboardplan',{boardPlan:JSON.stringify(input)}).success,true);const writes=f.calls.filter(c=>c.payload).length;
 assert.equal(f.call('poolstart',{ticket:ready.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes);
});
test('planner Start denies write-disabled targets extra fields and unexpected readback changes',()=>{
 const f=savedNative(),p=f.call('poolstartprepare',{});f.context.BEAUTY_IDENTITY_WRITES_ENABLED_=false;const writes=f.calls.filter(c=>c.payload).length;assert.equal(f.call('poolstart',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,writes);
 assert.equal(f.call('poolstartprepare',{tdid:'production'}).success,false);assert.equal(f.call('poolboardplan',{boardPlan:'{}'}).success,false);
 const g=savedNative(),ready=g.call('poolstartprepare',{});g.options.afterGroups=t=>{if(t.status===30)t.rr_setting.limit_leg_count=9;};assert.equal(g.call('poolstart',{ticket:ready.ticket,confirmed:'true'}).uncertain,true);assert.equal(JSON.parse(g.values.get('BEAUTY_POOL_START_t_QHaG_7792')).state,'ATTEMPTED');
});

function controlFixture(seven=false){
 const f=nativeRobinFixture();delete f.event.t_order;
 if(seven)f.players[6].status='IN';
 const l=f.load(),d=f.call('pooldraw',{bindings:JSON.stringify(l.mappings.map(p=>({id:p.id,lpid:p.lpid,tpid:p.tpid}))),reviewed:'true',sizes:seven?'[4,3]':'[3,3]'}),p=f.call('poolprepare',{ticket:d.ticket,format:'top2-rest'});
 assert.equal(f.call('poolsave',{ticket:p.ticket,confirmed:'true'}).success,true);f.event.status=30;
 f.options.standings={result:0,tdid:f.event.tdid,groups:f.event.rr_table.map((table,index)=>({kind:'rr',index,players:table.filter(Boolean).map((tpid,i,arr)=>({tpid,rank:i+1,win:arr.length-1-i,lose:i}))}))};
 f.options.completion={result:0,tdid:f.event.tdid,groups:{rr_0:1,rr_1:1}};
 f.calls.length=0;return f;
}
test('tournament review is read only and splits completed mixed pools using approved top two rules',()=>{
 const f=controlFixture(true),r=f.call('poolcontrol',{});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.control.ready,true);assert.deepEqual(r.control.stages.map(s=>s.players.length),[4,3]);assert.equal(r.control.stages[1].byes,1);
 assert.ok(r.control.stages[0].players.every(p=>p.rank<=2));assert.ok(r.control.stages[1].players.every(p=>p.rank>2));assert.equal(new Set(r.control.stages.flatMap(s=>s.players.map(p=>p.id))).size,7);assert.equal(f.calls.some(c=>c.payload),false);
 const stage=r.control.stages[0];for(let i=0;i<4;i+=2)assert.notEqual(stage.players.find(p=>p.id===stage.table[0][i]).group,stage.players.find(p=>p.id===stage.table[0][i+1]).group);
});
test('tournament bye advances only past an empty subtree and never past an unresolved match',()=>{
 const f=controlFixture(true),players=Array.from({length:3},(_,i)=>({id:'p'+i}));
 assert.deepEqual(copy(f.context.beautyTournamentBracket_(players,4)),[['p0','','p1','p2'],['p0',''],['']]);
 const table=copy(f.context.beautyTournamentBracket_(players,8));assert.deepEqual(table[2],['p0','']);assert.deepEqual(table[3],['']);
});
test('tournament confirmation assigns both brackets once and preserves every other event field',()=>{
 const f=controlFixture(true),p=f.call('poolqualifyprepare',{});assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.calls.some(c=>c.payload),false);const before=copy(f.event),r=f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'});
 assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.readbackVerified,true);const expected={...before,t_table:p.control.stages[0].table,s2_table:p.control.stages[1].table,updateTime:before.updateTime+1};assert.deepEqual(f.event,expected);assert.equal(f.calls.filter(c=>c.payload).length,1);
 assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_QUALIFY_t_QHaG_7792')).state,'VERIFIED');assert.equal(f.call('poolqualifyprepare',{}).success,false);assert.equal(f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,1);
 assert.equal(f.call('poolcontrol',{}).control.assigned,true);
});
test('tournament incomplete groups tied ranks foreign members and altered rules cannot prepare assignment',()=>{
 for(const change of [f=>f.options.standings.groups[0].players[0].win=0,f=>f.options.standings.groups[0].players[1].rank=1,f=>f.options.standings.groups[0].players[0].tpid='foreign',f=>f.event.assign_setting.t_count=3,f=>f.event.rr_table.reverse(),f=>f.event.t_setting.t_player_count=8,f=>f.event.t_setting.tournament=0,f=>f.options.completion.groups.rr_0=0,f=>f.options.completion.tdid='other',f=>delete f.options.completion.groups.rr_0]){
  const f=controlFixture(true);change(f);assert.equal(f.call('poolqualifyprepare',{}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
 }
});
test('tournament refuses occupied brackets existing results guides and unverified attempts',()=>{
 for(const change of [f=>f.event.t_table[0][0]=f.event.rr_table[0][0],f=>f.event.s2_result={saved:1},f=>f.event.t_init=[[1,2,3,4]],f=>f.event.s2_order=[1],f=>f.values.set('BEAUTY_POOL_QUALIFY_t_QHaG_7792',JSON.stringify({state:'ATTEMPTED'}))]){
  const f=controlFixture();change(f);assert.equal(f.call('poolqualifyprepare',{}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
 }
});
test('tournament approval binds staff session expiry confirmation event and standings',()=>{
 for(const change of [f=>f.advance(300001),f=>f.account.uid='other',f=>f.account.sessionBinding='other',f=>f.event.updateTime++,f=>f.options.standings.groups[0].players.reverse(),f=>f.context.BEAUTY_IDENTITY_WRITES_ENABLED_=false]){
  const f=controlFixture(),p=f.call('poolqualifyprepare',{});assert.equal(p.success,true);change(f);assert.equal(f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
 }
 const f=controlFixture(),p=f.call('poolqualifyprepare',{});assert.equal(f.call('poolqualifysave',{ticket:p.ticket,confirmed:'false'}).success,false);assert.equal(f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
});
test('tournament provider failure or readback drift remains uncertain and cannot retry',()=>{
 for(const fail of [true,false]){
  const f=controlFixture(),p=f.call('poolqualifyprepare',{});if(fail)f.options.fail=(path,payload)=>!!payload;else f.options.afterGroups=e=>e.rr_setting.limit_leg_count=9;
  const r=f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'});assert.equal(r.uncertain,true);assert.doesNotMatch(r.error,/PRIVATE/);assert.equal(JSON.parse(f.values.get('BEAUTY_POOL_QUALIFY_t_QHaG_7792')).state,'ATTEMPTED');assert.equal(f.call('poolqualifyprepare',{}).success,false);assert.equal(f.calls.filter(c=>c.payload).length,1);
 }
});
test('tournament audit or concurrent prewrite changes block provider mutation',()=>{
 for(const drift of [false,true]){
  const f=controlFixture(),p=f.call('poolqualifyprepare',{}),audit=f.context.beautyPoolAudit_;
  f.context.beautyPoolAudit_=(...args)=>{if(!drift)throw Error('private audit failure');const v=audit(...args);f.event.updateTime++;return v;};
  assert.equal(f.call('poolqualifysave',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);assert.equal(f.values.has('BEAUTY_POOL_QUALIFY_t_QHaG_7792'),false);
 }
});
test('tournament routes reject wrong identity authentication unsupported inputs and prestart state',()=>{
 for(const change of [f=>f.event.tdid='other',f=>f.options.auth=true,f=>f.event.status=20]){const f=controlFixture();change(f);assert.equal(f.call('poolcontrol',{}).success,false);assert.equal(f.calls.some(c=>c.payload),false);}
 const f=controlFixture();for(const action of ['poolcontrol','poolqualifyprepare'])assert.equal(f.call(action,{event:'other'}).success,false);assert.equal(f.call('poolqualifysave',{ticket:'bad',confirmed:'true',set:'{}'}).success,false);assert.equal(f.calls.some(c=>c.payload),false);
});
