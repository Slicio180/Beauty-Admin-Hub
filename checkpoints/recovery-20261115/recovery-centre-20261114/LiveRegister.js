var BeautyLiveNameResolution_ = (() => {
  const NEW = 'MITT NAMN FINNS INTE I LISTAN';
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const key = value => clean(value).toLocaleLowerCase('sv-SE');
  const error = (code, message) => ({ success: false, code, error: message });
  function resolve(input, master, tonight) {
    const selected = clean(input.selectedName);
    const entered = clean(selected === NEW ? input.newName : selected);
    if (!entered || entered.length > 120 || /^[=+@-]/.test(entered) || /[\x00-\x1f\x7f]/.test(entered)) {
      return error('INVALID_NAME', 'Enter a valid full name.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Several player records have this name. Please ask the organiser for help.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Select your name or add a new player.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Choose who you are.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'The selected name has changed. Start again with your name.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'This name is already on the list.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Enter your middle name, nickname or another identifying detail.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'The name and identifying detail are too long.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'This name with that detail already exists. Select it if it is you, or enter a different detail.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Confirm how your name will be displayed.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'You are already registered for this event.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();
/* LIVE registration. Selected event; staff authentication or restricted player actor.
 * ScriptLock serialises Hub and paired player routes in this project.
 * A pending receipt blocks retries after any uncertain multi-service write.
 */
function beautyLiveRegistrationSetup_() {
  beautyLiveLoginGuard_();
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/script.external_request', 'https://www.googleapis.com/auth/forms']);
  beautyLiveRegistrationSheets_();
  beautyLiveRegistrationForm_();
  beautyLiveRegistrationEvent_();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_SETUP',result:'READY_FOR_REGISTRATION_REVIEW',writesPerformed:false}));
}
function beautyLiveRegistrationReview_() {
  beautyLiveLoginGuard_();
  const p=PropertiesService.getScriptProperties();
  console.log(JSON.stringify({check:'LIVE_REGISTRATION_RECEIPT',pending:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_PENDING')||'null'),last:JSON.parse(p.getProperty('BEAUTY_LIVE_REGISTRATION_LAST')||'null')},null,2));
}
function beautyLiveRegistrationKey_(v) { return String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'); }
function beautyLiveRegistrationRows_(sheet, width) {
  // Read through the same service used for RAW appends; do not reuse getLastRow caches.
  if(!Number.isInteger(width)||width<1||width>6)throw Error('Invalid read width.');
  SpreadsheetApp.flush();
  const name=sheet.getName();
  if(!["PLAYER'S MASTER LIST",'PLAYER STATUS DATA',"TONIGHT'S PLAYERS",'Form responses 2'].includes(name))throw Error('Unexpected registration sheet.');
  const range="'"+name.replace(/'/g,"''")+"'!A2:"+String.fromCharCode(64+width);
  const data=beautyLiveSheetsRead_('/values/'+encodeURIComponent(range)+'?valueRenderOption=FORMATTED_VALUE',name==="PLAYER'S MASTER LIST");
  if(data.values!==undefined&&!Array.isArray(data.values))throw Error('Incomplete sheet read.');
  const rows=data.values||[];
  if(rows.length>19999||rows.some(r=>!Array.isArray(r)||r.length>width))throw Error('Sheet exceeds reviewed size.');
  return rows.map(r=>Array.from({length:width},(_,i)=>String(r[i]??'')));
}
function beautyLiveRegistrationSheets_() {
  const ss=SpreadsheetApp.openById(beautyLiveTarget_().sheetId);
  if(ss.getId()!==beautyLiveTarget_().sheetId)throw Error('Wrong sheet.');
  const out={};
  for(const [key,name] of Object.entries({control:'Control',master:"PLAYER'S MASTER LIST",responses:'Form responses 2',store:'PLAYER STATUS DATA',tonight:"TONIGHT'S PLAYERS"})){
    out[key]=(key==='master'?SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId):ss).getSheetByName(name);if(!out[key])throw Error('Required sheet missing.');
  }
  const date=out.control.getRange('A2').getValue();
  if(!(date instanceof Date)||Utilities.formatDate(date,'Europe/Stockholm','yyyy-MM-dd')!==beautyLiveTarget_().date)throw Error('Event date changed.');
  const heads=out.store.getRange(1,1,1,6).getDisplayValues()[0];
  if(heads[0]!=='PLAYER'||heads[1]!=='OLD NAME'||heads[2]!=='STATUS'||heads[3]!=='FOTO&VIDEO'||heads[4]!=='MEDDELANDE'||heads[5]!=='WHERE FROM')throw Error('Status layout changed.');
  if(out.tonight.getRange(2,3,99,1).getFormulas().some(r=>r[0]))throw Error('Status formulas found.');
  const names=beautyLiveRegistrationRows_(out.tonight,2);
  if(names.slice(99).some(r=>r.some(Boolean)))throw Error('Registration display capacity reached.');
  return out;
}
function beautyLiveRegistrationApi_(path, payload) {
  beautyLiveLoginGuard_();beautyContextAssert_();
  if(payload){if(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_LEASE_)&&!beautyQueueWorker_)throw Error("A registration worker is active.");const t=beautyLiveTarget_();if(payload.tdid!==undefined&&payload.tdid!==t.eventId||payload.lgid!==undefined&&(t.mode!=='league'||payload.lgid!==t.leagueId))throw Error('Wrong event write target.');}
  const p=PropertiesService.getScriptProperties(),user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');
  if(!user||!password)throw Error('Nakka credentials missing.');
  const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/'+path,{
    method:payload?'post':'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},
    ...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{}),muteHttpExceptions:true,followRedirects:false
  });
  if(response.getResponseCode()!==200)throw Error('Nakka request failed.');
  const data=JSON.parse(response.getContentText());if(data.result!==0)throw Error('Nakka did not confirm request.');return data;
}
function beautyLiveRegistrationEvent_() {
  const t=beautyLiveTarget_(),e=beautyLiveRegistrationApi_('tournament/get?tdid='+t.eventId).tournament;
  if(!e||e.tdid!==t.eventId||(e.lgid||'')!==t.leagueId||e.team_games!==0||![10,20,25].includes(e.status)||!Number.isFinite(e.t_date)||Utilities.formatDate(new Date(e.t_date*1000),'Europe/Stockholm','yyyy-MM-dd')!==t.date)throw Error('Nakka event is not open for registration.');
}
function beautyLiveRegistrationList_(kind) {
  if(kind==='league'&&beautyContextStandalone_())return [];
  const t=beautyLiveTarget_(),data=beautyLiveRegistrationApi_(kind==='league'?'league/entry/list?lgid='+t.leagueId:'tournament/entry/list?tdid='+t.eventId);
  if(!Array.isArray(data.list))throw Error('Incomplete Nakka list.');return data.list;
}
function beautyLiveRegistrationForm_() {
  const form=FormApp.openById('1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ');
  const questions=[];
  for(const [type,cast] of [[FormApp.ItemType.LIST,'asListItem'],[FormApp.ItemType.MULTIPLE_CHOICE,'asMultipleChoiceItem']]){
    for(const item of form.getItems(type)){const q=item[cast]();if(q.getTitle().trim()==='VÄLJ DITT NAMN')questions.push(q);}
  }
  const sections=form.getItems(FormApp.ItemType.PAGE_BREAK);
  if(questions.length!==1||sections.length<2)throw Error('Backup form layout changed.');
  return {question:questions[0],newSection:sections[0].asPageBreakItem(),existingSection:sections[1].asPageBreakItem()};
}
function beautyLiveRegistrationAppend_(range,values) {
  // RAW avoids interpreting a name/message as a spreadsheet formula.
  const r=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+(range==="'PLAYER''S MASTER LIST'!A:A"?BEAUTY_LIVE_BASE_.sheetId:beautyLiveTarget_().sheetId)+'/values/'+encodeURIComponent(range)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{
    method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:[values]}),muteHttpExceptions:true,followRedirects:false
  });
  if(r.getResponseCode()!==200)throw Error('Sheet append response uncertain.');
  const data=JSON.parse(r.getContentText());if(data.updates?.updatedRows!==1)throw Error('Sheet append not confirmed.');
}
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
function beautyLiveRegister_(input,token){return beautyQueueAccept_(input,token);}
function beautyLiveRegisterLegacy_(input,token) {
  beautyLiveLoginGuard_();const user=typeof beautyLiveRegistrationActor_==='function'?beautyLiveRegistrationActor_(token):beautyHubAuthRequire_(token),source=user.source||'HUB',key=beautyLiveRegistrationKey_;
  const fail=(code,error)=>({success:false,code,error});
  const allowed=['eventDate','selectedName','newName','consent','message','identityChoice','identityBase','identityDetail','identityConfirmedName'];
  if(!input||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k))||Object.values(input).some(v=>typeof v!=='string')||input.eventDate!==beautyLiveTarget_().date||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000)return fail('INVALID','Check registration fields.');
  input={...input};
  if(input.selectedName==='MITT NAMN FINNS INTE I LISTAN'&&!input.identityChoice)input.newName=String(input.newName||'').toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
  const timingStart=Date.now(),timings={};const measure=(phase,fn)=>{const started=Date.now();try{return fn();}finally{timings[phase]=(timings[phase]||0)+Date.now()-started;}};
  const lock=LockService.getScriptLock();if(!measure('lockWait',()=>lock.tryLock(5000)))return fail('BUSY','Another Hub operation is running.');
  const p=PropertiesService.getScriptProperties(),pending='BEAUTY_LIVE_REGISTRATION_PENDING';let attempted=false,journal;
  try {
    beautyContextAssert_();
    if(p.getProperty(pending)||p.getProperty('BEAUTY_LIVE_STATUS_PENDING')||p.getProperty('BEAUTY_LIVE_REMOVE_PENDING'))return fail('REGISTRATION_REVIEW_REQUIRED','A previous save needs review. Do not repeat registration.');
    const s=measure('sheetValidation',()=>beautyLiveRegistrationSheets_()),master=()=>measure('masterRead',()=>beautyLiveRegistrationRows_(s.master,1).map(r=>r[0]).filter(n=>key(n)&&n!=='MITT NAMN FINNS INTE I LISTAN'));
    const tonight=()=>measure('tonightRead',()=>beautyLiveRegistrationRows_(s.tonight,2).map(r=>r[0]||r[1]).filter(Boolean));
    if(tonight().length>=99)throw Error('Registration display capacity reached.');
    const resolved=BeautyLiveNameResolution_.resolve(input,master(),tonight());if(!resolved.success){timings.outcome=resolved.code;return resolved;}
    const player=resolved.player;
    if(/^[=+@-]/.test((input.message||'').trim()))return fail('INVALID','Start the message with ordinary text.');
    beautyLiveRegistrationEvent_();
    const league=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    const entries=beautyLiveRegistrationList_('event').filter(r=>key(r.name)===key(player)||(league.length===1&&r.lpid&&String(r.lpid)===String(league[0].lpid)));
    if(league.length>1||entries.length>1)return fail('AMBIGUOUS_NAME','Duplicate Nakka identities need review.');
    if(league.length===1&&!league[0].lpid)throw Error('League identity missing.');
    if(!beautyContextStandalone_()&&entries.length&&(!league.length||key(entries[0].name)!==key(player)||(entries[0].lpid&&String(entries[0].lpid)!==String(league[0].lpid))))return fail('AMBIGUOUS_NAME','Nakka player identity needs review.');
    const rows=beautyLiveRegistrationRows_(s.store,6),matches=rows.map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(matches.length>1)return fail('AMBIGUOUS_NAME','Duplicate status identities need review.');
    const old=matches[0];if(old&&s.store.getRange(old.row,1,1,6).getFormulas()[0].some(Boolean))throw Error('Formula in source record.');
    const status=old?.r[2]||'IN';if(!['IN','OUT','STANDBY'].includes(status))throw Error('Unexpected status.');
    const form=resolved.isNew?beautyLiveRegistrationForm_():null;
    beautyLiveRegistrationSheets_();
    const again=BeautyLiveNameResolution_.resolve(input,master(),tonight());
    if(!again.success||again.player!==player||again.isNew!==resolved.isNew)return fail('STALE_IDENTITY','Player list changed. Reload.');
    journal={state:'ATTEMPTED',stage:'response',uid:user.uid,source,eventId:beautyLiveTarget_().eventId,player,eventDate:input.eventDate,recordedUTC:new Date().toISOString()};
    const stage=value=>{journal.stage=value;p.setProperty(pending,JSON.stringify(journal));if(p.getProperty(pending)!==JSON.stringify(journal))throw Error('Receipt not saved.');};
    stage('response');attempted=true;
    // Native timestamp serial (same date basis as spreadsheet's Europe/Berlin zone).
    const wall=Utilities.formatDate(new Date(),'Europe/Berlin',"yyyy-MM-dd'T'HH:mm:ss");
    const serial=(Date.parse(wall+'Z')-Date.UTC(1899,11,30))/86400000;
    beautyLiveRegistrationAppend_("'Form responses 2'!A:F",[serial,resolved.isNew?'MITT NAMN FINNS INTE I LISTAN':player,resolved.isNew?player:'',input.consent,input.message||'',source]);
    return beautyLiveRegistrationFinish_({source,s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending});
  }catch(e){if(attempted&&journal)beautyLiveRegistrationFailure_(p,pending,journal,e);return fail(attempted?'REGISTRATION_UNCERTAIN':'REGISTRATION_CHECK_FAILED',attempted?'Registration may be partly saved. Do not submit again. Review the saved registration receipt.':'Registration checks failed. No registration write was attempted.');}
  finally{lock.releaseLock();try{console.log(JSON.stringify({kind:'BEAUTY_REGISTRATION_TIMING',source,choice:input.identityChoice?'confirmed':'initial',elapsedMs:Date.now()-timingStart,phases:timings}));}catch(ignored){}}
}

