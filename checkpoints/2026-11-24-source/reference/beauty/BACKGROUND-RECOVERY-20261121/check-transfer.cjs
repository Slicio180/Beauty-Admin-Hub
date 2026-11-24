const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'candidate/HubTestNakkaTransfer.gs'),'utf8'),results=[],clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('base64url');
function f(){
 const state={event:{id:'t_TEST_1234',title:'TEST',date:'2026-11-21',status:20,updateTime:1},hub:[{name:'Synthetic 06',status:'IN'}],identity:{name:'Synthetic 06',lpid:'L006'},entries:[],existing:null};
 const key='BEAUTY_NAKKA_TRANSFER_t_TEST_1234_L006',props={N01_API_USER:'fixture',N01_API_PASSWORD:'fixture'},cache={},calls=[];
 const c={Date,JSON,Object,Array,Error,Set,console,BEAUTY_IDENTITY_WRITES_ENABLED_:true,beautyBackgroundInvocation_:{operation:'registration'},beautyHubRequestToken_:null,
  beautyHubTestGuard_:()=>{},beautyHubAutoLockHeld_:()=>true,beautyHubAuthRequire_:()=>{throw Error('AUTH_REQUIRED');},
  beautyBackgroundRequire_:()=>({uid:'worker',sessionBinding:'claim'}),beautyHubLeagueId_:()=> 'lg_TEST_1234',beautyContextStandalone_:()=>false,
  beautyHubActiveTestTarget_:()=>({id:state.event.id,title:state.event.title}),beautyHubNakkaDate_:()=>({date:state.event.date}),beautyHubNakkaHubRows_:()=>clone(state.hub),
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>props[k]=v})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k]??null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
  Utilities:{base64Encode:()=> 'fixture',getUuid:()=> 'a'.repeat(32),formatDate:()=>state.event.date}};
 vm.createContext(c);vm.runInContext(source,c);
 Object.assign(c,{beautyHubTransferHash_:hash,beautyHubTransferState_:()=>clone(state),beautyHubTransferFetch_:(path,auth,payload)=>{
  calls.push({path,payload:payload?clone(payload):null});
  if(payload){assert.equal(JSON.parse(props[key]).state,'ATTEMPTED');state.entries=[{name:'Synthetic 06',lpid:'L006',tpid:'E006'}];if(c.loseReply)throw Error('lost provider response');return {added:clone(state.entries)};}
  if(path.startsWith('tournament/get'))return {tournament:{tdid:state.event.id,lgid:'lg_TEST_1234',title:state.event.title,status:20,updateTime:1,t_date:1795287600}};
  return {list:clone(state.entries)};
 }});
 const prior={state:'ATTEMPTED',event:clone(state.event),identity:clone(state.identity),beforeCount:0,beforeHash:hash([])};
 const preview=()=>c.beautyHubNakkaTransferRun_('preview',{player:'Synthetic 06'});
 const save=ticket=>c.beautyHubNakkaTransferRun_('save',{player:'Synthetic 06',confirmed:'true',ticket});
 return {c,state,props,calls,key,prior,preview,save};
}
function test(name,fn){fn();results.push({name,result:'PASS'});}
test('Fresh first add records ATTEMPTED before provider mutation and verifies readback',()=>{const x=f(),p=x.preview(),r=x.save(p.ticket);assert.equal(r.readbackVerified,true);assert.equal(x.calls.filter(x=>x.payload).length,1);assert.equal(JSON.parse(x.props[x.key]).state,'VERIFIED');});
test('Missing entry after ATTEMPTED is review-only with zero provider writes',()=>{const x=f();x.props[x.key]=JSON.stringify(x.prior);const before=x.props[x.key],r=x.preview();assert.equal(r.code,'TRANSFER_REVIEW_REQUIRED');assert.equal(x.props[x.key],before);assert.equal(x.calls.length,0);});
test('Matching entry after lost reply is verified without replaying or rewriting attempt',()=>{const x=f();x.props[x.key]=JSON.stringify(x.prior);const before=x.props[x.key];x.state.existing={name:'Synthetic 06',lpid:'L006',tpid:'E006'};x.state.entries=[x.state.existing];const r=x.preview();assert.equal(r.status,'PRESENT_AFTER_ATTEMPT');assert.equal(r.readbackVerified,true);assert.equal(x.props[x.key],before);assert.equal(x.calls.length,0);});
test('Ambiguous existing entry cannot get staff-review authority from background context',()=>{const x=f();x.props[x.key]=JSON.stringify({...x.prior,beforeCount:9});x.state.existing={name:'Synthetic 06',lpid:'L006',tpid:'E006'};x.state.entries=[x.state.existing];const r=x.preview();assert.equal(r.code,'TRANSFER_REVIEW_REQUIRED');assert.equal(r.ticket,undefined);assert.equal(x.calls.length,0);});
test('A confirmed entry that later disappears is not added again',()=>{const x=f();x.props[x.key]=JSON.stringify({...x.prior,state:'VERIFIED',tpid:'E006'});const r=x.preview();assert.equal(r.code,'TRANSFER_REVIEW_REQUIRED');assert.equal(x.calls.length,0);});
test('Lost POST response followed by reconciliation sends exactly one mutation',()=>{const x=f(),p=x.preview();x.c.loseReply=true;assert.equal(x.save(p.ticket).code,'TRANSFER_UNCERTAIN');x.state.existing=x.state.entries[0];const r=x.preview();assert.equal(r.readbackVerified,true);assert.equal(x.calls.filter(c=>c.payload).length,1);assert.equal(JSON.parse(x.props[x.key]).state,'ATTEMPTED');});
test('Uncertain prior league creation blocks event add',()=>{const x=f();x.props['BEAUTY_NAKKA_LEAGUE_CREATE_lg_TEST_1234_'+hash('synthetic 06')]=JSON.stringify({state:'ATTEMPTED',name:'Synthetic 06'});assert.equal(x.preview().code,'LEAGUE_CREATION_REVIEW_REQUIRED');assert.equal(x.calls.length,0);});
test('Closed event prevents a first background add',()=>{const x=f();x.state.event.status=40;assert.equal(x.preview().code,'EVENT_REGISTRATION_CLOSED');assert.equal(x.calls.length,0);});
test('Consumed ticket cannot repeat an add',()=>{const x=f(),p=x.preview();assert.equal(x.save(p.ticket).readbackVerified,true);assert.equal(x.save(p.ticket).code,'STALE_TRANSFER');assert.equal(x.calls.filter(c=>c.payload).length,1);});
test('A changed preview fingerprint prevents provider POST',()=>{const x=f(),p=x.preview();x.state.event.updateTime++;assert.equal(x.save(p.ticket).code,'STALE_TRANSFER');assert.equal(x.calls.filter(c=>c.payload).length,0);});
fs.writeFileSync(path.join(__dirname,'TRANSFER-CHECKS.json'),JSON.stringify({result:'PASS',checks:results.length,results},null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:results.length}));
