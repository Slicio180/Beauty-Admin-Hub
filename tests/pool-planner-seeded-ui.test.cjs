const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('../public/js/pool-seeding.js');
const clone=x=>JSON.parse(JSON.stringify(x));
class Node{
 constructor(tag,owner){this.tag=tag;this.owner=owner;this.children=[];this.dataset={};this.events={};this.value='';this.disabled=false;this.checked=false;this.open=false;this._text='';}
 set textContent(t){this._text=String(t);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join(' ');}
 appendChild(n){if(n.parentElement){const a=n.parentElement.children;if(a.indexOf(n)>=0)a.splice(a.indexOf(n),1);}n.parentElement=this;this.children.push(n);if(this.tag==='select'&&this.children.length===1)this._selected=0;return n;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}replaceChildren(...nodes){for(const child of this.children)child.parentElement=null;this._text='';this.children=[];this.append(...nodes);}
 set value(v){this._value=String(v);}get value(){if(this.tag==='select'&&!this._value)return this.children[0]?.value||'';return this._value||'';}
 setAttribute(k,v){this[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 fire(k){if(this.disabled)return;for(const fn of this.events[k]||[])fn({preventDefault(){},stopImmediatePropagation(){}});}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 querySelectorAll(q){const queries=q.split(',');return this.all().filter(n=>queries.some(s=>s.startsWith('[data-')?Object.hasOwn(n.dataset,s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):s.startsWith('.')?n.className===s.slice(1):n.tag===s));}
 querySelector(q){return this.querySelectorAll(q)[0]||null;}
 dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);}
 close(){this.open=false;for(const fn of this.events.close||[])fn();}
 click(){return this.fire('click');}after(n){const p=this.parentElement;if(n.parentElement){const a=n.parentElement.children;if(a.indexOf(n)>=0)a.splice(a.indexOf(n),1);}n.parentElement=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
 showModal(){this.open=true;}focus(){this.owner.activeElement=this;}
}
function fixture(options={}){
 const handlers={},document={hidden:false,createElement(tag){return new Node(tag,this);},createTextNode(text){const n=new Node('#text',this);n.textContent=text;return n;},addEventListener(k,fn){(handlers[k]??=[]).push(fn);}};
 let host=new Node('dialog',document);host.open=true;const classes=new Set();document.body=new Node('body',document);document.body.classList={add:s=>classes.add(s),remove:s=>classes.delete(s),contains:s=>classes.has(s)};const main=new Node('main',document),nav=[new Node('button',document),new Node('button',document)];document.body.append(main);document.querySelector=q=>q==='.main-content'?main:null;document.querySelectorAll=q=>q==='.sidebar > button'?nav:[];
 const data={success:true,eventDate:'2026-10-27',players:Array.from({length:6},(_,i)=>({player:'Player '+i,status:'IN'}))};
 const players=data.players.map((p,i)=>({id:'P'+i,name:p.player,status:p.status,average:i?50+i:null}));
 const source={success:true,stats:{fresh:true,fetchedAt:'2026-10-28T22:00:00Z',title:'AIK',profiles:[]},mappings:players.map((p,i)=>({...p,lpid:'L'+i,tpid:'E'+i,leagueCandidates:[{lpid:'L'+i,name:p.name,average:p.average}],eventCandidates:[{tpid:'E'+i,name:p.name}]}))};
 const draw=core.draw({players,sizes:[3,3],seed:42,eventDate:data.eventDate,frozenAt:'2026-10-28T22:00:00Z',source:{leagueId:'lg',fetchedAt:'2026-10-28T22:00:00Z'}});
 const requests=[],queue=[];let generation=1,timer,deadline;
 const window={BeautyPoolBoards:require('../public/js/pool-board-allocation.js'),document,BeautyPoolPlanner:require('../public/js/pool-planner.js'),beautyHubData:data,setInterval(fn){timer=fn;}};
 const c={window,document,URL,Event:class {constructor(type){this.type=type;}},BeautyPoolSeeding:core,BeautyPoolPlanner:require('../public/js/pool-planner.js'),BeautyHubAuth:{generation:()=>generation,isCurrent:n=>n===generation},BeautyHubServices:{mode:'test',endpoint:'https://beauty.invalid/hub',request(raw){const u=new URL(raw),input=Object.fromEntries(u.searchParams);requests.push(input);return new Promise((resolve,reject)=>queue.push({resolve:r=>resolve({json:async()=>r}),reject}));}}};
 if(options.watchdog){window.setTimeout=fn=>{deadline=fn;return 1;};window.clearTimeout=()=>{};}window.BeautyHubAuth=c.BeautyHubAuth;window.BeautyHubAuth.token=()=> 'TOKEN';if(options.google)c.google=options.google;vm.runInNewContext(fs.readFileSync('public/js/pool-planner-seeded.js','utf8'),c);if(options.fullPage){window.BeautySeededPoolUI.open(nav[0]);host=main.children[0];}else window.BeautySeededPoolUI.mount(host);host.querySelector('[data-boards]').value='2';host.querySelector('[data-size]').value='3';window.BeautySeededPoolUI.update(data);
 const tick=async()=>{for(let i=0;i<32;i++)await Promise.resolve();};
 const find=text=>host.all().find(n=>n.tag==='button'&&n._text===text);
 async function load(){await find('LOAD / REFRESH LEAGUE STATS').fire('click');queue.shift().resolve(clone(source));await tick();}
 async function startGenerate(){await host.querySelector('[data-generate]').fire('click');host.querySelector('[data-mapping-reviewed]').checked=true;await host.querySelector('[data-mapping-reviewed]').fire('change');await host.querySelector('[data-confirm-generate]').fire('click');}
 async function generate(){await startGenerate();queue.shift().resolve({success:true,ticket:'draw',draw:clone(draw)});await tick();}
 async function prepare(){await find('REVIEW NAKKA HANDOFF — TEST').fire('click');queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:data.eventDate},setting:{startScore:501},expectedCards:6});await tick();}
 return {expire:()=>deadline(),startGenerate,host,window,document,main,nav,source,data,draw,requests,queue,find,tick,load,generate,prepare,timer:()=>timer(),lock(){generation++;(handlers['beauty-hub-locked']||[]).forEach(fn=>fn());},notice:()=>host.querySelector('[data-pool-message]').textContent};
}
test('pool UI reviews mappings, renders frozen group means, and does not send during generation',async()=>{
 const f=fixture();await f.load();await f.host.querySelector('[data-generate]').fire('click');assert.equal(f.requests.length,1);assert.match(f.notice(),/acknowledgement/);await f.generate();assert.ok(f.host.querySelector('.pool-group-heading'));assert.match(f.host.textContent,/Unseeded/);assert.match(f.host.textContent,/Frozen/);assert.deepEqual(f.requests.map(p=>p.page),['poolload','pooldraw']);const sent=JSON.parse(f.requests[1].bindings);assert.equal(sent.length,6);assert.equal(sent[0].lpid,'L0');
});
test('pool UI manual swaps request server adjustment and retain no old approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const first=f.draw.pools[0].players[0],other=f.draw.pools[1].players[0];await f.host.querySelectorAll('[data-swap-player]').find(n=>n.dataset.swapPlayer===first.id).fire('click');await f.host.querySelectorAll('[data-swap-with]').find(n=>n.dataset.swapWith===other.id).fire('click');assert.equal(f.requests.at(-1).page,'pooladjust');const change=JSON.parse(f.requests.at(-1).change),adjusted=core.adjust(f.draw,change);f.queue.shift().resolve({success:true,ticket:'adjusted',draw:adjusted});await f.tick();assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.notice(),/Swap saved/);
});
test('pool UI only sends after final approval and cannot double click while saving',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const save=f.find('SEND APPROVED TEST POOLS');assert.equal(save.disabled,true);await save.fire('click');assert.equal(f.requests.length,3);
 const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');await save.fire('click');await save.fire('click');assert.equal(f.requests.filter(p=>p.page==='poolsave').length,1);assert.equal(f.requests.at(-1).ticket,'approved');
 f.queue.shift().resolve({success:true,message:'Verified groups and cards',audit:'before',receipt:'after'});await f.tick();f.queue.shift().resolve({...f.source,workflow:savedWorkflow(f)});await f.tick();assert.match(f.notice(),/Verified groups/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);
});
test('pool UI withdrawals invalidate review and preserve visible frozen draw without silently redrawing',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.data.players[0].status='OUT';f.window.BeautySeededPoolUI.update(f.data);assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.match(f.host.textContent,/Player 0/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,true);assert.equal(f.requests.length,3);
});
test('pool UI lock drops late response and clears identities and previews',async()=>{
 const f=fixture();await f.load();await f.startGenerate();f.lock();f.queue.shift().resolve({success:true,ticket:'late',draw:f.draw});await f.tick();assert.equal(f.host.open,false);assert.doesNotMatch(f.host.textContent,/Player 0|Frozen/);assert.match(f.notice(),/Sign in/);
});
test('pool UI provider timeout blocks repeat send and retains inspect-before-retry guidance',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');await f.find('SEND APPROVED TEST POOLS').fire('click');f.queue.shift().reject(Error('Connection lost'));await f.tick();assert.match(f.notice(),/Do not repeat/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);
});
test('pool UI automatic refresh preserves a frozen preview and its controls',async()=>{
 const f=fixture();await f.load();f.document.hidden=true;f.timer();assert.equal(f.queue.length,0);f.document.hidden=false;f.timer();await f.tick();assert.equal(f.requests.at(-1).page,'poolload');f.queue.shift().resolve(f.source);await f.tick();
 await f.generate();await f.prepare();const requests=f.requests.length;f.timer();await f.tick();assert.equal(f.requests.length,requests);assert.ok(f.find('SEND APPROVED TEST POOLS'));assert.ok(f.host.querySelector('[data-swap-player]'));assert.doesNotMatch(f.host.textContent,/REVIEW INVALIDATED/);
});
test('pool TEST transport routes authenticated exact payloads and rejects target or extra-key injection',async()=>{
 const calls=[],context=vm.createContext({URL,BeautyHubAuth:{generation:()=>1,token:()=> 'staff-token',isCurrent:()=>true},google:{script:{get run(){let success;return {withSuccessHandler(fn){success=fn;return this;},withFailureHandler(){return this;},beautyHubTest(action,input,token){calls.push({action,input:clone(input),token});success({success:true});}};}}}});
 vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',context);
 await context.service.request('https://beauty.invalid/hub?page=pooldraw&bindings=%5B%5D&reviewed=true&sizes=%5B3%2C3%5D');
 assert.deepEqual(calls,[{action:'pooldraw',input:{bindings:'[]',reviewed:'true',sizes:'[3,3]',_context:'legacy'},token:'staff-token'}]);
 for(const u of ['https://evil.invalid/hub?page=poolload&refresh=true','https://beauty.invalid/hub?page=poolsave&ticket=x&confirmed=true&tdid=other','https://beauty.invalid/hub?page=poolload&refresh=true&refresh=false'])await assert.rejects(context.service.request(u),/Blocked/);
 assert.equal(calls.length,1);
});
test('pool UI closing and reopening drops an old handoff approval while retaining the frozen reference',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.host.close();f.host.showModal();assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.match(f.host.textContent,/Frozen/);assert.equal(f.requests.length,3);
});

