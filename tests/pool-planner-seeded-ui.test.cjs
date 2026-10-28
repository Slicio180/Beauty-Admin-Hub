const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('../public/js/pool-seeding.js');
const clone=x=>JSON.parse(JSON.stringify(x));
class Node{
 constructor(tag,owner){this.tag=tag;this.owner=owner;this.children=[];this.dataset={};this.events={};this.value='';this.disabled=false;this.checked=false;this.open=false;this._text='';}
 set textContent(t){this._text=String(t);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join(' ');}
 appendChild(n){n.parent=this;this.children.push(n);if(this.tag==='select'&&this.children.length===1)this._selected=0;return n;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 set value(v){this._value=String(v);}get value(){if(this.tag==='select'&&!this._value)return this.children[0]?.value||'';return this._value||'';}
 setAttribute(k,v){this[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 fire(k){if(this.disabled)return;for(const fn of this.events[k]||[])fn({preventDefault(){}});}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 querySelectorAll(q){const queries=q.split(',');return this.all().filter(n=>queries.some(s=>s.startsWith('[data-')?Object.hasOwn(n.dataset,s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):s.startsWith('.')?n.className===s.slice(1):n.tag===s));}
 querySelector(q){return this.querySelectorAll(q)[0]||null;}
 close(){this.open=false;for(const fn of this.events.close||[])fn();}
 showModal(){this.open=true;}focus(){this.owner.activeElement=this;}
}
function fixture(){
 const handlers={},document={hidden:false,createElement(tag){return new Node(tag,this);},createTextNode(text){const n=new Node('#text',this);n.textContent=text;return n;},addEventListener(k,fn){(handlers[k]??=[]).push(fn);}};
 const host=new Node('dialog',document);host.open=true;const size=new Node('select',document);size.dataset.size='';size.value='3';const boards=new Node('input',document);boards.dataset.boards='';boards.value='2';host.append(size,boards);
 const data={success:true,eventDate:'2026-10-27',players:Array.from({length:6},(_,i)=>({player:'Player '+i,status:'IN'}))};
 const players=data.players.map((p,i)=>({id:'P'+i,name:p.player,status:p.status,average:i?50+i:null}));
 const source={success:true,stats:{fresh:true,fetchedAt:'2026-10-28T22:00:00Z',title:'AIK',profiles:[]},mappings:players.map((p,i)=>({...p,lpid:'L'+i,tpid:'E'+i,leagueCandidates:[{lpid:'L'+i,name:p.name,average:p.average}],eventCandidates:[{tpid:'E'+i,name:p.name}]}))};
 const draw=core.draw({players,sizes:[3,3],seed:42,eventDate:data.eventDate,frozenAt:'2026-10-28T22:00:00Z',source:{leagueId:'lg',fetchedAt:'2026-10-28T22:00:00Z'}});
 const requests=[],queue=[];let generation=1,timer;
 const window={document,beautyHubData:data,setInterval(fn){timer=fn;}};
 const c={window,document,URL,BeautyPoolSeeding:core,BeautyPoolPlanner:require('../public/js/pool-planner.js'),BeautyHubAuth:{generation:()=>generation,isCurrent:n=>n===generation},BeautyHubServices:{mode:'test',endpoint:'https://beauty.invalid/hub',request(raw){const u=new URL(raw),input=Object.fromEntries(u.searchParams);requests.push(input);return new Promise((resolve,reject)=>queue.push({resolve:r=>resolve({json:async()=>r}),reject}));}}};
 vm.runInNewContext(fs.readFileSync('public/js/pool-planner-seeded.js','utf8'),c);window.BeautySeededPoolUI.mount(host);
 const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const find=text=>host.all().find(n=>n.tag==='button'&&n._text===text);
 async function load(){await find('LOAD / REFRESH LEAGUE STATS').fire('click');queue.shift().resolve(clone(source));await tick();}
 async function generate(){host.querySelector('[data-mapping-reviewed]').checked=true;await find('GENERATE SEEDED PREVIEW').fire('click');queue.shift().resolve({success:true,ticket:'draw',draw:clone(draw)});await tick();}
 async function prepare(){await find('REVIEW NAKKA HANDOFF — TEST').fire('click');queue.shift().resolve({success:true,ticket:'approved',event:{title:'TEST',date:data.eventDate},setting:{startScore:501},expectedCards:6});await tick();}
 return {host,window,document,source,data,draw,requests,queue,find,tick,load,generate,prepare,timer:()=>timer(),lock(){generation++;(handlers['beauty-hub-locked']||[]).forEach(fn=>fn());},notice:()=>host.querySelector('[data-pool-message]').textContent};
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
