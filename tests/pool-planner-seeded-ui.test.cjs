const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('../public/js/pool-seeding.js');
const clone=x=>JSON.parse(JSON.stringify(x));
class Node{
 constructor(tag,owner){this.tag=tag;this.owner=owner;this.children=[];this.dataset={};this.events={};this.value='';this.disabled=false;this.checked=false;this.open=false;this._text='';}
 set textContent(t){this._text=String(t);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join(' ');}
 appendChild(n){n.parentElement=this;this.children.push(n);if(this.tag==='select'&&this.children.length===1)this._selected=0;return n;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 set value(v){this._value=String(v);}get value(){if(this.tag==='select'&&!this._value)return this.children[0]?.value||'';return this._value||'';}
 setAttribute(k,v){this[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 fire(k){if(this.disabled)return;for(const fn of this.events[k]||[])fn({preventDefault(){},stopImmediatePropagation(){}});}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 querySelectorAll(q){const queries=q.split(',');return this.all().filter(n=>queries.some(s=>s.startsWith('[data-')?Object.hasOwn(n.dataset,s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):s.startsWith('.')?n.className===s.slice(1):n.tag===s));}
 querySelector(q){return this.querySelectorAll(q)[0]||null;}
 dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);}
 close(){this.open=false;for(const fn of this.events.close||[])fn();}
 showModal(){this.open=true;}focus(){this.owner.activeElement=this;}
}
function fixture(options={}){
 const handlers={},document={hidden:false,createElement(tag){return new Node(tag,this);},createTextNode(text){const n=new Node('#text',this);n.textContent=text;return n;},addEventListener(k,fn){(handlers[k]??=[]).push(fn);}};
 let host=new Node('dialog',document);host.open=true;const classes=new Set();document.body=new Node('body',document);document.body.classList={add:s=>classes.add(s),remove:s=>classes.delete(s),contains:s=>classes.has(s)};const main=new Node('main',document),nav=[new Node('button',document),new Node('button',document)];document.body.append(main);document.querySelector=q=>q==='.main-content'?main:null;document.querySelectorAll=q=>q==='.sidebar > button'?nav:[];
 const data={success:true,eventDate:'2026-10-27',players:Array.from({length:6},(_,i)=>({player:'Player '+i,status:'IN'}))};
 const players=data.players.map((p,i)=>({id:'P'+i,name:p.player,status:p.status,average:i?50+i:null}));
 const source={success:true,stats:{fresh:true,fetchedAt:'2026-10-28T22:00:00Z',title:'AIK',profiles:[]},mappings:players.map((p,i)=>({...p,lpid:'L'+i,tpid:'E'+i,leagueCandidates:[{lpid:'L'+i,name:p.name,average:p.average}],eventCandidates:[{tpid:'E'+i,name:p.name}]}))};
 const draw=core.draw({players,sizes:[3,3],seed:42,eventDate:data.eventDate,frozenAt:'2026-10-28T22:00:00Z',source:{leagueId:'lg',fetchedAt:'2026-10-28T22:00:00Z'}});
 const requests=[],queue=[];let generation=1,timer;
 const window={BeautyPoolBoards:require('../public/js/pool-board-allocation.js'),document,BeautyPoolPlanner:require('../public/js/pool-planner.js'),beautyHubData:data,setInterval(fn){timer=fn;}};
 const c={window,document,URL,Event:class {constructor(type){this.type=type;}},BeautyPoolSeeding:core,BeautyPoolPlanner:require('../public/js/pool-planner.js'),BeautyHubAuth:{generation:()=>generation,isCurrent:n=>n===generation},BeautyHubServices:{mode:'test',endpoint:'https://beauty.invalid/hub',request(raw){const u=new URL(raw),input=Object.fromEntries(u.searchParams);requests.push(input);return new Promise((resolve,reject)=>queue.push({resolve:r=>resolve({json:async()=>r}),reject}));}}};
 vm.runInNewContext(fs.readFileSync('public/js/pool-planner-seeded.js','utf8'),c);if(options.fullPage){window.BeautySeededPoolUI.open(nav[0]);host=main.children[0];}else window.BeautySeededPoolUI.mount(host);host.querySelector('[data-boards]').value='2';host.querySelector('[data-size]').value='3';window.BeautySeededPoolUI.update(data);
 const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const find=text=>host.all().find(n=>n.tag==='button'&&n._text===text);
 async function load(){await find('LOAD / REFRESH LEAGUE STATS').fire('click');queue.shift().resolve(clone(source));await tick();}
 async function generate(){host.querySelector('[data-mapping-reviewed]').checked=true;await find('GENERATE SEEDED PREVIEW').fire('click');queue.shift().resolve({success:true,ticket:'draw',draw:clone(draw)});await tick();}
 async function prepare(){await find('REVIEW NAKKA HANDOFF — TEST').fire('click');queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:data.eventDate},setting:{startScore:501},expectedCards:6});await tick();}
 return {host,window,document,main,nav,source,data,draw,requests,queue,find,tick,load,generate,prepare,timer:()=>timer(),lock(){generation++;(handlers['beauty-hub-locked']||[]).forEach(fn=>fn());},notice:()=>host.querySelector('[data-pool-message]').textContent};
}
test('pool UI reviews mappings, renders frozen means and coverage, and does not send during generation',async()=>{
 const f=fixture();await f.load();await f.find('GENERATE SEEDED PREVIEW').fire('click');assert.equal(f.requests.length,1);assert.match(f.notice(),/acknowledgement/);await f.generate();assert.match(f.host.textContent,/Coverage 2\/3/);assert.match(f.host.textContent,/Unseeded/);assert.match(f.host.textContent,/Frozen/);assert.deepEqual(f.requests.map(p=>p.page),['poolload','pooldraw']);const sent=JSON.parse(f.requests[1].bindings);assert.equal(sent.length,6);assert.equal(sent[0].lpid,'L0');
});
test('pool UI manual swaps request server adjustment and retain no old approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const field=f.host.querySelector('fieldset'),selects=field.querySelectorAll('select');selects[0].value=f.draw.pools[0].players[0].id;selects[1].value=f.draw.pools[1].players[0].id;
 await f.find('SWAP PLAYERS').fire('click');assert.equal(f.requests.at(-1).page,'pooladjust');const change=JSON.parse(f.requests.at(-1).change),adjusted=core.adjust(f.draw,change);f.queue.shift().resolve({success:true,ticket:'adjusted',draw:adjusted});await f.tick();assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.notice(),/Swap saved/);
});
test('pool UI only sends after final approval and cannot double click while saving',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const save=f.find('SEND APPROVED TEST POOLS');assert.equal(save.disabled,true);await save.fire('click');assert.equal(f.requests.length,3);
 const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');await save.fire('click');await save.fire('click');assert.equal(f.requests.filter(p=>p.page==='poolsave').length,1);assert.equal(f.requests.at(-1).ticket,'approved');
 f.queue.shift().resolve({success:true,message:'Verified groups and cards',audit:'before',receipt:'after'});await f.tick();assert.match(f.notice(),/Verified groups/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);
});
test('pool UI withdrawals invalidate review and preserve visible frozen draw without silently redrawing',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.data.players[0].status='OUT';f.window.BeautySeededPoolUI.update(f.data);assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.match(f.host.textContent,/Player 0/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST'),undefined);assert.equal(f.requests.length,3);
});
test('pool UI lock drops late response and clears identities and previews',async()=>{
 const f=fixture();await f.load();f.host.querySelector('[data-mapping-reviewed]').checked=true;await f.find('GENERATE SEEDED PREVIEW').fire('click');f.lock();f.queue.shift().resolve({success:true,ticket:'late',draw:f.draw});await f.tick();assert.equal(f.host.open,false);assert.doesNotMatch(f.host.textContent,/Player 0|Frozen/);assert.match(f.notice(),/Sign in/);
});
test('pool UI provider timeout blocks repeat send and retains inspect-before-retry guidance',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');await f.find('SEND APPROVED TEST POOLS').fire('click');f.queue.shift().reject(Error('Connection lost'));await f.tick();assert.match(f.notice(),/Do not repeat/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);
});
test('pool UI automatic refresh runs only while visible and invalidates expired frozen approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.document.hidden=true;f.timer();assert.equal(f.queue.length,0);f.document.hidden=false;f.timer();await f.tick();assert.equal(f.requests.at(-1).page,'poolload');assert.equal(f.requests.at(-1).refresh,'false');f.queue.shift().resolve(f.source);await f.tick();assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);
});
test('pool TEST transport routes authenticated exact payloads and rejects target or extra-key injection',async()=>{
 const calls=[],context=vm.createContext({URL,BeautyHubAuth:{generation:()=>1,token:()=> 'staff-token',isCurrent:()=>true},google:{script:{get run(){let success;return {withSuccessHandler(fn){success=fn;return this;},withFailureHandler(){return this;},beautyHubTest(action,input,token){calls.push({action,input:clone(input),token});success({success:true});}};}}}});
 vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',context);
 await context.service.request('https://beauty.invalid/hub?page=pooldraw&bindings=%5B%5D&reviewed=true&sizes=%5B3%2C3%5D');
 assert.deepEqual(calls,[{action:'pooldraw',input:{bindings:'[]',reviewed:'true',sizes:'[3,3]'},token:'staff-token'}]);
 for(const u of ['https://evil.invalid/hub?page=poolload&refresh=true','https://beauty.invalid/hub?page=poolsave&ticket=x&confirmed=true&tdid=other','https://beauty.invalid/hub?page=poolload&refresh=true&refresh=false'])await assert.rejects(context.service.request(u),/Blocked/);
 assert.equal(calls.length,1);
});
test('pool UI closing and reopening drops an old handoff approval while retaining the frozen reference',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.host.close();f.host.showModal();assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.match(f.host.textContent,/Frozen/);assert.equal(f.requests.length,3);
});

