const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),checks=[];
function fixture(){let context={version:1,mode:'league',sheetId:'synthetic',eventId:'t_synthetic',leagueId:'lg_synthetic',date:'2026-11-24',revision:'a'.repeat(32)};const calls=[],guards=[];let http=200,result=0,incomplete=false,stale=false,secret=true;
 const c={JSON,Array,Error,beautyLiveLoginGuard_(){},beautyContextAssert_(){},beautyLiveTarget_:()=>({...context}),beautyLiveContextRead_:()=>({...context,...(stale?{revision:'b'.repeat(32)}:{})}),beautyContextStandalone_:()=>context.mode==='tournament',beautyReleaseProviderGuard_:p=>guards.push(p),PropertiesService:{getScriptProperties:()=>({getProperty:()=>secret?'synthetic':' '})},Utilities:{base64Encode:x=>Buffer.from(x).toString('base64')},UrlFetchApp:{fetchAll(requests){calls.push(...requests);return requests.slice(0,incomplete?1:undefined).map((r,i)=>({getResponseCode:()=>http,getContentText:()=>JSON.stringify({result,index:i})}));}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'application/LiveRemove.gs'),'utf8'),c);
 return {c,calls,guards,run:()=>c.beautyLiveRemoveReads_(null,true),context,failHttp:()=>http=503,failResult:()=>result=9,incomplete:()=>incomplete=true,stale:()=>stale=true};}
function test(name,fn){fn();checks.push(name);}
test('One GET batch reads the selected event, entries and league once each',()=>{const f=fixture();assert.equal(f.run().length,3);assert.equal(f.calls.length,3);assert.equal(new Set(f.calls.map(r=>r.url)).size,3);assert(f.calls.every(r=>r.method==='get'&&!r.payload&&!r.followRedirects));assert.equal(f.guards.length,3);});
test('Standalone tournament reads no league',()=>{const f=fixture();f.context.mode='tournament';f.context.leagueId='';assert.equal(f.run().length,2);assert.equal(f.calls.some(r=>r.url.includes('league/')),false);});
test('Context changed while reads were in flight rejects the whole batch',()=>{const f=fixture();f.stale();assert.throws(f.run,/STALE/);});
test('Incomplete batch rejects all results',()=>{const f=fixture();f.incomplete();assert.throws(f.run,/incomplete/);});
test('Provider outage rejects all results',()=>{const f=fixture();f.failHttp();assert.throws(f.run,/failed/);});
test('Provider error rejects all results',()=>{const f=fixture();f.failResult();assert.throws(f.run,/confirm/);});
fs.writeFileSync(path.join(root,'evidence/removal-reads-tests.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks},null,2));console.log(JSON.stringify({result:'PASS',checks:checks.length}));
