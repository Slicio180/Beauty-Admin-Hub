const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../public/js/nakka-stage-model.js');
function fixture(){return [{result:0,tournament:{tdid:'t_RqC2_2034',lgid:'lg_tM2v_3523',title:'TEST',status:30,join_pass:'SECRET',entry_list:[{tpid:'aaaa',name:'Adam'},{tpid:'bbbb',name:'Bea'}],t_table:[['aaaa','bbbb'],['bbbb']],t_result:[{aaaa:{bbbb:{r:0,a:40}},bbbb:{aaaa:{r:2,a:50}}}]}},{result:0,tdid:'t_RqC2_2034',groups:[{kind:'lg',index:0,players:[{tpid:'bbbb',rank:1,p:1,w:1,l:0,pts:2},{tpid:'aaaa',rank:2,p:1,w:0,l:1,pts:0}]}]}];}
test('stage model preserves provider standings scores and advancement without exposing secrets',()=>{
 const f=fixture(),before=JSON.stringify(f),out=project(...f);assert.equal(JSON.stringify(f),before);assert.equal(out.pools[0].players[0].name,'Bea');assert.equal(out.pools[0].players[1].points,0);
 assert.equal(out.knockouts[0].rounds[0].matches[0].leftScore,0);assert.equal(out.knockouts[0].rounds[1].matches[0].left.id,'bbbb');assert.doesNotMatch(JSON.stringify(out),/SECRET|join_pass/);
});
test('stage model distinguishes pending slots byes and unknown scores without manufacturing winners',()=>{
 const f=fixture();f[0].tournament.t_table=[['aaaa','empty'],['','']];f[1].groups=[];const out=project(...f);assert.equal(out.knockouts[0].rounds[0].matches[0].right.state,'bye');assert.equal(out.knockouts[0].rounds[1].matches[0].left.state,'pending');assert.equal(out.knockouts[0].rounds[0].matches[0].leftScore,null);
});
test('stage model refuses cross-event data unknown identities and duplicate standings identities',()=>{
 let f=fixture();f[1].tdid='other';assert.throws(()=>project(...f));f=fixture();f[0].tournament.t_table[0][0]='unknown';assert.throws(()=>project(...f));f=fixture();f[1].groups[0].players.push(f[1].groups[0].players[0]);assert.throws(()=>project(...f));
});
