const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../public/js/nakka-stage-model.js'),feed=require('../public/js/nakka-stage-feed.js');
function input(){return [{result:0,tournament:{tdid:'t_RqC2_2034',lgid:'lg_tM2v_3523',updateTime:1,entry_list:[{tpid:'aaaa',name:'A'},{tpid:'bbbb',name:'B'}],t_table:[['aaaa','bbbb']],s2_table:[['aaaa','bbbb']],badge:{'t-0-0':{str:'14',st:1},'s2-0-0':{str:'2',st:2}}}},{result:0,tdid:'t_RqC2_2034',groups:[]}];}
test('stage badges map exact stage round and slot; reassignments and removals replace old values',()=>{
 const f=input();let out=model.project(...f);assert.equal(out.knockouts[0].rounds[0].matches[0].board.text,'14');assert.equal(out.knockouts[1].rounds[0].matches[0].board.text,'2');
 f[0].tournament.badge['t-0-0']={str:'7',st:1};out=model.project(...f);assert.equal(out.knockouts[0].rounds[0].matches[0].board.text,'7');delete f[0].tournament.badge['t-0-0'];assert.equal(model.project(...f).knockouts[0].rounds[0].matches[0].board.state,'unassigned');
});
test('stage badges empty values are unassigned and unsupported shapes unavailable; never infer from pool plan',()=>{
 const f=input(),get=()=>model.project(...f).knockouts[0].rounds[0].matches[0].board;
 f[0].tournament.badge['t-0-0']={str:'',st:0};assert.equal(get().state,'unassigned');f[0].tournament.badge['t-0-0']='14';assert.equal(get().state,'unavailable');f[0].tournament.badge['t-0-0']={str:'14',st:9};assert.equal(get().text,null);delete f[0].tournament.badge;assert.equal(get().state,'unavailable');f[0].tournament.badge={'t-0-0':null};assert.equal(get().state,'unavailable');
});
test('stage feed uses only fixed public GETs and refuses torn snapshots or failed refreshes',async()=>{
 const f=input(),calls=[],out=[],errors=[];let drift=false;
 const c=feed.create({model,onData:d=>out.push(d),onError:e=>errors.push(e),fetch:async(url,options)=>{calls.push({url,options});const data=JSON.parse(JSON.stringify(url.includes('standings')?f[1]:f[0]));if(drift&&calls.length%3===0)data.tournament.updateTime++;return {ok:true,json:async()=>data};}});
 await c.refresh();assert.equal(out.length,1);assert.equal(calls.length,3);assert.ok(calls.every(c=>c.options.method==='GET'&&c.options.credentials==='omit'&&c.url.includes('tdid=t_RqC2_2034')));
 drift=true;await c.refresh();assert.equal(out.length,1);assert.equal(errors.length,1);c.stop();await c.refresh();assert.equal(calls.length,6);
});
test('stage feed suppresses overlapping polls and stopped late responses',async()=>{
 let finish,calls=0,painted=0;const c=feed.create({model,onData:()=>painted++,onError:()=>{},fetch:()=>{calls++;return new Promise(r=>finish=r);}});
 const pending=c.refresh();await c.refresh();assert.equal(calls,1);c.stop();finish({ok:false});await pending;assert.equal(painted,0);
});