test('pool UI renders omitted and null RPC averages as Unseeded and keeps measured zero numeric',async()=>{
 const f=fixture();delete f.source.mappings[0].average;f.source.mappings[1].average=null;f.source.mappings[2].average=0;
 await f.load();assert.match(f.host.textContent,/Unseeded/);assert.match(f.host.textContent,/0.00/);assert.ok(f.find('GENERATE SEEDED PREVIEW'));assert.doesNotMatch(f.notice(),/toFixed/);
 const row=f.host.querySelectorAll('[data-binding]')[0];row.querySelector('[data-lpid]').value='L0';await row.querySelector('[data-lpid]').fire('change');assert.equal(f.host.querySelector('[data-mapping-reviewed]').checked,false);
});
test('pool UI normalizes omitted frozen averages before pool means colours and manual review',async()=>{
 const f=fixture();await f.load();f.host.querySelector('[data-mapping-reviewed]').checked=true;
 await f.find('GENERATE SEEDED PREVIEW').fire('click');const draw=clone(f.draw);for(const p of draw.roster)if(p.average===null)delete p.average;for(const g of draw.pools)for(const p of g.players)if(p.average===null)delete p.average;
 f.queue.shift().resolve({success:true,ticket:'draw',draw});await f.tick();assert.match(f.host.textContent,/Coverage 2\/3/);assert.match(f.host.textContent,/Unseeded/);assert.ok(f.find('REVIEW NAKKA HANDOFF — TEST'));assert.doesNotMatch(f.notice(),/toFixed/);
});
test('pool approved workspace opens as one main-page section and sidebar navigation closes it without RPC',async()=>{
 const f=fixture({fullPage:true});assert.equal(f.host.tag,'section');assert.equal(f.document.body.classList.contains('pool-workspace-active'),true);assert.equal(f.main.children.length,1);assert.equal(f.requests.length,0);
 f.window.BeautySeededPoolUI.open(f.nav[0]);assert.equal(f.main.children.length,1);await f.nav[1].fire('click');assert.equal(f.host.hidden,true);assert.equal(f.document.body.classList.contains('pool-workspace-active'),false);assert.equal(f.requests.length,0);
 f.window.BeautySeededPoolUI.open(f.nav[0]);assert.equal(f.host.hidden,false);assert.equal(f.main.children.length,1);
});
test('pool workspace board and size changes invalidate an approved frozen draw without silently redrawing',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const boards=f.host.querySelector('[data-boards]');boards.value='3';await boards.fire('input');assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.equal(f.requests.length,3);
 const choices=f.host.querySelectorAll('[data-size-choice]');await choices[1].fire('click');assert.equal(f.host.querySelector('[data-size]').value,'4');assert.equal(f.requests.length,3);
});
test('pool workspace advanced hypothetical count is isolated from actual roster and handoff approval',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();const count=f.host.querySelector('[data-manual-count]');count.value='37';await count.fire('input');assert.match(f.host.textContent,/12 pools/);assert.equal(f.data.players.length,6);assert.ok(f.find('SEND APPROVED TEST POOLS'));assert.equal(f.requests.length,3);
});
test('pool workspace disables Nakka handoff for unresolved identities but preserves planning and swap controls',async()=>{
 const f=fixture();f.source.mappings[0].tpid='';await f.load();await f.generate();const handoff=f.find('REVIEW NAKKA HANDOFF — TEST');assert.equal(handoff.disabled,true);assert.ok(f.find('SWAP PLAYERS'));await handoff.fire('click');assert.equal(f.requests.length,2);assert.match(f.host.textContent,/Resolve 1 player identities/);
});
test('pool workspace colour bands only alter preview presentation and retain frozen values without RPC',async()=>{
 const f=fixture();await f.load();await f.generate();const tools=f.host.querySelector('.pool-preview-tools'),toggle=tools.querySelector('input');toggle.checked=true;await toggle.fire('change');assert.ok(f.host.all().some(n=>n.className==='pool-band-UNSEEDED'));assert.ok(f.host.all().some(n=>n.className==='pool-band-2'));assert.equal(f.requests.length,2);assert.match(f.host.textContent,/Frozen/);
});
test('pool workspace unavailable Hub data blocks generating and clears handoff approval until a new draw',async()=>{
 const f=fixture();await f.load();await f.generate();await f.prepare();f.window.BeautySeededPoolUI.unavailable();assert.equal(f.find('GENERATE SEEDED PREVIEW').disabled,true);assert.equal(f.find('SEND APPROVED TEST POOLS'),undefined);assert.match(f.host.textContent,/REVIEW INVALIDATED/);f.window.BeautySeededPoolUI.update(f.data);assert.equal(f.find('GENERATE SEEDED PREVIEW').disabled,false);assert.equal(f.find('REVIEW NAKKA HANDOFF — TEST'),undefined);assert.equal(f.requests.length,3);
});

