const assert=require('node:assert/strict'),{makeVerifiers}=require('./verification.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const r={requestId:'registration_0001',event:{mode:'league',leagueId:'lg_fixture',eventId:'t_fixture',date:'2026-11-16',revision:'rev1',sheetId:'TEST_ONLY'},playerId:'identity1',player:'TEST PLAYER',consent:'JA',source:'HUB',message:'TEST'};const data={save:[{requestId:r.requestId,request:clone(r),state:'ACTIVE',recordId:'row1'}],provider:[{tpid:'ABCD',lpid:'EFGH',name:r.player}],display:[{requestId:r.requestId,playerId:r.playerId,player:r.player,status:'IN',consent:'JA',source:'HUB',message:'TEST',recordId:'display1'}]};let binding={request:clone(r),tpid:'ABCD',lpid:'EFGH'},complete=true,other=false;const io={assertContext:()=>{},readFresh:(kind,e)=>({event:other?{...e,eventId:'t_wrong'}:e,complete,rows:data[kind]}),readBinding:()=>binding};return {r,data,io,v:makeVerifiers(io),binding:x=>binding=x,incomplete:()=>complete=false,wrongEvent:()=>other=true,run(k){return this.v[k](r,r.requestId+':'+k);}};}
let n=0;function test(name,f){f();n++;console.log('PASS '+name);}
test('all exact proofs succeed',()=>{const f=fixture();for(const k of ['save','provider','display'])assert.equal(f.run(k).verified,true);});
test('same name without durable binding cannot clear',()=>{const f=fixture();f.binding(null);assert.throws(()=>f.run('provider'),/BINDING_MISSING/);});
test('duplicate provider names cannot clear',()=>{const f=fixture();f.data.provider.push({...f.data.provider[0],tpid:'IJKL'});assert.throws(()=>f.run('provider'),/IDENTITY_UNCONFIRMED/);});
test('provider identity mismatch cannot clear',()=>{const f=fixture();f.data.provider[0].lpid='WRNG';assert.throws(()=>f.run('provider'),/IDENTITY_CONFLICT/);});
test('partial provider response cannot clear',()=>{const f=fixture();f.incomplete();assert.throws(()=>f.run('provider'),/SNAPSHOT/);});
test('wrong event cannot clear',()=>{const f=fixture();f.wrongEvent();assert.throws(()=>f.run('save'),/SNAPSHOT/);});
test('removed saved registration cannot clear',()=>{const f=fixture();f.data.save[0].state='REMOVED';assert.throws(()=>f.run('save'),/CONFLICT/);});
test('stale consent cannot clear',()=>{const f=fixture();f.data.display[0].consent='NEJ';assert.throws(()=>f.run('display'),/DISPLAY_CONFLICT/);});
test('name-only display cannot clear',()=>{const f=fixture();delete f.data.display[0].requestId;assert.throws(()=>f.run('display'),/DISPLAY_CONFLICT/);});
test('duplicated display row cannot clear',()=>{const f=fixture();f.data.display.push(clone(f.data.display[0]));assert.throws(()=>f.run('display'),/IDENTITY_UNCONFIRMED/);});
test('context checked after read',()=>{const f=fixture();let reads=0;f.io.assertContext=()=>{if(++reads===2)throw Error('EVENT_SWITCH');};assert.throws(()=>f.run('save'),/EVENT_SWITCH/);});
test('wrong operation cannot clear',()=>{const f=fixture();assert.throws(()=>f.v.save(f.r,'other'),/OPERATION/);});
console.log(JSON.stringify({result:'PASS',checks:n,scope:'synthetic verifier contract only; no native adapter'}));
