/* Authenticated TEST Hub bridge to existing fixed fixture rechecks only. */
function beautyTestHubRecoveryUi(action,input,token){
 try{
  beautyStandaloneGuard_();beautyHubAuthRequire_(token);
  if(!['read','transfer','import','display'].includes(action)||!input||Array.isArray(input)||Object.keys(input).join(',')!=='_context'||typeof input._context!=='string'||input._context!==beautyContextToken_())throw Error('Reload the TEST Hub: the event or request changed.');
  const context=input._context;
  const jobs=()=>[
   {kind:'transfer',label:'Transfer recovery',job:beautyStandaloneGet_(beautyStandaloneKeys_().job)},
   {kind:'import',label:'Import recovery',job:beautyImportGet_(beautyImportKeys_().job)},
   {kind:'display',label:'Display recovery',job:beautyDisplayGet_(beautyDisplayKeys_().job)}
  ].map(x=>({kind:x.kind,label:x.label,state:x.job?.state||'NOT_RUN',reference:x.job?.id||null,lastVerifiedAt:x.job?.completedAt||null}));
  let result=null;
  if(action!=='read'){
   // There is no preview, add, append, fault injection, or client-supplied target route.
   result=beautyTestHubReceiptRecheck_(action);
  }
  beautyHubAuthRequire_(token);beautyStandaloneGuard_();if(beautyContextToken_()!==context)throw Error('The selected Hub event changed. Reload this panel.');
  return {success:true,event:{id:'t_xeWf_2939',title:'Beauty Recovery TEST 2026-11-14.'},player:'BEAUTY TEST TRANSFER 1411',items:jobs(),result,
   scope:'Isolated TEST receipts only. Current Hub event is unchanged. Fresh transfer/import and production UI acceptance remain pending.'};
 }catch(e){return {success:false,code:e?.name==='HubAuthError'?'AUTH_REQUIRED':'RECOVERY_TEST_REVIEW',error:e?.name==='HubAuthError'?'Sign in to continue.':e.message||'The TEST recheck could not be verified. No automatic repeat.'};}
}

/* Preserve the original completed receipts; UI readback uses a temporary journal.
 * Import rechecks must not invalidate the display test's original-receipt hash.
 */
function beautyTestHubReceiptRecheck_(kind){return beautyStandaloneLocked_(()=>{
 const ss=beautyPartialNativeBook_(),key=kind==='transfer'?beautyStandaloneKeys_().job:kind==='import'?beautyImportKeys_().job:beautyDisplayKeys_().job;
 const p=PropertiesService.getScriptProperties(),raw=p.getProperty(key),j=raw?JSON.parse(raw):null;
 if(!j||j.state!=='COMPLETE'||j.player!==beautyStandaloneConfig_().player||j.event.eventId!=='t_xeWf_2939')throw Error('This panel rechecks completed test receipts only. Keep unfinished records for owner inspection.');
 beautyImportGuard_(ss);if(kind==='display'){const proof=beautyDisplayGet_(beautyDisplayKeys_().fault);if(!proof||proof.jobId!==j.id)throw Error('Display proof needs inspection.');beautyDisplayOriginal_(ss,proof.originalReceiptHash);}
 const io=kind==='transfer'?beautyStandaloneAdapter_(ss):beautyImportAdapter_(ss,'RECHECK');let memory=raw;
 io.PropertiesService={getScriptProperties:()=>({getProperty:k=>{if(k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('TEST_RECEIPT_KEY');return memory;},setProperty:(k,v)=>{if(k!=='BEAUTY_RECOVERY_JOB_'+j.id)throw Error('TEST_RECEIPT_KEY');memory=v;}})};
 const read=io.beautyLiveRegistrationApi_;io.beautyLiveRegistrationApi_=(path,payload)=>{if(payload)throw Error('UI_RECHECK_NO_PROVIDER_WRITE');return read(path);};io.beautyEventSheets_=()=>{throw Error('UI_RECHECK_NO_SOURCE_WRITE');};
 const core=kind==='transfer'?beautyStandaloneTransferCore_(io):beautyStandaloneImportCore_(io);const detail=core.run(j);
 if(kind!=='transfer')beautyImportVerified_(ss,j,true);beautyImportGuard_(ss);if(p.getProperty(key)!==raw)throw Error('The original test receipt changed during this check.');
 const report={detail,kind,jobId:j.id,checkedAt:new Date().toISOString(),sourceWriteAttempts:0,providerWrites:0,originalReceiptUnchanged:true};console.log(JSON.stringify({kind:'BEAUTY_TEST_HUB_RECOVERY',action:kind,...report}));return report;
 });}
