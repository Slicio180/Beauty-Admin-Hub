const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const view=require('../public/js/competition-view.js'),model=require('../public/js/nakka-stage-model.js');
class Node{
 constructor(tag='div'){this.tag=tag;this.children=[];this.textContent='';this.dataset={};this.attributes={};this.handlers={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;const classes=new Set();this.classList={toggle:(n,b)=>b?classes.add(n):classes.delete(n),contains:n=>classes.has(n)};}
 click(){return this.handlers.click?.();}
 focus(){this.focused=true;}
 appendChild(n){this.children.push(n);return n;}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,f){this.handlers[k]=f;}set innerHTML(_){throw Error('Unsafe HTML insertion');}
}
const text=n=>n.textContent+' '+n.children.map(text).join(' ');
function data(count=9){return {title:'TEST',pools:Array.from({length:count},(_,i)=>({number:i+1,players:[{name:'Player '+i,rank:i+1,played:0,wins:0,losses:0,points:0}]})),knockouts:[]};}
function harness(automatic=false){
 const ids=[...fs.readFileSync('public/competition-preview.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]),nodes=Object.fromEntries(ids.map(id=>[id,new Node()]));nodes.autoRefresh.checked=true;
 const listeners={},timers=new Map();let timer=0,time=100000,fetches=0,callbacks,stops=0;
 const find=(node,id)=>node.id===id?node:node.children.map(child=>find(child,id)).find(Boolean);
 const document={body:{dataset:{stageMode:automatic?'test-live':''}},hidden:false,fullscreenElement:null,getElementById:id=>nodes[id]||Object.values(nodes).map(n=>find(n,id)).find(Boolean),createElement:tag=>new Node(tag),addEventListener:(k,f)=>listeners[k]=f,documentElement:{requestFullscreen:async()=>{document.fullscreenElement={};listeners.fullscreenchange();}},exitFullscreen:async()=>{document.fullscreenElement=null;listeners.fullscreenchange();}};
 const window={fetch:async()=>{throw Error('Unexpected fetch');},setInterval:(f,ms)=>{timers.set(++timer,{f,ms});return timer;},clearInterval:id=>timers.delete(id),addEventListener:(k,f)=>listeners[k]=f};
 class Clock extends Date{static now(){return time;}}
 const navigator={onLine:true};
 vm.runInNewContext(fs.readFileSync('public/js/competition-preview.js','utf8'),{document,window,navigator,Date:Clock,BeautyNakkaStages:model,BeautyCompetitionView:view,BeautyNakkaStageFeed:{create:c=>{callbacks=c;return {refresh:async()=>{fetches++;},stop:()=>stops++};}}});
 return {nodes,document,navigator,listeners,click:async id=>{await nodes[id].handlers.click();await new Promise(setImmediate);},change:async id=>{await nodes[id].handlers.change();await new Promise(setImmediate);},receive:d=>callbacks.onData(d),fail:()=>callbacks.onError(),tick:ms=>{for(const t of timers.values())if(t.ms===ms)t.f();},advance:ms=>time+=ms,fetches:()=>fetches,stops:()=>stops,timers};
}
test('competition pool pages cover every numbered pool once and clamp after source shrinks',()=>{
 const input=data(65),seen=[];for(let i=0;i<17;i++)seen.push(...view.page(input,{index:i,size:4}).pools.map(p=>p.number));assert.deepEqual(seen,Array.from({length:65},(_,i)=>i+1));
 assert.equal(view.page(data(3),{index:16,size:4}).index,0);assert.equal(view.page(input,{index:-2,size:6}).index,0);assert.equal(view.page(input,{view:'unknown'}).view,'pools');assert.equal(view.page(data(0)).total,1);
});
test('competition renderer preserves provider rank zero points and untrusted names as literal text',()=>{
 const d=data(1),host=new Node(),doc={createElement:t=>new Node(t)};d.pools[0].players[0].name='<img src=x onerror=alert(1)>';d.pools[0].players[0].rank=37;
 view.render(doc,host,d,{});assert.match(text(host),/<img src=x onerror=alert\(1\)>/);assert.match(text(host),/37/);assert.match(text(host),/0–0/);assert.match(text(host),/Poäng/);
});
test('competition knockout renderer distinguishes byes missing averages winner and exact board state',()=>{
 const d={pools:[],knockouts:[{kind:'t',rounds:[{round:1,slotCount:2,matches:[{board:{text:'14',state:'in-progress'},left:{name:'A',state:'player'},right:{name:'Bye',state:'bye'},leftScore:0,rightScore:null,leftAverage:40.835,rightAverage:null}]},{round:2,slotCount:1,matches:[{left:{name:'A',state:'player'}}]}]}]},host=new Node();
 view.render({createElement:t=>new Node(t)},host,d,{view:'t'});const output=text(host);assert.match(output,/Bana 14/);assert.match(output,/Matchsnitt 40.84/);assert.match(output,/Frirond/);assert.match(output,/Vinnare/);assert.doesNotMatch(output,/undefined|null|Väntar på bana/);assert.equal(host.children[0].children[1].children[1].attributes.tabindex,'0');
});
test('competition view options reflect supplied stages and empty view remains honest',()=>{
 const d={pools:[],knockouts:[{kind:'s2',rounds:[]}]},host=new Node();assert.deepEqual(view.views(d).map(v=>v.id),['all','pools','boards','s2']);view.render({createElement:t=>new Node(t)},host,d,{view:'s2'});assert.match(text(host),/Inget slutspelsträd/);view.render({createElement:t=>new Node(t)},host,d,{view:'pools'});assert.match(text(host),/Ingen gruppställning/);
});
test('competition screen loads TEST explicitly clears synthetic content and recovers from failure',async()=>{
 const h=harness();assert.equal(h.fetches(),0);assert.match(text(h.nodes.stagePreview),/Exempelspelare/);await h.click('loadTest');assert.equal(h.fetches(),1);assert.equal(text(h.nodes.stagePreview).trim(),'');h.fail();assert.match(h.nodes.stageStatus.textContent,/TEST-data kan inte visas/);assert.equal(h.nodes.staleNotice.hidden,false);
 h.receive(data(9));assert.match(h.nodes.stageStatus.textContent,/hämtat/);assert.equal(h.nodes.staleNotice.hidden,true);assert.match(text(h.nodes.stagePreview),/Player 0/);h.document.getElementById('toggle-pools').handlers.click();await h.click('nextPage');assert.match(h.nodes.pageIndicator.textContent,/Sida 2 \/ 2/);assert.doesNotMatch(text(h.nodes.stagePreview),/Player 0/);
});
test('competition screen marks failed paused overdue and offline board views as last known',async()=>{
 const h=harness();await h.click('loadTest');h.receive(data());h.fail();assert.equal(h.nodes.stagePreview.classList.contains('stage-stale'),true);h.receive(data());assert.equal(h.nodes.staleNotice.hidden,true);
 h.nodes.autoRefresh.checked=false;await h.change('autoRefresh');assert.equal(h.nodes.staleNotice.hidden,false);assert.match(h.nodes.stageStatus.textContent,/pausad/);h.nodes.autoRefresh.checked=true;await h.change('autoRefresh');h.receive(data());h.advance(31000);h.tick(10000);assert.equal(h.nodes.staleNotice.hidden,false);assert.match(h.nodes.stageStatus.textContent,/försenad/);
 h.navigator.onLine=false;h.listeners.offline();assert.match(h.nodes.stageStatus.textContent,/Ingen anslutning/);
});
test('competition screen retains full screen options rotates pages and stops polling on page exit',async()=>{
 const h=harness();await h.click('fullScreen');assert.equal(h.nodes.fullScreen.textContent,'Lämna helskärm');await h.click('fullScreen');assert.equal(h.nodes.fullScreen.textContent,'Helskärm');
 await h.click('loadTest');h.receive(data());h.document.getElementById('toggle-pools').handlers.click();h.nodes.rotatePages.checked=true;h.tick(12000);assert.match(h.nodes.pageIndicator.textContent,/Sida 2/);h.document.hidden=true;const before=h.fetches();h.tick(10000);h.tick(12000);assert.equal(h.fetches(),before);assert.match(h.nodes.pageIndicator.textContent,/Sida 2/);h.listeners.pagehide();assert.equal(h.stops(),1);assert.equal(h.timers.size,0);h.listeners.pageshow({persisted:true});assert.equal(h.nodes.staleNotice.hidden,false);assert.match(h.nodes.stageStatus.textContent,/Visningen pausades/);assert.equal(h.nodes.refreshStage.disabled,true);
});
test('competition-only preview policy allows the fixed API origin while Hub stays offline',async()=>{
 const server=require('../scripts/serve-preview.cjs').createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{
 const base='http://127.0.0.1:'+server.address().port,stage=await fetch(base+'/competition-preview.html'),hub=await fetch(base+'/preview.html');assert.equal(stage.status,200);assert.match(stage.headers.get('content-security-policy'),/connect-src https:\/\/api\.n01darts\.com;/);assert.match(hub.headers.get('content-security-policy'),/connect-src 'none'/);assert.equal((await fetch(base+'/competition-preview.html',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));}
});

test('competition all-stages screen has independent accessible section chevrons',()=>{
 const d=data(1);d.knockouts=[{kind:'t',rounds:[]},{kind:'s2',rounds:[]}];const host=new Node(),actions=[];
 const state=view.render({createElement:t=>new Node(t)},host,d,{view:'all',collapsed:{pools:true,t:false,s2:true}},a=>actions.push(a));
 assert.equal(host.children.length,3);for(const [i,id]of ['pools','t','s2'].entries()){const section=host.children[i],button=section.children[0].children[0],content=section.children[1];assert.equal(button.attributes['aria-controls'],content.id);assert.equal(content.hidden,id!=='t');button.handlers.click();assert.equal(actions[i].id,id);assert.equal(actions[i].type,'toggle');}assert.equal(state.collapsed.t,false);
});
test('competition arrows show only the chosen adjacent round pair and keep each stage independent',()=>{
 const rounds=Array.from({length:6},(_,i)=>({round:i+1,slotCount:2**(5-i),matches:[]})),d={pools:[],knockouts:[{kind:'t',rounds},{kind:'s2',rounds:rounds.slice(0,3)}]},host=new Node(),actions=[];
 const state=view.render({createElement:t=>new Node(t)},host,d,{view:'all',roundStarts:{t:3,s2:0}},a=>actions.push(a));
 const first=host.children[1].children[1],second=host.children[2].children[1];assert.deepEqual(first.children[1].children.map(r=>r.children[0].textContent),['Semifinal','Final']);assert.equal(second.children[0].children[0].disabled,true);assert.equal(first.children[0].children[0].disabled,false);first.children[0].children[1].handlers.click();assert.equal(actions[0].direction,1);assert.equal(actions[0].id,'t');assert.equal(state.roundStarts.s2,0);
});
test('competition section and round choices survive new provider data and clamp safely if rounds disappear',()=>{
 const d=data(9);d.knockouts=[{kind:'t',rounds:Array.from({length:6},()=>({matches:[]}))}];let state=view.page(d,{view:'all',index:2,collapsed:{pools:true,t:false},roundStarts:{t:4}});
 const next=data(2);next.knockouts=[{kind:'t',rounds:[{matches:[]},{matches:[]}]}];state=view.page(next,state);assert.equal(state.collapsed.pools,true);assert.equal(state.collapsed.t,false);assert.equal(state.roundStarts.t,0);assert.equal(state.index,0);next.knockouts=[];state=view.page(next,{...state,view:'t'});assert.equal(state.view,'pools');assert.equal(state.roundStarts.t,undefined);
});
test('competition screen preserves manual collapse during refresh and pauses rotation for hidden pools',async()=>{
 const h=harness();await h.click('loadTest');h.receive(data(9));h.document.getElementById('toggle-pools').handlers.click();const button=h.document.getElementById('toggle-pools');button.handlers.click();assert.equal(h.document.getElementById('content-pools').hidden,true);assert.equal(h.nodes.nextPage.disabled,true);h.receive(data(9));assert.equal(h.document.getElementById('content-pools').hidden,true);h.nodes.rotatePages.checked=true;h.tick(12000);h.document.getElementById('toggle-pools').handlers.click();assert.equal(h.document.getElementById('content-pools').hidden,false);assert.match(h.nodes.pageIndicator.textContent,/Sida 1/);
});

test('deployed stage mode loads TEST immediately without ever rendering synthetic players',async()=>{
 const h=harness(true);await new Promise(setImmediate);assert.equal(h.fetches(),1);assert.doesNotMatch(text(h.nodes.stagePreview),/Exempelspelare/);assert.equal(text(h.nodes.stagePreview).trim(),'');h.receive(data(1));assert.match(text(h.nodes.stagePreview),/Player 0/);
});
test('competition renderer shows pool matrices and third-place result without turning either into ranking',()=>{
 const d=data(1);d.pools[0].matrix=[{id:'a',position:1,name:'A',cells:[{state:'self'},{state:'result',score:0,opponentScore:2,average:40}]},{id:'b',position:2,name:'B',cells:[{state:'pending'},{state:'self'}]}];const match={board:{text:'7',state:'finished'},left:{name:'C',state:'player'},right:{name:'D',state:'player'},leftScore:2,rightScore:0,leftAverage:51,rightAverage:44,format:'First to 2 legs'};d.knockouts=[{kind:'t',rounds:[],thirdPlace:match}];const host=new Node();view.render({createElement:t=>new Node(t)},host,d,{view:'all'});assert.match(text(host),/0–2/);assert.match(text(host),/Tabell och poäng/);assert.match(text(host),/Match om tredje pris/);assert.match(text(host),/Först till 2 leg/);assert.match(text(host),/Bana 7/);
});

test('focus remaining play folds only complete matrices and stages and moves to first unrecorded round',()=>{
 const match=(a,b,leftScore=null,rightScore=null)=>({left:{state:a},right:{state:b},leftScore,rightScore}),d={pools:[{matrix:[{cells:[{state:'self'},{state:'result'}]},{cells:[{state:'result'},{state:'self'}]}]}],knockouts:[{kind:'t',rounds:[{slotCount:4,matches:[match('player','player',2,0),match('player','bye')]},{slotCount:2,matches:[match('player','player')]},{slotCount:1,matches:[]}]},{kind:'s2',rounds:[{slotCount:2,matches:[match('player','player',2,1)]},{slotCount:1,matches:[]}]}]};
 const s=view.focusRemaining(d,{size:6});assert.equal(s.roundStarts.t,1);assert.equal(s.collapsed.pools,true);assert.equal(s.collapsed.t,false);assert.equal(s.collapsed.s2,true);assert.equal(s.size,6);assert.equal(s.view,'all');
 d.pools[0].matrix[0].cells[1].state='pending';d.knockouts[1].thirdPlace=match('player','pending');assert.equal(view.focusRemaining(d).collapsed.pools,false);assert.equal(view.focusRemaining(d).collapsed.s2,false);delete d.pools[0].matrix;assert.equal(view.focusRemaining(d).collapsed.pools,false);
});
test('focus remaining button leaves explicit stage controls usable and selection survives updates',async()=>{
 const h=harness();await h.click('loadTest');h.receive(data(1));await h.click('focusRemaining');assert.match(h.nodes.displayMessage.textContent,/Visar spel utan registrerade resultat/);assert.equal(h.nodes.stageView.value,'all');h.receive(data(2));assert.equal(h.nodes.stageView.value,'all');
});

test('Swedish cast presentation localizes match format and placeholders without translating player identities',()=>{
 for(const [format,expected]of [['First to 2 legs','Först till 2 leg'],['First to 3 sets','Först till 3 set'],['Limit 2 legs · draws allowed','Högst 2 leg · oavgjort tillåtet'],['Limit 3 sets · draws allowed','Högst 3 set · oavgjort tillåtet']]){
  const match={board:{text:'12',state:'assigned'},left:{name:'Awaiting player',state:'player'},right:{name:'Bye',state:'pending'},leftScore:0,rightScore:null,leftAverage:44,rightAverage:null};const d={pools:[],knockouts:[{kind:'t',rounds:[{round:1,slotCount:2,format,matches:[match]}]}]},host=new Node();view.render({createElement:t=>new Node(t)},host,d,{view:'t'});const output=text(host);assert.ok(output.includes(expected));assert.match(output,/Awaiting player/);assert.match(output,/Väntar på spelare/);assert.doesNotMatch(output,/Match average|First to|draws allowed/);
 }
});


test('overview initially folds all three provider stages and preserves independent choices through refresh',async()=>{
 const h=harness(true);await new Promise(setImmediate);const d=data(9);d.knockouts=[{kind:'t',rounds:[]},{kind:'s2',rounds:[]}];h.receive(d);
 for(const id of ['pools','t','s2'])assert.equal(h.document.getElementById('content-'+id).hidden,true);
 h.document.getElementById('toggle-t').handlers.click();h.document.getElementById('toggle-pools').handlers.click();h.receive(d);
 assert.equal(h.document.getElementById('content-t').hidden,false);assert.equal(h.document.getElementById('content-pools').hidden,false);assert.equal(h.document.getElementById('content-s2').hidden,true);
 h.document.getElementById('toggle-t').handlers.click();assert.equal(h.document.getElementById('content-pools').hidden,false);
 await h.click('tabBoards');await h.click('tabPools');assert.equal(h.nodes.stageView.value,'all');assert.equal(h.document.getElementById('content-pools').hidden,false);assert.equal(h.document.getElementById('content-t').hidden,true);
});
test('overview uses the provider group format and keeps keyboard accessible section controls visible',()=>{
 const d=data(1);d.pools[0].format='First to 2 legs';const host=new Node();view.render({createElement:t=>new Node(t)},host,d,{view:'all',collapsed:{pools:true}});const b=host.children[0].children[0].children[0];assert.match(b.textContent,/Gruppspel · Först till 2 leg/);assert.equal(b.attributes['aria-expanded'],'false');assert.equal(host.children[0].children[1].hidden,true);
 const css=fs.readFileSync('public/css/competition-preview.css','utf8');assert.match(css,/competition-section>h2\{position:static;clip-path:none/);
});