test('pool UI renders omitted and null RPC averages as Unseeded and keeps measured zero numeric',async()=>{
 const f=fixture();delete f.source.mappings[0].average;f.source.mappings[1].average=null;f.source.mappings[2].average=0;
 await f.load();assert.match(f.host.textContent,/Unseeded/);assert.match(f.host.textContent,/0.00/);assert.ok(f.host.querySelector('[data-generate]'));assert.doesNotMatch(f.notice(),/toFixed/);
 const row=f.host.querySelectorAll('[data-binding]')[0];row.querySelector('[data-lpid]').value='L0';await row.querySelector('[data-lpid]').fire('change');assert.equal(f.host.querySelector('[data-mapping-reviewed]').checked,false);
});
test('pool UI normalizes omitted frozen averages before pool means colours and manual review',async()=>{
 const f=fixture();await f.load();await f.startGenerate();
 const draw=clone(f.draw);for(const p of draw.roster)if(p.average===null)delete p.average;for(const g of draw.pools)for(const p of g.players)if(p.average===null)delete p.average;
 f.queue.shift().resolve({success:true,ticket:'draw',draw});await f.tick();assert.ok(f.host.querySelector('.pool-group-heading'));assert.match(f.host.textContent,/Unseeded/);assert.ok(f.find('REVIEW NAKKA HANDOFF — TEST'));assert.doesNotMatch(f.notice(),/toFixed/);
});
test('pool workspace automatically loads current data on entry and sidebar navigation makes no extra request',async()=>{
 const f=fixture({fullPage:true});assert.equal(f.host.tag,'section');assert.equal(f.document.body.classList.contains('pool-workspace-active'),true);assert.equal(f.main.children.length,1);assert.equal(f.requests.length,1);assert.equal(f.requests[0].refresh,'false');
 f.queue.shift().resolve(clone(f.source));await f.tick();
 await f.nav[1].fire('click');assert.equal(f.host.hidden,true);assert.equal(f.document.body.classList.contains('pool-workspace-active'),false);assert.equal(f.requests.length,1);
 f.window.BeautySeededPoolUI.open(f.nav[0]);assert.equal(f.host.hidden,false);assert.equal(f.main.children.length,1);assert.equal(f.requests.length,2);f.queue.shift().resolve(clone(f.source));await f.tick();
});
test('pool workspace board and size changes invalidate an approved frozen draw without silently redrawing',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const boards=f.host.querySelector('[data-boards]');boards.value='3';await boards.fire('input');assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.equal(f.requests.length,3);
 const choices=f.host.querySelectorAll('[data-size-choice]');await choices[1].fire('click');assert.equal(f.host.querySelector('[data-size]').value,'4');assert.equal(f.requests.length,3);
});
test('pool workspace advanced hypothetical count is isolated from actual roster and handoff approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const count=f.host.querySelector('[data-manual-count]');count.value='37';await count.fire('input');assert.match(f.host.textContent,/12 pools/);assert.equal(f.data.players.length,6);assert.ok(f.find('SEND APPROVED TEST POOLS'));assert.equal(f.requests.length,3);
});
test('pool workspace disables Nakka handoff for unresolved identities but preserves planning and swap controls',async()=>{
 const f=fixture();f.source.mappings[0].tpid='';await f.load();await f.generate();const handoff=f.find('REVIEW NAKKA HANDOFF — TEST');assert.equal(handoff.disabled,true);assert.ok(f.host.querySelector('[data-swap-player]'));await handoff.fire('click');assert.equal(f.requests.length,2);assert.match(f.host.textContent,/Resolve 1 player identities/);
});
test('pool workspace colour bands only alter preview presentation and retain frozen values without RPC',async()=>{
 const f=fixture();await f.load();await f.generate();const tools=f.host.querySelector('.pool-preview-tools'),toggle=tools.querySelector('input');toggle.checked=true;await toggle.fire('change');assert.ok(f.host.all().some(n=>n.className==='pool-band-UNSEEDED'));assert.ok(f.host.all().some(n=>n.className==='pool-band-2'));assert.equal(f.requests.length,2);assert.match(f.host.textContent,/Frozen/);
});
test('pool workspace unavailable Hub data blocks generating and clears handoff approval until a new draw',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.window.BeautySeededPoolUI.unavailable();assert.equal(f.host.querySelector('[data-generate]').disabled,true);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);f.window.BeautySeededPoolUI.update(f.data);assert.equal(f.host.querySelector('[data-generate]').disabled,false);assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,true);assert.equal(f.requests.length,3);
});

