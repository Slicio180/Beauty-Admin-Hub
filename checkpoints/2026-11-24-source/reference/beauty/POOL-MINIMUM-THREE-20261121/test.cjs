const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname;let checks=0;
function load(variant){
 const h=fs.readFileSync(root+'/'+variant+'/HubTest.html','utf8');
 const s=fs.readFileSync(root+'/'+variant+'/HubTestPools.gs','utf8');
 const server={};vm.createContext(server);vm.runInContext(s,server);
 const planner={module:{exports:{}}};vm.createContext(planner);
 const start=h.indexOf('/* Read-only planning.');const end=h.indexOf('/* Pure planning only.',start);
 vm.runInContext(h.slice(start,end),planner);
 const client={module:{exports:{}}};vm.createContext(client);
 const seedStart=h.indexOf('/* Pure draw planning.');vm.runInContext(h.slice(seedStart,start),client);
 for(const block of h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(block[1]);
 return {plan:planner.module.exports.plan,server:server.BeautyPoolSeeding,client:client.module.exports,h};
}
const old=load('baseline'),next=load('candidate'),plain=x=>JSON.parse(JSON.stringify(x));
for(const n of [3,4])for(const pref of [3,4]){
 const p=next.plan(n,pref,1);assert.equal(p.preferredPlan.pools,1);assert.equal(p.perBoard.pools,1);
 assert.deepEqual(plain(next.server.sizesFromPlan(p.preferredPlan)),[n]);checks++;
 for(const core of [next.server,next.client])for(const avg of [null,55]){
 const opts={players:Array.from({length:n},(_,i)=>({id:String(i),name:'Synthetic '+i,status:'IN',average:avg})),sizes:[n],seed:123,eventDate:'2026-11-16',frozenAt:'2026-11-21T12:00:00Z',source:{leagueId:'TEST',fetchedAt:'2026-11-21T12:00:00Z'}};
 const d=core.draw(opts);assert.equal(d.pools.length,1);assert.equal(d.pools[0].players.length,n);assert.equal(core.check(d),true);checks++;
 }
}
for(let n=5;n<=101;n++)for(const pref of [3,4])for(const boards of [1,2,16]){assert.deepEqual(plain(next.plan(n,pref,boards)),plain(old.plan(n,pref,boards)));checks++;}
for(const n of [0,1,2,3.5,NaN,10001]){assert.ok(next.plan(n,3,1).error);checks++;}
for(const core of [next.server,next.client]){
 const opts={players:[{id:'a',name:'A',status:'IN',average:null},{id:'b',name:'B',status:'IN',average:null},{id:'c',name:'C',status:'OUT',average:null}],sizes:[3],seed:123};
 assert.throws(()=>core.draw(opts),/3–101/);checks++;
 opts.players[2].status='IN';opts.players[2].id='a';assert.throws(()=>core.draw(opts),/ambiguous/);checks++;
}
assert.ok(next.h.includes("count.min='3'"));checks++;
console.log(JSON.stringify({result:'PASS',checks,remoteCalls:0,scope:'Pure planner and client/server draw cores, inline syntax; native preview and Nakka send not tested'},null,2));
