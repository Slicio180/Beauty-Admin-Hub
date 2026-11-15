/* Existing completed import only. No source-row or provider mutation is exposed. */
function beautyDisplayKeys_(){return {preview:'BID1511_PREVIEW',job:'BID1511_JOB',fault:'BID1511_FAULT',result:'BID1511_RESULT'};}
function beautyDisplayProperty_(key,value){beautyStandaloneGuard_();if(!Object.values(beautyDisplayKeys_()).includes(key))throw Error('DISPLAY_PROPERTY_ONLY');const p=PropertiesService.getScriptProperties();if(value===undefined)return p.getProperty(key);const s=JSON.stringify(value);if(Utilities.newBlob(s).getBytes().length>8500)throw Error('DISPLAY_RECEIPT_SIZE');p.setProperty(key,s);if(p.getProperty(key)!==s)throw Error('DISPLAY_RECEIPT_READBACK');return s;}
function beautyDisplayGet_(key){const s=beautyDisplayProperty_(key);return s?JSON.parse(s):null;}
function beautyDisplayOriginal_(ss,expectedHash){beautyImportGuard_(ss);const raw=beautyImportProperty_(beautyImportKeys_().job),j=raw?JSON.parse(raw):null;if(!j||j.state!=='COMPLETE'||j.kind!=='import'||j.event.eventId!=='t_xeWf_2939'||j.player!==beautyStandaloneConfig_().player||j.steps.records!=='VERIFIED'||j.entry?.tpid!=='HQzG')throw Error('COMPLETED_IMPORT_REQUIRED');const hash=beautyPartialNativeHash_(raw);if(expectedHash&&hash!==expectedHash)throw Error('ORIGINAL_IMPORT_RECEIPT_CHANGED');return {job:j,hash};}
function beautyDisplayCompare_(ss,j){
 const snap=beautyImportSnapshot_(ss),ranges=j.plan.plans.map(x=>"'"+beautyImportMap_()[x.title]+"'!A"+(x.start+1)+':F'+(x.start+1));
 if(ranges.length!==2||j.plan.plans.some(x=>!['Form responses 2','PLAYER STATUS DATA'].includes(x.title)||x.start!==2))throw Error('READBACK_RANGE_REVIEW');
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+beautyStandaloneConfig_().sheetId+'/values:batchGet?'+ranges.map(r=>'ranges='+encodeURIComponent(r)).join('&')+'&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER';
 let response;try{response=UrlFetchApp.fetch(url,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true,followRedirects:false});}catch(e){throw Error('DIRECT_READ_UNAVAILABLE');}
 if(response.getResponseCode()!==200)throw Error('DIRECT_READ_HTTP_'+response.getResponseCode());let data;try{data=JSON.parse(response.getContentText());}catch(e){throw Error('DIRECT_READ_JSON');}
 if(data.spreadsheetId!==ss.getId()||!Array.isArray(data.valueRanges)||data.valueRanges.length!==2)throw Error('DIRECT_READ_LAYOUT');
 const pad=r=>Array.from({length:6},(_,i)=>r?.[i]??''),result=[];
 for(let i=0;i<2;i++){const x=j.plan.plans[i],vr=data.valueRanges[i];if(typeof vr.range!=='string'||vr.range.replace(/'/g,'')!==ranges[i].replace(/'/g,''))throw Error('DIRECT_READ_RANGE');
  const native=pad(snap[x.title].values[x.start]),direct=pad(vr.values?.[0]);if(x.title==='Form responses 2')native[0]=beautyImportSerial_(native[0],ss.getSpreadsheetTimeZone());
  const mismatch=r=>r.map((v,k)=>v===x.values[k]?null:k+1).filter(v=>v!==null);
  result.push({table:x.title,nativeMismatchColumns:mismatch(native),directMismatchColumns:mismatch(direct),nativeEqualsDirect:JSON.stringify(native)===JSON.stringify(direct)});
 }
 return {result:'IMPORT_READBACK_COMPARISON',checkedAt:new Date().toISOString(),rows:result,bothReadersMatchExpected:result.every(r=>!r.nativeMismatchColumns.length&&!r.directMismatchColumns.length),historicalFirstReadbackCause:'UNDETERMINED',providerWrites:0,sheetsWrites:0};
}
function beautyTestImportDisplayPreview20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),keys=beautyDisplayKeys_(),original=beautyDisplayOriginal_(ss);if(beautyDisplayGet_(keys.job)||beautyDisplayGet_(keys.fault))throw Error('USE_DISPLAY_RECHECK');
 beautyStandaloneEvent_();const snap=beautyImportVerified_(ss,original.job,true),comparison=beautyDisplayCompare_(ss,original.job);beautyStandaloneOutput_(comparison);if(!comparison.bothReadersMatchExpected)throw Error('READBACK_COMPARISON_REVIEW');
 const rows=snap["TONIGHT'S PLAYERS"].values,hits=rows.map((r,i)=>({r,i})).filter(x=>x.r[0]===original.job.player);if(hits.length!==1||hits[0].r[2]!=='IN')throw Error('DISPLAY_TARGET_REVIEW');
 const preview={ticket:Utilities.getUuid().replace(/-/g,''),owner:Session.getActiveUser().getEmail().toLowerCase(),expires:Date.now()+600000,originalReceiptHash:original.hash,snapshotHash:beautyPartialNativeHash_(snap),row:hits[0].i+1,column:3,before:'IN',after:''};beautyDisplayProperty_(keys.preview,preview);
 return beautyStandaloneOutput_({result:'IMPORT_DISPLAY_PREVIEW_READY',player:original.job.player,eventId:original.job.event.eventId,sourceRowsToAppend:0,providerWrites:0,displayCellToClear:{tab:'BSI1511_Display',row:preview.row,column:3},readbackComparison:comparison,confirmation:'Run beautyTestImportDisplayConfirm20261115 within 10 minutes. It clears only the synthetic display status and deliberately fails refresh; recheck restores it. Original import receipt is retained.'});
 });}