test('pool workspace selects physical boards and shows numbered pools sharing only available boards',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='1,7';await f.load();await f.generate();assert.match(f.host.textContent,/Board 1/);assert.match(f.host.textContent,/Board 7/);assert.doesNotMatch(f.host.querySelector('[data-pool-draw]').textContent,/Group/);assert.doesNotMatch(f.host.textContent,/Pool A/);
 const first=f.host.querySelectorAll('[data-board-choice]')[0];await first.fire('click');assert.equal(f.host.querySelector('[data-boards]').value,'7');assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.equal(f.requests.length,2);
});
test('pool workspace invalid board ranges block drawing and excluded Nakka entries block approval',async()=>{
 const f=fixture();await f.load();f.host.querySelector('[data-boards]').value='1-4,4';await f.host.querySelector('[data-boards]').fire('input');assert.equal(f.host.querySelector('[data-generate]').disabled,true);
 f.host.querySelector('[data-boards]').value='1,7';await f.host.querySelector('[data-boards]').fire('input');await f.generate();await f.find('REVIEW NAKKA HANDOFF — TEST').fire('click');f.queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:f.data.eventDate},setting:{},expectedCards:6,unassignedEntries:[{tpid:'extra',name:'Standby Player'}]});await f.tick();assert.match(f.host.textContent,/Standby Player/);const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');assert.equal(f.find('SEND APPROVED TEST POOLS').disabled,true);
});

test('pool review orders unresolved identities first and confirms generation only through popup',async()=>{
 const f=fixture();f.source.mappings[5].lpid='';await f.load();assert.equal(f.host.querySelectorAll('[data-binding]')[0].dataset.binding,'P5');
 await f.host.querySelector('[data-generate]').fire('click');assert.equal(f.host.querySelector('[data-preview-confirm]').open,true);assert.equal(f.requests.length,1);assert.equal(f.host.querySelector('[data-confirm-generate]').disabled,true);await f.find('CANCEL').fire('click');assert.equal(f.requests.length,1);
 await f.generate();assert.equal(f.host.querySelector('[data-preview-confirm]').open,false);assert.equal(f.requests.at(-1).page,'pooldraw');
});
test('pool invalidation retains group overview and disabled swaps with a specific reason',async()=>{
 const f=fixture();await f.load();await f.generate();f.data.players[0].status='OUT';f.window.BeautySeededPoolUI.update(f.data);
 assert.match(f.host.textContent,/Group overview/);assert.match(f.host.textContent,/IN roster or event date changed/);assert.equal(f.host.querySelector('[data-swap-player]').disabled,true);const n=f.requests.length;await f.host.querySelector('[data-swap-player]').fire('click');assert.equal(f.requests.length,n);
});


