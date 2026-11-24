const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'application/LiveHubView.html'),'utf8');
const s=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const BeautyHubServices')).split('// LIVE player opener:')[0];
function fixture(){
 let generation=1,serial=0;const timers=new Map(),calls=[],pending=[];
 const c={URL,Promise,JSON,Set,Map,Object,Error,console,document:{getElementById:()=>null},
 BeautyHubAuth:{generation:()=>generation,token:()=> 'synthetic-token',isCurrent:n=>n===generation,expired:()=>generation++},
 setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),
 google:{script:{run:{withSuccessHandler(success){return {withFailureHandler(failure){return {beautyHubTest(action,input,token){calls.push({action,input,token});pending.push({success,failure});}};}};}}}}};
 vm.createContext(c);vm.runInContext(s+'\nthis.service=BeautyHubServices;',c);
 return {c,calls,pending,request:(page,args={})=>c.service.request('https://beauty.invalid/hub?'+new URLSearchParams({page,...args})),tick:()=>new Promise(setImmediate),timeout:()=>[...timers.values()].forEach(fn=>fn()),rotate:()=>generation++};
}
const checks=[];async function test(name,fn){await fn();checks.push(name);}
(async()=>{
await test('Pool draft choices use their own handler and cannot fall through to registration',async()=>{const f=fixture(),p=f.request('pooldraftchoices',{ticket:'abc',choices:'{}'});await f.tick();assert.equal(f.calls[0].action,'pooldraftchoices');f.pending[0].success({success:true});assert.equal((await (await p).json()).success,true);});
await test('Read failure deadline settles once and ignores its late successful callback',async()=>{const f=fixture(),p=f.request('hubdata');await f.tick();const rejected=assert.rejects(p,/No reply within 60 seconds/);f.timeout();await rejected;f.pending[0].success({success:true,eventContext:'late'});assert.equal(f.calls.length,1);});
await test('Uncertain consent pauses subsequent writes but permits a readback',async()=>{const f=fixture(),p=f.c.service.consent({});await f.tick();const rejected=assert.rejects(p,/save may have completed/);f.timeout();await rejected;await assert.rejects(f.c.service.queue('pump'),/previous save/);const read=f.request('hubdata');await f.tick();assert.equal(f.calls[1].action,'read');f.pending[1].success({success:true});await read;assert.equal(f.calls.length,2);});
await test('An unverified recovery save pauses further mutations',async()=>{const f=fixture(),p=f.c.service.recovery('save',{ticket:'x'});f.pending[0].failure();await assert.rejects(p,/could not be verified/);await assert.rejects(f.c.service.recovery('recheck',{ref:'x'}),/previous save/);assert.equal(f.calls.length,1);});
await test('Concurrent identical roster reads share one native request',async()=>{const f=fixture(),a=f.request('hubdata'),b=f.request('hubdata');await f.tick();assert.equal(f.calls.length,1);f.pending[0].success({success:true});await Promise.all([a,b]);});
await test('A queued mutation cannot acquire a later sign-in session',async()=>{const f=fixture(),read=f.request('hubdata'),save=f.c.service.consent({});const rejected=assert.rejects(save,/Sign in/);await f.tick();f.rotate();f.pending[0].success({success:true});await assert.rejects(read,/Sign in/);await rejected;assert.equal(f.calls.length,1);});
fs.writeFileSync(path.join(root,'evidence/transport-tests.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Actual assembled service routing and promise lifecycle with simulated Google callbacks.'},null,2));console.log(JSON.stringify({result:'PASS',checks:checks.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
