var beautyRegistrationRecoveryActive_=null;
function beautyRegistrationRecoveryPrefix_(){return 'BEAUTY_REGISTRATION_RECOVERY_V1_'+beautyHubTransferHash_({sheet:SHEET_ID,event:beautyHubTransferTarget_(),date:beautyHubNakkaDate_().date})+'_';}
function beautyRegistrationRecoveryKey_(name){return beautyRegistrationRecoveryPrefix_()+beautyHubTransferHash_(BeautyNameResolution.key(name));}
function beautyRegistrationRecoveryWrite_(r){const p=PropertiesService.getScriptProperties(),raw=JSON.stringify(r);if(Utilities.newBlob(raw).getBytes().length>8500)throw Error('REGISTRATION_RECEIPT_SIZE');p.setProperty(beautyRegistrationRecoveryKey_(r.name),raw);if(p.getProperty(beautyRegistrationRecoveryKey_(r.name))!==raw)throw Error('REGISTRATION_RECEIPT_READBACK');}
function beautyRegistrationRecoveryBegin_(sheet,decision,recordedAt,selectedName,newName,consent,message,source){
 beautyHubTestGuard_();const raw=PropertiesService.getScriptProperties().getProperty(beautyRegistrationRecoveryKey_(decision.player));let old;
 if(raw){try{old=JSON.parse(raw);}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}if(old.state!=='COMPLETE'){beautyRegistrationRecoveryActive_=old;throw Error('REGISTRATION_PENDING');}}
 const r={version:1,name:decision.player,date:beautyHubNakkaDate_().date,eventId:beautyHubTransferTarget_(),sheetId:SHEET_ID,context:beautyContextToken_(),state:'INTENT',row:sheet.getLastRow()+1,recordedAt:recordedAt.toISOString(),selectedName,newName,consent,message,source,existingPlayer:!decision.isNew};
 beautyRegistrationRecoveryWrite_(r);beautyRegistrationRecoveryActive_=r;
}
function beautyRegistrationRecoverySource_(r){
 beautyHubTestGuard_();if(r.version!==1||r.sheetId!==SHEET_ID||r.eventId!==beautyHubTransferTarget_()||r.date!==beautyHubNakkaDate_().date||r.context!==beautyContextToken_()||!Number.isInteger(r.row)||r.row<2)throw Error('REGISTRATION_CONTEXT_CHANGED');
 const ss=beautyHubSpreadsheet_(),sh=ss.getSheetByName(RESPONSE_SHEET),v=sh.getRange(r.row,1,1,6).getValues()[0];
 if(!(v[0] instanceof Date)||v[0].toISOString()!==r.recordedAt||JSON.stringify(v.slice(1))!==JSON.stringify([r.selectedName,r.selectedName===NEW_PLAYER_OPTION?r.newName:'',r.consent,r.message,r.source]))throw Error('REGISTRATION_SOURCE_UNVERIFIED');return ss;
}
function beautyRegistrationRecoveryFinish_(){const r=beautyRegistrationRecoveryActive_;if(!r)return;beautyRegistrationRecoverySource_(r);r.state='COMPLETE';r.completedAt=new Date().toISOString();beautyRegistrationRecoveryWrite_(r);beautyRegistrationRecoveryActive_=null;}
function beautyRegistrationRecoveryCatch_(e){const r=beautyRegistrationRecoveryActive_;beautyRegistrationRecoveryActive_=null;if(!r)throw e;
 let sourceVerified=false;try{beautyRegistrationRecoverySource_(r);sourceVerified=true;}catch(ignore){}
 r.state='REVIEW';r.code=sourceVerified?'REGISTRATION_DISPLAY_PENDING':'REGISTRATION_SOURCE_UNVERIFIED';try{beautyRegistrationRecoveryWrite_(r);}catch(ignore){}
 beautyHubAttentionRemember_(r.name,r.date,{code:r.code});
 return {success:sourceVerified,player:r.name,existingPlayer:r.existingPlayer,registrationPending:true,code:r.code,error:'Your registration needs an organiser check. Do not submit it again.'};
}
function beautyRegistrationRecoveryPending_(){
 const prefix=beautyRegistrationRecoveryPrefix_(),all=PropertiesService.getScriptProperties().getProperties(),out=[];
 for(const key of Object.keys(all).filter(k=>k.startsWith(prefix))){let r;try{r=JSON.parse(all[key]);}catch(e){throw Error('REGISTRATION_RECEIPT_UNREADABLE');}if(r.state!=='COMPLETE'){if(typeof r.name!=='string'||r.version!==1||r.eventId!==beautyHubTransferTarget_())throw Error('REGISTRATION_RECEIPT_UNREADABLE');out.push(r);}}
 return out;
}
function beautyRegistrationRecoveryResume_(name){
 beautyHubTestGuard_();beautyHubAuthRequire_(beautyHubRequestToken_);const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {success:false,code:'BUSY'};
 try{
  const r=beautyRegistrationRecoveryPending_().find(r=>r.name===name);if(!r)return {success:true};
  const ss=beautyRegistrationRecoverySource_(r),key=BeautyNameResolution.key,read=title=>{const sh=ss.getSheetByName(title);if(!sh)throw Error('REGISTRATION_SHEET_MISSING');return sh.getLastRow()<2?[]:sh.getRange(2,1,sh.getLastRow()-1,6).getDisplayValues();};
  const stored=read('PLAYER STATUS DATA').filter(x=>key(x[0])===key(name)),shown=read("TONIGHT'S PLAYERS").filter(x=>key(x[0]||x[1])===key(name));
  if(stored.length>1||shown.length!==1)throw Error('REGISTRATION_DISPLAY_REVIEW');
  const consent=r.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ';
  if(stored.length&&([stored[0][2]].some(v=>v&&!['IN'].includes(v))||[3,4,5].some((i)=>stored[0][i]!==''&&stored[0][i]!==[consent,r.message,r.source][i-3])))throw Error('REGISTRATION_STATUS_CHANGED');
  const masters=read(MASTER_SHEET).filter(x=>key(x[0])===key(name));if(masters.length>1)throw Error('REGISTRATION_IDENTITY_CONFLICT');
  if(!masters.length){if(r.existingPlayer)throw Error('REGISTRATION_MASTER_CHANGED');addPlayerToMasterList_(name);}
  // Only fill absent or matching fields. Never append the response a second time.
  updatePlayerStatusData_(name,r.consent,r.message,r.source);syncTonightStatusDisplay_(name);
  beautyRegistrationRecoverySource_(r);
  const after=read('PLAYER STATUS DATA').filter(x=>key(x[0])===key(name)),visible=read("TONIGHT'S PLAYERS").filter(x=>key(x[0]||x[1])===key(name));
  if(after.length!==1||after[0][2]!=='IN'||after[0][3]!==consent||after[0][4]!==r.message||after[0][5]!==r.source||visible.length!==1||visible[0][2]!=='IN')throw Error('REGISTRATION_DISPLAY_REVIEW');
  r.state='COMPLETE';r.completedAt=new Date().toISOString();beautyRegistrationRecoveryWrite_(r);beautyHubAttentionRemember_(name,r.date,{code:'MISSING_EVENT_ENTRY'});return {success:true};
 }catch(e){return {success:false,code:/^REGISTRATION_[A-Z_]+$/.test(e.message)?e.message:'REGISTRATION_DISPLAY_REVIEW',error:'The saved registration needs review. No response row was appended.'};}finally{lock.releaseLock();}
}
