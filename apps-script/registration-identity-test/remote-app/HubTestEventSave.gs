/* Bounded event transition for the owner-only Identity TEST project. */
const BEAUTY_HUB_EVENT_WRITES_ENABLED_ = true;
function beautyHubEventKey_(v) { return String(v || '').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE'); }
function beautyHubEventDateValid_(v) {
  return typeof v === 'string' && /^20\d\d-\d\d-\d\d$/.test(v) &&
    !isNaN(Date.parse(v+'T12:00:00Z')) && new Date(v+'T12:00:00Z').toISOString().slice(0,10) === v;
}
function beautyHubEventSnapshot_(ss) {
  if(ss.getId()!==SHEET_ID || ss.getSpreadsheetTimeZone()!=='Europe/Berlin' || ss.getSpreadsheetLocale()!=='en_GB')throw Error('LAYOUT');
  const titles=['Control','PLAYER STATUS DATA',"TONIGHT'S PLAYERS","PLAYER'S MASTER LIST",'Form responses 2'];
  const widths=[2,6,6,1,6], limits=[10,1000,1000,10000,10000];
  const expected=[['START DATE','LAST RESET'],['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE'],['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['PLAYERS'],['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM']];
  const result={};
  titles.forEach((title,i)=>{
    const sheet=ss.getSheetByName(title);if(!sheet || sheet.getLastRow()>limits[i] || sheet.getLastColumn()>widths[i])throw Error('LAYOUT');
    const rows=['PLAYER STATUS DATA',"TONIGHT'S PLAYERS"].includes(title)?Math.min(1000,sheet.getMaxRows()):Math.max(2,sheet.getLastRow());
    if(rows<2 || (title==="TONIGHT'S PLAYERS" && rows<100))throw Error('LAYOUT');
    const range=sheet.getRange(1,1,rows,widths[i]);
    const values=range.getValues(),display=range.getDisplayValues(),formulas=range.getFormulas(),formats=range.getNumberFormats();
    if(JSON.stringify(display[0].slice(0,expected[i].length))!==JSON.stringify(expected[i]))throw Error('LAYOUT');
    result[title]={values,display,formulas,formats,id:sheet.getSheetId()};
  });
  if(result.Control.formulas[1].some(Boolean)||result['PLAYER STATUS DATA'].formulas.some(r=>r.some(Boolean)))throw Error('FORMULA');
  if(result["TONIGHT'S PLAYERS"].formulas.slice(1).some(r=>r[2]))throw Error('FORMULA');
  // The real workbook historically filtered from LAST RESET (B2), which
  // excludes registrations already made earlier on the selected event day.
  // Require the reviewed day-based spill formula before any backup or reset.
  if(result["TONIGHT'S PLAYERS"].formulas[1][0] !== "=IFERROR(SORT(UNIQUE(FILTER({IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,'Form responses 2'!B2:B),IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,\"\")},IF('Form responses 2'!B2:B=\"MITT NAMN FINNS INTE I LISTAN\",'Form responses 2'!C2:C,'Form responses 2'!B2:B)<>\"\",'Form responses 2'!A2:A>=Control!A2,'Form responses 2'!A2:A<Control!A2+1)),1,TRUE),\"\")")throw Error('DATE_FILTER');
  return result;
}
function beautyHubEventPlan_(snap,date,zone) {
  const correction=new Map(),kept=[],names=new Set();
  for(const row of snap['PLAYER STATUS DATA'].display.slice(1)){
    const name=String(row[0]||'').trim(),old=String(row[1]||'').trim();
    if(!name)continue;
    const key=beautyHubEventKey_(name);if(names.has(key))throw Error('AMBIGUOUS');names.add(key);
    if(old){const prior=beautyHubEventKey_(old);if(correction.has(prior))throw Error('AMBIGUOUS');correction.set(prior,name);kept.push([name,old,'','','','']);}
  }
  const targets=[],seen=new Set();
  for(const row of snap['Form responses 2'].values.slice(1)){
    if(row.every(v=>v===''||v===null))continue;
    if(!(row[0] instanceof Date)||isNaN(row[0].getTime()))throw Error('TIMESTAMP');
    if(Utilities.formatDate(row[0],zone,'yyyy-MM-dd')!==date)continue;
    const raw=String(row[1]||'').trim();let name=raw==='MITT NAMN FINNS INTE I LISTAN'?String(row[2]||'').trim():raw;
    name=correction.get(beautyHubEventKey_(name))||name;
    const key=beautyHubEventKey_(name);if(!key||seen.has(key))throw Error('AMBIGUOUS');seen.add(key);
    const consent=row[3]==='JA, JAG GODKÄNNER'?'JA':row[3]==='NEJ, JAG GODKÄNNER INTE'?'NEJ':String(row[3]||'').trim();
    if(!['JA','NEJ'].includes(consent))throw Error('CONSENT');
    const message=String(row[4]||''),source=String(row[5]||'');
    const old=snap['PLAYER STATUS DATA'].display.slice(1).find(r=>beautyHubEventKey_(r[0])===key);
    // Preserve a pre-registered player's manual status only when all event metadata agrees.
    const status=old&&old[3]===consent&&old[4]===message&&old[5]===source&&['IN','OUT','STANDBY'].includes(old[2])?old[2]:'IN';
    const entry=[name,'',status,consent,message,source];targets.push(entry);
    const retained=kept.find(r=>beautyHubEventKey_(r[0])===key);
    if(retained)retained.splice(2,4,...entry.slice(2));else kept.push(entry);
  }
  if(targets.length>99 || kept.length>999)throw Error('LIMIT');
  if(kept.length+1>snap['PLAYER STATUS DATA'].values.length)throw Error('LIMIT');
  return {rows:kept,targets};
}
function beautyHubEventVersion_(snap,date) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify({snap,date}))).replace(/=+$/,'');
}
function beautyHubTestEventTransition_(action,input) {
  beautyHubTestGuard_();
  const fail=(code,error,backup)=>({success:false,code,error,...(backup?{backup}: {})});
  const required=action==='prepare'?'date,expectedDate':'confirmed,date,expectedDate,version';
  if(!input||Array.isArray(input)||Object.keys(input).sort().join(',')!==required || !beautyHubEventDateValid_(input.date)||!beautyHubEventDateValid_(input.expectedDate) ||
    (action==='save'&&(input.confirmed!=='true'||typeof input.version!=='string'||!/^[\w-]{43}$/.test(input.version))))return fail('INVALID','Invalid event change. Reload and review again.');
  if(BEAUTY_HUB_EVENT_WRITES_ENABLED_!==true||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)return fail('BLOCKED','Event saving is disabled in TEST.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','Another TEST operation is running.');
  let attempted=false,backup=null;
  try{
    beautyHubAuthRequire_(beautyHubRequestToken_);
    const ss=SpreadsheetApp.openById(SHEET_ID),zone=ss.getSpreadsheetTimeZone();
    const snap=beautyHubEventSnapshot_(ss),current=snap.Control.values[1][0];
    if(!(current instanceof Date)||Utilities.formatDate(current,zone,'yyyy-MM-dd')!==input.expectedDate)return fail('STALE_EVENT','The event date changed. Reload and review again.');
    if(input.date===input.expectedDate)return fail('INVALID','Choose a different event date.');
    const plan=beautyHubEventPlan_(snap,input.date,zone),version=beautyHubEventVersion_(snap,input.date);
    if(action==='prepare')return {success:true,mode:'test',version,eventDate:input.expectedDate,newDate:input.date,
      targetPlayers:plan.targets.length,retainedCorrections:plan.rows.filter(r=>r[1]).length,backupRequired:true};
    if(input.version!==version)return fail('STALE_EVENT','Event data changed since review. Reload and review again.');
    // Spreadsheet-scoped backup; no Drive access or production destination.
    const stamp=Utilities.formatDate(new Date(),zone,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,8);
    backup={prefix:'BKP-'+stamp,sheets:[]};
    Object.keys(snap).forEach((title,i)=>{
      const copy=ss.getSheetByName(title).copyTo(ss).setName(backup.prefix+'-'+i);
      backup.sheets.push({source:title,id:copy.getSheetId(),name:copy.getName()});
    });
    // Preserve an immutable typed snapshot too: copied formulas may recalculate.
    const archive=ss.insertSheet(backup.prefix+'-SNAPSHOT');
    const serialized=JSON.stringify({snapshot:snap,plan,from:input.expectedDate,to:input.date,recordedUTC:new Date().toISOString()});
    const chunks=serialized.match(/[\s\S]{1,30000}/g);archive.getRange(1,1,chunks.length,1).setValues(chunks.map(c=>["'"+c]));
    backup.snapshotSheet=archive.getName();
    if(beautyHubEventVersion_(beautyHubEventSnapshot_(ss),input.date)!==version)return fail('STALE_EVENT','Data changed during backup. No event change attempted.',backup);
    const store=ss.getSheetByName('PLAYER STATUS DATA'),tonight=ss.getSheetByName("TONIGHT'S PLAYERS"),control=ss.getSheetByName('Control');
    beautyHubAuthRequire_(beautyHubRequestToken_);
    attempted=true;
    // Plain text writes prevent messages/names starting '=' from becoming formulas.
    store.getRange(2,1,snap['PLAYER STATUS DATA'].values.length-1,6).clearContent();
    if(plan.rows.length)store.getRange(2,1,plan.rows.length,6).setValues(plan.rows.map(r=>r.map(v=>typeof v==='string'&&v.startsWith('=')?"'"+v:v)));
    tonight.getRange(2,3,99,1).clearContent();
    control.getRange('A2').setValue(Utilities.parseDate(input.date,zone,'yyyy-MM-dd'));
    control.getRange('B2').setValue(new Date());SpreadsheetApp.flush();
    // New membership is formula-derived; only C cells may be rebuilt.
    const targets=new Map(plan.targets.map(r=>[beautyHubEventKey_(r[0]),r]));
    let display, found;
    for(let attempt=0;attempt<5;attempt++) {
      display=tonight.getRange(2,1,99,6).getDisplayValues();found=new Set();let matches=true;
      for(const row of display){const key=beautyHubEventKey_(row[0]||row[1]);if(!key)continue;if(found.has(key)||!targets.has(key)){matches=false;break;}found.add(key);}
      if(matches&&found.size===targets.size)break;
      if(attempt===4)throw Error('MEMBERSHIP');
      Utilities.sleep(250); // Read-only recalculation polling; no mutation retry.
    }
    display.forEach((r,i)=>{const key=beautyHubEventKey_(r[0]||r[1]);if(key)tonight.getRange(i+2,3).setValue(targets.get(key)[2]);});
    if(found.size!==targets.size)throw Error('MEMBERSHIP');SpreadsheetApp.flush();
    const verify=()=>{
      const after=beautyHubEventSnapshot_(ss);
      for(const title of ["PLAYER'S MASTER LIST",'Form responses 2'])if(JSON.stringify(after[title])!==JSON.stringify(snap[title]))throw Error('PRESERVATION');
      for(const title of Object.keys(snap)){
        if(JSON.stringify(after[title].formulas)!==JSON.stringify(snap[title].formulas)||JSON.stringify(after[title].formats)!==JSON.stringify(snap[title].formats))throw Error('FORMULA_OR_FORMAT');
      }
      const stored=after['PLAYER STATUS DATA'].display.slice(1).filter(r=>r.some(Boolean));
      if(JSON.stringify(stored)!==JSON.stringify(plan.rows))throw Error('STORE');
      const data=getBeautyHubData_();if(data.eventDate!==input.date||data.players.length!==targets.size)throw Error('HUB');
      for(const p of data.players){const wanted=targets.get(beautyHubEventKey_(p.player||p.newPlayer));if(!wanted||p.status!==wanted[2]||p.consent!==wanted[3]||p.message!==wanted[4].trim()||p.whereFrom!==wanted[5].trim())throw Error('HUB_DATA');}
      return data;
    };
    verify();const data=verify();
    return {success:true,mode:'test',readbackVerified:true,changed:true,eventDate:input.date,backup,data};
  }catch(error){return fail(attempted?'SAVE_UNCERTAIN':'READ_FAILED',attempted?'Event save could not be fully verified. Do not retry. Inspect TEST sheets and backup.':'Event review failed. Check dates, headers, formulas or duplicate registrations before trying again.',backup);}
  finally{lock.releaseLock();}
}