function beautyLiveRegistrationFailure_(p,pending,journal,error) {
  // Keep the original attempted stage; never clear a receipt on a failed write.
  const known=['Master readback failed.','Sheet append response uncertain.','Sheet append not confirmed.','Form choices not verified.','Status record changed during registration.','Tonight display could not be verified.','League write not verified.','Event entry not verified.','Registration readback failed.'];
  const detail=known.includes(String(error.message))?String(error.message):'Service or verification failure; inspect execution.';
  try{p.setProperty(pending,JSON.stringify({...journal,failure:detail,failedUTC:new Date().toISOString()}));}catch(ignored){}
}
function beautyLiveRegistrationFinish_(c) {
  const {s,master,resolved,player,form,matches,old,status,input,journal,stage,p,pending}=c;
  const key=beautyLiveRegistrationKey_,source=c.source||'HUB';
    if(resolved.isNew){
      stage('master');
      if(!master().some(n=>key(n)===key(player)))beautyLiveRegistrationAppend_("'PLAYER''S MASTER LIST'!A:A",[player]);
      if(master().filter(n=>key(n)===key(player)).length!==1)throw Error('Master readback failed.');
      // Append preserves concurrent names; sort choices without clearing the master.
      stage('backup-form');
      const names=master().sort((a,b)=>a.localeCompare(b,'sv-SE'));
      form.question.setChoices([...names.map(n=>form.question.createChoice(n,form.existingSection)),form.question.createChoice('MITT NAMN FINNS INTE I LISTAN',form.newSection)]);
      if(JSON.stringify(form.question.getChoices().map(c=>c.getValue()))!==JSON.stringify([...names,'MITT NAMN FINNS INTE I LISTAN']))throw Error('Form choices not verified.');
    }
    stage('status');
    const fresh=beautyLiveRegistrationRows_(s.store,6).map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
    if(JSON.stringify(fresh)!==JSON.stringify(matches))throw Error('Status record changed during registration.');
    const consent=input.consent==='JA, JAG GODKÄNNER'?'JA':'NEJ';
    if(old)s.store.getRange(old.row,3,1,4).setValues([[status,consent,input.message||'',source]]);
    else beautyLiveRegistrationAppend_("'PLAYER STATUS DATA'!A:F",[player,'',status,consent,input.message||'',source]);
    stage('display');beautyLiveRegistrationSync_(s,player);
    stage('nakka');beautyLiveRegistrationSheets_();beautyLiveRegistrationEvent_();
    let members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));
    if(members.length>1)throw Error('Ambiguous league identity.');
    if(!members.length&&!beautyContextStandalone_()){beautyLiveRegistrationApi_('league/entry/update',{lgid:beautyLiveTarget_().leagueId,add:[{name:player}]});members=beautyLiveRegistrationList_('league').filter(r=>key(r.name)===key(player));}
    if(beautyContextStandalone_())members=[{name:player,lpid:''}];
    if(members.length!==1||!beautyContextStandalone_()&&!members[0].lpid)throw Error('League write not verified.');
    const matchingEntry=r=>key(r.name)===key(player)||(r.lpid&&String(r.lpid)===String(members[0].lpid));
    journal.leaguePlayerId=members[0].lpid;stage('nakka-event');
    let eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);
    if(!eventPlayers.length){beautyLiveRegistrationEvent_();beautyLiveRegistrationApi_('tournament/entry/update',{tdid:beautyLiveTarget_().eventId,add:[{name:player,...(beautyContextStandalone_()?{}:{lpid:members[0].lpid})}]});eventPlayers=beautyLiveRegistrationList_('event').filter(matchingEntry);}
    if(eventPlayers.length!==1||key(eventPlayers[0].name)!==key(player)||!eventPlayers[0].tpid||(!beautyContextStandalone_()&&eventPlayers[0].lpid&&String(eventPlayers[0].lpid)!==String(members[0].lpid)))throw Error('Event entry not verified.');
    const leagueLinkVerified=!!eventPlayers[0].lpid;
    journal.eventEntryId=eventPlayers[0].tpid;journal.leagueLinkVerified=leagueLinkVerified;
    stage('readback');beautyLiveRegistrationSheets_();
    const result=beautyLiveDashboardRead_(),found=result.players.filter(r=>key(r.player||r.newPlayer)===key(player));
    const final=beautyLiveRegistrationRows_(s.store,6).filter(r=>key(r[0])===key(player));
    if(found.length!==1||final.length!==1||final[0][1]!== (old?.r[1]||'')||final[0][2]!==status||final[0][3]!==consent||final[0][4]!== (input.message||'')||final[0][5]!==source||found[0].status!==status||found[0].consent!==consent||found[0].message!==(input.message||'')||found[0].whereFrom!==source)throw Error('Registration readback failed.');
    p.setProperty('BEAUTY_LIVE_REGISTRATION_LAST',JSON.stringify({...journal,state:'VERIFIED',verifiedUTC:new Date().toISOString()}));p.deleteProperty(pending);
    if(p.getProperty(pending)!==null)throw Error('Receipt clear failed.');
    return {success:true,player,registrationEventDate:input.eventDate,readbackVerified:true,nakka:{entryConfirmed:true,leagueLinkVerified,message:beautyContextStandalone_()?'Nakka tournament entry verified.':leagueLinkVerified?'Nakka entry verified.':'Nakka entry verified. Its readback does not expose the league link.'}};
}
