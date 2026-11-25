const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const server=read('application/LivePlanner.gs'),html=read('application/LiveHubView.html');
const ctx=vm.createContext({});vm.runInContext(server,ctx);const api=ctx.BeautyPoolSeeding;
const original=fs.readFileSync(path.join(base,'../../checkpoints/2026-11-24-speed-test/application/LivePlanner.gs'),'utf8');const old=vm.createContext({});vm.runInContext(original,old);
const pure=s=>s.slice(s.indexOf('  function validatePlayers'),s.indexOf('  const api={draw,adjust'));
assert.equal(pure(server),pure(html),'browser and server use identical draw algorithms');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
for(const m of read('aik-internal/AIKInternal.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const normalize=x=>JSON.parse(JSON.stringify(x));
const options=(sizes,missing=0)=>({players:Array.from({length:sizes.reduce((a,b)=>a+b)},(_,i)=>({id:'p'+i,name:'Synthetic '+i,status:'IN',average:i<missing?null:100-i*.7})),sizes,seed:123,eventDate:'2026-11-25',frozenAt:'2026-11-25T10:00:00Z',source:{leagueId:'synthetic',fetchedAt:'2026-11-25T10:00:00Z'}});
let cases=0;
for(const sizes of [[3],[4],[5],[4,3],[4,4],[3,3,3],[4,4,3],Array(25).fill(4),[...Array(23).fill(4),3,3,3]]){
 for(const missing of [0,1,Math.floor(sizes.reduce((a,b)=>a+b)/2),sizes.reduce((a,b)=>a+b)]){
  const o=options(sizes,missing);
  assert.deepEqual(normalize(api.draw(o).pools),normalize(old.BeautyPoolSeeding.draw(o).pools),'default fair preserves previous allocation');
  for(const drawMode of ['fair','similar','random']){
   const d=api.draw({...o,drawMode});assert.equal(api.check(d),true);assert.deepEqual(normalize(d.pools.map(p=>p.players.length)),sizes);
   assert.deepEqual(normalize(d),normalize(api.draw({...o,drawMode})),'reproducible seed');
   assert.equal(d.drawMode,drawMode);
   if(drawMode==='random')assert.deepEqual(normalize(d.pools.map(p=>p.players.map(x=>x.id))),normalize(api.draw({...o,drawMode,players:o.players.map(p=>({...p,average:null}))}).pools.map(p=>p.players.map(x=>x.id))),'random ignores ratings');
   if(drawMode==='similar'){
    const known=d.pools.flatMap(g=>g.players.filter(p=>p.average!==null).map(p=>p.average));assert.deepEqual(normalize(known),normalize(known.slice().sort((a,b)=>b-a)));
   }
   if(missing===o.players.length)assert.equal(api.summary(d.pools[0]).knownAverage,null);
   if(d.pools.length>1){const a=d.pools[0].players[0],b=d.pools[1].players[0];const changed=api.adjust(d,{playerId:a.id,targetPool:1,swapWith:b.id});assert.equal(api.check(changed),true);assert.equal(changed.drawMode,drawMode);assert.equal(d.manualChanges.length,0);}
   cases++;
  }
 }
}
assert.throws(()=>api.draw({...options([4,4]),drawMode:'bogus'}),/Unknown/);
const excluded=options([4,4]);excluded.players.push({id:'out',name:'Excluded',status:'OUT',average:100});assert.equal(api.draw(excluded).roster.length,8);
// Saved choices accept legacy drafts and reject unsupported modes.
const draw=api.draw(options([4,4]));const choices={boards:'1, 2',plannedBoards:[1,2],preferredSize:4,scheme:'preferredPlan',format:'preserve',boardChoices:{},cardLabels:{}};
ctx.beautyPoolEqual_=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
assert.equal(ctx.beautyPoolDraftChoices_(choices,draw,true).drawMode,'fair');
for(const mode of ['fair','similar','random'])assert.equal(ctx.beautyPoolDraftChoices_({...choices,drawMode:mode},draw,true).drawMode,mode);
assert.throws(()=>ctx.beautyPoolDraftChoices_({...choices,drawMode:'bogus'},draw,true),/Invalid/);
const internal=require('../aik-internal/PoolPlanner.js');
for(const format of ['singles','doubles']){
 const event={id:'test',format,entries:Array.from({length:8},(_,i)=>Array.from({length:format==='doubles'?2:1},(_,j)=>({id:i+'-'+j,name:'Synthetic',rating:{average:90-i*5-j,source:'manual',asOf:'2026-11-25'}})))};
 for(const method of ['draw','balanced','similar']){const d=internal[method](event,3,()=>.4);internal.validate(event,d);assert.deepEqual(d.groups.map(g=>g.length).sort(),[2,3,3]);internal.validate(event,internal.swap(event,d,0,7));}
 assert.deepEqual(internal.similar(event,2,()=>.4).groups,[[0,1,2,3],[4,5,6,7]]);
 event.entries[0][0].rating=null;assert.throws(()=>internal.similar(event,2),/Unrated is not zero/);internal.validate(event,internal.draw(event,2));
}
console.log(`PASS: ${cases} Hub draw scenarios, legacy Fair equivalence, browser/server parity, script syntax, saved choices, swaps, and Internal singles/doubles.`);