function beautyDisplayCore_(ss,phase,proof){
 const io=beautyImportAdapter_(ss,'RECHECK'),keys=beautyDisplayKeys_(),sync=io.beautyLiveRegistrationSync_;let injected=false;
 io.PropertiesService={getScriptProperties:()=>({getProperty:k=>{const j=beautyDisplayGet_(keys.job);if(!j||k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('DISPLAY_JOB_KEY');return JSON.stringify(j);},setProperty:(k,text)=>{const j=JSON.parse(text);if(k!=='BEAUTY_RECOVERY_JOB_'+j.id||j.id!==proof.jobId||j.kind!=='import'||j.event.eventId!=='t_xeWf_2939'||j.player!==beautyStandaloneConfig_().player)throw Error('DISPLAY_JOB_KEY');beautyDisplayOriginal_(ss,proof.originalReceiptHash);beautyDisplayProperty_(keys.job,j);}})};
 io.beautyEventSheets_=()=>{throw Error('DISPLAY_TEST_NO_SOURCE_WRITE');};
 io.beautyLiveRegistrationSync_=()=>{beautyDisplayOriginal_(ss,proof.originalReceiptHash);if(phase==='CONFIRM'){injected=true;throw Error('TEST_DISPLAY_FAILURE_INJECTED');}return sync();};
 return {core:beautyStandaloneImportCore_(io),injected:()=>injected};
}
function beautyDisplayRun_(ss,job,phase,proof){const a=beautyDisplayCore_(ss,phase,proof);let detail;try{detail=a.core.run(job);if(detail.success)beautyImportVerified_(ss,job,true);}catch(e){job.state='REVIEW';job.failure=e.message;a.core.save(job);detail={success:false,outcome:'REVIEW',error:e.message};}
 beautyDisplayOriginal_(ss,proof.originalReceiptHash);beautyImportVerified_(ss,job,false);
 const report={result:detail.success?'IMPORT_DISPLAY_RECOVERY_VERIFIED':'IMPORT_DISPLAY_RECOVERY_REVIEW',phase,jobId:job.id,originalImportJobId:proof.originalImportJobId,displayFailureInjectedThisRun:a.injected(),displayFaultWasApplied:proof.state==='INJECTED',sourceWriteAttemptsDuringThisTest:0,providerWrites:0,originalImportReceiptUnchanged:true,originalEventTabsUnchanged:true,transferFixturesUnchanged:true,hubBindingChanged:false,productionChanged:false,detail,scope:'Existing native import fixture display recovery through production import core; historical readback cause and full Hub UI still open'};
 beautyDisplayProperty_(beautyDisplayKeys_().result,report);return beautyStandaloneOutput_(report);
}
function beautyTestImportDisplayConfirm20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),keys=beautyDisplayKeys_();if(beautyDisplayGet_(keys.job)||beautyDisplayGet_(keys.fault))throw Error('USE_DISPLAY_RECHECK');const p=beautyDisplayGet_(keys.preview);if(!p||p.consumed||Date.now()>=p.expires||p.owner!==Session.getActiveUser().getEmail().toLowerCase())throw Error('FRESH_DISPLAY_PREVIEW_REQUIRED');
 const original=beautyDisplayOriginal_(ss,p.originalReceiptHash),snap=beautyImportVerified_(ss,original.job,true);beautyStandaloneEvent_();if(beautyPartialNativeHash_(snap)!==p.snapshotHash)throw Error('STALE_DISPLAY_PREVIEW');
 if(p.column!==3||!Number.isInteger(p.row)||p.row<2||p.row>10||snap["TONIGHT'S PLAYERS"].values[p.row-1][0]!==original.job.player||snap["TONIGHT'S PLAYERS"].values[p.row-1][2]!=='IN'||p.after!=='')throw Error('DISPLAY_CELL_REVIEW');
 const proof={jobId:p.ticket,originalImportJobId:original.job.id,originalReceiptHash:original.hash,row:p.row,column:3,before:'IN',after:'',state:'INTENT'},j={...JSON.parse(JSON.stringify(original.job)),id:p.ticket,state:'PROCESSING',steps:{records:'VERIFIED'}};
 beautyDisplayProperty_(keys.preview,{...p,consumed:true});beautyDisplayProperty_(keys.job,j);beautyDisplayProperty_(keys.fault,proof);
 const cell=beautyImportTab_(ss,"TONIGHT'S PLAYERS").getRange(p.row,3);try{cell.setValue('');SpreadsheetApp.flush();}catch(e){}
 if(cell.getValue()!=='')throw Error('DISPLAY_FAULT_WRITE_UNVERIFIED');
 proof.state='INJECTED';beautyDisplayProperty_(keys.fault,proof);return beautyDisplayRun_(ss,j,'CONFIRM',proof);
 });}
function beautyTestImportDisplayRecheck20261115(){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),keys=beautyDisplayKeys_(),proof=beautyDisplayGet_(keys.fault),j=beautyDisplayGet_(keys.job);if(!proof||!j||proof.jobId!==j.id||!['INTENT','INJECTED'].includes(proof.state)||j.steps.records!=='VERIFIED')throw Error('DISPLAY_RECEIPT_REQUIRED');
 beautyDisplayOriginal_(ss,proof.originalReceiptHash);return beautyDisplayRun_(ss,j,'RECHECK',proof);
 });}
