/* One-attempt recovery. It does not replay registration or clear failed receipts.
 * Run Review first, then Complete. Both require the existing LIVE owner guard.
 * Complete validates the same data again under the Hub ScriptLock.
 */
function beautyLiveRegistrationRecoveryRead_() {
  beautyLiveLoginGuard_();
  if(beautyLiveTarget_().eventId!==BEAUTY_LIVE_BASE_.eventId)throw Error('Recovery belongs to the original Monday event.');
  const p=PropertiesService.getScriptProperties(),pending='BEAUTY_LIVE_REGISTRATION_PENDING';
  const raw=p.getProperty(pending),j=JSON.parse(raw||'null'),key=beautyLiveRegistrationKey_;
  if(!j||j.state!=='ATTEMPTED'||j.stage!=='master'||j.player!=='Beauty Test November (Hub Test)'||j.eventDate!=='2026-11-09'||j.uid!=='607O4cFmrTMPSk2CgADhwNu7k742'||j.recordedUTC!=='2026-11-08T13:00:22.654Z')throw Error('RECOVERY_STOP: receipt does not match the reviewed attempt.');
  const properties=p.getProperties();
  if(Object.keys(properties).some(k=>k!==pending&&/PENDING/.test(k)&&properties[k]))throw Error('RECOVERY_STOP: another pending operation needs review.');
  const s=beautyLiveRegistrationSheets_();
  beautyLiveRegistrationEvent_();
  const master=()=>beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(n=>key(n)&&n!=='MITT NAMN FINNS INTE I LISTAN');
  const names=master();
  if(names.filter(n=>key(n)===key(j.player)).length!==1)throw Error('RECOVERY_STOP: expected exactly one saved master name.');
  const responseData=beautyLiveSheetsRead_('/values/'+encodeURIComponent("'Form responses 2'!A2:F")+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
  if(!Array.isArray(responseData.values)||responseData.values.length>19999)throw Error('RECOVERY_STOP: response read incomplete.');
  const rows=responseData.values.filter(r=>key(r[2]||r[1])===key(j.player));
  if(rows.length!==1)throw Error('RECOVERY_STOP: expected exactly one saved response.');
  const r=Array.from({length:6},(_,i)=>rows[0][i]??'');
  const wall=Utilities.formatDate(new Date(j.recordedUTC),'Europe/Berlin',"yyyy-MM-dd'T'HH:mm:ss");
  const serial=(Date.parse(wall+'Z')-Date.UTC(1899,11,30))/86400000;
  if(typeof r[0]!=='number'||Math.abs(r[0]-serial)>2/86400000||r[1]!=='MITT NAMN FINNS INTE I LISTAN'||r[2]!==j.player||!['NEJ','NEJ, JAG GODKÄNNER INTE'].includes(r[3])||r[4]!=='Hub Test'||r[5]!=='HUB')throw Error('RECOVERY_STOP: saved response differs from this attempt.');
  if(beautyLiveRegistrationRows_(s.store,6).some(r=>key(r[0])===key(j.player)))throw Error('RECOVERY_STOP: status already exists; inspect before continuing.');
  const displayed=beautyLiveRegistrationRows_(s.tonight,2).filter(r=>key(r[0]||r[1])===key(j.player));
  if(displayed.length!==1)throw Error('RECOVERY_STOP: expected one Hub display row.');
  const league=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(j.player));
  if(league.length>1||(league.length===1&&!league[0].lpid))throw Error('RECOVERY_STOP: league identity is ambiguous.');
  const entries=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(j.player)||(league.length===1&&r.lpid&&String(r.lpid)===String(league[0].lpid)));
  if(entries.length)throw Error('RECOVERY_STOP: event entry already exists; inspect before continuing.');
  const form=beautyLiveRegistrationForm_();
  return {p,pending,raw,j,s,master,form,response:r,league};
}
function beautyLiveRegistrationRecoveryReview_() {
  const c=beautyLiveRegistrationRecoveryRead_();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECOVERY',result:'READY',player:c.j.player,eventDate:c.j.eventDate,savedResponseCount:1,savedMasterCount:1,statusExists:false,eventEntryExists:false,consent:'NEJ',message:c.response[4],source:'HUB',writesPerformed:false,next:'Run beautyLiveRegistrationRecoveryComplete_ to finish this exact attempt.'},null,2));
}
function beautyLiveRegistrationRecoveryComplete_() {
  beautyLiveLoginGuard_();
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('RECOVERY_STOP: Hub busy.');
  let c,started=false;
  try {
    c=beautyLiveRegistrationRecoveryRead_();
    if(c.p.getProperty(c.pending)!==c.raw)throw Error('RECOVERY_STOP: receipt changed.');
    const journal={...c.j,recoveryStartedUTC:new Date().toISOString()};
    // No response append and no master append. The new name was already saved.
    // Mark recovery before any service write, so an uncertain result cannot replay.
    const stage=value=>{journal.stage=value;c.p.setProperty(c.pending,JSON.stringify(journal));if(c.p.getProperty(c.pending)!==JSON.stringify(journal))throw Error('Receipt not saved.');};
    stage('recovery-backup-form');started=true;
    const names=c.master().sort((a,b)=>a.localeCompare(b,'sv-SE'));
    c.form.question.setChoices([...names.map(n=>c.form.question.createChoice(n,c.form.existingSection)),c.form.question.createChoice('MITT NAMN FINNS INTE I LISTAN',c.form.newSection)]);
    if(JSON.stringify(c.form.question.getChoices().map(x=>x.getValue()))!==JSON.stringify([...names,'MITT NAMN FINNS INTE I LISTAN']))throw Error('Form choices not verified.');
    const result=beautyLiveRegistrationFinish_({s:c.s,master:c.master,resolved:{isNew:false},player:journal.player,form:null,matches:[],old:undefined,status:'IN',input:{eventDate:journal.eventDate,consent:'NEJ, JAG GODKÄNNER INTE',message:c.response[4]},journal,stage,p:c.p,pending:c.pending});
    console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECOVERY',...result},null,2));
    return result;
  }catch(e){
    if(started){const latest=JSON.parse(c.p.getProperty(c.pending)||'null');if(latest)beautyLiveRegistrationFailure_(c.p,c.pending,latest,e);}
    console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECOVERY',result:started?'STOPPED_PENDING_REVIEW':'STOPPED_BEFORE_WRITES',message:String(e.message)},null,2));
    throw e;
  }finally{lock.releaseLock();}
}
