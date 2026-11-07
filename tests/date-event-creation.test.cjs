const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTestNakkaEvent.gs','utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(o={}){
 const props=new Map([['N01_API_USER','secret-user'],['N01_API_PASSWORD','secret-password']]),cache=new Map(),calls=[],audits=[];
 const state={date:'2026-11-08',uid:'owner',session:'session',events:[],created:null,serial:0};
 const template={tdid:'t_QHaG_7792',title:'Beauty Registration TEST event DO NOT USE LIVE',lgid:'lg_tM2v_3523',team_games:0,rr_setting:{round_robin:1,robin_count:2,robin_player_count:4},t_setting:{tournament:1,t_player_count:4,t3:1,limit_leg_count:3},s2_setting:{tournament:1,t_player_count:4,limit_leg_count:2},rr_table:[['OLD']],rr_result:{OLD:{score:2}},entry_list:[{tpid:'OLD'}]};
 const c={Date,Map,JSON,Number,Object,Array,encodeURIComponent,SHEET_ID:'sheet',beautyHubRequestToken_:'token',
  beautyHubTestGuard_(){if(o.guard)throw Error('wrong project');},beautyHubNakkaAuthorize_(){if(o.auth)throw Error('not signed in');},
  beautyHubAuthRequire_(){if(o.auth)throw Error('secret');return {uid:state.uid,sessionBinding:state.session};},
  LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock(){}})},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>{if(o.propertyFailure)throw Error('secret');props.set(k,v);}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  Utilities:{getUuid:()=>String(++state.serial).padStart(32,'0'),base64Encode:v=>Buffer.from(v).toString('base64'),formatDate:d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)},
  UrlFetchApp:{fetch:(url,input)=>{calls.push({url,input});assert.equal(input.method,'get');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({result:0,list:state.events})};}},
  beautyPoolAuth_:()=> 'authorization',beautyPoolCopy_:clone,beautyPoolHash_:v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),beautyPoolEqual_:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
  beautyPoolEmpty_:v=>v==null||v===''||Array.isArray(v)&&v.every(c.beautyPoolEmpty_)||typeof v==='object'&&Object.values(v).every(c.beautyPoolEmpty_),
  beautyTournamentReadAudit_:name=>clone(audits[Number(name.split('-')[1])-1]),
  beautyPoolAudit_:v=>{audits.push(v);if(o.auditFailure)throw Error('secret');return 'audit-'+audits.length;},
  beautyHubTransferFetch_:(path,auth,payload)=>{
   calls.push({path,payload:payload&&clone(payload)});
   if(path==='tournament/get?tdid=t_QHaG_7792'){if(o.templateMissing)throw Error('removed TEST event');return {tournament:clone(template)};}
   if(path==='tournament/create'){
    assert.equal(JSON.parse(props.get('BEAUTY_CREATE_EVENT_'+state.date)).state,'ATTEMPTED');
    assert.deepEqual(Object.keys(payload),['set']);assert.equal(payload.set.private,0);assert.equal(payload.set.status,20);assert.equal(payload.set.join_pass,'AIK');assert.equal(payload.set.game_type,5);assert.equal(payload.set.common_join,1);assert.equal(payload.set.individual_pass,0);
    for(const k of Object.keys(payload.set))assert(!/table|result|rank|entry/.test(k));
    state.created={...clone(payload.set),tdid:'t_NEW_2026',rr_table:[],t_table:[],s2_table:[]};
    if(o.omitDisabled)for(const [key,flag]of [['rr_setting','round_robin'],['t_setting','tournament'],['s2_setting','tournament']])if(state.created[key]?.[flag]===0)delete state.created[key];
    state.events.push(clone(state.created));
    if(o.timeout)throw Error('secret-password');
    o.afterCreate?.(state.created);
    if(o.readbackMismatch)state.created.title='Unexpected';
    if(o.duplicate)state.events.push({...clone(state.created),tdid:'t_SECOND'});
    return {result:0,tdid:'t_NEW_2026'};
   }
   if(path==='tournament/update'){
    assert.equal(payload.tdid,state.created.tdid);assert.equal(payload.expect_update_time,state.created.updateTime);Object.assign(state.created,clone(payload.set));state.created.updateTime++;if(o.omitDisabled)for(const [key,flag]of [['rr_setting','round_robin'],['t_setting','tournament'],['s2_setting','tournament']])if(state.created[key]?.[flag]===0)delete state.created[key];o.afterUpdate?.(state.created);if(o.updateTimeout)throw Error('secret timeout');return {result:0};
   }
   if(path==='tournament/get?tdid=t_NEW_2026')return {tournament:clone(state.created)};
   if(path==='tournament/entry/list?tdid=t_NEW_2026')return {list:o.nonempty?[{tpid:'BAD'}]:[]};
   throw Error('secret unexpected path '+path);
  }};
 vm.createContext(c);vm.runInContext(source,c);c.beautyHubNakkaDate_=()=>({date:state.date,zone:'Europe/Berlin'});
 const prepare=settings=>c.beautyHubCreateEvent_('prepare',{title:'AIK Hub TEST 8 November',...(settings===undefined?{}:{settings:JSON.stringify(settings)})});
 const confirm=p=>c.beautyHubCreateEvent_('confirm',{confirmed:'true',ticket:p.ticket});
 return {c,state,props,cache,calls,audits,template,prepare,confirm,posts:()=>calls.filter(v=>v.payload)};
}
test('Date events select a new approved TEST event and refuse a stale binding after the Hub date changes',()=>{
 const f=fixture();f.state.events=[{tdid:'t_NEW_2026',title:'AIK Hub TEST Sunday',lgid:'lg_tM2v_3523',t_date:Date.parse('2026-11-08T12:00Z')/1000}];
 assert.equal(f.c.beautyHubNakkaEvent_({}).event.id,'t_NEW_2026');assert.equal(f.c.beautyHubActiveTestTarget_().id,'t_NEW_2026');f.state.date='2026-11-09';assert.throws(()=>f.c.beautyHubActiveTestTarget_());assert.equal(f.posts().length,0);
});
test('Date creation review copies settings only and discloses public TEST visibility without any POST',()=>{
 const f=fixture(),p=f.prepare();assert.equal(p.success,true);assert.equal(p.event.private,false);assert.equal(p.event.status,'Accepting entries');assert.equal(f.posts().length,0);assert.equal(f.props.has('BEAUTY_CREATE_EVENT_'+f.state.date),false);assert.doesNotMatch(JSON.stringify(p),/secret|join_pass|OLD|Authorization/);
});
test('Date creation confirms once and verifies empty native entries plus settings before publishing the selection',()=>{
 const f=fixture(),p=f.prepare(),before=clone(f.template),r=f.confirm(p);assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.event.id,'t_NEW_2026');assert.equal(f.posts().length,1);assert.equal(f.c.beautyHubActiveTestTarget_().id,'t_NEW_2026');assert.equal(JSON.parse(f.props.get('BEAUTY_CREATE_EVENT_'+f.state.date)).state,'VERIFIED');assert.deepEqual(f.template,before);assert.equal(f.confirm(p).success,false);assert.equal(f.posts().length,1);assert.doesNotMatch(JSON.stringify(f.audits),/secret|join_pass/);
});
test('Date creation rejects missing acknowledgement altered dates sessions users and expired tickets before POST',()=>{
 for(const mutate of [f=>f.state.date='2026-11-09',f=>f.state.session='another',f=>f.state.uid='another',f=>{const [key,value]=[...f.cache][0];const r=JSON.parse(value);r.expires=0;f.cache.set(key,JSON.stringify(r));}]){const f=fixture(),p=f.prepare();mutate(f);assert.equal(f.confirm(p).success,false);assert.equal(f.posts().length,0);}
 const f=fixture(),p=f.prepare();assert.equal(f.c.beautyHubCreateEvent_('confirm',{ticket:p.ticket,confirmed:'false'}).success,false);assert.equal(f.posts().length,0);
});
test('Date creation timeout leaves a durable uncertain marker and every later create attempt stays read only',()=>{
 const f=fixture({timeout:true}),p=f.prepare(),r=f.confirm(p);assert.equal(r.uncertain,true);assert.match(r.error,/Do not retry/);assert.doesNotMatch(JSON.stringify(r),/secret/);assert.equal(JSON.parse(f.props.get('BEAUTY_CREATE_EVENT_'+f.state.date)).state,'ATTEMPTED');assert.equal(f.prepare().success,false);assert.equal(f.confirm(p).success,false);assert.equal(f.posts().length,1);
});
test('Date creation blocks duplicate selection nonempty entries or changed native readbacks after its single POST',()=>{
 for(const options of [{duplicate:true},{nonempty:true},{readbackMismatch:true}]){const f=fixture(options),r=f.confirm(f.prepare());assert.equal(r.success,false);assert.equal(r.uncertain,true);assert.equal(f.posts().length,1);assert.equal(f.prepare().success,false);}
});
test('Date creation refuses an existing TEST event and cannot target same-date production or arbitrary input IDs',()=>{
 const f=fixture();f.state.events=[{tdid:'t_PRODUCTION',title:'Monday competition',lgid:'lg_tM2v_3523',t_date:Date.parse('2026-11-08T12:00Z')/1000}];assert.equal(f.c.beautyHubNakkaEvent_({}).status,'NOT_FOUND');
 assert.equal(f.c.beautyHubCreateEvent_('prepare',{title:'AIK Hub TEST',id:'t_PRODUCTION'}).success,false);assert.equal(f.c.beautyHubCreateEvent_('prepare',{title:'Production tournament'}).success,false);
 f.state.events.push({...f.state.events[0],tdid:'t_EXISTS',title:'AIK Hub TEST existing'});assert.equal(f.prepare().success,false);assert.equal(f.posts().length,0);
});
test('Date creation cannot POST if project authorization lock audit or journal verification fails',()=>{
 for(const option of ['guard','auth','busy','auditFailure','propertyFailure']){const o={},f=fixture(o);const p=f.prepare();o[option]=true;try{assert.equal(f.confirm(p).success,false);}catch(e){assert.equal(option,'guard');}assert.equal(f.posts().length,0);}
});

