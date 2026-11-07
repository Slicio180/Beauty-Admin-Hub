const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan,eventCount}=require('../public/js/pool-planner.js');
test('pool planner: 37 players prefer three with ten boards',()=>{
 const p=plan(37,3,10);assert.deepEqual(p.preferredPlan,{three:11,four:1,five:0,pools:12});assert.deepEqual(p.perBoard,{three:3,four:7,five:0,pools:10});assert.equal(p.waves,2);
});
test('pool planner: 34 players with seven boards cannot fit one pool per board',()=>{
 const p=plan(34,3,7);assert.equal(p.perBoard,null);assert.equal(p.preferredPlan.three,10);assert.equal(p.preferredPlan.four,1);
});
test('pool planner: supplied 5–101 schemes match both preferences',()=>{
 const scheme=require('./fixtures/pool-scheme.json');
 for(const row of scheme)for(const size of [3,4])assert.deepEqual(plan(row.n,size,100).preferredPlan,row[size],`${row.n}/${size}`);
});
test('pool planner: every arrangement preserves players and board limits',()=>{
 for(let n=5;n<=600;n++)for(const size of [3,4])for(const b of [1,7,10,100]){
  const p=plan(n,size,b);for(const x of [p.preferredPlan,p.perBoard].filter(Boolean)){
   assert.equal(x.three*3+x.four*4+x.five*5,n);assert.equal(x.pools,x.three+x.four+x.five);
  }if(p.perBoard)assert.ok(p.perBoard.pools<=b);
 }
});
test('pool planner: rejects invalid inputs and marks counts beyond source scheme',()=>{
 for(const n of [0,1,2,3,4,NaN,5.5,10001])assert.ok(plan(n,3,10).error);
 for(const b of [0,-1,1.5,NaN,1001])assert.ok(plan(37,3,b).error);
 assert.ok(plan(37,5,10).error);assert.equal(plan(102,3,10).beyondScheme,true);
});
test('pool planner: event count excludes OUT and STANDBY and rejects unknown snapshots',()=>{
 const snapshot={success:true,eventDate:'2026-10-26',players:[{status:'IN'},{status:'OUT'},{status:'STANDBY'},{status:'IN'}]};
 assert.equal(eventCount(snapshot),2);assert.equal(eventCount({...snapshot,players:[]}),0);
 for(const d of [null,{}, {...snapshot,success:false},{...snapshot,eventDate:''},{...snapshot,players:[{status:'???'}]}])assert.equal(eventCount(d),null);
});
test('pool planner: real panel reacts to verified event refresh, controls and outages',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 class Node {
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.handlers={};this.value='';}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}
  appendChild(n){this.children.push(n);if(this.tag==='select'&&this.children.length===1)this.value=n.value;return n;}
  replaceChildren(){this.children=[];}
  setAttribute(){} addEventListener(name,fn){this.handlers[name]=fn;}
  querySelector(q){const key=q.slice(6,-1);return this.children.flatMap(n=>[n,...n.all()]).find(n=>Object.hasOwn(n.dataset,key));}
  all(){return this.children.flatMap(n=>[n,...n.all()]);}
  showModal(){this.open=true;}close(){this.open=false;}
 }
 const button=new Node('button'),body=new Node('body');let ready;
 const document={body,createElement:t=>new Node(t),getElementById:()=>button,addEventListener:(n,f)=>{if(n==='DOMContentLoaded')ready=f;}};
 const window={document};const BeautyHubServices={mode:'mock'};let capturedBlob;
 const generated=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTest.html','utf8');
 const source=[...generated.matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('Read-only planning.'));
 assert.ok(source);
 vm.runInNewContext(source,{window,document,BeautyHubServices,atob:s=>Buffer.from(s,'base64').toString('binary'),
  Blob:class {constructor(parts,options){this.parts=parts;this.type=options.type;}},
  URL:{createObjectURL:blob=>{capturedBlob=blob;return 'blob:test-pool-download';}}});
 ready();button.handlers.click();const d=body.children[0];
 const text=()=>d.querySelector('[data-results]').all().map(n=>n.textContent||'').join(' ');
 assert.match(text(),/unavailable/);
 const data={success:true,eventDate:'2026-10-26',players:Array.from({length:37},()=>({status:'IN'}))};
 window.BeautyPoolPlanner.update(data);const boards=d.querySelector('[data-boards]');boards.value='10';boards.handlers.input();
 assert.match(text(),/11 pools of 3 \+ 1 pool of 4/);assert.match(text(),/3 pools of 3 \+ 7 pools of 4/);
 data.players[0].status='OUT';window.BeautyPoolPlanner.update(data);assert.match(text(),/12 pools of 3/);
 window.BeautyPoolPlanner.unavailable();assert.match(text(),/out of date/);assert.doesNotMatch(text(),/12 pools of 3/);
 window.BeautyPoolPlanner.update(data);assert.match(text(),/12 pools of 3/);
 const size=d.querySelector('[data-size]');size.value='4';size.handlers.change();assert.match(text(),/9 pools of 4/);
 assert.equal(d.children.find(n=>n.tag==='a').download,undefined);
 assert.equal(d.children.find(n=>n.tag==='a').href,'blob:test-pool-download');
 assert.deepEqual(Buffer.from(capturedBlob.parts[0]),fs.readFileSync('public/assets/pool-scheme.html'));
 assert.equal(capturedBlob.type,'text/html;charset=utf-8');
 assert.equal(d.children.find(n=>n.tag==='a').target,'_blank');
 d.children[0].handlers.click();assert.equal(d.open,false);button.handlers.click();assert.equal(d.open,true);assert.equal(boards.value,'10');
});
test('pool planner: generated TEST download embeds exact original bytes after script inlining',()=>{
 const fs=require('node:fs'),crypto=require('node:crypto');
 const html=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTest.html','utf8');
 assert.doesNotMatch(html,/assets\/pool-scheme\.html/);
 const embedded=html.match(/reference\.href='data:text\/html;base64,([^']+)'/);
 assert.ok(embedded,'generated download has embedded data, not a relative Apps Script URL');
 const page=Buffer.from(embedded[1],'base64').toString('utf8');
 assert.equal(page,fs.readFileSync('public/assets/pool-scheme.html','utf8'));
 const workbook=page.match(/base64,([^"]+)/)[1];
 assert.deepEqual(Buffer.from(workbook,'base64'),fs.readFileSync('public/assets/pool-scheme.xlsx'));
 assert.equal((page.match(/data-players=/g)||[]).length,97);
 assert.match(page,/download="Original-Pool-Scheme.xlsx"/);
 assert.match(html,/reference.target='_blank'/);assert.match(html,/reference.rel='noopener noreferrer'/);
});