test('pool card picker excludes same group and marks exactly both exchanged players yellow',async()=>{
 const f=fixture();await f.load();await f.generate();const first=f.draw.pools[0].players[0],other=f.draw.pools[1].players[0];
 await f.host.querySelectorAll('[data-swap-player]').find(n=>n.dataset.swapPlayer===first.id).fire('click');
 const choices=f.host.querySelectorAll('[data-swap-with]');assert.equal(choices.length,3);assert.ok(choices.every(n=>f.draw.pools[1].players.some(p=>p.id===n.dataset.swapWith)));
 const search=f.host.querySelector('[data-swap-search]');search.value=other.name;await search.fire('input');assert.equal(f.host.querySelectorAll('[data-swap-with]').length,1);
 await f.host.querySelector('[data-swap-with]').fire('click');const change=JSON.parse(f.requests.at(-1).change),adjusted=core.adjust(f.draw,change);f.queue.shift().resolve({success:true,ticket:'adjusted',draw:adjusted});await f.tick();
 assert.deepEqual(f.host.querySelectorAll('[data-swap-player]').filter(n=>n.dataset.swapped==='true').map(n=>n.dataset.swapPlayer).sort(),[first.id,other.id].sort());assert.deepEqual(adjusted.pools.map(p=>p.players.length),[3,3]);
 assert.equal(f.host.querySelector('[data-pool-draw]').children.at(-1).className,'pool-grid');
});
test('pool card labels reject collisions and preserve the frozen players and RPC ticket',async()=>{
 const f=fixture();await f.load();await f.generate();const before=f.requests.length,edit=f.host.querySelectorAll('button').find(n=>n._text==='Board 2');await edit.fire('click');
 const group=f.host.querySelector('[data-edit-group]');group.value='2';await f.find('SAVE LABELS').fire('click');assert.match(f.host.textContent,/already used/);assert.equal(f.requests.length,before);
 group.value='3';await f.find('SAVE LABELS').fire('click');assert.match(f.host.textContent,/Group 3/);assert.equal(f.requests.length,before);assert.equal(f.host.querySelectorAll('[data-swap-player]').length,6);
});
test('pool compact identity warning hides when resolved and scheme counts remain visible',async()=>{
 const f=fixture();await f.load();assert.equal(f.host.querySelector('[data-identity-notice]').hidden,true);assert.match(f.host.querySelector('[data-plan-summary]').textContent,/2 × 3 players/);
 assert.equal(f.find('BACK TO DASHBOARD'),undefined);await f.generate();assert.equal(f.host.querySelector('[data-pool-draw]').children.length,1);
});

test('pool estimate works before boards are selected and updates with selected board count',async()=>{
 const f=fixture(),count=f.host.querySelector('[data-manual-count]'),boards=f.host.querySelector('[data-boards]');boards.value='';await boards.fire('input');count.value='16';await count.fire('input');assert.match(f.host.querySelector('[data-estimate]').textContent,/5 pools:.*No boards selected/);
 boards.value='1,7';await boards.fire('input');assert.match(f.host.querySelector('[data-estimate]').textContent,/2 boards/);assert.match(f.host.querySelector('[data-plan-summary]').textContent,/2 × 3 players/);assert.equal(f.requests.length,0);
 count.value='4';await count.fire('input');assert.match(f.host.querySelector('[data-estimate]').textContent,/5 to 101/);assert.equal(f.data.players.length,6);
});
test('pool review is one expandable tab and calculation lives inside Advanced settings',async()=>{
 const f=fixture();f.source.mappings[0].lpid='';await f.load();const review=f.host.querySelector('[data-player-review]');assert.match(review.querySelector('summary').textContent,/Review players · 1 need review/);assert.ok(review.querySelector('[data-identity-notice]'));assert.equal(f.host.querySelectorAll('[data-player-review]').length,1);
 const advanced=f.host.querySelector('[data-advanced-settings]');assert.ok(advanced.querySelector('[data-stat-calculation]'));assert.match(advanced.textContent,/Overall three-dart average/);
 const row=review.querySelector('[data-binding]');row.querySelector('[data-lpid]').value='L0';await row.querySelector('[data-lpid]').fire('change');assert.equal(review.querySelector('[data-identity-notice]').hidden,true);assert.equal(review.querySelector('summary').textContent,'Review players');assert.equal(f.requests.length,1);
});

test('pool toolbar orders review league advanced and buttons expand content without RPC or losing mappings',async()=>{
 const f=fixture(),row=f.host.querySelector('[data-pool-toolbar]');assert.deepEqual(row.children.map(n=>Object.keys(n.dataset)[0]),['reviewToggle','leagueSlot','advancedToggle',undefined]);assert.equal(f.host.querySelector('[data-review-toggle]').disabled,true);
 await f.load();const review=f.host.querySelector('[data-review-toggle]'),advanced=f.host.querySelector('[data-advanced-toggle]'),details=f.host.querySelector('[data-player-review]');assert.equal(review.disabled,false);await review.fire('click');assert.equal(details.open,true);assert.equal(review['aria-expanded'],'true');const ids=f.host.querySelectorAll('[data-binding]').map(n=>n.dataset.binding);
 await advanced.fire('click');assert.equal(f.host.querySelector('[data-advanced-settings]').open,true);await review.fire('click');assert.equal(details.open,false);assert.deepEqual(f.host.querySelectorAll('[data-binding]').map(n=>n.dataset.binding),ids);assert.equal(f.requests.length,1);await advanced.fire('click');assert.equal(f.host.querySelector('[data-advanced-settings]').open,false);
});

