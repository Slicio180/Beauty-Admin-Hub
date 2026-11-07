const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
const base='apps-script/registration-identity-test/remote-app/';
function batch(o={}){
 const h=harness(o),fetch=h.context.UrlFetchApp.fetch;let count=0;
 h.context.UrlFetchApp.fetchAll=requests=>{count++;assert.equal(requests.length,3);return requests.map(({url,...options})=>{assert.equal(options.method,'get');assert.equal(options.followRedirects,false);assert.equal(options.payload,undefined);return fetch(url,options);});};
 return {...h,get batches(){return count;}};
}
test('Nakka engine batches fixed-target GETs and every preview obtains fresh provider data',()=>{
 const h=batch(),first=h.preview();assert.equal(first.status,'PREVIEW');assert.equal(h.batches,1);assert.equal(h.posts().length,0);
 h.state.league[0].lpid='c345';const second=h.preview();assert.equal(second.identity.lpid,'c345');assert.equal(h.batches,2);assert.equal(h.posts().length,0);
 assert.deepEqual(h.calls.slice(0,3).map(r=>new URL(r.url).pathname.split('/').slice(-2).join('/')),['tournament/get','entry/list','entry/list']);
});
test('Nakka engine batch failures never fall back to duplicate requests or send a mutation',()=>{
 for(const failure of ['throw','short','http','json','result','large']){
  const h=harness();let calls=0;h.context.UrlFetchApp.fetchAll=()=>{calls++;if(failure==='throw')throw Error('private');if(failure==='short')return [];
   return Array.from({length:3},()=>({getResponseCode:()=>failure==='http'?503:200,getContentText:()=>failure==='json'?'private':failure==='large'?'x'.repeat(1000001):JSON.stringify({result:1})}));};
  const r=h.preview();assert.equal(r.success,false);assert.equal(calls,1);assert.equal(h.calls.length,0);assert.equal(h.posts().length,0);assert.doesNotMatch(JSON.stringify(r),/private|SECRET/);
 }
});
test('Nakka engine fresh batches retain stale-state and wrong-event write barriers',()=>{
 for(const o of [{state:{event:{tdid:'t_LIVE'}}},{onFetch:({state,url})=>{if(url.includes('league/entry/list'))state.hub=[];}}]){
  const h=batch(o);assert.equal(h.preview().success,false);assert.equal(h.posts().length,0);
 }
});
test('Nakka engine reports bounded timing labels without credentials names or provider bodies',()=>{
 const h=batch(),r=h.preview();assert.equal(r.timing.operation,'transfer-preview');assert(r.timing.totalMs>=0);assert(r.timing.steps.some(s=>s.stage==='nakka-read-batch'));
 assert.doesNotMatch(JSON.stringify(r.timing),/Anna|SECRET|Authorization|session|lpid/);
});
function transport(){
 const calls=[];let generation=1;
 const runner={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},beautyHubTest(action,input,token){calls.push({action,input,token,ok:this.success,fail:this.failure});}};
 const c=vm.createContext({URL,BeautyHubAuth:{token:()=> 'token-'+generation,generation:()=>generation,isCurrent:g=>g===generation,expired(){generation++;}},google:{script:{run:runner}}});
 vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',c);
 return {calls,read:page=>c.service.request('https://beauty.invalid/hub?page='+page),write:()=>c.service.request('https://beauty.invalid/hub?page=hubstatus&player=Anna&status=OUT&expectedStatus=IN&eventDate=2026-11-02'),lock:()=>generation++};
}
const turn=()=>new Promise(setImmediate);
test('Hub transport starts independent reads together and coalesces only identical in-flight reads',async()=>{
 const h=transport(),a=h.read('hubdata'),b=h.read('nakkahealth'),same=h.read('hubdata');await turn();assert.deepEqual(h.calls.map(c=>c.action),['read','nakkahealth']);
 h.calls[0].ok({success:true});h.calls[1].ok({success:true});await Promise.all([a,b,same]);const fresh=h.read('hubdata');await turn();assert.equal(h.calls.length,3);h.calls[2].ok({success:true});await fresh;
});
test('Hub transport keeps writes behind earlier reads and later reads behind the write',async()=>{
 const h=transport(),a=h.read('hubdata'),b=h.read('nakkahealth'),write=h.write(),later=h.read('hubdata');await turn();assert.equal(h.calls.length,2);
 h.calls[0].ok({success:true});await turn();assert.equal(h.calls.length,2);h.calls[1].ok({success:true});await turn();assert.equal(h.calls[2].action,'status');assert.equal(h.calls.length,3);
 h.calls[2].ok({success:true});await turn();assert.equal(h.calls[3].action,'read');h.calls[3].ok({success:true});await Promise.all([a,b,write,later]);
});
test('Hub transport rejects concurrent late responses after logout without releasing an old write into a new session',async()=>{
 const h=transport(),a=h.read('hubdata'),b=h.read('nakkahealth'),write=h.write();const rejected=[a,b,write].map(p=>assert.rejects(p,/Sign in/));await turn();h.lock();h.calls[0].ok({success:true});h.calls[1].ok({success:true});await Promise.all(rejected);assert.equal(h.calls.length,2);
});

test('Speed pass reuses only the workbook handle while roster reads observe edits and reject bad headers',()=>{
 let opens=0,reads=0,rows=[['PLAYERS','NEW PLAYERS','STATUS'],['Anna','','IN']];
 const c=vm.createContext({console,Date,Map,Set,SpreadsheetApp:{openById:()=>{opens++;return workbook;}}});
 const workbook={getId:()=>c.expectedSheet,getSheetByName:()=>({getLastRow:()=>rows.length,getRange:(r,col,h,w)=>({getDisplayValues:()=>{reads++;return rows.slice(r-1,r-1+h).map(v=>v.slice(col-1,col-1+w));}})})};
 vm.runInContext(fs.readFileSync(base+'Code.js','utf8')+'\nglobalThis.expectedSheet=SHEET_ID;',c);
 vm.runInContext(fs.readFileSync(base+'HubTestNakkaEvent.gs','utf8'),c);
 assert.equal(c.beautyHubNakkaHubRows_()[0].status,'IN');
 rows[1][2]='OUT';assert.equal(c.beautyHubNakkaHubRows_()[0].status,'OUT');
 rows[0][0]='Wrong header';assert.throws(()=>c.beautyHubNakkaHubRows_(),/headers/);
 assert.equal(opens,1);assert.equal(reads,3);
});
test('Speed pass status repaint preserves OUT and STANDBY and clears stale tail cells in a single write',()=>{
 const names=['Anna','Other','Third'],store=[['Anna','','IN'],['Other','','OUT'],['Third','','STANDBY']];
 let written,flushes=0,clears=0;
 const c=vm.createContext({console,Date,Map,Set,SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==="TONIGHT'S PLAYERS"?{
  getRange:(r,col,h,w)=>({getDisplayValues:()=>Array.from({length:h},(_,i)=>[names[i]||'']),clearContent(){clears++;throw Error('intermediate clearing');},setValues:v=>{assert.deepEqual([r,col,h,w],[2,3,99,1]);assert.equal(written,undefined);written=v;}})
 }:{getLastRow:()=>4,getRange:()=>({getDisplayValues:()=>store})}}),flush:()=>flushes++}});
 vm.runInContext(fs.readFileSync(base+'Code.js','utf8'),c);c.syncTonightStatusDisplay_('Anna');
 assert.deepEqual(Array.from(written.slice(0,4),r=>r[0]),['IN','OUT','STANDBY','']);
 assert.equal(written.length,99);assert.equal(clears,0);assert.equal(flushes,2);
});
