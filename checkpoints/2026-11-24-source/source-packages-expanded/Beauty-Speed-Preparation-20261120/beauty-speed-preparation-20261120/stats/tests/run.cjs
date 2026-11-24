const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),Module=require('module');
const root=path.resolve(__dirname,'..'),m=new Module('acorn');
m._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'acorn');
const parse=s=>m.exports.parse(s,{ecmaVersion:'latest'});
function functions(s,names){return parse(s).body.filter(n=>n.type==='FunctionDeclaration'&&names.includes(n.id.name)).map(n=>s.slice(n.start,n.end)).join('\n');}
const helper=fs.readFileSync(path.join(root,'candidate/BeautySpeedStatsReads.gs'),'utf8');
const sources=Object.fromEntries(['baseline','candidate'].map(k=>[k,fs.readFileSync(path.join(root,k,'HubTestPools.gs'),'utf8')]));
for(const s of [helper,...Object.values(sources)])parse(s);
function setup(candidate=true,options={}){
 const calls=[],data={},now=1800000000000;let last=options.last||null;
 const stats={scores:'synthetic'},rank={points:'synthetic'};
 const decode=r=>{if(r.code!==200||r.data.result!==0)throw Error('provider');return r.data;};
 const c={Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},
  beautyContextAssert_(){calls.push('context');if(options.contextFail)throw Error('context');},
  beautyHubLeagueId_:()=> 'syntheticLeague',beautyHubScopeId_:()=> 'syntheticLeague',
  beautyContextStandalone_:()=>!!options.standalone,beautyHubActiveTestTarget_:()=>({title:'synthetic'}),
  beautyTestNakkaReadGuard_(p){calls.push(['guard',p]);if(options.guardFail)throw Error('guard');},
  beautyHubNakkaMeasure_:(s,f)=>f(),beautyHubTransferError_:s=>{throw Error(s);},
  beautyHubTransferDecode_:decode,
  beautyPoolProfiles_:()=>{calls.push('profiles');return [{name:'Synthetic',lpid:'AAAA'}];},
  beautyPoolNormalizeStats_(profiles,s,r){assert.deepEqual(s,stats);assert.deepEqual(r,rank);calls.push('validate');if(options.invalidStats)throw Error('stats');return profiles.map(x=>({...x,average:50,points:2}));},
  beautyPoolLastGood_(v){if(v){last=v;calls.push('publish');}return last;},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>data[k]||null,setProperty:(k,v)=>{data[k]=v;},deleteProperty:k=>{delete data[k];}})},
  beautyHubTransferFetch_(p){calls.push(['single',p]);if(p.startsWith('league/get'))return {league:{lgid:options.wrongLeague?'wrong':'syntheticLeague',title:'Synthetic League'}};return {result:0,stats:p.includes('stats_list')?stats:rank};},
  UrlFetchApp:{fetchAll(requests){calls.push(['batch',requests]);if(options.batchThrows)throw Error('network');
    const rows=[{code:200,data:{result:0,stats}},{code:200,data:{result:0,stats:rank}}];
    if(options.badCount)return rows.slice(0,1);if(options.badResponse)rows[1].code=503;return rows;}}
 };
 if(options.noBatch)delete c.UrlFetchApp.fetchAll;
 vm.createContext(c);vm.runInContext(helper+'\n'+functions(sources[candidate?'candidate':'baseline'],['beautyPoolStatsRun_','beautyPoolStatsTimeFresh_']),c);
 return {c,calls,data,getLast:()=>last,now};
}
let passed=0;const outcomes=[];
function test(name,work){work();passed++;outcomes.push({name,result:'PASS'});}
const run=r=>r.c.beautyPoolStatsRun_('synthetic-auth',false,[{name:'Synthetic',lpid:'AAAA'}]);
const plain=x=>JSON.parse(JSON.stringify(x));
test('Baseline and candidate produce identical validated output',()=>{assert.deepEqual(plain(run(setup(false))),plain(run(setup())));});
test('Three sequential requests become metadata plus one two-request batch',()=>{const b=setup(false),c=setup();run(b);run(c);assert.equal(b.calls.filter(x=>x[0]==='single').length,3);assert.equal(c.calls.filter(x=>x[0]==='single').length,1);const batch=c.calls.find(x=>x[0]==='batch')[1];assert.equal(batch.length,2);for(const r of batch){assert.equal(r.method,'get');assert.equal(r.followRedirects,false);assert.equal(r.payload,undefined);assert.ok(r.url.startsWith('https://push.n01darts.com/api/v1/league/stats?lgid=syntheticLeague&kind='));}});
test('Both route guards run before any batch',()=>{const r=setup();run(r);const idx=r.calls.findIndex(x=>x[0]==='batch');assert.equal(r.calls.slice(0,idx).filter(x=>x[0]==='guard').length,2);});
for(const option of ['contextFail','guardFail','batchThrows','badCount','badResponse','invalidStats','wrongLeague'])test(option+' cannot publish fresh statistics',()=>{const last={fetchedAt:new Date(1799999000000).toISOString(),profiles:[{name:'Retained'}]},r=setup(true,{[option]:true,last});const out=run(r);assert.equal(out.fresh,false);assert.equal(out.profiles[0].name,'Retained');assert.ok(!r.calls.includes('publish'));assert.equal(r.calls.filter(x=>x[0]==='single').length,1);if(['contextFail','guardFail','wrongLeague'].includes(option))assert.ok(!r.calls.some(x=>x[0]==='batch'));});
test('No fetchAll chooses sequential reads before sending, same result',()=>{const r=setup(true,{noBatch:true});assert.equal(run(r).fresh,true);assert.equal(r.calls.filter(x=>x[0]==='single').length,3);});
test('Fresh reference cache avoids remote requests',()=>{const r=setup(true,{last:{fetchedAt:new Date(1800000000000-1000).toISOString(),profiles:[]}});assert.equal(run(r).fresh,true);assert.equal(r.calls.length,0);});
test('Cooldown remains enforced',()=>{const r=setup();r.data.BEAUTY_LEAGUE_STATS_syntheticLeague_ATTEMPT=String(r.now-1000);assert.equal(run(r).fresh,false);assert.equal(r.calls.length,0);});
test('Future cache time cannot count as fresh',()=>{const r=setup(true,{last:{fetchedAt:new Date(1800000000000+10000).toISOString(),profiles:[]}});run(r);assert.ok(r.calls.some(x=>x[0]==='batch'));});
test('Standalone events never request league statistics',()=>{const r=setup(true,{standalone:true});assert.equal(run(r).fresh,true);assert.ok(!r.calls.some(x=>x[0]==='single'||x[0]==='batch'));});
test('No cached result and provider failure remains unavailable',()=>{const r=setup(true,{badResponse:true});const out=run(r);assert.equal(out.fresh,false);assert.deepEqual(plain(out.profiles),[]);});
console.log(JSON.stringify({passed,syntaxFiles:3,remoteCalls:0,nativeElapsedTimeMeasured:false,outcomes},null,2));
