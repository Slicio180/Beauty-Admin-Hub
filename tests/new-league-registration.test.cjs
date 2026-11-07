const test=require('node:test'),assert=require('node:assert/strict');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const fresh={...input,selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'New Person'};
const send=(h,route,data=fresh)=>route==='HUB'?h.register(data):h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](data);
const again=(h)=>h.context.beautyHubNewLeagueIdentity_({success:true,existingPlayer:false,player:'New Person'},input.eventDate);
for(const source of ['HUB','MOBIL','KIOSK'])test(source+' new registration creates one league identity then links one TEST event entry',()=>{
 const h=registration({newLeague:true,noAuth:source!=='HUB'}),r=send(h,source);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.rows.length,1);assert.equal(h.rows[0][5],source);assert.equal(h.posts().length,2);assert.ok(h.posts()[0].url.endsWith('league/entry/update'));assert.ok(h.posts()[1].url.endsWith('tournament/entry/update'));assert.equal(JSON.parse(h.posts()[1].options.payload).add[0].lpid,'n123');assert.ok([...h.props.values()].some(v=>{try{return JSON.parse(v).state==='VERIFIED'&&JSON.parse(v).lpid==='n123';}catch{return false;}}));assert.equal(h.held,false);assert.equal(h.context.beautyHubPlayerContext_,null);
 const duplicate=send(h,source,{...input,selectedName:'New Person',identityChoice:'existing',identityBase:'New Person'});assert.equal(duplicate.code,'ALREADY_REGISTERED');assert.equal(h.posts().length,2);
});
test('Different-person nickname creates its own league member without changing the base player',()=>{
 const h=registration({newLeague:true}),r=h.register({...fresh,newName:'Anna',identityChoice:'different',identityBase:'Anna',identityDetail:'Other',identityConfirmedName:'Anna (Other)'});assert.equal(r.player,'Anna (Other)');assert.equal(r.nakka.entryConfirmed,true);assert.deepEqual(h.state.league[0],{name:'Anna',lpid:'a123'});assert.equal(h.state.league[1].name,'Anna (Other)');assert.equal(h.state.entries[0].lpid,'n123');
});
test('A new Beauty identity reuses a unique existing league member without another league add',()=>{
 const h=registration({newLeague:true,state:{league:[{name:'New Person',lpid:'a123'}]}}),r=h.register(fresh);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.posts().length,1);assert.equal(h.state.league.length,1);assert.equal(h.state.entries[0].lpid,'a123');
});
test('New league creation fails closed for wrong target started event duplicate name oversized list and unlinked event entry',()=>{
 const cases=[{otherTarget:true},{state:{event:{tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',title:'Beauty Registration TEST event DO NOT USE LIVE',status:30,t_date:1793124000,updateTime:1000}}},{state:{league:[{name:'New Person',lpid:'a123'},{name:'NEW PERSON',lpid:'z123'}]}},{state:{league:Array.from({length:1000},(_,i)=>({name:'P'+i,lpid:i.toString(36).padStart(4,'0')}))}},{state:{entries:[{name:'New Person',tpid:'b123'}]}}];
 for(const o of cases){const h=registration({...o,newLeague:true}),r=h.register(fresh);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);assert.equal(h.held,false);}
});
test('Uncertain league creation retains registration blocks event add and is never retried',()=>{
 for(const o of [{creationTimeout:true},{creationBadReceipt:true},{creationMissing:true},{creationAlterOld:true}]){
  const h=registration({...o,newLeague:true}),r=h.register(fresh);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(r.nakka.code,'LEAGUE_CREATION_UNCERTAIN');assert.equal(h.posts().length,1);assert.equal(h.rows.length,1);assert.equal(again(h).code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(h.posts().length,1);
  if(h.state.league.some(x=>x.name==='New Person')){const preview=h.context.beautyHubNakkaTransfer_('preview',{player:'New Person'});assert.equal(preview.code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(h.posts().length,1);}
 }
});
test('Verified league creation is reusable read-only while mismatched journals block',()=>{
 const h=registration({newLeague:true});h.register(fresh);assert.equal(again(h).success,true);assert.equal(h.posts().length,2);const key=[...h.props.keys()].find(k=>k.startsWith('BEAUTY_NAKKA_LEAGUE_CREATE_'));const record=JSON.parse(h.props.get(key));record.lpid='z123';h.props.set(key,JSON.stringify(record));assert.equal(again(h).code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(h.posts().length,2);
});
test('Creation journal failure and stale date or source state prevent the league POST',()=>{
 for(const o of [{journalFailure:true},{onFetch:({url,state})=>{if(url.includes('league/entry/list'))state.date='2026-10-28';}},{onFetch:({url,state})=>{if(url.includes('league/entry/list'))state.hub[0].status='OUT';}}]){const h=registration({...o,newLeague:true}),r=h.register(fresh);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,0);}
});
test('League identity swaps after creation cannot substitute a different player ID in the event add',()=>{
 let reads=0;const h=registration({newLeague:true,onFetch:({url,state})=>{if(url.includes('league/entry/list')&&++reads===4)state.league.at(-1).lpid='z123';}}),r=h.register(fresh);assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,false);assert.equal(h.posts().length,1);
});
test('Event timeout after verified creation does not repeat either mutation',()=>{
 const h=registration({newLeague:true,postTimeout:true}),r=h.register(fresh);assert.equal(r.success,true);assert.equal(r.nakka.code,'TRANSFER_UNCERTAIN');assert.equal(h.posts().length,2);assert.equal(again(h).success,true);assert.equal(h.posts().length,2);assert.equal(h.rows.length,1);
});
test('Creation helper requires enabled gates canonical saved input current day and valid authority',()=>{
 for(const options of [{autoDisabled:true},{disableActualWrites:true},{writes:false},{noAuth:true}]){const h=registration({...options,newLeague:true});const r=again(h);assert.equal(r.success,false);assert.equal(h.posts().length,0);}
 const h=registration({newLeague:true});for(const saved of [null,{success:false,existingPlayer:false,player:'New Person'},{success:true,existingPlayer:false,player:'x'.repeat(61)}]){assert.equal(h.context.beautyHubNewLeagueIdentity_(saved,input.eventDate).success,false);assert.equal(h.posts().length,0);}
 h.state.hub=[{name:'New Person',status:'IN'}];assert.equal(h.context.beautyHubNewLeagueIdentity_({success:true,existingPlayer:false,player:'New Person'},'2026-10-28').code,'STALE_EVENT');assert.equal(h.posts().length,0);
});

test('Existing Beauty master player absent from Nakka is created and entered using the same guarded flow',()=>{
 const h=registration({newLeague:true,state:{league:[]}}),r=h.register();assert.equal(r.success,true);assert.equal(r.existingPlayer,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.posts().length,2);assert.equal(h.state.league[0].name,'Anna');assert.equal(h.state.entries[0].lpid,'n123');
});
