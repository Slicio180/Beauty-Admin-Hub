
/* Shared, pure name-conflict rules. No service access and no writes. */
var BeautyRegistrationIdentity_ = (() => {
  const NEW = 'MITT NAMN FINNS INTE I LISTAN';
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const key = value => clean(value).toLocaleLowerCase('sv-SE');
  const error = (code, message) => ({ success: false, code, error: message });
  function resolve(input, master, tonight) {
    const selected = clean(input.selectedName);
    const entered = clean(selected === NEW ? input.newName : selected);
    if (!entered || entered.length > 120 || /^[=+@-]/.test(entered) || /[\x00-\x1f\x7f]/.test(entered)) {
      return error('INVALID_NAME', 'Skriv ett giltigt fullständigt namn.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Flera spelarposter har samma namn. Be arrangören om hjälp.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Välj ditt namn i listan eller lägg till en ny spelare.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Välj vem du är.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'Namnvalet har ändrats. Börja om med ditt namn.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'Det här namnet finns redan i listan.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Skriv ditt mellannamn, smeknamn eller en annan uppgift.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'Namnet och tillägget är för långt.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'Det namnet med tillägg finns redan. Välj det i spelarlistan om det är du, eller ange ett annat tillägg.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Bekräfta hur ditt namn ska visas.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'Du är redan anmäld till den här spelkvällen.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();

/* All public saves enter here before any Sheet, status, master or Nakka write.
 * This lock is shared with this project's Nakka helper via invocation state.
 * It cannot serialize other Apps Script projects. Their later sequential calls
 * are detected from source response rows, not a potentially stale display. */
var beautyRegistrationLockHeld_=false;
function beautyPrevious_submitRegistration_(input){return beautyRegistrationGuard_('MOBIL',input);}
function beautyPrevious_submitKioskRegistration_(input){return beautyRegistrationGuard_('KIOSK',input);}
function beautyRegistrationGuard_(source,input){
  const fail=(code,error)=>({success:false,code,error});
  const allowed=['selectedName','newName','consent','message','source','eventDate','identityChoice','identityBase','identityDetail','identityConfirmedName'];
  if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).some(k=>!allowed.includes(k))||Object.values(input).some(v=>typeof v!=='string')||!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(input.consent)||(input.message||'').length>2000||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.eventDate||''))return fail('INVALID','Kontrollera uppgifterna och ladda om sidan.');
  if(beautyRegistrationLockHeld_)return fail('BUSY','En annan åtgärd pågår.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return fail('BUSY','En annan anmälan pågår. Vänta och kontrollera spelarlistan.');
  let attempted=false;
  try{
    const ss=SpreadsheetApp.openById(SHEET_ID),control=ss.getSheetByName('Control'),master=ss.getSheetByName(MASTER_SHEET),responses=ss.getSheetByName(RESPONSE_SHEET);
    if(!control||!master||!responses)throw Error('Required sheet missing.');
    const zone=Session.getScriptTimeZone();
    const bounds=()=>{
      const values=control.getRange('A2:B2').getValues()[0];
      if(values.length!==2||values.some(v=>!(v instanceof Date)||!Number.isFinite(v.getTime())))throw Error('Invalid registration window.');
      const date=Utilities.formatDate(values[0],zone,'yyyy-MM-dd');
      if(Utilities.formatDate(values[1],zone,'yyyy-MM-dd')>date)throw Error('Invalid reset date.');
      return {date,start:values[1].getTime()};
    };
    const window=bounds();
    if(window.date!==input.eventDate)return fail('STALE_EVENT','Speldatumet har ändrats. Ladda om sidan. Ingen anmälan sparades.');
    function rows(sheet,width){const count=sheet.getLastRow();if(count>20000)throw Error('Sheet exceeds reviewed size.');return count<2?[]:sheet.getRange(2,1,count-1,width).getValues();}
    const names=rows(master,1).map(r=>String(r[0]||'')).filter(n=>BeautyRegistrationIdentity_.key(n)&&n!==NEW_PLAYER_OPTION);
    const current=[];
    for(const row of rows(responses,3)){
      // Hub removal deliberately clears B/C and retains the timestamp.
      if(!BeautyRegistrationIdentity_.key(row[1])&&!BeautyRegistrationIdentity_.key(row[2]))continue;
      if(!(row[0] instanceof Date)||!Number.isFinite(row[0].getTime()))throw Error('Invalid source timestamp.');
      if(row[0].getTime()<window.start||Utilities.formatDate(row[0],zone,'yyyy-MM-dd')>window.date)continue;
      const name=String(row[1]===NEW_PLAYER_OPTION?row[2]:row[1]||'');
      if(!BeautyRegistrationIdentity_.key(name))throw Error('Missing source name.');
      current.push(name);
    }
    const candidate={...input};
    if(candidate.selectedName===NEW_PLAYER_OPTION&&!candidate.identityChoice)candidate.newName=String(candidate.newName||'').toLocaleLowerCase('sv-SE').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('sv-SE'));
    const resolved=BeautyRegistrationIdentity_.resolve(candidate,names,current);
    if(!resolved.success)return resolved;
    // A response whose master row disappeared still must not be registered again.
    if(current.some(n=>BeautyRegistrationIdentity_.key(n)===BeautyRegistrationIdentity_.key(resolved.player)))return fail('ALREADY_REGISTERED','Du är redan anmäld till den här spelkvällen. Dina sparade uppgifter har inte ändrats.');
    if(/^[=+@-]/.test((input.message||'').trim()))return fail('INVALID','Börja meddelandet med vanlig text.');
    if(JSON.stringify(bounds())!==JSON.stringify(window))return fail('STALE_EVENT','Speldatumet har ändrats. Ladda om sidan.');
    const properties=PropertiesService.getScriptProperties(),pending='BEAUTY_PUBLIC_REGISTRATION_PENDING';
    if(properties.getProperty(pending))return fail('SAVE_UNCERTAIN','En tidigare anmälan behöver kontrolleras av arrangören. Ingen ny anmälan sparades.');
    const receipt=JSON.stringify({state:'ATTEMPTED',player:resolved.player,eventDate:window.date,source,recordedUTC:new Date().toISOString()});
    properties.setProperty(pending,receipt);if(properties.getProperty(pending)!==receipt)throw Error('Receipt not saved.');
    beautyRegistrationLockHeld_=true;attempted=true;
    const saved=beautyRegistrationSave_({selectedName:resolved.isNew?NEW_PLAYER_OPTION:resolved.player,newName:resolved.isNew?resolved.player:'',consent:input.consent,message:input.message||'',source});
    if(!saved||saved.success!==true)throw Error('Save not confirmed.');
    properties.deleteProperty(pending);
    return saved;
  }catch(e){return fail(attempted?'SAVE_UNCERTAIN':'READ_FAILED',attempted?'Anmälan kan vara delvis sparad. Anmäl dig inte igen. Be arrangören kontrollera.':'Uppgifterna kunde inte kontrolleras. Ingen anmälan sparades.');}
  finally{beautyRegistrationLockHeld_=false;lock.releaseLock();}
}
