const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'application/BeautyInboundCore.gs'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),checks=[];
function test(name,fn){try{fn();checks.push({name,result:'PASS'});}catch(e){console.error(name);throw e;}}
function fixture(placeholder=false){
  const context={eventId:'t_GgaQ_0921',leagueId:'lg_M2wQ_4189',sheetId:'test-book',revision:'current',date:'2026-11-21'};
  const entry={name:'Beauty Synthetic Import',tpid:'AB12',lpid:'CD34'},provider={entries:[entry],league:[{name:entry.name,lpid:entry.lpid}],readAt:Date.now()};
  const table=(id,rows,width=6)=>({id,values:clone(rows),display:rows.map(r=>r.map(String)),formulas:rows.map(()=>Array(width).fill('')),formats:rows.map(()=>Array(width).fill('General'))});
  const status=[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Other Player','','STANDBY','NEJ','Keep this','HUB']];
  if(placeholder)status.push([entry.name,'','','','','']);
  status.push(['','','','','','']);
  let state={context,snap:{Control:table(0,[['START DATE','LAST RESET'],[46347,36526]],2),
    'PLAYER STATUS DATA':table(1,status),'Form responses 2':table(2,[['Timestamp','Name','New','Consent','Message','Source'],[46347,'Other Player','','NEJ','Keep this','HUB'],['','','','','','']]),
    "TONIGHT'S PLAYERS":table(3,[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Other Player','','STANDBY','NEJ','Keep this','HUB'],['','','','','','']]),
    "PLAYER'S MASTER LIST":table(4,[['PLAYERS'],['Other Player'],[entry.name]],1)},
    bounds:{'PLAYER STATUS DATA':{last:placeholder?3:2,capacity:1000},'Form responses 2':{last:2,capacity:1000}}};
  state.snap["TONIGHT'S PLAYERS"].formulas[1][0]='=SORT(...)';
  let history={removals:[],registrations:[],imports:[]},writes=0,syncs=0,saves=0,failWrite='',failSave=false,changed=false,failDisplay=false;
  const c={Date,JSON,Object,Array,String,Number,Map,Set,Error,Math,beautyHubTransferHash_:hash,beautyNakkaImportResponseCurrent_:(row,state)=>Number.isFinite(row[0])&&row[0]>=state.snap.Control.values[1][1]&&row[0]<state.snap.Control.values[1][0]+1};vm.createContext(c);vm.runInContext(source,c);
  const io={provider,guard(){if(changed)throw Error('IMPORT_CONTEXT_CHANGED');},read:()=>clone(state),history:()=>clone(history),now:()=>new Date().toISOString(),externalClosed(){},revalidate(){},
    save(r){saves++;if(failSave)throw Error('IMPORT_SAVE_UNCERTAIN');history.imports=[clone(r)];},
    write(plan){writes++;if(failWrite==='before')throw Error('lost before commit');
      for(const cell of plan.cells){const t=state.snap[cell.title];t.values[cell.row]=clone(cell.values);t.display[cell.row]=cell.values.map(String);t.formulas[cell.row]=Array(6).fill('');t.formats[cell.row]??=Array(6).fill('General');state.bounds[cell.title].last=Math.max(state.bounds[cell.title].last,cell.row+1);}
      if(failWrite==='after')throw Error('lost after commit');},
    sync(name){syncs++;if(failDisplay)throw Error('formula still calculating');const t=state.snap["TONIGHT'S PLAYERS"];if(!t.display.some(r=>r[0]===name)){t.display[2]=[name,'','IN','N/A','','NAKKA'];t.values[2]=clone(t.display[2]);}}
  };
  return {c,entry,provider,io,get state(){return state;},get history(){return history;},counts:()=>({writes,syncs,saves}),
    decision:()=>clone(c.beautyNakkaImportDecision_(entry,provider,state,history)),run:()=>clone(c.beautyNakkaImportExecute_(entry,io)),
    failWrite:v=>failWrite=v,failSave:()=>failSave=true,changeContext:()=>changed=true,failDisplay:v=>failDisplay=v};
}
for(const placeholder of [false,true])test('Nakka-only registration '+(placeholder?'reuses one blank placeholder':'adds one new status row'),()=>{
  const f=fixture(placeholder),before=clone(f.state);assert.equal(f.decision().state,'READY');assert.equal(f.run().state,'COMPLETE');assert.equal(f.counts().writes,1);
  assert.equal(f.state.snap['PLAYER STATUS DATA'].values.filter(r=>r[0]===f.entry.name).length,1);
  assert.deepEqual(f.state.snap['PLAYER STATUS DATA'].values[2],[f.entry.name,'','IN','N/A','','NAKKA']);
  assert.deepEqual(f.state.snap["PLAYER'S MASTER LIST"],before.snap["PLAYER'S MASTER LIST"]);assert.deepEqual(f.state.snap.Control,before.snap.Control);
  assert.deepEqual(f.state.snap['PLAYER STATUS DATA'].values[1],before.snap['PLAYER STATUS DATA'].values[1]);
  for(let i=0;i<5;i++)assert.equal(f.run().state,'PRESENT');assert.equal(f.counts().writes,1);
});
test('Lost successful write reply is confirmed without another registration',()=>{const f=fixture(true);f.failWrite('after');assert.equal(f.run().state,'COMPLETE');assert.equal(f.run().state,'PRESENT');assert.equal(f.counts().writes,1);});
test('Unknown unsuccessful write is retained for review and never replayed',()=>{const f=fixture();f.failWrite('before');assert.equal(f.run().code,'IMPORT_SAVE_UNCERTAIN');f.failWrite('');assert.equal(f.run().state,'REVIEW');assert.equal(f.counts().writes,1);});
test('Receipt readback failure prevents the registration write',()=>{const f=fixture();f.failSave();assert.throws(()=>f.run(),/IMPORT_SAVE_UNCERTAIN/);assert.equal(f.counts().writes,0);});
for(const status of ['OUT','STANDBY'])test(status+' is preserved',()=>{const f=fixture(true);f.state.snap['PLAYER STATUS DATA'].values[2][2]=status;assert.equal(f.run().state,'PROTECTED');assert.equal(f.counts().writes,0);});
for(const [column,value] of [[1,'Earlier Name'],[3,'JA'],[3,'NEJ'],[4,'Real message'],[5,'HUB']])test('Existing value in column '+column+' is preserved: '+value,()=>{const f=fixture(true);f.state.snap['PLAYER STATUS DATA'].values[2][column]=value;assert.equal(f.run().state,'REVIEW');assert.equal(f.counts().writes,0);});
for(const state of ['ATTEMPTED','VERIFIED'])test(state+' removal protects a blank or absent status record',()=>{const f=fixture();f.history.removals.push({player:f.entry.name,state});assert.equal(f.run().state,'PROTECTED');assert.equal(f.counts().writes,0);});
test('Removal identity remains protected after a provider rename',()=>{const f=fixture();f.history.removals.push({player:'Previous name',identity:{name:'Previous name',lpid:f.entry.lpid}});assert.equal(f.run().state,'PROTECTED');});
test('Removed entry tombstone remains protected without ordinary removal receipt',()=>{const f=fixture();f.history.removals.push({player:'Old',tpid:f.entry.tpid});assert.equal(f.run().state,'PROTECTED');});
test('Saved Beauty registration is left to its existing recovery flow',()=>{const f=fixture();f.history.registrations.push({name:f.entry.name,state:'INTENT'});assert.equal(f.run().state,'PROTECTED');assert.equal(f.counts().writes,0);});
test('Duplicate normalized Nakka names require review',()=>{const f=fixture();f.provider.entries.push({...f.entry,tpid:'EF56',name:'BEAUTY  SYNTHETIC IMPORT'});assert.equal(f.run().code,'IMPORT_IDENTITY_REVIEW');});
test('Duplicate league names require review',()=>{const f=fixture();f.provider.league.push({name:f.entry.name,lpid:'EF56'});assert.equal(f.run().code,'IMPORT_IDENTITY_REVIEW');});
test('Conflicting event-to-league identity requires review',()=>{const f=fixture();f.provider.league[0].name='Different Player';assert.equal(f.run().code,'IMPORT_IDENTITY_REVIEW');});
test('Duplicate event league identity is rejected when the first entry omits its link',()=>{const f=fixture();f.entry.lpid='';f.provider.entries.push({name:'Other name',tpid:'EF56',lpid:'CD34'});assert.equal(f.run().code,'IMPORT_IDENTITY_REVIEW');});
test('Existing response with missing display cannot create a duplicate',()=>{const f=fixture();f.state.snap['Form responses 2'].values[2]=[46347,f.entry.name,'','JA','','HUB'];assert.equal(f.run().code,'IMPORT_EXISTING_RECORD_REVIEW');});
test('Formula in an otherwise empty placeholder is rejected',()=>{const f=fixture(true);f.state.snap['PLAYER STATUS DATA'].formulas[2][4]='=""';assert.equal(f.run().state,'REVIEW');});
test('Unrecognized name injection remains plain review, not a formula write',()=>{const f=fixture();f.entry.name='=IMPORTDATA("secret")';assert.equal(f.run().code,'IMPORT_NAME_REVIEW');});
test('Context change before the operation prevents all writes',()=>{const f=fixture();f.changeContext();assert.throws(()=>f.run(),/IMPORT_CONTEXT_CHANGED/);assert.equal(f.counts().writes,0);});
test('Concurrent sheet edit after planning is preserved and no write is sent',()=>{const f=fixture(true);let reads=0;const read=f.io.read;f.io.read=()=>{if(++reads===2)f.state.snap['PLAYER STATUS DATA'].values[2][3]='JA';return read();};assert.throws(()=>f.run(),/IMPORT_CHANGED/);assert.equal(f.counts().writes,0);assert.equal(f.state.snap['PLAYER STATUS DATA'].values[2][3],'JA');});
test('Changed history before intent prevents a new import',()=>{const f=fixture();let n=0;const history=f.io.history;f.io.history=()=>{if(++n===2)f.history.removals.push({player:f.entry.name,state:'ATTEMPTED'});return history();};assert.throws(()=>f.run(),/IMPORT_CHANGED/);assert.equal(f.counts().writes,0);});
test('Crash after intent is recovered by readback, never by resending',()=>{const f=fixture();const plan=f.c.beautyNakkaImportPlan_(f.decision(),f.state);f.io.save({version:1,context:f.state.context,entry:f.entry,state:'INTENT',attempts:0,plan});f.io.write(plan);assert.equal(f.run().state,'COMPLETE');assert.equal(f.counts().writes,1);});
test('Display retry can complete without another registration write',()=>{const f=fixture();f.failDisplay(true);assert.equal(f.run().state,'RESUME');f.failDisplay(false);assert.equal(f.run().state,'COMPLETE');assert.equal(f.counts().writes,1);});
test('Display retries stop after three attempts',()=>{const f=fixture();f.failDisplay(true);assert.equal(f.run().state,'RESUME');assert.equal(f.run().state,'RESUME');assert.equal(f.run().state,'REVIEW');assert.equal(f.run().state,'REVIEW');assert.equal(f.counts().syncs,3);assert.equal(f.counts().writes,1);});
test('Changed provider entry ID cannot reuse an old receipt',()=>{const f=fixture();f.run();f.entry.tpid='EF56';assert.equal(f.run().code,'IMPORT_IDENTITY_CHANGED');assert.equal(f.counts().writes,1);});
test('Later real consent survives repeated scans',()=>{const f=fixture();f.run();f.state.snap['PLAYER STATUS DATA'].values[2][3]='JA';assert.equal(f.run().state,'PRESENT');assert.equal(f.state.snap['PLAYER STATUS DATA'].values[2][3],'JA');assert.equal(f.counts().writes,1);});
test('A cleared completed import is reported, never resurrected',()=>{const f=fixture();f.run();f.state.snap['PLAYER STATUS DATA'].values[2]=Array(6).fill('');assert.equal(f.run().code,'IMPORT_RECORD_CHANGED');assert.equal(f.counts().writes,1);});
test('Invalid registration window fails before recording an intent',()=>{const f=fixture();f.state.snap.Control.values[1][1]=50000;assert.throws(()=>f.run(),/IMPORT_DATE_REVIEW/);assert.equal(f.counts().writes,0);assert.equal(f.counts().saves,0);});
test('Master-list ambiguity fails without a master write',()=>{const f=fixture();f.state.snap["PLAYER'S MASTER LIST"].values.push([f.entry.name]);assert.equal(f.run().code,'IMPORT_MASTER_AMBIGUOUS');});
test('Full status capacity is not silently extended',()=>{const f=fixture();f.state.bounds['PLAYER STATUS DATA'].capacity=2;assert.throws(()=>f.run(),/IMPORT_CAPACITY_REVIEW/);assert.equal(f.counts().writes,0);});
test('Open legacy Google Form prevents a table write',()=>{const f=fixture();f.io.externalClosed=()=>{throw Error('IMPORT_FORM_OPEN');};assert.throws(()=>f.run(),/IMPORT_FORM_OPEN/);assert.equal(f.counts().writes,0);});
test('Entry removed in Nakka during planning blocks the import',()=>{const f=fixture();f.io.revalidate=()=>{f.provider.entries=[];};assert.throws(()=>f.run(),/IMPORT_CHANGED/);assert.equal(f.counts().writes,0);});
test('Changed Nakka entry identity during planning blocks the import',()=>{const f=fixture();f.io.revalidate=()=>{f.provider.entries=[{...f.entry,tpid:'EF56'}];};assert.throws(()=>f.run(),/IMPORT_CHANGED/);assert.equal(f.counts().writes,0);});
test('Historical response does not block the current event import',()=>{const f=fixture();f.state.snap['Form responses 2'].values[2]=[36525,f.entry.name,'','JA','','HUB'];f.state.bounds['Form responses 2'].last=3;assert.equal(f.run().state,'COMPLETE');assert.deepEqual(f.state.snap['Form responses 2'].values[2],[36525,f.entry.name,'','JA','','HUB']);assert.equal(f.counts().writes,1);});
const report={result:'PASS',scope:'Actual candidate import decision/execution functions with isolated storage and provider data; no native acceptance claimed',checks};
fs.writeFileSync(path.join(root,'evidence/import-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,checks:checks.length}));
module.exports={fixture};