test('pool compact cards show groups only for shared boards and keep average in clickable player row',async()=>{
 const f=fixture();await f.load();await f.generate();const cards=f.host.querySelectorAll('.pool-card');assert.equal(cards.length,2);assert.match(cards[0].querySelector('.pool-card-heading').textContent,/Board 2.*Group 1/);assert.match(cards[1].querySelector('.pool-card-heading').textContent,/Board 2.*Group 2/);assert.doesNotMatch(f.host.textContent,/✎/);const row=cards[0].querySelector('[data-swap-player]');assert.equal(row.children.length,2);await row.children[1].parentElement.fire('click');assert.ok(f.host.querySelector('[data-swap-picker]'));assert.equal(f.requests.length,2);
});
test('pool compact Nakka step preserves handoff gates and opens review without sending',async()=>{
 const f=fixture(),nakka=f.host.querySelectorAll('[data-step]')[2];assert.equal(nakka.disabled,true);await f.load();assert.equal(nakka.disabled,true);await f.generate();assert.equal(nakka.disabled,false);await nakka.fire('click');assert.equal(f.requests.at(-1).page,'poolprepare');assert.equal(f.requests.some(r=>r.page==='poolsave'),false);
});

test('Hub board and group dialog picker and scheme are English while canonical draw metadata stays intact',async()=>{
 const f=fixture();await f.load();await f.generate();const before=JSON.stringify(f.draw);await f.find('Board 2').fire('click');assert.ok(f.find('SAVE LABELS'));assert.match(f.host.textContent,/Edit Board \/ Group/);assert.doesNotMatch(f.host.textContent,/Bana|Grupp|manna|banor/);f.host.querySelector('[data-edit-board]').parentElement.parentElement.close();const p=f.host.querySelector('[data-swap-player]');await p.fire('click');assert.match(f.host.querySelector('[data-swap-picker]').textContent,/Board 2.*Group/);assert.equal(JSON.stringify(f.draw),before);assert.equal(f.requests.length,2);
});
test('pool cards are the only board editor and update a two-board heading immediately',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';const workflow=savedWorkflow(f);workflow.draw.pools[0].players.push(workflow.draw.pools[1].players.pop());workflow.draw.pools[0].capacity=4;f.source.workflow=workflow;await f.load();
 assert.equal(f.find('EDIT DISPLAY BOARDS'),undefined);assert.doesNotMatch(f.host.textContent,/Continue below|Saved pools loaded|Pools sent and verified/);assert.equal(f.notice(),'');assert.equal(f.host.querySelector('[data-fresh]').dataset.fresh,'true');const count=f.host.querySelector('[data-pool-board-count]');count.value='2';count.fire('change');
 const id=workflow.draw.pools[0].id;let fields=f.host.querySelectorAll('[data-pool-board-number]');fields.find(n=>n.dataset.poolBoardNumber===id+':0').value='4';fields.find(n=>n.dataset.poolBoardNumber===id+':0').fire('change');fields=f.host.querySelectorAll('[data-pool-board-number]');fields.find(n=>n.dataset.poolBoardNumber===id+':1').value='9';fields.find(n=>n.dataset.poolBoardNumber===id+':1').fire('change');
 assert.match(f.host.querySelector('.pool-card-heading').textContent,/Bana 4 \+ 9/);assert.match(f.host.querySelector('.pool-board-options').textContent,/Board 1.*Board 2/);assert.doesNotMatch(f.host.querySelector('.pool-board-options').textContent,/Second board/);assert.ok(f.find('SAVE BOARDS & MATCH PLAN'));assert.equal(f.requests.length,1);
});
test('pool inline board save uses the existing plan route and an expired organiser cannot save',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();await f.find('SAVE BOARDS & MATCH PLAN').fire('click');assert.equal(f.requests.at(-1).page,'poolboardplan');assert.equal(f.requests.some(p=>p.page==='poolsave'),false);f.lock();f.queue.shift().resolve({success:true,workflow:f.source.workflow,message:'Late save'});await f.tick();assert.equal(f.host.open,false);assert.doesNotMatch(f.notice(),/Late save/);
});

test('planner scheme uses only needed pool-size tiles ordered by selected preference and hides redundant boards field',async()=>{
 const f=fixture(),summary=f.host.querySelector('[data-plan-summary]');assert.equal(summary.children.length,1);assert.match(summary.textContent,/2 × 3 players/);assert.doesNotMatch(summary.textContent,/0 ×|boards/);assert.equal(f.host.querySelector('[data-boards]').parentElement.hidden,true);assert.equal(f.find('EDIT DISPLAY BOARDS'),undefined);
 f.data.players=Array.from({length:62},(_,i)=>({player:'Player '+i,status:'IN'}));f.window.BeautySeededPoolUI.update(f.data);assert.equal(summary.children.length,2);assert.match(summary.children[0].textContent,/18 × 3 players/);assert.match(summary.children[1].textContent,/2 × 4 players/);
 f.host.querySelectorAll('[data-size-choice]').find(n=>n.dataset.sizeChoice==='4').click();assert.match(summary.children[0].textContent,/14 × 4 players/);assert.match(summary.children[1].textContent,/2 × 3 players/);assert.equal(f.requests.length,0);
});

test('planner BOARDS tile counts used physical boards and retains only nonzero size chips',()=>{
 const f=fixture(),boards=f.host.querySelector('[data-boards]'),needed=f.host.querySelector('[data-boards-needed]');const summary=f.host.querySelector('[data-plan-summary]'),label=f.host.querySelector('[data-pools-label]');assert.equal(label.textContent,'POOLS');assert.equal(label.parentElement,summary.parentElement);assert.equal(summary.parentElement.children[0],label);assert.equal(needed.parentElement.parentElement.children[1],label.parentElement);assert.equal(needed.parentElement.children[0].textContent,'BOARDS');assert.equal(needed.textContent,'1');assert.match(needed['aria-label'],/1 boards used/);
 boards.value='1,2,3,4';boards.fire('input');assert.equal(needed.textContent,'2');assert.equal(f.host.querySelector('[data-plan-summary]').children.length,1);
 boards.value='';boards.fire('input');assert.equal(needed.textContent,'—');
 f.data.players=Array.from({length:62},(_,i)=>({player:'Player '+i,status:'IN'}));boards.value='1-8';boards.fire('input');f.window.BeautySeededPoolUI.update(f.data);assert.equal(needed.textContent,'8');assert.match(f.host.querySelector('[data-plan-summary]').textContent,/18 × 3 players.*2 × 4 players/);assert.equal(f.requests.length,0);
});

