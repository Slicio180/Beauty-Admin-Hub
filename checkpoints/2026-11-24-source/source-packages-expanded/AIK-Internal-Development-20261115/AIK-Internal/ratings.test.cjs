'use strict';
const assert=require('node:assert/strict'),P=require('./PoolPlanner.js'),vm=require('node:vm'),crypto=require('node:crypto');
let count=0;function check(name,fn){fn();count++;console.log('PASS '+name);}
const players=[80,70,60,50,40,30].map((average,i)=>({id:'p'+i,name:'Player '+i,active:true,rating:{average,source:'manual',asOf:'2026-11-16'}}));
const sums=pairs=>pairs.map(team=>team.reduce((n,id)=>n+players.find(p=>p.id===id).rating.average,0));
check('default Fair pairs strongest with weakest',()=>assert.deepEqual(sums(P.pair(players)),[110,110,110]));
check('similar pairs adjacent strengths',()=>assert.deepEqual(sums(P.pair(players,'similar')),[150,110,70]));
check('random pairs allow unrated players and preserve IDs',()=>assert.deepEqual(P.pair(players.map(p=>({...p,rating:null})),'random').flat().sort(),players.map(p=>p.id).sort()));
check('odd numbers require explicit resolution',()=>assert.throws(()=>P.pair(players.slice(0,5)),/even/));
check('duplicate identity rejected even with same names allowed',()=>{assert.throws(()=>P.pair([players[0],players[0],players[1],players[2]]),/Repeated/);assert.equal(P.pair(players.map(p=>({...p,name:'Same Name'}))).length,3);});
check('unrated never treated as zero',()=>assert.throws(()=>P.pair(players.map(p=>({...p,rating:null}))),/Unrated/));
check('invalid ratings and dates refused',()=>{for(const average of [0,-1,181,NaN,Infinity,'55'])assert.throws(()=>P.rating({...players[0],rating:{...players[0].rating,average}}));assert.throws(()=>P.rating({...players[0],rating:{...players[0].rating,asOf:'2026-02-30'}}));});
check('bad random source rejected',()=>assert.throws(()=>P.pair(players,'random',()=>1),/random/));
check('balanced singles produces seeded groups',()=>{const event={id:'e',format:'singles',entries:players.map(p=>[p])},plan=P.balanced(event,2);assert.deepEqual(plan.groups,[[0,3,4],[1,2,5]]);assert.equal(plan.ratingSnapshot.length,6);});
check('all group sizes and doubles pairs preserved',()=>{for(let n=4;n<=64;n+=2){const ps=Array.from({length:n},(_,i)=>({...players[0],id:'id'+i,rating:{...players[0].rating,average:20+i}}));for(const format of ['singles','doubles']){const entries=format==='singles'?ps.map(p=>[p]):P.pair(ps).map(ids=>ids.map(id=>ps.find(p=>p.id===id)));const event={id:'e',format,entries};for(let g=1;g<=Math.floor(entries.length/2);g++){const plan=P.balanced(event,g);assert.equal(plan.groups.flat().length,entries.length);P.validate(event,plan);}}}});
check('planning leaves input unchanged and swaps invalidate review',()=>{const event={id:'e',format:'singles',entries:players.map(p=>[p])},before=JSON.stringify(event),plan=P.balanced(event,2);plan.status='REVIEWED_LOCAL';assert.equal(P.swap(event,plan,0,1).status,'LOCAL_REVIEW');assert.equal(JSON.stringify(event),before);});
(async()=>{
 const html=require('./preview.cjs').buildPreview(),script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][0][1],c={window:{},crypto};vm.createContext(c);vm.runInContext(script,c);const api=c.window.AikInternalClient;
 await api.request('setup');for(let i=0;i<4;i++)await api.request('addPlayer',{name:'Test '+i});let state=await api.request('read');
 for(const [i,p]of state.players.entries())await api.request('setRating',{id:p.id,rating:{average:40+i*10,source:'manual',asOf:'2026-11-16'}});
 const input={requestId:crypto.randomUUID(),title:'Ratings',date:'2026-11-16',kind:'km',format:'singles',entries:state.players.map(p=>[p.id])};
 state=await api.request('saveDraft',input);const old=JSON.stringify(state.events[0]);
 await api.request('setRating',{id:state.players[0].id,rating:{average:90,source:'manual',asOf:'2026-11-16'}});
 state=await api.request('saveDraft',input);check('saved rating snapshot and repeat save survive master average edits',()=>{assert.equal(JSON.stringify(state.events[0]),old);assert.equal(state.events.length,1);});
 await assert.rejects(api.request('setRating',{id:state.players[0].id,rating:{average:50,source:'dartstatistik',asOf:'2026-11-16'}}),/manual/);count++;console.log('PASS preview cannot claim an automatic statistics import');
 const plan=c.AikPoolPlanner.balanced(state.events[0],2);await api.request('savePlan',plan);state=await api.request('read');check('balanced plan saves with rating provenance',()=>{assert.equal(state.plans[input.requestId].method,'fair');assert.equal(state.plans[input.requestId].ratingSnapshot[0][0].average,40);});
 console.log(count+' rating and pairing checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
