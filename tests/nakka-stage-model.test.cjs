const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../public/js/nakka-stage-model.js');
function fixture(){return [{result:0,tournament:{tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',title:'TEST',status:30,join_pass:'SECRET',entry_list:[{tpid:'aaaa',name:'Adam'},{tpid:'bbbb',name:'Bea'}],t_table:[['aaaa','bbbb'],['bbbb']],t_result:[{aaaa:{bbbb:{r:0,a:40}},bbbb:{aaaa:{r:2,a:50}}}]}},{result:0,tdid:'t_QHaG_7792',groups:[{kind:'lg',index:0,players:[{tpid:'bbbb',rank:1,p:1,w:1,l:0,pts:2},{tpid:'aaaa',rank:2,p:1,w:0,l:1,pts:0}]}]}];}
test('stage model preserves provider standings scores and advancement without exposing secrets',()=>{
 const f=fixture(),before=JSON.stringify(f),out=project(...f);assert.equal(JSON.stringify(f),before);assert.equal(out.pools[0].players[0].name,'Bea');assert.equal(out.pools[0].players[1].points,0);assert.equal(out.pools[0].players[0].wins,1);assert.equal(out.pools[0].players[1].losses,1);const native=fixture();native[1].groups[0].kind='rr';native[1].groups[0].players=[{tpid:'aaaa',rank:1,win:1,lose:0},{tpid:'bbbb',rank:3,win:0,lose:1}];assert.deepEqual(project(...native).pools[0].players.map(p=>[p.wins,p.losses]),[[1,0],[0,1]]);
 assert.equal(out.knockouts[0].rounds[0].matches[0].leftScore,0);assert.equal(out.knockouts[0].rounds[1].matches[0].left.id,'bbbb');assert.doesNotMatch(JSON.stringify(out),/SECRET|join_pass/);
});
test('stage model distinguishes pending slots byes and unknown scores without manufacturing winners',()=>{
 const f=fixture();f[0].tournament.t_table=[['aaaa','empty'],['','']];f[1].groups=[];const out=project(...f);assert.equal(out.knockouts[0].rounds[0].matches[0].right.state,'bye');assert.equal(out.knockouts[0].rounds[1].matches[0].left.state,'pending');assert.equal(out.knockouts[0].rounds[0].matches[0].leftScore,null);
});
test('stage model refuses cross-event data unknown identities and duplicate standings identities',()=>{
 let f=fixture();f[1].tdid='other';assert.throws(()=>project(...f));f=fixture();f[0].tournament.t_table[0][0]='unknown';assert.throws(()=>project(...f));f=fixture();f[1].groups[0].players.push(f[1].groups[0].players[0]);assert.throws(()=>project(...f));
});

test('stage model omits explicitly disabled knockouts and publishes only enabled competition views',()=>{
 const f=fixture();f[0].tournament.t_setting={tournament:0};f[0].tournament.s2_setting={tournament:1};f[0].tournament.rr_setting={round_robin:0};f[0].tournament.s2_table=[['aaaa','bbbb'],['']];f[1].groups=[];const out=project(...f);assert.deepEqual(out.knockouts.map(s=>s.kind),['s2']);assert.deepEqual(out.views,{pools:false,t:false,s2:true});f[0].tournament.rr_setting.round_robin=1;f[0].tournament.s2_setting.tournament=0;assert.deepEqual(project(...f).views,{pools:true,t:false,s2:false});
});

test('stage model validates selected standalone and league scopes without accepting other events',()=>{
 for(const league of ['', 'lg_tM2v_3523']){
  const f=fixture(),id='t_ca7M_0142';f[0].tournament.tdid=id;f[0].tournament.lgid=league;f[1].tdid=id;
  assert.equal(project(f[0],f[1],undefined,id,league).pools.length,1);
  assert.throws(()=>project(f[0],f[1],undefined,id,'lg_wrong'));
  assert.throws(()=>project(f[0],f[1],undefined,'t_wrong',league));
 }
 const f=fixture();delete f[0].tournament.lgid;assert.equal(project(f[0],f[1],undefined,'t_QHaG_7792','').pools.length,1);
 assert.throws(()=>project(f[0],f[1],undefined,'t_QHaG_7792',null));
});