function savedWorkflow(f){let boardPlan=null;try{const api=require('../public/js/pool-board-allocation.js'),available=api.parseBoards(f.host.querySelector('[data-boards]').value);boardPlan=api.matchPlan(f.draw.pools,available,f.draw.pools.map((p,i)=>({poolId:p.id,boards:[available[i%available.length]]})));}catch(e){}return {event:{id:'t_QHaG_7792',title:'TEST',date:f.data.eventDate,status:20},draw:clone(f.draw),boardPlan,canStart:true,running:false,format:{stage1:{qualifiers:4},stage2:{qualifiers:2}}};}
test('pool main flow shows qualification without Advanced and resumes saved pools to an explicit Start confirmation',async()=>{
 const f=fixture();await f.load();await f.generate();assert.ok(f.host.querySelector('[data-event-format]'));assert.equal(f.host.querySelector('[data-advanced-settings]').querySelector('[data-event-format]'),null);
 assert.match(f.host.textContent,/first 2 up, last 1 down/);
 const g=fixture();g.source.workflow=savedWorkflow(g);await g.load();assert.ok(g.find('START EVENT — TEST'));assert.equal(g.requests.length,1);
 const step=g.host.querySelector('[data-start-section]'),advanced=g.host.querySelector('[data-advanced-settings]');assert.equal(step.querySelectorAll('details').length,0);assert.match(advanced.textContent,/Qualification rules/);assert.match(advanced.textContent,/Board match order/);assert.equal(step.querySelectorAll('button').length,2);
 await g.find('START EVENT — TEST').fire('click');assert.equal(g.requests.at(-1).page,'poolstartprepare');g.queue.shift().resolve({success:true,ticket:'start-ticket',workflow:g.source.workflow});await g.tick();
 const confirm=g.find('CONFIRM START — TEST');assert.equal(confirm.disabled,true);const check=g.host.querySelector('[data-start-section]').querySelector('input');check.checked=true;await check.fire('change');await confirm.fire('click');await confirm.fire('click');assert.equal(g.requests.filter(r=>r.page==='poolstart').length,1);assert.match(g.host.querySelector('[data-start-section]').textContent,/Starting TEST event/);assert.doesNotMatch(g.host.querySelector('[data-start-section]').textContent,/Save boards first/);
 g.queue.shift().resolve({success:true,message:'TEST started'});await g.tick();assert.match(g.host.textContent,/Competition running/);assert.equal(g.find('CONFIRM START — TEST'),undefined);assert.equal(g.requests.some(r=>r.page==='poolsave'),false);
});
test('pool four-player draft defaults to one board when scarce and rejects an unavailable second board',async()=>{
 const f=fixture();await f.load();await f.startGenerate();const draw=clone(f.draw);draw.pools[0].players.push(draw.pools[1].players.pop());draw.pools[0].capacity=4;
 f.queue.shift().resolve({success:true,ticket:'draw',draw});await f.tick();
 const count=f.host.querySelector('[data-pool-board-count]');assert.ok(count);assert.equal(count.value,'1');assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,false);count.value='1';await count.fire('change');assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,false);
 const first=f.host.querySelector('[data-pool-board-count]');first.value='2';await first.fire('change');assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,true);
});

test('planner automatic load failure leaves generation blocked and never starts or sends',async()=>{
 const f=fixture({fullPage:true});assert.equal(f.requests.length,1);f.queue.shift().reject(Error('League unavailable'));await f.tick();assert.match(f.notice(),/League unavailable/);assert.equal(f.host.querySelector('[data-generate]').disabled,true);assert.equal(f.requests.some(r=>r.page==='poolstart'||r.page==='poolsave'),false);
});

test('saved pool RPC omission stays Unseeded and frozen START excludes unknown averages',async()=>{
 const f=fixture(),workflow=savedWorkflow(f);workflow.draw.pools[0].players.forEach((p,i)=>{if(i===0)p.average=54.43;else if(i===1)p.average=37.99;else delete p.average;});workflow.draw.pools[1].players.forEach((p,i)=>{if(i===0)p.average=40.83;else delete p.average;});
 f.source.workflow=workflow;await f.load();assert.match(f.host.textContent,/START\s+46\.21/);assert.match(f.host.textContent,/START\s+40\.83/);assert.doesNotMatch(f.host.textContent,/NaN|undefined/);
 assert.equal(f.host.querySelector('[data-fresh]').dataset.fresh,'true');const cards=f.host.querySelectorAll('.pool-card');assert.equal(cards.length,2);const rows=cards[0].querySelectorAll('.pool-player-name');assert.equal(rows.length,3);assert.equal(rows[0].children[1].textContent,'54.43');assert.equal(rows[1].children[1].textContent,'37.99');assert.equal(rows[2].children[1].textContent,'—');
});
test('saved pools preserve measured zero and explain empty board choices without inventing a selection',async()=>{
 const f=fixture(),workflow=savedWorkflow(f);workflow.draw.pools[0].players.forEach((p,i)=>{if(i===0)p.average=0;else delete p.average;});workflow.draw.pools[1].players.forEach(p=>delete p.average);workflow.boardPlan=null;f.source.workflow=workflow;f.host.querySelector('[data-boards]').value='';await f.load();
 assert.match(f.host.textContent,/START\s+0\.00/);assert.match(f.host.textContent,/START\s+—/);assert.match(f.host.textContent,/Select available boards above/);assert.doesNotMatch(f.host.textContent,/NaN|undefined/);assert.equal(f.host.querySelector('[data-boards]').value,'');assert.equal(f.requests.some(p=>p.page==='poolsave'||p.page==='poolstart'),false);
});

