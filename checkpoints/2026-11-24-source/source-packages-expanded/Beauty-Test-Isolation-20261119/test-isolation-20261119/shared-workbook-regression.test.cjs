const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname,source=path.resolve(root,'../reconciliation-20261119/checkpoint/test-head');
const results=[];function test(name,f){f();results.push({name,status:'PASS'});}
function run(file,globals){const c={Date,...globals};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(source,file),'utf8'),c);return c;}
for(const action of ['eventprepare','eventsave'])test('Existing Hub dispatch already blocks '+action+' with active context',()=>{
 let reached=false;
 const c=run('HubTestBridge.gs',{beautyHubAuthRequire_:()=>{},beautyContextBind_:i=>i,beautyContextRead_:()=>({date:'2026-11-16'}),beautyHubTestEventTransition_:()=>{reached=true;}});
 c.beautyHubTestGuard_=()=>{};
 const r=c.beautyHubTest(action,{},'synthetic');assert.equal(r.success,false);assert.match(r.error,/League \/ Tournament/);assert.equal(reached,false);
});
function remove(context){
 const row=['Synthetic Repeat','','IN','JA','','KIOSK'];
 const snap={Control:{values:[[],[new Date('2026-11-23T12:00:00Z')]]},"TONIGHT'S PLAYERS":{display:[[],row]},'PLAYER STATUS DATA':{display:[[],row]},'Form responses 2':{formulas:[[],[],[]],values:[[],[new Date('2026-11-16T12:00:00Z'),'Synthetic Repeat'],[new Date('2026-11-23T12:00:00Z'),'Synthetic Repeat']]}};
 let providerReached=false;
 const c=run('HubTestRemove.gs',{beautyHubSpreadsheet_:()=>({getSpreadsheetTimeZone:()=> 'Europe/Berlin'}),beautyHubNakkaMeasure_:(_,f)=>f(),beautyHubEventSnapshot_:()=>snap,beautyHubEventKey_:v=>String(v||'').toLowerCase(),beautyContextRead_:()=>context,Utilities:{formatDate:d=>d.toISOString().slice(0,10)},beautyHubNakkaEvent_:()=>{providerReached=true;throw Error('PROVIDER_SENTINEL');}});
 return {c,providerReached:()=>providerReached};
}
test('Active event context sees two weekly rows as ambiguous before Nakka read',()=>{const e=remove({date:'2026-11-23'});assert.throws(()=>e.c.beautyHubRemoveState_({eventDate:'2026-11-23',player:'Synthetic Repeat'},'synthetic'),/^Error: IDENTITY$/);assert.equal(e.providerReached(),false);});
test('Legacy date-scoped branch selects current weekly row and reaches Nakka check',()=>{const e=remove(null);assert.throws(()=>e.c.beautyHubRemoveState_({eventDate:'2026-11-23',player:'Synthetic Repeat'},'synthetic'),/PROVIDER_SENTINEL/);assert.equal(e.providerReached(),true);});
test('Active-context registration accepts advance date through admission',()=>{
 const c=run('HubTestAutoRegister.gs',{beautyHubTestGuard_:()=>{},beautyContextRead_:()=>({date:'2026-11-23'}),beautyHubNakkaDate_:()=>({date:'2026-11-23'}),beautyHubRegistrationAdmission_:()=>({success:true}),Utilities:{formatDate:d=>d.toISOString().slice(0,10)}});
 c.beautyHubRegistrationAdmission_=()=>({success:true});
 assert.equal(c.beautyHubRegistrationDateCheck_('2026-11-23',new Date('2026-11-16T12:00:00Z')).success,true);
 c.beautyContextRead_=()=>null;
 assert.equal(c.beautyHubRegistrationDateCheck_('2026-11-23',new Date('2026-11-16T12:00:00Z')).code,'REGISTRATION_DAY_MISMATCH');
});
fs.writeFileSync(path.join(root,'shared-workbook-regression-results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Actual captured functions with synthetic records and stubbed services. These reproduce architectural constraints, not deployed incidents or fixes.',results},null,2));console.log(results.length+' PASS');
