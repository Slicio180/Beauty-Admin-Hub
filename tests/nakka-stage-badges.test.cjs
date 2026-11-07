const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../public/js/nakka-stage-model.js'),feed=require('../public/js/nakka-stage-feed.js');
function input(){return [{result:0,tournament:{tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',updateTime:1,entry_list:[{tpid:'aaaa',name:'A'},{tpid:'bbbb',name:'B'}],t_table:[['aaaa','bbbb']],s2_table:[['aaaa','bbbb']],badge:{'t-0-0':{str:'14',st:1},'s2-0-0':{str:'2',st:2}}}},{result:0,tdid:'t_QHaG_7792',groups:[]}];}
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
 await c.refresh();assert.equal(out.length,1);assert.equal(calls.length,3);assert.ok(calls.every(c=>c.options.method==='GET'&&c.options.credentials==='omit'&&c.url.includes('tdid=t_QHaG_7792')));
 drift=true;await c.refresh();assert.equal(out.length,1);assert.equal(errors.length,1);c.stop();await c.refresh();assert.equal(calls.length,6);
});
test('stage feed suppresses overlapping polls and stopped late responses',async()=>{
 let finish,calls=0,painted=0;const c=feed.create({model,onData:()=>painted++,onError:()=>{},fetch:()=>{calls++;return new Promise(r=>finish=r);}});
 const pending=c.refresh();await c.refresh();assert.equal(calls,1);c.stop();finish({ok:false});await pending;assert.equal(painted,0);
});

test('Knockout board badges use match ordinal for second semifinal and later matches',()=>{
 const f=input(),t=f[0].tournament;t.entry_list.push({tpid:'cccc',name:'C'},{tpid:'dddd',name:'D'});t.t_table=[['aaaa','bbbb','cccc','dddd'],['','']];t.badge={'t-0-0':{str:'1',st:1},'t-0-1':{str:'2',st:1},'t-0-2':{str:'wrong slot',st:1},'t-1-0':{str:'4',st:0}};
 let out=model.project(...f);assert.deepEqual(out.knockouts[0].rounds[0].matches.map(m=>m.board.text),['1','2']);assert.equal(out.knockouts[0].rounds[1].matches[0].board.text,'4');
 delete t.badge['t-0-1'];out=model.project(...f);assert.equal(out.knockouts[0].rounds[0].matches[1].board.text,null);
});

test('native badge indices cover every match across eight to sixty-four player brackets',()=>{
 for(const count of [8,16,32,64]){
  const f=input(),t=f[0].tournament;t.entry_list=Array.from({length:count},(_,i)=>({tpid:i.toString(36).padStart(4,'0'),name:'Player '+i}));t.badge={};
  for(const kind of ['t','s2']){
   t[kind+'_table']=[];
   for(let size=count,round=0;size>=2;size/=2,round++){
    t[kind+'_table'].push(t.entry_list.slice(0,size).map(p=>p.tpid));
    // Explicit native index list, independent of the implementation formula.
    const indices=[0,1,4,5,8,9,12,13,16,17,20,21,24,25,28,29,32,33,36,37,40,41,44,45,48,49,52,53,56,57,60,61];
    for(let match=0;match<size/2;match++)t.badge[kind+'-'+round+'-'+indices[match]]={str:kind+'-'+round+'-board-'+(match+1),st:1};
   }
  }
  const out=model.project(...f);
  for(const [stage,kind]of out.knockouts.map((s,i)=>[s,i?'s2':'t']))for(const [r,round]of stage.rounds.entries())assert.deepEqual(round.matches.map(m=>m.board.text),round.matches.map((_,i)=>kind+'-'+r+'-board-'+(i+1)));
 }
});
test('native quarterfinal badges match observed TEST keys and removal never borrows another board',()=>{
 const f=input(),t=f[0].tournament;t.entry_list=Array.from({length:8},(_,i)=>({tpid:i.toString(36).padStart(4,'0'),name:'Player '+i}));
 t.t_table=[t.entry_list.map(p=>p.tpid)];t.s2_table=[t.entry_list.map(p=>p.tpid)];t.badge={};
 for(const [i,k]of [0,1,4,5].entries()){t.badge['t-0-'+k]={str:String(i+1),st:1};t.badge['s2-0-'+k]={str:String(i+5),st:1};}
 let out=model.project(...f);assert.deepEqual(out.knockouts[0].rounds[0].matches.map(m=>m.board.text),['1','2','3','4']);assert.deepEqual(out.knockouts[1].rounds[0].matches.map(m=>m.board.text),['5','6','7','8']);
 delete t.badge['t-0-4'];t.badge['t-0-2']={str:'wrong',st:1};out=model.project(...f);assert.equal(out.knockouts[0].rounds[0].matches[2].board.text,null);assert.equal(out.knockouts[0].rounds[0].matches[3].board.text,'4');
});