test('pool card group numbers appear only for separate pools sharing a selected board',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();let headings=f.host.querySelectorAll('.pool-card-heading');assert.doesNotMatch(headings.map(n=>n.textContent).join(' '),/Group/);
 const id=f.draw.pools[1].id,field=f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');field.value='4';field.fire('change');headings=f.host.querySelectorAll('.pool-card-heading');assert.match(headings[0].textContent,/Bana 4.*Group 1/);assert.match(headings[1].textContent,/Bana 4.*Group 2/);assert.equal(f.requests.length,1);
});

test('compact pool status turns red on failed refresh and unsaved board edits block Start',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();assert.equal(f.host.querySelector('[data-fresh]').dataset.fresh,'true');assert.ok(f.host.querySelectorAll('.pool-inline-status').every(n=>n.dataset.ready==='true'));assert.equal(f.notice(),'');
 const id=f.draw.pools[1].id,field=f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');field.value='4';field.fire('change');assert.equal(f.host.querySelectorAll('.pool-inline-status')[1].dataset.ready,'false');assert.equal(f.find('START EVENT — TEST'),undefined);
 await f.find('↻').fire('click');f.queue.shift().reject(Error('Status unavailable'));await f.tick();assert.equal(f.host.querySelector('[data-fresh]').dataset.fresh,'false');assert.match(f.host.textContent,/Check pools/);assert.equal(f.find('START EVENT — TEST'),undefined);
});

test('planner pending read deadline unlocks controls and drops a late saved-plan response',async()=>{
 const f=fixture({watchdog:true});f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();await f.find('↻').fire('click');assert.equal(f.window.BeautySeededPoolUI.isBusy(),true);f.expire();await f.tick();assert.equal(f.window.BeautySeededPoolUI.isBusy(),false);assert.equal(f.host.querySelector('[data-advanced-toggle]').disabled,false);assert.match(f.notice(),/Loading timed out/);assert.equal(f.find('START EVENT — TEST'),undefined);assert.equal(f.find('SAVE BOARDS & MATCH PLAN').disabled,true);
 f.queue.shift().resolve(clone(f.source));await f.tick();assert.match(f.notice(),/Loading timed out/);assert.equal(f.find('START EVENT — TEST'),undefined);assert.equal(f.requests.some(r=>r.page==='poolsave'||r.page==='poolstart'),false);
});
test('planner reloading saved boards discards unsaved choices and restores Start without another save',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();const id=f.draw.pools[1].id;let field=f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');field.value='4';field.fire('change');assert.equal(f.find('START EVENT — TEST'),undefined);
 await f.find('↻').fire('click');f.queue.shift().resolve(clone(f.source));await f.tick();field=f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');assert.equal(field.value,'9');assert.ok(f.find('START EVENT — TEST'));assert.equal(f.requests.filter(r=>r.page==='poolboardplan').length,0);
});
test('planner restoring the saved board selection clears the local dirty gate without a sticky false state',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';f.source.workflow=savedWorkflow(f);await f.load();const id=f.draw.pools[1].id;const select=()=>f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');select().value='4';select().fire('change');assert.equal(f.find('START EVENT — TEST'),undefined);select().value='9';select().fire('change');assert.ok(f.find('START EVENT — TEST'));assert.equal(f.requests.length,1);
});

test('planner a late request from a locked session cannot unlock a new organiser request',async()=>{
 const f=fixture();await f.find('LOAD / REFRESH LEAGUE STATS').fire('click');f.lock();f.host.showModal();await f.find('LOAD / REFRESH LEAGUE STATS').fire('click');assert.equal(f.requests.length,2);f.queue.shift().resolve(clone(f.source));await f.tick();assert.equal(f.window.BeautySeededPoolUI.isBusy(),true);f.queue.shift().resolve(clone(f.source));await f.tick();assert.equal(f.window.BeautySeededPoolUI.isBusy(),false);
});


test('running pool cards hide Save and Start after the competition starts',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='4,9';
 f.window.BeautyTournamentControl={open(){throw Error('Removed command must not open');}};const workflow=savedWorkflow(f);workflow.running=true;workflow.canStart=false;workflow.canEditBoards=true;workflow.boardVersion='revision-1';
 f.source.workflow=workflow;await f.load();
 const id=f.draw.pools[0].id,field=f.host.querySelectorAll('[data-pool-board-number]').find(n=>n.dataset.poolBoardNumber===id+':0');
 assert.equal(f.find('TOURNAMENT CONTROL'),undefined);assert.ok(field);field.value='9';await field.fire('change');
 assert.match(f.host.textContent,/Save boards/);assert.equal(f.find('START EVENT — TEST'),undefined);
 assert.equal(f.find('SAVE BOARDS & MATCH PLAN'),undefined);
 assert.equal(f.requests.some(r=>r.page==='poolstart'||r.page==='poolsave'),false);
});


test('pool draft fills two-board four-player defaults and preserves manual one-board choice on redraw',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='1,4,5';await f.load();await f.startGenerate();
 const draw=clone(f.draw);draw.pools[0].players.push(draw.pools[1].players.pop());draw.pools[0].capacity=4;
 f.queue.shift().resolve({success:true,ticket:'draw',draw});await f.tick();
 let count=f.host.querySelector('[data-pool-board-count]');assert.equal(count.value,'2');
 let fields=f.host.querySelectorAll('[data-pool-board-number]').filter(n=>n.dataset.poolBoardNumber.startsWith(draw.pools[0].id+':'));
 assert.deepEqual(fields.map(n=>n.value),['1','4']);assert.equal(f.host.querySelector('[data-boards-needed]').textContent,'3');assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST').disabled,false);
 count.value='1';await count.fire('change');assert.equal(f.host.querySelector('[data-pool-board-count]').value,'1');assert.equal(f.host.querySelector('[data-boards-needed]').textContent,'2');
 const review=f.find('REVIEW NAKKA HANDOFF — TEST');await review.fire('click');
 const plan=JSON.parse(f.requests.at(-1).boardPlan);assert.deepEqual(plan.choices.find(c=>c.poolId===draw.pools[0].id).boards,[1]);
});
test('saved explicit boards survive default allocation and sparse draft queues explain later pools',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='1,4';const w=savedWorkflow(f);
 w.boardPlan.assignments[0].boards=[4];w.boardPlan.assignments[1].boards=[1];f.source.workflow=w;await f.load();
 const fields=f.host.querySelectorAll('[data-pool-board-number]');assert.deepEqual(fields.map(n=>n.value),['4','1']);
 const g=fixture();await g.load();await g.generate();assert.match(g.host.textContent,/Shared boards.*Pool 2.*row 4.*play later/);
});


