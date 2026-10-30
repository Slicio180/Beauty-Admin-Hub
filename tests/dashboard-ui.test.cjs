const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ui(initial){
 class Node{
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.dataset={};this.attrs={};this.hidden=false;this._text='';}
  set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}replaceChildren(){this.children=[];this._text='';}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}setAttribute(k,v){this.attrs[k]=v;}focus(){this.focused=true;}showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}
  querySelector(sel){const all=n=>[n,...n.children.flatMap(all)];return all(this).find(n=>sel[0]==='.'?n.className===sel.slice(1):sel==='[data-attention-status]'?'attentionStatus'in n.dataset:sel==='[data-attention-refresh]'?'attentionRefresh'in n.dataset:false);}
  fire(name='click'){if(this.disabled&&name==='click')return;return Promise.all((this.listeners[name]||[]).map(fn=>fn({target:this,preventDefault(){}})));}
 }
 const ids=Object.fromEntries(['attentionCount','attentionTile','attentionCard','attentionStatus','inPlayerCount','attentionReview','dashboardNavButton','nakkaNavButton'].map(id=>[id,new Node()]));
 const body=new Node('body'),events={},requests=[],pending=[];const c={window:{beautyHubData:initial},Date,JSON,Object,document:{body,hidden:false,getElementById:id=>ids[id],createElement:tag=>new Node(tag),querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(k,fn)=>(events[k]??=[]).push(fn)},setInterval:fn=>{c.tick=fn;},BeautyHubServices:{request:url=>{requests.push(url);return new Promise((resolve,reject)=>pending.push({resolve:r=>resolve({json:async()=>r}),reject}));}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-dashboard.js','utf8'),c);
 return {ids,body,c,events,requests,pending,dash:c.window.BeautyDashboard,emit:name=>Promise.all((events[name]||[]).map(fn=>fn()))};
}
const attention=(items=[])=>({available:true,eventDate:'2026-10-27',items,complete:true,checkedAt:'2026-10-27T18:00:00Z'});
const data=(items=[])=>({eventDate:'2026-10-27',players:[{player:'Anna',status:'IN'},{player:'Other',status:'OUT'}],attention:attention(items)});
test('Dashboard hides review for a verified clear event and shows it inside the attention card for alerts',()=>{
 const u=ui();u.dash.update(data());assert.equal(u.ids.attentionCount.textContent,'0');assert.equal(u.ids.attentionTile.dataset.active,'false');assert.equal(u.ids.attentionTile.hidden,true);assert.equal(u.ids.inPlayerCount.textContent,'1');
 u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionTile.dataset.active,'true');assert.equal(u.ids.attentionTile.hidden,false);assert.equal(u.ids.attentionCard.dataset.active,'true');
});
test('Dashboard review displays literal player names and sends no transfer or retry',()=>{
 const u=ui();u.dash.update(data([{name:'<img onerror=evil()>',code:'TRANSFER_UNCERTAIN'}]));u.dash.review();assert.equal(u.body.children.length,1);assert.match(u.body.children[0].textContent,/<img onerror=evil\(\)>/);assert.match(u.body.children[0].textContent,/do not retry/);assert.equal(u.requests.length,0);assert.ok(!fs.readFileSync('public/preview.html','utf8').includes('id="attentionBanner"'));
});
test('Dashboard failed refresh retains alert and explicit verified refresh clears it',async()=>{
 const u=ui();u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));const p=u.dash.refresh();u.pending.shift().reject(Error('secret'));await p;
 assert.equal(u.ids.attentionCount.textContent,'1');assert.match(u.ids.attentionStatus.textContent,/retained/);assert.doesNotMatch(u.ids.attentionStatus.textContent,/secret/);
 const next=u.dash.refresh();u.pending.shift().resolve({success:true,attention:attention()});await next;assert.equal(u.ids.attentionCount.textContent,'0');assert.equal(u.ids.attentionTile.hidden,true);assert(u.requests.every(url=>url.endsWith('page=attentionrefresh')));
});
test('Dashboard refresh is single flight and logout discards late private responses',async()=>{
 const u=ui();u.dash.update(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));const p=u.dash.refresh();await u.dash.refresh();assert.equal(u.requests.length,1);u.dash.review();await u.emit('beauty-hub-locked');assert.equal(u.body.children.length,0);
 u.pending.shift().resolve({success:true,attention:attention([{name:'Private',code:'ENTRY_UNCONFIRMED'}])});await p;assert.equal(u.ids.attentionTile.hidden,true);assert.equal(u.ids.attentionCount.textContent,'—');assert.doesNotMatch(u.ids.attentionStatus.textContent,/Private/);
});
test('Dashboard ignores a stale refresh after event or same-date player list changes',async()=>{
 for(const eventChange of [false,true]){
  const u=ui();u.dash.update(data());const p=u.dash.refresh();const next=data([{name:'New player',code:'ENTRY_UNCONFIRMED'}]);next.players.push({player:'New player',status:'IN'});if(eventChange){next.eventDate='2026-10-28';next.attention.eventDate=next.eventDate;}
  u.dash.update(next);u.pending.shift().resolve({success:true,attention:attention()});await p;assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionTile.hidden,false);
 }
});
test('Dashboard unavailable storage is shown honestly rather than as an all-clear zero',()=>{
 const u=ui();u.dash.update({...data(),attention:{available:false,eventDate:'2026-10-27',items:[]}});assert.equal(u.ids.attentionCount.textContent,'—');assert.match(u.ids.attentionStatus.textContent,/unavailable/);assert.equal(u.ids.attentionTile.hidden,false);u.dash.update({...data(),attention:{...attention(),complete:false}});assert.equal(u.ids.attentionTile.hidden,false);
});