test('Cast staff opener forwards only its verified session to date selection and restores request context',()=>{
 const f=fixture();vm.runInContext(fs.readFileSync('apps-script/registration-identity-test/remote-app/BeautyLiveTest.gs','utf8'),f.c);
 f.c.beautyHubRequestToken_='prior';let seen;f.c.beautyHubNakkaEvent_=()=>{seen=f.c.beautyHubRequestToken_;return {status:'MATCHED'};};f.c.beautyHubSelectCastEvent_('verified-staff-token');assert.equal(seen,'verified-staff-token');assert.equal(f.c.beautyHubRequestToken_,'prior');
 f.c.beautyHubNakkaEvent_=()=>{throw Error('network');};assert.throws(()=>f.c.beautyHubSelectCastEvent_('other'));assert.equal(f.c.beautyHubRequestToken_,'prior');
});
test('Selected TEST Live feed requests only its injected event and rejects a different provider event',async()=>{
 const paths=[],id='t_SUNDAY_NEW',c={BeautySelectedEventId:id,BeautyNakkaStages:require('../public/js/nakka-stage-model.js'),AbortSignal,Date};vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/nakka-stage-feed.js','utf8'),c);
 let shown,failed=false,wrong=false;
 const feed=c.BeautyNakkaStageFeed.create({fetch:async url=>{paths.push(url);return {ok:true,json:async()=>url.includes('standings?')?{result:0,tdid:id,groups:[]}:{result:0,tournament:{tdid:wrong?'t_QHaG_7792':id,lgid:'lg_tM2v_3523',title:'AIK Hub TEST Sunday',updateTime:1,entry_list:[]}}};},onData:d=>shown=d,onError:()=>failed=true});
 await feed.refresh();assert.equal(failed,false);assert.equal(shown.eventId,id);assert(paths.every(p=>p.endsWith('tdid='+id)));wrong=true;await feed.refresh();assert.equal(failed,true);
});
function creationUI(options={}){
 class Node{constructor(tag){this.tag=tag;this.children=[];this.events={};this.disabled=false;this._text='';}set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text;}append(...nodes){this.children.push(...nodes);}replaceChildren(){this.children=[];this._text='';}setAttribute(k,v){(this.attrs??={})[k]=v;}addEventListener(k,fn){this.events[k]=fn;}fire(k='click'){if(!this.disabled)return this.events[k]?.();}}
 const host=new Node('section'),check=new Node('button'),compare=new Node('button'),date=new Node('p'),calls=[];date.textContent='8 November 2026';
 const replies=options.replies||[{status:'NOT_FOUND',message:'Missing TEST event'},{success:true,ticket:'ticket',message:'Review',event:{title:'AIK Hub TEST Sunday',date:'2026-11-08',format:'Round Robin + Slutspel 1 and 2'}},{success:true,message:'Created once'}];
 const c={URL,Date,JSON,window:{beautyHubData:{eventDate:'2026-11-08',players:[]}},document:{getElementById:id=>({nakkaEventCheck:check,nakkaCompare:compare,nakkaEventResult:host,currentEventDate:date}[id]),addEventListener(){},createElement:t=>new Node(t),createTextNode:t=>t},MutationObserver:class{observe(){}},BeautyHubServices:{request:async url=>{calls.push(new URL(url));return {json:async()=>replies.shift()};}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-nakka-event.js','utf8'),c);
 return {host,check,compare,date,c,calls,replies,all:()=>{const walk=n=>[n,...n.children.filter(v=>v&&typeof v==='object').flatMap(walk)];return walk(host);},find:text=>host.children.find(n=>n.textContent===text),ack:()=>host.children.find(n=>n.tag==='label')?.children[0]};
}
test('Missing-event UI reviews creation separately and sends exactly one explicitly acknowledged confirm',async()=>{
 const {host,check,calls}=creationUI();
 await check.fire();assert.equal(calls.length,1);const review=host.children.find(n=>n.textContent==='REVIEW CREATE EVENT');await review.fire();assert.equal(calls[1].searchParams.get('page'),'nakkacreateprepare');
 const confirm=host.children.find(n=>n.textContent==='CREATE EVENT — TEST'),ack=host.children.find(n=>n.tag==='label').children[0];assert.equal(confirm.disabled,true);assert.equal(calls.length,2);ack.checked=true;ack.fire('change');const promise=confirm.fire();confirm.fire();await promise;
 assert.equal(calls.length,3);assert.equal(calls[2].searchParams.get('page'),'nakkacreateconfirm');assert.equal(calls[2].searchParams.get('confirmed'),'true');assert(host.children.some(n=>n.textContent==='Created once'));
});

test('Creation Back preserves the title and requires a fresh review ticket and acknowledgement',async()=>{
 const f=creationUI();await f.check.fire();const name=f.host.children.find(n=>n.tag==='input');name.value='AIK Hub TEST my title';await f.find('REVIEW CREATE EVENT').fire();
 const oldConfirm=f.find('CREATE EVENT — TEST'),oldAck=f.ack();oldAck.checked=true;oldAck.fire('change');await f.find('BACK TO EVENT SETUP').fire();assert.equal(f.host.children.find(n=>n.tag==='input').value,'AIK Hub TEST my title');assert.equal(f.calls.length,2);
 await oldConfirm.fire();assert.equal(f.calls.length,2);f.replies.length=0;f.replies.push({success:true,ticket:'fresh',event:{title:'AIK Hub TEST my title',date:'2026-11-08',format:'RR'}});
 await f.find('REVIEW CREATE EVENT').fire();assert.equal(f.find('CREATE EVENT — TEST').disabled,true);assert.equal(f.ack().checked,undefined);assert.equal(f.calls.at(-1).searchParams.get('title'),'AIK Hub TEST my title');
});
test('Creation expired approval returns an actionable review button without repeating the write',async()=>{
 const f=creationUI();await f.check.fire();await f.find('REVIEW CREATE EVENT').fire();f.replies.length=0;f.replies.push({success:false,uncertain:false,error:'Review expired. Review again to continue.'});f.ack().checked=true;f.ack().fire('change');await f.find('CREATE EVENT — TEST').fire();assert(f.find('REVIEW AGAIN'));assert.equal(f.calls.length,3);await f.find('REVIEW AGAIN').fire();assert(f.find('REVIEW CREATE EVENT'));assert.equal(f.calls.length,3);
});
test('Creation uncertain outcome offers no retry or Back path after its single confirm',async()=>{
 const f=creationUI();await f.check.fire();await f.find('REVIEW CREATE EVENT').fire();f.replies.length=0;f.replies.push({success:false,uncertain:true,error:'Inspect Nakka. Do not retry.'});f.ack().checked=true;f.ack().fire('change');await f.find('CREATE EVENT — TEST').fire();assert.equal(f.find('REVIEW AGAIN'),undefined);assert.equal(f.find('BACK TO EVENT SETUP'),undefined);assert.equal(f.calls.length,3);
});
test('Creation validation exposes only safe actionable reasons and keeps unexpected backend details private',()=>{
 const f=fixture();assert.match(f.c.beautyHubCreateEvent_('prepare',{title:'Production'}).error,/Start the event name with "AIK Hub TEST"/);const p=f.prepare();const [key,value]=[...f.cache][0],r=JSON.parse(value);r.expires=0;f.cache.set(key,JSON.stringify(r));assert.equal(f.confirm(p).error,'Review expired. Review again to continue.');assert.equal(f.posts().length,0);
 const failed=fixture({auditFailure:true});const error=failed.confirm(failed.prepare()).error;assert.doesNotMatch(error,/secret/);assert.match(error,/Sign in again/);
});

function matchOptions(){return {groups:{legs:1,maxDarts:39},stage1:{legs:2,finalLegs:3,maxDarts:45,thirdPlace:true,thirdPlaceLegs:1},stage2:{legs:3,finalLegs:4,maxDarts:null,thirdPlace:false,thirdPlaceLegs:2}};}
test('Creation match settings freeze chosen legs final overrides dart limits and third-place flags before any write',()=>{
 const f=fixture(),options=matchOptions();f.template.rr_setting.game_setting=[{round:0,limit_leg_count:99}];const before=clone(f.template),p=f.prepare(options);assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.posts().length,0);
 const r=JSON.parse([...f.cache.values()][0]),rr=r.set.rr_setting,a=r.set.t_setting,b=r.set.s2_setting;assert.equal(rr.limit,1);assert.equal(rr.limit_leg_count,1);assert.equal(rr.drawMode,0);assert.equal(rr.limit_rounds,1);assert.equal(rr.rounds,13);assert.deepEqual(rr.game_setting,[]);
 assert.equal(a.limit_leg_count,2);assert.equal(a.rounds,15);assert.equal(a.t3,1);assert.deepEqual(a.game_setting.map(v=>[v.round,v.limit_leg_count,v.roundLimit,v.maxRound]),[[-1,3,1,15],[-3,1,1,15]]);
 assert.equal(b.limit_leg_count,3);assert.equal(b.limit_rounds,0);assert.equal(b.t3,0);assert.equal(b.game_setting[0].roundLimit,0);assert.deepEqual(f.template,before);assert(p.event.matchSettings.some(line=>line.includes('39 darts')&&line.includes('13 rounds')));assert(p.event.matchSettings.some(line=>line.includes('Final: first to 3')&&line.includes('Third place: first to 1')));
});
test('Creation confirms only frozen match options and verifies every native setting after one create',()=>{
 const f=fixture(),p=f.prepare(matchOptions());assert.equal(p.success,true);assert.equal(f.c.beautyHubCreateEvent_('confirm',{ticket:p.ticket,confirmed:'true',settings:JSON.stringify(matchOptions())}).success,false);assert.equal(f.posts().length,0);
 const r=f.confirm(p);assert.equal(r.success,true,JSON.stringify(r));assert.equal(f.posts().length,1);assert(f.audits[0].matchSettings.some(line=>line.includes('39 darts')));assert.deepEqual(f.audits[1].matchSettings,f.audits[0].matchSettings);assert.equal(f.state.created.rr_setting.rounds,13);assert.equal(f.state.created.t_setting.game_setting[0].limit_leg_count,3);assert.equal(f.state.created.s2_setting.t3,0);
 const mismatch=fixture({afterCreate:t=>t.rr_setting.rounds=99}),failed=mismatch.confirm(mismatch.prepare(matchOptions()));assert.equal(failed.success,false);assert.equal(failed.uncertain,true);assert.equal(mismatch.posts().length,1);assert.equal(mismatch.prepare(matchOptions()).success,false);
});
test('Creation rejects malformed unknown fractional string or out-of-range match settings without a write or approval',()=>{
 const changes=[v=>v.groups.legs='2',v=>v.stage1.finalLegs=0,v=>v.stage2.legs=100,v=>v.groups.maxDarts=40,v=>v.groups.maxDarts=0,v=>v.groups.maxDarts=300,v=>v.groups.maxDarts='39',v=>v.groups.maxDarts=3.5,v=>v.stage1.thirdPlace=1,v=>v.stage1.thirdPlaceLegs=-1,v=>v.groups.other=true,v=>v.extra={},v=>delete v.stage2,v=>v.stage1=[],v=>v.groups=null];
 for(const change of changes){const f=fixture(),v=matchOptions();change(v);assert.equal(f.prepare(v).success,false,JSON.stringify(v));assert.equal(f.posts().length,0);assert.equal(f.cache.size,0);}
 const f=fixture();for(const settings of ['{','null','[]','x'.repeat(4001)])assert.equal(f.c.beautyHubCreateEvent_('prepare',{title:'AIK Hub TEST',settings}).success,false);assert.equal(f.posts().length,0);
});
test('Creation replaces inherited per-round overrides and explicitly turns off old limits and bronze settings',()=>{
 const f=fixture(),v=matchOptions();for(const k of ['groups','stage1','stage2'])v[k].maxDarts=null;v.stage1.thirdPlace=false;v.stage1.finalLegs=v.stage1.legs;v.stage2.finalLegs=v.stage2.legs;for(const k of ['rr_setting','t_setting','s2_setting'])Object.assign(f.template[k],{startScore:301,match_type:'01',limit_rounds:1,rounds:13,game_setting:[{round:4,limit_leg_count:99}]});
 const configured=f.c.beautyHubCreateMatchSettings_(JSON.stringify(v),f.template),set=clone(configured.set);for(const k of ['rr_setting','t_setting','s2_setting']){assert.equal(set[k].limit_rounds,0);assert.deepEqual(set[k].game_setting,[]);assert.equal(set[k].startScore,301);}assert.equal(set.t_setting.t3,0);assert.equal(set.s2_setting.t3,0);
});
test('Creation UI sends match settings only on review and Back retains every stage option with fresh acknowledgement',async()=>{
 const f=creationUI();await f.check.fire();const field=label=>f.all().find(n=>n.attrs?.['aria-label']===label);
 field('Groups Legs to win').value='1';field('Groups Limit darts per leg').checked=true;await field('Groups Limit darts per leg').fire('change');field('Groups Darts per player (multiples of 3)').value='39';field('Slutspel 1 Final: legs to win').value='5';field('Slutspel 1 Third-place match').checked=true;await field('Slutspel 1 Third-place match').fire('change');field('Slutspel 1 Third place: legs to win').value='3';
 await f.find('REVIEW CREATE EVENT').fire();const chosen=JSON.parse(f.calls[1].searchParams.get('settings'));assert.equal(chosen.groups.legs,1);assert.equal(chosen.groups.maxDarts,39);assert.equal(chosen.stage1.finalLegs,5);assert.equal(chosen.stage1.thirdPlace,true);assert.equal(chosen.stage1.thirdPlaceLegs,3);assert.equal(f.find('CREATE EVENT — TEST').disabled,true);
 await f.find('BACK TO EVENT SETUP').fire();assert.equal(field('Groups Legs to win').value,'1');assert.equal(field('Groups Limit darts per leg').checked,true);assert.equal(field('Slutspel 1 Final: legs to win').value,'5');assert.equal(field('Slutspel 1 Third-place match').checked,true);assert.equal(f.calls.length,2);
});
test('Creation UI displays server-reviewed match rules and restores editing after validation failure',async()=>{
 const f=creationUI();await f.check.fire();f.replies.length=0;f.replies.push({success:false,error:'Groups dart limit must be a multiple of 3.'});await f.find('REVIEW CREATE EVENT').fire();assert.equal(f.find('REVIEW CREATE EVENT').disabled,false);assert(f.host.children.some(n=>n.textContent.includes('multiple of 3')));assert.equal(f.all().find(n=>n.attrs?.['aria-label']==='Groups Limit darts per leg').disabled,false);
 f.replies.push({success:true,ticket:'new',event:{title:'AIK Hub TEST',date:'2026-11-08',format:'RR',matchSettings:['Groups: first to 1 leg · 39 darts','Slutspel 1: first to 2 · Final: first to 5 · Third place: off']}});await f.find('REVIEW CREATE EVENT').fire();assert(f.host.children.some(n=>n.textContent==='Groups: first to 1 leg · 39 darts'));assert(f.host.children.some(n=>n.textContent.includes('Final: first to 5')));
});