test('planner board usage estimate includes a spare second board for each four-player pool',async()=>{
 const f=fixture();f.data.players.push({player:'Player 6',status:'IN'});f.window.BeautySeededPoolUI.update(f.data);
 const boards=f.host.querySelector('[data-boards]');boards.value='1,4,6';await boards.fire('input');
 assert.equal(f.host.querySelector('[data-boards-needed]').textContent,'3');
 boards.value='1,4';await boards.fire('input');assert.equal(f.host.querySelector('[data-boards-needed]').textContent,'2');
});

test('pool review Back retains the frozen draw and board choices while discarding the send approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const text=f.host.querySelector('[data-pool-draw]').textContent;const boards=f.host.querySelector('[data-boards]').value;
 const staleSave=f.find('SEND APPROVED TEST POOLS'),oldCheck=f.host.querySelector('.pool-approval').querySelector('input');oldCheck.checked=true;oldCheck.fire('change');await f.find('BACK TO POOLS').fire('click');assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.equal(f.host.querySelector('[data-pool-draw]').textContent,text);assert.equal(f.host.querySelector('[data-boards]').value,boards);assert.equal(f.requests.length,3);
 await staleSave.fire('click');await f.tick();assert.equal(f.requests.filter(r=>r.page==='poolsave').length,0);await f.prepare();assert.equal(f.find('SEND APPROVED TEST POOLS').disabled,true);assert.equal(f.requests.at(-1).page,'poolprepare');
});

test('start review Back preserves saved pools and boards and requires a fresh start approval',async()=>{
 const f=fixture();f.source.workflow=savedWorkflow(f);await f.load();const boards=f.host.querySelector('[data-boards]').value;
 await f.find('START EVENT — TEST').fire('click');f.queue.shift().resolve({success:true,ticket:'old-start',workflow:f.source.workflow});await f.tick();const stale=f.find('CONFIRM START — TEST');
 await f.find('BACK TO BOARDS').fire('click');assert.equal(f.find('CONFIRM START — TEST'),undefined);assert.equal(f.host.querySelector('[data-boards]').value,boards);assert(f.find('START EVENT — TEST'));await stale.fire('click');assert.equal(f.requests.filter(r=>r.page==='poolstart').length,0);
 await f.find('START EVENT — TEST').fire('click');f.queue.shift().resolve({success:true,ticket:'new-start',workflow:f.source.workflow});await f.tick();assert.equal(f.find('CONFIRM START — TEST').disabled,true);assert.equal(f.requests.filter(r=>r.page==='poolstartprepare').length,2);
});

test('Pool UI follows Round Robin only and single Slutspel qualification choices',async()=>{
 const f=fixture();f.source.stages={stage1:false,stage2:false};f.source.formatPreset='preserve';await f.load();await f.generate();const select=f.host.querySelector('[data-event-format]');assert.equal(select.value,'preserve');assert.equal(select.children.length,1);assert.match(f.host.textContent,/Round Robin only/);assert.doesNotMatch(f.host.textContent,/First 2 up → Slutspel 1/);
 const g=fixture();g.source.stages={stage1:false,stage2:true};await g.load();await g.generate();assert.match(g.host.textContent,/Top 2 per group → Slutspel 2/);assert.doesNotMatch(g.host.textContent,/remaining players down → Slutspel 2/);
});
test('Pool UI explains native knockout-only setup and disables group generation',async()=>{
 const f=fixture();Object.assign(f.source,{knockoutOnly:true,stats:null,stages:[{title:'Slutspel 2',slots:16}],event:{title:'AIK Hub TEST knockout',date:f.data.eventDate,url:'https://n01darts.com/n01/league/season.php?id=t_TEST'}});await f.load();assert.equal(f.host.querySelector('.pool-setup').hidden,true);assert.equal(f.host.querySelector('[data-generate]').disabled,true);assert.match(f.host.textContent,/assign them to the chosen brackets and start in Nakka Control/);const link=f.host.all().find(n=>n.tag==='a'&&n._text==='OPEN NAKKA EVENT ↗');assert.equal(link.href,f.source.event.url);assert.equal(f.requests.length,1);
});

test('pool handoff shows readable finals and limits with JSON collapsed under technical details',async()=>{
 const f=fixture();await f.load();await f.generate();await f.find('REVIEW NAKKA HANDOFF — TEST').fire('click');
 const base={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01',limit_rounds:1,rounds:13,game_setting:[]};
 f.queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:f.data.eventDate},setting:base,matchSettings:{groups:{...base,point_w:2,point_d:1,point_l:0},slutspel1:{...base,tournament:1,t3:0,game_setting:[{round:-1,limit_leg_count:3,roundLimit:1,maxRound:13}]},slutspel2:{...base,tournament:1,t3:0}},expectedCards:6});await f.tick();
 const readable=f.host.querySelector('.pool-readable-settings');assert.match(readable.textContent,/First to 3 legs \(best of 5\)/);assert.match(readable.textContent,/First to 2 legs \(best of 3\)/);assert.match(readable.textContent,/13 rounds \/ 39 darts/);assert.match(readable.textContent,/Third-place match: Off/);assert.doesNotMatch(readable.textContent,/limit_leg_count/);
 const details=f.host.querySelector('.pool-approval').querySelectorAll('details').find(n=>n.querySelector('summary')?.textContent==='Technical details');assert(details);assert.equal(details.open,false);assert.match(details.textContent,/limit_leg_count/);
});
