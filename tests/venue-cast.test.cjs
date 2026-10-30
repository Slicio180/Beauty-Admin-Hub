const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const live=require('../public/js/nakka-pool-live.js'),model=require('../public/js/nakka-stage-model.js');
const event='t_RqC2_2034',ids=['aaaa','bbbb','cccc'];
function base(){return model.project({result:0,tournament:{tdid:event,lgid:'lg_tM2v_3523',entry_list:ids.map((tpid,i)=>({tpid,name:'Player '+i})),rr_table:[ids],rr_result:[{aaaa:{bbbb:{r:2,a:30}},bbbb:{aaaa:{r:1,a:60}}}]}},{result:0,tdid:event,groups:[{kind:'rr',index:0,players:ids.map((tpid,i)=>({tpid,p:i<2?1:0,w:i===0?1:0,l:i===1?1:0}))}]});}
function matches(){return [{mid:'done',tdid:event,tmid:event+'_rr_0_aaaa_bbbb',endMatch:1,statsData:[{tpid:'aaaa',allScore:100,allDarts:10},{tpid:'bbbb',allScore:200,allDarts:10}]},{mid:'now',tdid:event,tmid:event+'_rr_0_aaaa_cccc',endMatch:0,statsData:[]}];}
function current(){return {result:0,tdid:event,mid:'now',tmid:event+'_rr_0_aaaa_cccc',end_match:0,players:[{tpid:'aaaa'},{tpid:'cccc'}],stats:[{score:150,darts:5},{score:50,darts:5}],legs:[1,0],show_sets:0};}
function snapshot(){return {rows:matches(),live:new Map([['now',current()]])};}
function plan(){return {eventId:event,pools:[{id:'rr_0',ids,startAverage:48.5,coverage:3,board:7,group:1}]};}
test('venue running player and group averages weight points by darts and replace live totals without mutating input',()=>{
 const d=base(),before=JSON.stringify(d),p=live.apply(d,snapshot(),plan()).pools[0];assert.equal(JSON.stringify(d),before);assert.equal(p.matrix[0].overallAverage,50);assert.equal(p.matrix[1].overallAverage,60);assert.equal(p.matrix[2].overallAverage,30);assert.equal(p.currentAverage,50);assert.equal(p.startAverage,48.5);assert.equal(p.board,7);assert.equal(p.shared,false);assert.equal(p.matrix.flatMap(p=>p.cells).filter(c=>c.live).length,2);assert.equal(p.matrix[0].cells[2].score,1);assert.equal(p.matrix[2].cells[0].score,0);
});
test('venue completed live response removes both highlights and totals are counted once on transition to archive',()=>{
 let snap=snapshot();snap.live.get('now').end_match=1;let p=live.apply(base(),snap,plan()).pools[0];assert.equal(p.matrix.flatMap(r=>r.cells).some(c=>c.live),false);snap.rows[1]={...snap.rows[1],endMatch:1,statsData:[{tpid:'aaaa',allScore:150,allDarts:5},{tpid:'cccc',allScore:50,allDarts:5}]};snap.live.clear();p=live.apply(base(),snap,plan()).pools[0];assert.equal(p.currentAverage,50);
});
test('venue missing totals incomplete archive duplicate fixture and set formats never invent group averages',()=>{
 for(const change of [s=>delete s.rows[0].statsData[0].allDarts,s=>s.rows.shift(),s=>s.rows.push({...s.rows[0],mid:'duplicate'}),s=>s.live.get('now').show_sets=1]){const snap=snapshot();change(snap);const p=live.apply(base(),snap,plan()).pools[0];assert.equal(p.currentAverage,null);assert.ok(p.matrix.every(r=>r.overallAverage===null));}
 const p=live.apply(base(),{rows:[],live:new Map()},null).pools[0];assert.equal(p.startAverage,null);assert.equal(p.board,null);
});
test('venue zero throws remain unknown and corrected scores replace old totals without accumulation',()=>{
 const d=base(),snap=snapshot();snap.live.get('now').stats=[{score:0,darts:0},{score:0,darts:0}];let p=live.apply(d,snap,plan()).pools[0];assert.equal(p.matrix[2].overallAverage,null);assert.equal(p.currentAverage,45);snap.live.get('now').stats[0]={score:60,darts:5};p=live.apply(d,snap,plan()).pools[0];assert.equal(p.matrix[0].overallAverage,32);assert.equal(p.currentAverage,43.2);
});
test('venue matching requires exact TEST event pool and player identities and excludes knockout results',()=>{
 const d=base();for(const id of ['other_rr_0_aaaa_bbbb',event+'_t_0_aaaa_bbbb',event+'_rr_1_aaaa_bbbb',event+'_rr_0_aaaa_zzzz',event+'_rr_0_aaaa_aaaa'])assert.equal(live.fixture(id,d),null);
 const snap=snapshot();snap.rows.push({...snap.rows[0],mid:'final',tmid:event+'_t_0_aaaa_bbbb'});assert.equal(live.apply(d,snap,plan()).pools[0].currentAverage,50);
});
test('venue mismatched frozen membership suppresses starting average and board labels and shared boards sort together',()=>{
 const d=base(),p=plan();p.pools[0].ids=['aaaa','bbbb'];assert.equal(live.apply(d,snapshot(),p).pools[0].startAverage,null);const second=structuredClone(d.pools[0]);second.id='rr_1';second.number=2;d.pools.push(second);p.pools[0].ids=ids;p.pools[0].group=2;p.pools.push({...p.pools[0],id:'rr_1',group:1});const out=live.apply(d,snapshot(),p);assert.deepEqual(out.pools.map(q=>q.id),['rr_1','rr_0']);assert.ok(out.pools.every(q=>q.shared));
});
test('venue collector uses public GET paths and rejects wrong live identity or failed endpoint',async()=>{
 const paths=[],get=async path=>{paths.push(path);return path.startsWith('match/list')?{result:0,list:matches()}:current();};const snap=await live.collect(get,base());assert.equal(snap.live.size,1);assert.ok(paths[0].includes('tdid='+event));assert.equal(paths[1],'match/live?mid=now');await assert.rejects(live.collect(async p=>p.startsWith('match/list')?{result:0,list:matches()}:{...current(),tdid:'other'},base()));await assert.rejects(live.collect(async()=>({result:-1}),base()));
});
test('venue collector paginates completely and refuses duplicate match documents',async()=>{
 const rows=Array.from({length:100},(_,i)=>({mid:'m'+i,tdid:event,tmid:event+'_t_0_aaaa_bbbb',endMatch:1})),paths=[];const snap=await live.collect(async p=>{paths.push(p);return {result:0,list:p.includes('skip=0&')?rows:[]};},base());assert.equal(snap.rows.length,0);assert.equal(paths.length,2);await assert.rejects(live.collect(async()=>({result:0,list:[rows[0],rows[0]]}),base()));
});
function metadata(){
 const draw={eventDate:'2026-10-27',frozenAt:'2026-10-27T17:00:00Z',pools:[{players:[{id:'1',average:50},{id:'2',average:null},{id:'3',average:40}]}]},journal={state:'VERIFIED',audit:'POOL-'+ 'a'.repeat(20),receipt:'POOL-'+ 'b'.repeat(20),drawHash:'HASH'};
 const audit={kind:'POOL_SEND_BEFORE',draw,event:{tdid:event},mappings:ids.map((tpid,i)=>({id:String(i+1),tpid,name:'PRIVATE',lpid:'SECRET'})),table:[ids]},receipt={kind:'POOL_SEND_READBACK',beforeAudit:journal.audit,drawHash:'HASH'};const values=new Map([['BEAUTY_POOL_SEND_'+event,JSON.stringify(journal)]]);let auth=0,blocked=false;
 const c=vm.createContext({Date,JSON,Number,Set,beautyHubTestGuard_:()=>{if(blocked)throw Error('guard');},beautyHubAuthRequire_:()=>{auth++;},beautyPoolHash_:()=> 'HASH',SHEET_ID:'TEST',PropertiesService:{getScriptProperties:()=>({getProperty:k=>values.get(k),setProperty:(k,v)=>values.set(k,v)})},SpreadsheetApp:{openById:id=>{assert.equal(id,'TEST');return {getSheetByName:name=>{const data=name===journal.audit?audit:receipt;const rows=[['Beauty TEST pool audit','date'],['JSON 1',JSON.stringify(data)]];return {getLastRow:()=>2,getRange:()=>({getValues:()=>rows})};}};}}});vm.runInContext(fs.readFileSync('apps-script/registration-identity-test/remote-app/BeautyLiveTest.gs','utf8'),c);return {c,values,audit,receipt,journal,auth:()=>auth,block:()=>blocked=true};
}
test('venue public metadata reads verified audit baseline and exposes no private registration or staff fields',()=>{
 const h=metadata(),p=h.c.beautyStagePlanTest();assert.equal(p.pools[0].startAverage,45);assert.equal(p.pools[0].coverage,2);assert.equal(p.pools[0].board,null);assert.doesNotMatch(JSON.stringify(p),/PRIVATE|SECRET|uid|consent|message/);h.receipt.beforeAudit='other';assert.equal(h.c.beautyStagePlanTest(),null);h.block();assert.throws(()=>h.c.beautyStagePlanTest());
});
test('venue label publishing authenticates twice and validates frozen pool membership',()=>{
 const h=metadata();assert.equal(h.c.beautyStageLabelsTest('TOKEN',[{ids,board:7,group:2}]).success,true);assert.equal(h.auth(),2);assert.equal(h.c.beautyStagePlanTest().pools[0].board,7);assert.throws(()=>h.c.beautyStageLabelsTest('TOKEN',[{ids:['aaaa'],board:7,group:2}]));assert.throws(()=>h.c.beautyStageLabelsTest('TOKEN',[{ids,board:0,group:2}]));assert.throws(()=>h.c.beautyStageLabelsTest('TOKEN',[{ids,board:7,group:2,secret:'x'}]));
});
test('venue generated layout retains six card grid matched header font and stale highlight suppression',()=>{
 const css=fs.readFileSync('public/css/competition-preview.css','utf8'),html=fs.readFileSync('public/competition-preview.html','utf8');assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/\.pool-card-header h3\{font:700 30px/);assert.match(css,/height:1px;background:#ffd700/);assert.match(css,/\.stage-stale \.live-cell\{background:transparent\}/);assert.match(css,/\.stage-stale \.live-tag\{display:none\}/);assert.match(html,/id="pageSize"[\s\S]*value="6" selected/);assert.match(html,/lang="sv"/);
});
test('venue live feed suppresses overlapping refreshes and drops late data after stopping',async()=>{
 const feed=require('../public/js/nakka-stage-feed.js'),calls=[],painted=[],errors=[];let resolve,hold=false;
 const input={result:0,tournament:{tdid:event,lgid:'lg_tM2v_3523',updateTime:1,entry_list:ids.map(tpid=>({tpid,name:tpid})),rr_table:[ids]}},standing={result:0,tdid:event,groups:[{kind:'rr',index:0,players:ids.map(tpid=>({tpid}))}]};
 const fetch=async(url,opt)=>{calls.push(url);assert.equal(opt.method,'GET');assert.equal(opt.credentials,'omit');assert.equal(opt.redirect,'error');if(hold&&url.includes('match/list'))await new Promise(r=>resolve=r);return {ok:true,json:async()=>url.includes('standings')?standing:url.includes('match/list')?{result:0,list:matches()}:url.includes('match/live')?current():input};};
 const f=feed.create({fetch,model,includeLive:true,liveModel:live,onData:d=>painted.push(d),onError:e=>errors.push(e)});await f.refresh();assert.equal(painted.length,1);f.setPlan(plan());await f.refreshLive();assert.equal(painted.at(-1).pools[0].board,7);hold=true;const promise=f.refreshLive();await new Promise(setImmediate);const count=calls.length;await f.refreshLive();assert.equal(calls.length,count);f.stop();resolve();await promise;assert.equal(painted.length,2);assert.equal(errors.length,0);
});
test('venue failed full snapshot cannot be revived by polling an old group membership',async()=>{
 const feed=require('../public/js/nakka-stage-feed.js');let bad=false,painted=0,errors=0;const input={result:0,tournament:{tdid:event,lgid:'lg_tM2v_3523',updateTime:1,entry_list:[]}};
 const f=feed.create({model,includeLive:true,liveModel:live,onData:()=>painted++,onError:()=>errors++,fetch:async url=>({ok:true,json:async()=>url.includes('match/list')?{result:0,list:[]}:url.includes('standings')?{result:0,tdid:event,groups:[]}:bad?{result:-1}:input})});await f.refresh();assert.equal(painted,1);bad=true;await f.refresh();await f.refreshLive();assert.equal(painted,1);assert.equal(errors,1);
});
test('venue expired staff session cannot publish cast labels or change the frozen starting value',()=>{
 const h=metadata(),before=JSON.stringify([...h.values]);h.c.beautyHubAuthRequire_=()=>{throw Error('AUTH_REQUIRED');};assert.throws(()=>h.c.beautyStageLabelsTest('OLD',[{ids,board:8,group:1}]));assert.equal(JSON.stringify([...h.values]),before);assert.equal(h.c.beautyStagePlanTest().pools[0].startAverage,45);
});
test('venue card renderer uses literal light player names paired group averages and only two live cells',()=>{
 class N{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};}appendChild(n){this.children.push(n);return n;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}addEventListener(){}}
 const doc={createElement:t=>new N(t)},host=new N('div'),out=live.apply(base(),snapshot(),plan());out.pools[0].matrix[0].name='<img onerror=bad>';require('../public/js/competition-view.js').render(doc,host,out,{view:'pools',size:6});const all=n=>[n,...n.children.flatMap(all)],nodes=all(host);assert.equal(nodes.filter(n=>n.className==='number live-cell').length,2);assert.equal(nodes.find(n=>n.className==='start-average').textContent,'Start 48.50');assert.equal(nodes.find(n=>n.className==='current-average').textContent,'Nu 50.00');assert.ok(nodes.some(n=>n.textContent==='<img onerror=bad>'));assert.equal(nodes.some(n=>n.tag==='h3'&&n.textContent==='Grupp 1'),false);
});