test('pool workspace selects physical boards and shows numbered pools sharing only available boards',async()=>{
 const f=fixture();f.host.querySelector('[data-boards]').value='1,7';await f.load();await f.generate();assert.match(f.host.textContent,/Pool 1/);assert.match(f.host.textContent,/Board 1/);assert.match(f.host.textContent,/Board 7/);assert.match(f.host.textContent,/planned in Hub/);assert.doesNotMatch(f.host.textContent,/Pool A/);
 const first=f.host.querySelectorAll('[data-board-choice]')[0];await first.fire('click');assert.equal(f.host.querySelector('[data-boards]').value,'7');assert.match(f.host.textContent,/REVIEW INVALIDATED/);assert.equal(f.requests.length,2);
});
test('pool workspace invalid board ranges block drawing and excluded Nakka entries block approval',async()=>{
 const f=fixture();await f.load();f.host.querySelector('[data-boards]').value='1-4,4';await f.host.querySelector('[data-boards]').fire('input');assert.equal(f.find('GENERATE SEEDED PREVIEW').disabled,true);
 f.host.querySelector('[data-boards]').value='1,7';await f.host.querySelector('[data-boards]').fire('input');await f.generate();await f.find('REVIEW NAKKA HANDOFF — TEST').fire('click');f.queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:f.data.eventDate},setting:{},expectedCards:6,unassignedEntries:[{tpid:'extra',name:'Standby Player'}]});await f.tick();assert.match(f.host.textContent,/Standby Player/);const check=f.host.querySelector('.pool-approval').querySelector('input');check.checked=true;await check.fire('change');assert.equal(f.find('SEND APPROVED TEST POOLS').disabled,true);
});