test('Dashboard initializes from data that loaded before its external script',()=>{const u=ui(data([{name:'Anna',code:'MISSING_EVENT_ENTRY'}]));assert.equal(u.ids.inPlayerCount.textContent,'1');assert.equal(u.ids.attentionCount.textContent,'1');assert.equal(u.ids.attentionTile.hidden,false);});

test('Hub player list filters and sorts Swedish names without changing source order or player identities',()=>{
 const list=require('../public/js/hub-player-list.js'),players=[{player:'Östen',status:'IN'},{player:'Anna',status:'OUT'},{newPlayer:'Åsa',status:'STANDBY'}],before=JSON.stringify(players);
 assert.deepEqual(list.arrange(players).map(p=>p.player||p.newPlayer),['Anna','Åsa','Östen']);assert.equal(list.arrange(players,{search:' ÅS '})[0],players[2]);assert.equal(list.arrange(players,{sort:'original'})[0],players[0]);assert.equal(JSON.stringify(players),before);
});
test('Hub player list requires verified ranking and complete timestamps and keeps unranked players last',()=>{
 const list=require('../public/js/hub-player-list.js'),players=[{player:'Anna',rank:null},{player:'Zed',rank:1},{player:'Bea',rank:2}];assert.equal(list.capabilities(players,{}).ranking,false);assert.equal(list.arrange(players,{sort:'ranking'})[0].player,'Anna');assert.deepEqual(list.arrange(players,{sort:'ranking',rankingAvailable:true}).map(p=>p.player),['Zed','Bea','Anna']);assert.equal(list.capabilities(players,{}).registration,false);
 const timed=[{player:'Zed',registeredAt:'2026-10-27T18:00:00Z'},{player:'Anna',registeredAt:'2026-10-27T18:01:00Z'}];assert.equal(list.capabilities(timed,{}).registration,true);assert.equal(list.arrange(timed,{sort:'registration'})[0],timed[0]);
});

test('Hub search persists across refresh and sorting keeps event records intact then resets on lock',()=>{
 const handlers={},events={},sort={value:'alphabetical',options:['alphabetical','ranking','registration','original'].map(value=>({value})),addEventListener:(k,f)=>handlers['sort:'+k]=f},search={value:'',addEventListener:(k,f)=>handlers['search:'+k]=f},wrap={scrollTop:88},status={dataset:{}},title={dataset:{state:'matched'}},ids={hubPlayerSort:sort,hubPlayerSearch:search,hubListConnection:status,nakkaTournamentTitle:title};let rendered=[];
 const c={document:{getElementById:id=>ids[id],querySelector:()=>wrap,addEventListener:(k,f)=>events[k]=f},BeautyHubServices:{mode:'test'},Date,beautyHubData:{players:[{player:'Zed',status:'OUT'},{player:'Anna',status:'IN'}]},updatePlayersTable(players){rendered=c.BeautyPlayerList.rows(players);}};c.window=c;vm.runInNewContext(fs.readFileSync('public/js/hub-player-list.js','utf8'),c);
 search.value='ann';handlers['search:input']();assert.equal(rendered[0],c.beautyHubData.players[1]);assert.equal(wrap.scrollTop,0);c.beautyHubData.players.push({player:'Annika',status:'STANDBY'});c.updatePlayersTable(c.beautyHubData.players);assert.equal(rendered.length,2);assert.equal(sort.options[1].disabled,true);assert.equal(sort.options[2].disabled,true);c.BeautyPlayerList.connection(true);assert.match(status.textContent,/Nakka event verified/);events['beauty-hub-locked']();assert.equal(search.value,'');assert.equal(sort.value,'alphabetical');assert.match(status.textContent,/Sign in/);
});