test('Creation transport carries reviewed match settings and rejects unknown request parameters',async()=>{
 let handler;const calls=[],runner={withSuccessHandler(fn){handler=fn;return this;},withFailureHandler(){return this;},beautyHubTest(action,input,token){calls.push({action,input:clone(input),token});handler({success:true,ticket:'review'});}};
 const c={URL,Promise,Set,Map,JSON,google:{script:{run:runner}},BeautyHubAuth:{token:()=> 'staff',generation:()=>1,isCurrent:()=>true}};vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+';globalThis.service=BeautyHubServices;',c);
 const u=new URL('https://beauty.invalid/hub?page=nakkacreateprepare');u.searchParams.set('title','AIK Hub TEST');u.searchParams.set('settings',JSON.stringify(matchOptions()));const r=await(await c.service.request(u.toString())).json();assert.equal(r.success,true);assert.equal(calls.length,1);assert.equal(calls[0].action,'nakkacreateprepare');assert.deepEqual(JSON.parse(calls[0].input.settings),matchOptions());assert.equal(calls[0].token,'staff');
 u.searchParams.set('tdid','t_PRODUCTION');await assert.rejects(c.service.request(u.toString()),/Blocked/);assert.equal(calls.length,1);
});

test('Creation format selection enables only chosen native stages and verifies each combination',()=>{
 for(const [groups,a,b,title]of [[true,false,false,'Round Robin only'],[false,true,false,'Slutspel 1 only'],[false,false,true,'Slutspel 2 only'],[false,true,true,'Slutspel 1 and Slutspel 2 only'],[true,true,false,'Round Robin + Slutspel 1'],[true,false,true,'Round Robin + Slutspel 2']]){
  const f=fixture(),v=matchOptions();if(!groups)v.groups=null;if(!a)v.stage1=null;else if(!groups)v.stage1.slots=8;if(!b)v.stage2=null;else if(!groups)v.stage2.slots=16;
  const p=f.prepare(v);assert.equal(p.success,true,JSON.stringify(p));assert.equal(p.event.format,title);assert.equal(f.posts().length,0);const r=f.confirm(p);assert.equal(r.success,true,JSON.stringify(r));assert.equal(f.state.created.rr_setting.round_robin,Number(groups));assert.equal(f.state.created.t_setting.tournament,Number(a));assert.equal(f.state.created.s2_setting.tournament,Number(b));assert.equal(f.posts().length,1);
  if(!groups&&a)assert.equal(f.state.created.t_setting.t_player_count,8);if(!groups&&b)assert.equal(f.state.created.s2_setting.t_player_count,16);
 }
});
test('Creation refuses all-disabled formats and invalid knockout capacities without approval or provider write',()=>{
 for(const slots of [undefined,0,3,7,129,'8',8.5]){const f=fixture(),v=matchOptions();v.groups=null;v.stage2=null;if(slots!==undefined)v.stage1.slots=slots;assert.equal(f.prepare(v).success,false);assert.equal(f.posts().length,0);assert.equal(f.cache.size,0);}
 const f=fixture();assert.equal(f.prepare({groups:null,stage1:null,stage2:null}).success,false);assert.equal(f.cache.size,0);const v=matchOptions();v.groups=null;v.stage2=null;v.stage1.slots=2;const p=f.prepare(v);assert.equal(p.success,true);const set=JSON.parse([...f.cache.values()][0]).set;assert.equal(set.t_setting.t3,0);assert(!set.t_setting.game_setting.some(r=>r.round===-3));
});
test('Creation UI hides disabled stages preserves format choices on Back and sends only enabled stage options',async()=>{
 const f=creationUI();await f.check.fire();const field=label=>f.all().find(n=>n.attrs?.['aria-label']===label);const mode=field('Competition format');mode.value='rr';await mode.fire('change');assert.equal(field('Groups Legs to win').disabled,false);assert.equal(field('Slutspel 1 Legs to win').disabled,true);assert.equal(field('Enable Slutspel 1').disabled,true);
 await f.find('REVIEW CREATE EVENT').fire();let chosen=JSON.parse(f.calls.at(-1).searchParams.get('settings'));assert.equal(chosen.stage1,null);assert.equal(chosen.stage2,null);assert(chosen.groups);await f.find('BACK TO EVENT SETUP').fire();assert.equal(field('Competition format').value,'rr');
 field('Competition format').value='knockout';await field('Competition format').fire('change');field('Enable Slutspel 1').checked=false;await field('Enable Slutspel 1').fire('change');field('Slutspel 2 Bracket slots').value='32';assert.equal(field('Groups Legs to win').disabled,true);assert.equal(field('Slutspel 2 Legs to win').disabled,false);f.replies.length=0;f.replies.push({success:true,ticket:'new',event:{title:'AIK Hub TEST',date:'2026-11-08',format:'Slutspel 2 only'}});await f.find('REVIEW CREATE EVENT').fire();chosen=JSON.parse(f.calls.at(-1).searchParams.get('settings'));assert.equal(chosen.groups,null);assert.equal(chosen.stage1,null);assert.equal(chosen.stage2.slots,32);
 await f.find('BACK TO EVENT SETUP').fire();assert.equal(field('Competition format').value,'knockout');assert.equal(field('Enable Slutspel 1').checked,false);assert.equal(field('Slutspel 2 Bracket slots').value,'32');field('Enable Slutspel 2').checked=false;await field('Enable Slutspel 2').fire('change');assert.equal(f.find('REVIEW CREATE EVENT').disabled,true);
});

