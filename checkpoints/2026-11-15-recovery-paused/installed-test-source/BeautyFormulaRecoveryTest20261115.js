/* Owner-run formula subsystem test. No Nakka calls and no public Hub route.
 * Provider identity is synthetic; only new BFW1511 tabs and BFW1511_* receipts
 * may be written. No original tabs, existing receipts or event binding writes.
 */
function beautyFormulaMap_(){return {Control:'BFW1511_Control','Form responses 2':'BFW1511_Responses','PLAYER STATUS DATA':'BFW1511_Status',"TONIGHT'S PLAYERS":'BFW1511_Display',"PLAYER'S MASTER LIST":'BFW1511_Master'};}
function beautyFormulaHash_(v){return beautyPartialNativeHash_(v);}
function beautyFormulaGuard_(){beautyPartialNativeOwner_();return beautyPartialNativeConfig_();}
function beautyFormulaProperty_(key,value){
 beautyFormulaGuard_();if(!['SETUP','JOB','FAULT','RESULT','RESUME'].includes(key))throw Error('FORMULA_PROPERTY_KEY');
 const p=PropertiesService.getScriptProperties(),k='BFW1511_'+key;if(value===undefined){const s=p.getProperty(k);return s?JSON.parse(s):null;}
 const s=JSON.stringify(value);if(Utilities.newBlob(s).getBytes().length>8500)throw Error('FORMULA_RECEIPT_SIZE');p.setProperty(k,s);if(p.getProperty(k)!==s)throw Error('FORMULA_RECEIPT_READBACK');return value;
}
function beautyFormulaTab_(ss,title){const name=beautyFormulaMap_()[title];if(!name)throw Error('FORMULA_TAB_ONLY');const sh=ss.getSheetByName(name);if(!sh||sh.getRange('H1').getValue()!=='BEAUTY_FORMULA_FIXTURE_V1')throw Error('FORMULA_MARKER');const setup=beautyFormulaProperty_('SETUP');if(setup?.ids&&setup.ids[title]!==sh.getSheetId())throw Error('FORMULA_TAB_ID');return sh;}
function beautyFormulaProtected_(ss){
 const properties=PropertiesService.getScriptProperties().getProperties(),kept={};for(const k of Object.keys(properties).sort())if(/^(BSI1511_|BST1411_|BUI1511_|BID1511_|BPR1411_|BEAUTY_EVENT_CONTEXT_V1$)/.test(k))kept[k]=properties[k];
 return {original:beautyPartialNativeOriginalHash_(ss),receipts:beautyFormulaHash_(kept)};
}
function beautyFormulaSnapshot_(ss){const out={};for(const title of Object.keys(beautyFormulaMap_())){const sh=beautyFormulaTab_(ss,title),r=sh.getRange(1,1,100,6);out[title]={id:sh.getSheetId(),values:r.getValues(),display:r.getDisplayValues(),formulas:r.getFormulas(),formats:r.getNumberFormats()};}return out;}
function beautyFormulaPreserved_(ss){
 beautyFormulaGuard_();const s=beautyFormulaProperty_('SETUP');if(!s||s.state!=='READY')throw Error('FORMULA_SETUP_INCOMPLETE');
 if(JSON.stringify(beautyFormulaProtected_(ss))!==JSON.stringify(s.protected))throw Error('FORMULA_ORIGINALS_CHANGED');
 const snap=beautyFormulaSnapshot_(ss);if(beautyFormulaHash_(snap["TONIGHT'S PLAYERS"].formulas.slice(1))!==s.formulaHash)throw Error('FORMULA_LAYOUT_CHANGED');
 for(const t of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"]){if(beautyFormulaHash_(snap[t])!==s.sources[t])throw Error('FORMULA_SOURCE_CHANGED');}
 return snap;
}
function beautyFormulaCore_(ss,phase){
 const config=beautyFormulaGuard_(),player='BEAUTY FORMULA TEST 1511',entry={name:player,tpid:'FW01',lpid:''};
 const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const mapped={getId:()=>ss.getId(),getSpreadsheetTimeZone:()=>ss.getSpreadsheetTimeZone(),getSheetByName:t=>beautyFormulaTab_(ss,t)};
 const io={Utilities,SpreadsheetApp:{openById:id=>{if(id!==config.sheetId)throw Error('FORMULA_BOOK_ONLY');return mapped;},flush:()=>SpreadsheetApp.flush()},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>{const j=beautyFormulaProperty_('JOB');if(!j||k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('FORMULA_JOB_KEY');return JSON.stringify(j);},setProperty:(k,text)=>{const j=JSON.parse(text),old=beautyFormulaProperty_('JOB');if(!old||k!=='BEAUTY_RECOVERY_JOB_'+old.id||j.id!==old.id||j.player!==player||j.kind!=='import')throw Error('FORMULA_JOB_KEY');beautyFormulaPreserved_(ss);if(j.state==='COMPLETE')beautyFormulaDisplayVerified_(ss);beautyFormulaProperty_('JOB',j);}})},
 beautyLiveTarget_:()=>{beautyFormulaGuard_();return config;},beautyLiveContextEvent_:()=>({status:20,synthetic:true}),beautyLiveRemoveSnapshot_:()=>beautyFormulaSnapshot_(ss),beautyLiveRemoveHash_:beautyFormulaHash_,beautyLiveRegistrationKey_:key,
 beautyLiveRegistrationApi_:(route,payload)=>{if(payload!==undefined||route!=='tournament/entry/list?tdid='+config.eventId)throw Error('FORMULA_PROVIDER_DISABLED');return [entry];},beautyLiveRemoveEntries_:v=>v,
 beautyQueueWriteGuard_:()=>beautyFormulaGuard_(),beautyQueueLegacyBlock_:()=>beautyFormulaGuard_(),beautyLiveRegistrationList_:()=>{throw Error('FORMULA_LEAGUE_DISABLED');},beautyLiveRemoveSerial_:beautyImportSerial_,
 beautyEventExternalWritesClosed_:()=>{throw Error('FORMULA_SOURCE_WRITE_DISABLED');},beautyEventSheets_:()=>{throw Error('FORMULA_SOURCE_WRITE_DISABLED');},
 beautyLiveRegistrationSync_:(s,p)=>{beautyFormulaPreserved_(ss);if(phase==='INTERRUPT')throw Error('TEST_FORMULA_DISPLAY_INTERRUPTED');beautyFormulaSync_(s,p);}
 };
 // plan() needs only a fixture isolation assertion before the source is seeded.
 if(phase==='PLAN')io.beautyEventExternalWritesClosed_=()=>beautyFormulaGuard_();
 return beautyStandaloneImportCore_(io);
}
function beautyFormulaOutput_(v){console.log(JSON.stringify(v,null,2));return v;}
function beautyFormulaAction_(fn){beautyFormulaGuard_();return beautyPartialNativeLocked_(()=>{beautyFormulaGuard_();return fn(beautyPartialNativeBook_());});}
function beautyTestFormulaSetup20261115(){if(arguments.length)throw Error('FORMULA_NO_ARGUMENTS');return beautyFormulaAction_(ss=>{
 const prior=beautyFormulaProperty_('SETUP');if(prior){if(prior.state==='READY'){beautyFormulaPreserved_(ss);return beautyFormulaOutput_({result:'FORMULA_TEST_ALREADY_READY',next:'Use INTERRUPT once or RECHECK if a saved fault exists. No fixture reseeding.'});}throw Error('FORMULA_SETUP_INCOMPLETE_PRESERVE_EVIDENCE');}
 if(beautyFormulaProperty_('JOB')||beautyFormulaProperty_('FAULT')||Object.values(beautyFormulaMap_()).some(n=>ss.getSheetByName(n)))throw Error('FORMULA_EXISTING_FIXTURE_REVIEW');
 const actual=ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,99,6).getFormulas();if(beautyFormulaHash_(actual)!==beautyFormulaExpectedHash_())throw Error('FORMULA_BASELINE_CHANGED');
 const protectedState=beautyFormulaProtected_(ss),setup={state:'PROVISIONING',protected:protectedState,createdAt:new Date().toISOString()};beautyFormulaProperty_('SETUP',setup);
 const ids={};for(const [title,name]of Object.entries(beautyFormulaMap_())){beautyFormulaGuard_();const sh=ss.insertSheet(name);ids[title]=sh.getSheetId();sh.getRange('H1').setValue('BEAUTY_FORMULA_FIXTURE_V1');const rows=Array.from({length:2},()=>Array(6).fill(''));
 rows[0]=title==='Control'?['DATE','RESET','','','','']:title==='Form responses 2'?['TIME','PLAYER','NEW NAME','CONSENT','MESSAGE','SOURCE']:['PLAYER','OLD NAME','STATUS','CONSENT','MESSAGE','SOURCE'];
 if(title==='Control'){rows[1][0]=new Date('2026-11-07T12:00:00Z');rows[1][1]=rows[1][0];}
 else if(title==='Form responses 2')rows[1]=[new Date('2026-11-07T12:00:00Z'),'AAA FORMULA PRESERVE','','NEJ','Keep this message.   ','TEST'];
 else if(title==='PLAYER STATUS DATA')rows[1]=['AAA FORMULA PRESERVE','','OUT','NEJ','Keep this message.   ','TEST'];
 else if(title==="PLAYER'S MASTER LIST")rows[1][0]='AAA FORMULA PRESERVE';
 sh.getRange(1,1,2,6).setValues(rows);
 }
 setup.ids=ids;beautyFormulaProperty_('SETUP',setup);
 const formulas=actual.map(row=>row.map(f=>Object.entries(beautyFormulaMap_()).reduce((s,[old,name])=>s.split("'"+old.replace(/'/g,"''")+"'!").join(name+"!"),f)));
 // All nonempty references must point only at the new fixture sheets.
 if(formulas.flat().some(f=>/Form responses 2|PLAYER STATUS DATA/.test(f)))throw Error('FORMULA_MAPPING');
 const display=beautyFormulaTab_(ss,"TONIGHT'S PLAYERS");display.getRange(2,1,99,6).setFormulas(formulas);SpreadsheetApp.flush();
 // Snapshot a stable sentinel before adding the synthetic target.
 for(let i=0;i<5;i++){if(display.getRange('A2').getDisplayValue()==='AAA FORMULA PRESERVE')break;SpreadsheetApp.flush();Utilities.sleep(500);}
 if(display.getRange('A2').getDisplayValue()!=='AAA FORMULA PRESERVE')throw Error('FORMULA_SENTINEL_NOT_VISIBLE');
 display.getRange('C2').setValue('OUT');SpreadsheetApp.flush();
 const snap=beautyFormulaSnapshot_(ss),core=beautyFormulaCore_(ss,'PLAN'),player='BEAUTY FORMULA TEST 1511',mapped={getSpreadsheetTimeZone:()=>ss.getSpreadsheetTimeZone(),getSheetByName:t=>beautyFormulaTab_(ss,t)};
 const plan=core.plan({snap,identity:{name:player}},mapped),j={id:Utilities.getUuid().replace(/-/g,''),kind:'import',player,identity:{name:player,lpid:''},entry:{name:player,tpid:'FW01',lpid:''},event:beautyFormulaGuard_(),plan,state:'PREPARED',steps:{records:'INTENT'}};
 if(plan.plans.some(x=>x.start!==2))throw Error('FORMULA_SOURCE_BOUNDARY');beautyFormulaProperty_('JOB',j);
 // One-time synthetic setup: absolute writes only to the two new source rows.
 for(const x of plan.plans){beautyFormulaGuard_();beautyFormulaTab_(ss,x.title).getRange(3,1,1,6).setValues([x.values]);}SpreadsheetApp.flush();
 const after=beautyFormulaSnapshot_(ss);setup.state='READY';setup.formulaHash=beautyFormulaHash_(after["TONIGHT'S PLAYERS"].formulas.slice(1));setup.sources={};for(const t of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])setup.sources[t]=beautyFormulaHash_(after[t]);
 if(setup.formulaHash!==beautyFormulaHash_(formulas))throw Error('FORMULA_INSTALL_READBACK');beautyFormulaSync_({store:beautyFormulaTab_(ss,'PLAYER STATUS DATA'),tonight:display},player);beautyFormulaDisplayVerified_(ss);beautyFormulaProperty_('SETUP',setup);beautyFormulaPreserved_(ss);
 j.steps.records='VERIFIED';beautyFormulaProperty_('JOB',j);
 return beautyFormulaOutput_({result:'FORMULA_TEST_READY',createdTabs:Object.values(beautyFormulaMap_()),syntheticSourceRowsWritten:2,originalEventTabsUnchanged:true,existingReceiptsUnchanged:true,nakkaCalls:0,providerIsSynthetic:true,next:'Run beautyTestFormulaInterrupt20261115 once. Recovery remains TEST only.'});
 });}
function beautyFormulaRun_(ss,phase){
 beautyFormulaPreserved_(ss);const job=beautyFormulaProperty_('JOB'),core=beautyFormulaCore_(ss,phase);let detail;
 try{detail=core.run(job);}catch(e){job.state='REVIEW';job.failure=String(e.message||e);core.save(job);detail={success:false,outcome:'REVIEW',error:job.failure};}
 beautyFormulaPreserved_(ss);
 const report={result:detail.success?'FORMULA_RECOVERY_VERIFIED':'FORMULA_RECOVERY_REVIEW',phase,jobId:job.id,detail,originalEventTabsUnchanged:true,existingReceiptsUnchanged:true,sourceRowsAppendedDuringRecovery:0,nakkaCalls:0,providerIsSynthetic:true,formulaRecoveryNativeVerified:detail.success,scope:'Production import core and status-sync logic; real Sheets formulas in isolated tabs. Provider is simulated; normal Hub form recovery is not released.'};
 beautyFormulaProperty_('RESULT',report);return beautyFormulaOutput_(report);
}
function beautyTestFormulaInterrupt20261115(){if(arguments.length)throw Error('FORMULA_NO_ARGUMENTS');return beautyFormulaAction_(ss=>{
 beautyFormulaPreserved_(ss);if(beautyFormulaProperty_('FAULT'))throw Error('FORMULA_USE_RECHECK');
 const j=beautyFormulaProperty_('JOB');if(!j||j.state!=='PREPARED'||j.steps.records!=='VERIFIED')throw Error('FORMULA_JOB_NOT_READY');
 const rows=beautyFormulaSnapshot_(ss)["TONIGHT'S PLAYERS"].display,hits=rows.map((r,i)=>({r,i})).filter(x=>x.r[0]===j.player);
 if(hits.length!==1||hits[0].r[2]!=='IN'||hits[0].r.slice(3).join('|')!=='N/A||NAKKA')throw Error('FORMULA_TARGET_NOT_VISIBLE');
 const fault={jobId:j.id,state:'INTENT',row:hits[0].i+1};beautyFormulaProperty_('FAULT',fault);
 // Display C is script-owned; formulas in A/B/D/E/F are untouched.
 beautyFormulaTab_(ss,"TONIGHT'S PLAYERS").getRange(fault.row,3).setValue('');SpreadsheetApp.flush();
 if(beautyFormulaTab_(ss,"TONIGHT'S PLAYERS").getRange(fault.row,3).getValue()!=='')throw Error('FORMULA_FAULT_UNVERIFIED');
 fault.state='INJECTED';beautyFormulaProperty_('FAULT',fault);return beautyFormulaRun_(ss,'INTERRUPT');
 });}
function beautyTestFormulaRecheck20261115(){if(arguments.length)throw Error('FORMULA_NO_ARGUMENTS');return beautyFormulaAction_(ss=>{
 const j=beautyFormulaProperty_('JOB'),f=beautyFormulaProperty_('FAULT');if(!j||!f||j.id!==f.jobId||!['INTENT','INJECTED'].includes(f.state))throw Error('FORMULA_SAVED_FAULT_REQUIRED');return beautyFormulaRun_(ss,'RECHECK');
 });}

function beautyFormulaDisplayVerified_(ss){
 const rows=beautyFormulaSnapshot_(ss)["TONIGHT'S PLAYERS"].display.slice(1);
 const expected=[['AAA FORMULA PRESERVE','','OUT','NEJ','Keep this message.   ','TEST'],['BEAUTY FORMULA TEST 1511','','IN','N/A','','NAKKA']];
 for(let i=0;i<99;i++)if(JSON.stringify(rows[i])!==JSON.stringify(expected[i]||['','','','','','']))throw Error('FORMULA_FULL_DISPLAY_MISMATCH');
}
/* Resume only the preserved, fully seeded setup. No creation or source writes. */
function beautyTestFormulaResumeSetup20261115(){if(arguments.length)throw Error('FORMULA_NO_ARGUMENTS');return beautyFormulaAction_(ss=>{
 const setup=beautyFormulaProperty_('SETUP'),j=beautyFormulaProperty_('JOB');
 if(!setup||!['PROVISIONING','READY'].includes(setup.state)||!setup.ids||!j||j.kind!=='import'||j.player!=='BEAUTY FORMULA TEST 1511'||j.state!=='PREPARED'||!['INTENT','VERIFIED'].includes(j.steps?.records)||beautyFormulaProperty_('FAULT'))throw Error('FORMULA_RESUME_STATE_REVIEW');
 const config=beautyFormulaGuard_();if(['sheetId','eventId','leagueId','date','revision','mode'].some(k=>j.event?.[k]!==config[k]))throw Error('FORMULA_RESUME_CONTEXT');
 if(JSON.stringify(beautyFormulaProtected_(ss))!==JSON.stringify(setup.protected))throw Error('FORMULA_ORIGINALS_CHANGED');
 const actual=ss.getSheetByName("TONIGHT'S PLAYERS").getRange(2,1,99,6).getFormulas();if(beautyFormulaHash_(actual)!==beautyFormulaExpectedHash_())throw Error('FORMULA_BASELINE_CHANGED');
 const expected=actual.map(row=>row.map(f=>Object.entries(beautyFormulaMap_()).reduce((s,[old,name])=>s.split("'"+old.replace(/'/g,"''")+"'!").join(name+'!'),f)));
 const snap=beautyFormulaSnapshot_(ss),formulaHash=beautyFormulaHash_(snap["TONIGHT'S PLAYERS"].formulas.slice(1));
 if(formulaHash!==beautyFormulaHash_(expected))throw Error('FORMULA_RESUME_LAYOUT');
 if(!Array.isArray(j.plan?.plans)||j.plan.plans.length!==2)throw Error('FORMULA_RESUME_PLAN');
 const titles=['Form responses 2','PLAYER STATUS DATA'];
 for(let i=0;i<2;i++){
  const x=j.plan.plans[i],title=titles[i],s=snap[title],sh=beautyFormulaTab_(ss,title);
  if(x.title!==title||x.start!==2||x.sheetId!==s.id||x.capacity!==sh.getMaxRows()||sh.getLastRow()!==3)throw Error('FORMULA_RESUME_BOUNDARY');
  const prefix={};for(const k of ['values','display','formulas','formats'])prefix[k]=s[k].slice(0,2);prefix.id=s.id;
  if(beautyFormulaHash_(prefix)!==x.before)throw Error('FORMULA_RESUME_PREFIX');
  const row=s.values[2].slice();if(i===0)row[0]=beautyImportSerial_(row[0],ss.getSpreadsheetTimeZone());
  const wanted=i===0?[x.values[0],j.player,'','N/A','','NAKKA']:[j.player,'','IN','N/A','','NAKKA'];
  if(i===0&&(!Number.isFinite(x.values[0])||x.values[0]!==Math.max(beautyImportSerial_(snap.Control.values[1][0],ss.getSpreadsheetTimeZone()),beautyImportSerial_(snap.Control.values[1][1],ss.getSpreadsheetTimeZone()))))throw Error('FORMULA_RESUME_TIME');
  if(JSON.stringify(x.values)!==JSON.stringify(wanted)||JSON.stringify(row)!==JSON.stringify(wanted)||s.formulas[2].some(Boolean)||s.values.slice(3).some(r=>r.some(v=>v!==''))||s.formulas.slice(3).some(r=>r.some(Boolean)))throw Error('FORMULA_RESUME_SOURCE');
 }
 if(beautyFormulaHash_(snap.Control)!==j.plan.control||beautyFormulaHash_(snap["PLAYER'S MASTER LIST"])!==j.plan.master||beautyFormulaHash_(snap["TONIGHT'S PLAYERS"].formulas)!==j.plan.displayFormula||beautyFormulaHash_(snap["TONIGHT'S PLAYERS"].formats)!==j.plan.displayFormats)throw Error('FORMULA_RESUME_PRESERVATION');
 const sources={};for(const title of ['Control','Form responses 2','PLAYER STATUS DATA',"PLAYER'S MASTER LIST"])sources[title]=beautyFormulaHash_(snap[title]);
 if(setup.state==='READY'){
  beautyFormulaPreserved_(ss);beautyFormulaDisplayVerified_(ss);
  if(j.steps.records!=='VERIFIED')throw Error('FORMULA_RESUME_STATE_REVIEW');
  return beautyFormulaOutput_({result:'FORMULA_TEST_ALREADY_READY',sourceRowsWritten:0,tabsCreated:0,next:'Use the interruption step only if it has not run.'});
 }
 const proof=beautyFormulaProperty_('RESUME');
 if(proof&&(proof.jobId!==j.id||proof.setupHash!==beautyFormulaHash_(setup)||JSON.stringify(proof.sources)!==JSON.stringify(sources)))throw Error('FORMULA_RESUME_RECEIPT_CHANGED');
 if(!proof)beautyFormulaProperty_('RESUME',{jobId:j.id,state:'INTENT',setupHash:beautyFormulaHash_(setup),sources,originalSetup:setup,at:new Date().toISOString()});
 // Only derived C2:C100 is rebuilt. Formula strings and source records stay intact.
 beautyFormulaSync_({store:beautyFormulaTab_(ss,'PLAYER STATUS DATA'),tonight:beautyFormulaTab_(ss,"TONIGHT'S PLAYERS")},j.player);beautyFormulaDisplayVerified_(ss);
 const after=beautyFormulaSnapshot_(ss);for(const title of Object.keys(sources))if(beautyFormulaHash_(after[title])!==sources[title])throw Error('FORMULA_RESUME_SOURCE_CHANGED');
 if(beautyFormulaHash_(after["TONIGHT'S PLAYERS"].formulas.slice(1))!==formulaHash||JSON.stringify(beautyFormulaProtected_(ss))!==JSON.stringify(setup.protected))throw Error('FORMULA_RESUME_PRESERVATION');
 j.steps.records='VERIFIED';beautyFormulaProperty_('JOB',j);
 beautyFormulaProperty_('SETUP',{...setup,state:'READY',formulaHash,sources,resumedAt:new Date().toISOString()});beautyFormulaPreserved_(ss);
 return beautyFormulaOutput_({result:'FORMULA_TEST_READY',resumedExistingSetup:true,sourceRowsWritten:0,tabsCreated:0,formulasRewritten:0,originalEventTabsUnchanged:true,existingReceiptsUnchanged:true,nakkaCalls:0,providerIsSynthetic:true,next:'Return this log before running beautyTestFormulaInterrupt20261115.'});
 });}

function beautyFormulaExpectedHash_(){return '9c2e9924ed4b462f8fb4f0c756ff6713775793cd5587be58d34fa9441f367594';}
function beautyFormulaSync_(s,player){
 const beautyLiveRegistrationKey_=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 const beautyLiveRegistrationRows_=(sh,width)=>{beautyFormulaGuard_();if(!['BFW1511_Status','BFW1511_Display'].includes(sh.getName())||sh.getRange('H1').getValue()!=='BEAUTY_FORMULA_FIXTURE_V1'||!Number.isInteger(width)||width<1||width>6)throw Error('FORMULA_READ_TARGET');return sh.getRange(2,1,99,width).getDisplayValues();};
 function beautyLiveRegistrationSync_(s,player) {
  const key=beautyLiveRegistrationKey_;
  for(let pass=0;pass<5;pass++){
    SpreadsheetApp.flush();if(pass)Utilities.sleep(1000);
    const displayRows=beautyLiveRegistrationRows_(s.tonight,1);
    const names=Array.from({length:99},(_,i)=>displayRows[i]?.[0]||'');
    if(names.filter(n=>key(n)===key(player)).length!==1)continue;
    const map=new Map();
    const snapshot=beautyLiveRegistrationRows_(s.store,6);
    for(const r of snapshot)if(key(r[0])){
      if(map.has(key(r[0])))throw Error('Duplicate status rows.');map.set(key(r[0]),['IN','OUT','STANDBY'].includes(r[2])?r[2]:'');
    }
    const values=names.map(n=>[map.get(key(n))||'']);
    s.tonight.getRange(2,3,99,1).setValues(values);SpreadsheetApp.flush();
    const readback=beautyLiveRegistrationRows_(s.tonight,3);
    const after=Array.from({length:99},(_,i)=>readback[i]||['','','']);
    const current=beautyLiveRegistrationRows_(s.store,6);
    if(JSON.stringify(current)!==JSON.stringify(snapshot))continue;
    if(after.every((r,i)=>r[0]===names[i]&&r[2]===values[i][0])&&current.every(r=>!key(r[0])||map.get(key(r[0]))===(['IN','OUT','STANDBY'].includes(r[2])?r[2]:'')))return;
  }
  throw Error('Tonight display could not be verified.');
}
 beautyLiveRegistrationSync_(s,player);
}
