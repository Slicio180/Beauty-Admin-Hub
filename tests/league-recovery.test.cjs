const {test}=require('node:test'),assert=require('node:assert/strict');
const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');
const saved=()=>registration({newLeague:true,state:{league:[],hub:[{name:'Anna',status:'IN'}]}});
const preview=h=>h.context.beautyHubTest('nakkaleaguepreview',{player:'Anna'},'session');
const save=(h,p)=>h.context.beautyHubTest('nakkaleaguesave',{player:'Anna',ticket:p.ticket,confirmed:'true'},'session');
test('Missing league profile recovery previews without writes then creates one profile and event entry without registration append',()=>{
 const h=saved(),p=preview(h);assert.equal(p.status,'CREATE_LEAGUE_PREVIEW');assert.equal(h.posts().length,0);assert.equal(h.rows.length,0);
 const r=save(h,p);assert.equal(r.success,true);assert.equal(r.readbackVerified,true);assert.equal(h.posts().length,2);assert.equal(h.rows.length,0);assert.equal(h.state.hub.length,1);assert.equal(h.state.league.length,1);assert.equal(h.state.entries.length,1);assert.equal(h.held,false);
 assert.equal(save(h,p).code,'STALE_TRANSFER');assert.equal(h.posts().length,2);assert.equal(preview(h).success,false);
});
test('League recovery refuses duplicate existing standalone OUT and started targets',()=>{
 for(const change of [h=>h.state.league.push({name:'Anna',lpid:'a123'}),h=>h.state.league.push({name:'Anna',lpid:'a123'},{name:'ANNA',lpid:'z123'}),h=>h.state.hub[0].status='OUT',h=>h.state.event.status=30,h=>h.context.beautyContextStandalone_=()=>true,h=>h.state.entries.push({name:'Anna',tpid:'b123'})]){
  const h=saved();change(h);assert.equal(preview(h).success,false);assert.equal(h.posts().length,0);assert.equal(h.rows.length,0);
 }
});
test('League recovery never bypasses uncertain or verified historical creation and event transfer records',()=>{
 for(const kind of ['creation','transfer'])for(const state of ['ATTEMPTED','VERIFIED','garbage']){
  const h=saved(),key=kind==='creation'?'BEAUTY_NAKKA_LEAGUE_CREATE_lg_M2wQ_4189_'+h.context.beautyHubTransferHash_('anna'):'BEAUTY_NAKKA_TRANSFER_t_QHaG_7792_a123';
  const text=state==='garbage'?'invalid':JSON.stringify({state,identity:{name:'Anna',lpid:'a123'}});h.props.set(key,text);
  assert.equal(preview(h).success,false);assert.equal(h.props.get(key),text);assert.equal(h.posts().length,0);
 }
});
test('League recovery confirmation rejects changed roster date target identity and session',()=>{
 for(const change of [h=>h.state.hub.push({name:'Other',status:'IN'}),h=>h.state.date='2026-10-28',h=>h.target.id='t_OTHER',h=>h.state.league.push({name:'Anna',lpid:'a123'}),h=>h.state.uid='someone-else']){
  const h=saved(),p=preview(h);change(h);assert.equal(save(h,p).success,false);assert.equal(h.posts().length,0);assert.equal(h.rows.length,0);
 }
});
test('League recovery is staff-only with exact input and one-use expiring preview tickets',()=>{
 const h=saved();assert.equal(h.context.beautyHubTest('nakkaleaguepreview',{player:'ANNA'},'session').success,false);for(const extra of [{confirmed:'true'},{eventId:'t_OTHER'},{lpid:'a123'}])assert.equal(h.context.beautyHubTest('nakkaleaguepreview',{player:'Anna',...extra},'session').success,false);
 const p=preview(h);const cached=JSON.parse(h.cache.get('beauty-league-recovery:'+p.ticket));cached.expires=1;h.cache.set('beauty-league-recovery:'+p.ticket,JSON.stringify(cached));assert.equal(save(h,p).code,'STALE_TRANSFER');
 h.context.beautyHubPlayerContext_={};assert.equal(preview(h).code,'AUTH_REQUIRED');assert.equal(h.posts().length,0);
 const unauth=registration({noAuth:true});assert.equal(preview(unauth).code,'AUTH_REQUIRED');assert.equal(unauth.posts().length,0);
});
test('League recovery preserves uncertain creation journal and never repeats the POST',()=>{
 const h=registration({newLeague:true,creationTimeout:true,state:{league:[],hub:[{name:'Anna',status:'IN'}]}}),p=preview(h),r=save(h,p);assert.equal(r.code,'LEAGUE_CREATION_UNCERTAIN');assert.equal(h.posts().length,1);assert.equal(h.rows.length,0);
 const entries=[...h.props.entries()].filter(([k])=>k.startsWith('BEAUTY_NAKKA_LEAGUE_CREATE_'));assert.equal(JSON.parse(entries[0][1]).state,'ATTEMPTED');assert.equal(save(h,p).success,false);assert.equal(preview(h).success,false);assert.equal(h.posts().length,1);assert.equal(h.props.get(entries[0][0]),entries[0][1]);
});
test('League recovery keeps a verified profile when event transfer is uncertain without repeating creation',()=>{
 const h=registration({newLeague:true,postTimeout:true,state:{league:[],hub:[{name:'Anna',status:'IN'}]}}),p=preview(h),r=save(h,p);assert.equal(r.success,false);assert.equal(r.code,'TRANSFER_UNCERTAIN');assert.equal(h.posts().length,2);assert.equal(h.rows.length,0);assert.equal(preview(h).success,false);assert.equal(h.posts().length,2);
});
test('Automatic league creation retries one pre-send busy result across all registration sources',()=>{
 for(const route of ['HUB','MOBIL','KIOSK']){
  const h=registration({newLeague:true,noAuth:route!=='HUB',state:{league:[]}}),original=h.context.beautyHubNewLeagueIdentity_;let calls=0;
  h.context.beautyHubNewLeagueIdentity_=(...a)=>++calls===1?{success:false,code:'TRANSFER_BUSY'}:original(...a);
  const r=route==='HUB'?h.register():h.context[route==='MOBIL'?'submitRegistration':'submitKioskRegistration'](input);
  assert.equal(r.nakka.entryConfirmed,true);assert.equal(calls,2);assert.equal(h.rows.length,1);assert.equal(h.posts().length,2);
 }
});
test('Automatic league creation retries a real pre-send snapshot conflict without duplicate creation',()=>{
 let reads=0;const h=registration({newLeague:true,state:{league:[]},onFetch:({url,state})=>{if(url.includes('league/entry/list')&&++reads===2)state.event.updateTime++;}}),r=h.register();
 assert.equal(r.nakka.entryConfirmed,true);assert.equal(h.posts().length,2);assert.equal(h.rows.length,1);assert.equal(h.state.league.length,1);
});
test('Automatic league creation retry is bounded and stops on event change or uncertainty',()=>{
 for(const code of ['TRANSFER_BUSY','STALE_TRANSFER','LEAGUE_CREATION_UNCERTAIN','LEAGUE_CREATION_REVIEW_REQUIRED']){
  const h=registration({state:{league:[]}});let calls=0;h.context.beautyHubNewLeagueIdentity_=()=>{calls++;return {success:false,code};};const r=h.register();assert.equal(r.nakka.entryConfirmed,false);assert.equal(calls,['TRANSFER_BUSY','STALE_TRANSFER'].includes(code)?2:1);assert.equal(h.posts().length,0);assert.equal(h.rows.length,1);
 }
 const h=registration({state:{league:[]}});let calls=0;h.context.beautyHubNewLeagueIdentity_=()=>{calls++;h.target.id='t_OTHER';return {success:false,code:'TRANSFER_BUSY'};};assert.equal(h.register().nakka.code,'STALE_EVENT');assert.equal(calls,1);
});