test('Creation accepts omitted disabled formats but still rejects altered or missing enabled rules',()=>{
 for(const mode of ['rr','knockout','single']){const f=fixture({omitDisabled:true}),v=matchOptions();if(mode==='rr'){v.stage1=null;v.stage2=null;}else if(mode==='knockout'){v.groups=null;v.stage1.slots=8;v.stage2=null;}else v.stage2=null;const r=f.confirm(f.prepare(v));assert.equal(r.success,true,JSON.stringify(r));assert.equal(f.posts().length,1);}
 const f=fixture(),v=matchOptions();v.stage1=null;v.stage2=null;const p=f.prepare(v),expected=JSON.parse([...f.cache.values()][0]).set;for(const mutate of [t=>t.t_setting={tournament:1},t=>delete t.rr_setting,t=>t.rr_setting.limit_leg_count=99]){const native=clone(expected);delete native.t_setting;delete native.s2_setting;mutate(native);assert.equal(f.c.beautyHubCreateFormatMatches_(native,expected),false);}
});
function uncertainCreation(legacy=false){const f=fixture({timeout:true,omitDisabled:true}),v=matchOptions();v.stage1=null;v.stage2=null;Object.assign(f.template.rr_setting,{startScore:501,match_type:'01'});const p=f.prepare(v);assert.equal(f.confirm(p).uncertain,true);if(legacy)delete f.audits[0].settings;return f;}
test('Existing creation recovery uses GETs only and retains original attempted journal with a separate receipt',()=>{
 for(const legacy of [false,true]){const f=uncertainCreation(legacy),key='BEAUTY_CREATE_EVENT_'+f.state.date,original=f.props.get(key);assert.equal(f.c.beautyHubNakkaEvent_({}).creationReviewRequired,true);const r=f.c.beautyHubReviewCreatedEvent_({});assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.scope,legacy?'REVIEWED_OPTIONS_ONLY':'FULL_FORMAT');assert.equal(f.props.get(key),original);assert.equal(f.posts().length,1);assert.equal(f.c.beautyHubNakkaEvent_({}).creationReviewRequired,false);assert.equal(f.prepare().success,false);assert.equal(f.posts().length,1);assert.doesNotMatch(JSON.stringify(r),/secret|join_pass/);}
});
test('Existing creation recovery rejects changed rules security identity registrations and staff without another provider write',()=>{
 for(const change of [f=>f.state.created.rr_setting.limit_leg_count=9,f=>f.state.created.join_pass='changed',f=>f.state.uid='someone-else',f=>f.state.created.rr_table=[['occupied']],f=>f.state.created.entry_list=[{tpid:'occupied'}],f=>f.state.date='2026-11-09',f=>f.audits[0].kind='wrong']){const f=uncertainCreation(true),key='BEAUTY_CREATE_EVENT_'+f.state.date,original=f.props.get(key);change(f);const r=f.c.beautyHubReviewCreatedEvent_({});assert.equal(r.success,false);assert.equal(f.props.get(key),original);assert.equal(f.posts().length,1);assert.equal([...f.props.keys()].some(k=>k.startsWith('BEAUTY_CREATE_REVIEW_')),false);}
 const f=uncertainCreation();f.state.created.rr_setting.startScore=301;assert.equal(f.c.beautyHubReviewCreatedEvent_({}).success,false);assert.equal(f.posts().length,1);
});
test('Matched-event UI offers explicit existing-event verification without a creation route',async()=>{
 const f=creationUI({replies:[{status:'MATCHED',message:'Found',creationReviewRequired:true},{success:true,message:'Existing event verified without recreation'}]});await f.check.fire();assert.equal(f.find('REVIEW CREATE EVENT'),undefined);const verify=f.find('VERIFY EXISTING EVENT');assert(verify);const request=verify.fire();verify.fire();await request;assert.deepEqual(f.calls.map(u=>u.searchParams.get('page')),['nakkaevent','nakkacreaterecover']);assert(f.find('Existing event verified without recreation'));
});

