const vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('live-status/LiveStatus.gs','utf8');
function scenario(options={}){
 const store=[['PLAYER','OLD NAME','STATUS','FOTO','MESSAGE','SOURCE'],['Zoe Example','','IN','JA','unchanged','MOBIL'],['Bob Example','','OUT','NEJ','','KIOSK']];
 let names=['Bob Example','Zoe Example'],display=['OUT','IN'],calls=[],properties=new Map(),injected=false;
 if(options.overflow)names[99]='Overflow Player';
 if(options.duplicate)store.push([...store[1]]);
 if(options.pending)properties.set('BEAUTY_LIVE_STATUS_PENDING','{}');
 const date=new Date('2026-11-09T12:00:00Z');
 const range=(sheet,row,col,n=1,width=1)=>({
  getValue:()=>date,
  getFormula:()=>options.formula?'=bad':'',
  getFormulas:()=>Array.from({length:n},()=>['']),
  getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:width},(_,j)=>sheet==='store'?(store[row+i-1]?.[col+j-1]||''):col+j===1?(names[row+i-2]||''):col+j===2?'':(display[row+i-2]||''))),
  setValue:v=>{calls.push(['source',row,col,v]);store[row-1][col-1]=v;},
  setValues:values=>{calls.push(['display',row,col]);
   if(options.registration&&!injected){injected=true;store.push(['Amy Example','','IN','JA','new','MOBIL']);names=['Amy Example','Bob Example','Zoe Example'];}
   display=values.map(v=>v[0]);
   if(options.concurrentStatus)store[1][2]='STANDBY';
  }
 });
 const ss={getId:()=> 'sheet',getSheetByName:name=>name==='Control'?{getRange:()=>range('date',0,0)}:name==='PLAYER STATUS DATA'?{getLastRow:()=>store.length,getRange:(...args)=>range('store',...args)}:{getLastRow:()=>options.formulaTail?1000:names.length+1,getRange:(...args)=>range('tonight',...args)}};
 const c={Date,BEAUTY_LIVE_TARGET_:{sheetId:'sheet',date:'2026-11-09'},beautyLiveLoginGuard_:()=>{},beautyHubAuthRequire_:token=>{if(token!=='approved')throw Error('AUTH_REQUIRED');return {uid:'owner'}},LockService:{getScriptLock:()=>({tryLock:()=>!options.busy,releaseLock:()=>{}})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)??null,setProperty:(k,v)=>properties.set(k,v),deleteProperty:k=>properties.delete(k)})},SpreadsheetApp:{openById:()=>ss,flush:()=>{}},Utilities:{formatDate:()=>options.wrongDate?'2026-11-02':'2026-11-09'},beautyLiveDashboardRead_:()=>({success:true,eventDate:'2026-11-09',players:names.map(name=>({player:name,status:store.find(r=>r[0]===name)?.[2]||''}))})};
 vm.createContext(c);vm.runInContext(source,c);
 const request={eventDate:'2026-11-09',expectedStatus:'IN',player:'Zoe Example',status:'OUT'};
 const run=(input=request,token='approved')=>c.beautyLiveStatus_(input,token);
 return {run,store,calls,properties,get names(){return names},get display(){return display}};
}
let x=scenario();assert.equal(x.run().success,true);assert.equal(x.store[1][2],'OUT');assert.equal(x.store[1][4],'unchanged');assert.equal(x.properties.has('BEAUTY_LIVE_STATUS_PENDING'),false);assert.equal(x.calls.filter(c=>c[0]==='source').length,1);
x=scenario({registration:true});assert.equal(x.run().success,true);assert.deepEqual(x.display.slice(0,3),['IN','OUT','OUT']);assert.equal(x.calls.filter(c=>c[0]==='display').length,2);assert.equal(x.store[3][2],'IN');
for(const [opts,code] of [[{duplicate:true},'PLAYER_AMBIGUOUS_OR_MISSING'],[{wrongDate:true},'STALE_EVENT'],[{formula:true},'FORMULA'],[{busy:true},'BUSY'],[{pending:true},'STATUS_REVIEW_REQUIRED']]){x=scenario(opts);assert.equal(x.run().code,code);assert.equal(x.calls.length,0);}
x=scenario();assert.throws(()=>x.run(undefined,'wrong'),/AUTH_REQUIRED/);assert.equal(x.calls.length,0);
x=scenario({concurrentStatus:true});assert.equal(x.run().code,'SAVE_UNCERTAIN');assert.ok(x.properties.has('BEAUTY_LIVE_STATUS_PENDING'));assert.equal(x.store[1][2],'STANDBY');
x=scenario({formulaTail:true});assert.equal(x.run().success,true);
x=scenario({formulaTail:true,overflow:true});assert.equal(x.run().code,'LAYOUT');assert.equal(x.calls.length,0);
const files=JSON.parse(fs.readFileSync('live-status/prepared.json')).files;
for(const f of files){if(f.type==='SERVER_JS')new vm.Script(f.source);if(f.type==='HTML')for(const block of f.source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(block[1]);}
console.log('PASS: authenticated status change, unrelated fields preserved, registration reorder repaired, duplicate/date/formula/lock/pending guards, uncertain concurrent status preserved and blocked, all-source syntax. Apps Script services mocked. Native test pending.');