function eveningFixture(){const options={omitDisabled:true,afterCreate:t=>{t.updateTime=100;t.entry_list=[];}},f=fixture(options),v=matchOptions();v.stage1=null;v.stage2=null;Object.assign(f.template.rr_setting,{startScore:501,match_type:'01'});assert.equal(f.confirm(f.prepare(v)).success,true);return {...f,options,read:()=>f.c.beautyHubEveningSetup_('read',{})};}
test('Evening Setup reads actual native format rules and event status without exposing private fields or writing',()=>{
 const f=eveningFixture(),before=f.posts().length,r=f.read();assert.equal(r.success,true,JSON.stringify(r));assert.equal(r.setup.format,'Round Robin only');assert.match(r.setup.rows[0].text,/First to 1 leg.*39 darts.*13 rounds/);assert.deepEqual(clone(r.setup.rows.slice(1).map(v=>v.text)),['Off','Off']);assert.equal(r.setup.editable,true);assert.equal(r.setup.pools,'No pools sent');assert.equal(r.setup.registered,0);assert.equal(f.posts().length,before);assert.doesNotMatch(JSON.stringify(r),/secret|join_pass|authorization/i);
 f.state.created.rr_setting.limit_leg_count=3;assert.match(f.read().setup.rows[0].text,/First to 3 legs/);
});
test('Evening Setup explicitly reviews and saves changed settings once with native readback and no recreation',()=>{
 const f=eveningFixture(),read=f.read(),v=matchOptions();v.stage1=null;v.stage2=null;v.groups.legs=2;v.groups.maxDarts=null;const p=f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(v),version:read.version});assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.posts().length,1);assert.match(p.summary[0],/first to 2 legs.*No dart limit/);
 const r=f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true,JSON.stringify(r));assert.equal(f.posts().length,2);assert.equal(f.state.created.rr_setting.limit_leg_count,2);assert.equal(f.state.created.rr_setting.limit_rounds,0);assert.equal(f.state.created.t_setting,undefined);assert.equal(f.read().setup.format,'Round Robin only');assert.equal(f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.posts().length,2);
});
test('Evening Setup rejects stale expired unacknowledged and changed-session saves before provider writes',()=>{
 for(const change of [f=>f.state.created.updateTime++,f=>f.state.session='other',f=>{for(const [key,text]of f.cache)if(key.startsWith('beauty-evening:')){const v=JSON.parse(text);v.expires=0;f.cache.set(key,JSON.stringify(v));}}]){const f=eveningFixture(),r=f.read(),p=f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(matchOptions()),version:r.version});assert.equal(p.success,true);change(f);assert.equal(f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.posts().length,1);}
 const f=eveningFixture(),r=f.read();f.state.created.updateTime++;assert.equal(f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(matchOptions()),version:r.version}).success,false);assert.equal(f.posts().length,1);
});
test('Evening Setup shows but blocks edits after start sent pools or unresolved creation and preserves uncertain saves',()=>{
 for(const change of [f=>f.state.created.status=30,f=>f.state.created.rr_table=[['occupied']],f=>f.props.set('BEAUTY_POOL_SEND_'+f.state.created.tdid,'{}')]){const f=eveningFixture();change(f);const r=f.read();assert.equal(r.success,true);assert.equal(r.setup.editable,false);assert.equal(f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(matchOptions()),version:r.version}).success,false);assert.equal(f.posts().length,1);}
 const f=eveningFixture(),r=f.read(),p=f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(matchOptions()),version:r.version});f.options.updateTimeout=true;const saved=f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'});assert.equal(saved.uncertain,true);assert.equal(f.posts().length,2);assert.equal(JSON.parse(f.props.get('BEAUTY_EVENT_SETTINGS_'+f.state.created.tdid)).state,'ATTEMPTED');assert.equal(f.read().setup.editable,false);assert.equal(f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'}).success,false);assert.equal(f.posts().length,2);
});
test('Evening Setup enables a missing knockout format while preserving registrations and unrelated native fields',()=>{
 const f=eveningFixture();f.state.created.entry_list=[{tpid:'P1',name:'Player'}];f.state.created.description='Keep';const r=f.read(),v=matchOptions();v.groups=null;v.stage1.slots=8;v.stage2=null;const p=f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(v),version:r.version});assert.equal(p.success,true,JSON.stringify(p));assert(p.summary.some(s=>s.includes('8 bracket slots')));const saved=f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'});assert.equal(saved.success,true,JSON.stringify(saved));assert.equal(f.state.created.rr_setting,undefined);assert.equal(f.state.created.t_setting.tournament,1);assert.equal(f.state.created.t_setting.t_player_count,8);assert.equal(f.state.created.t_setting.startScore,501);assert.equal(f.state.created.entry_list[0].tpid,'P1');assert.equal(f.state.created.description,'Keep');assert.equal(f.posts().length,2);
});
test('Evening Setup refuses provider readback mismatch and target injection and shows pending creation review',()=>{
 const f=eveningFixture(),r=f.read();for(const input of [{tdid:'t_OTHER'},{version:r.version}])assert.equal(f.c.beautyHubEveningSetup_('read',input).success,false);assert.equal(f.posts().length,1);
 const p=f.c.beautyHubEveningSetup_('prepare',{settings:JSON.stringify(matchOptions()),version:r.version});f.options.afterUpdate=t=>t.description='unexpected';assert.equal(f.c.beautyHubEveningSetup_('confirm',{ticket:p.ticket,confirmed:'true'}).uncertain,true);assert.equal(f.read().setup.editable,false);assert.equal(f.posts().length,2);
 const pending=uncertainCreation(true);pending.state.created.updateTime=100;const setup=pending.c.beautyHubEveningSetup_('read',{});assert.equal(setup.success,true,JSON.stringify(setup));assert.equal(setup.setup.creationReviewRequired,true);assert.equal(setup.setup.editable,false);assert.equal(pending.posts().length,1);
});
test('New event defaults limit all stages to 39 darts and Monday preset restores both A and B while keeping chosen legs',async()=>{
 const f=creationUI();await f.check.fire();const field=label=>f.all().find(n=>n.attrs?.['aria-label']===label);for(const stage of ['Groups','Slutspel 1','Slutspel 2'])assert.equal(field(stage+' Limit darts per leg').checked,true);
 field('Competition format').value='rr';await field('Competition format').fire('change');field('Groups Legs to win').value='4';await f.find('USE MONDAY SETUP — RR + A/B').fire();assert.equal(f.calls.length,1);assert.equal(field('Competition format').value,'combined');assert.equal(field('Enable Slutspel 1').checked,true);assert.equal(field('Enable Slutspel 2').checked,true);assert.equal(field('Groups Legs to win').value,'4');
 field('Slutspel 2 Limit darts per leg').checked=false;await field('Slutspel 2 Limit darts per leg').fire('change');await f.find('REVIEW CREATE EVENT').fire();const v=JSON.parse(f.calls.at(-1).searchParams.get('settings'));assert.equal(v.groups.maxDarts,39);assert.equal(v.stage1.maxDarts,39);assert.equal(v.stage2.maxDarts,null);assert.equal(v.groups.legs,4);
});

test('New event creation is independent of deleted test events and never copies their players scores or averages',()=>{
 const f=fixture({templateMissing:true});Object.assign(f.template.rr_setting,{startScore:301,average:167});f.template.t_setting.t3=1;const p=f.prepare();assert.equal(p.success,true,JSON.stringify(p));assert.equal(f.calls.some(c=>c.path==='tournament/get?tdid=t_QHaG_7792'),false);const saved=JSON.parse([...f.cache.values()][0]);assert.doesNotMatch(JSON.stringify(saved.set),/OLD|average|167/);assert.equal(saved.set.rr_setting.startScore,501);assert.equal(saved.set.rr_setting.rounds,13);assert.equal(saved.set.t_setting.t3,0);assert.equal(saved.set.t_setting.game_setting[0].limit_leg_count,3);assert.equal(f.confirm(p).success,true);assert.equal(f.posts().length,1);
});
