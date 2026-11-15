/* Shared LIVE player routes. The Hub, kiosk and mobile use one event context
 * and one ScriptLock. Public input cannot obtain staff privileges.
 */
var beautyLivePlayerCall_=null;
function beautyLiveRegistrationActor_(token){
 if(!beautyLivePlayerCall_)return {...beautyHubAuthRequire_(token),source:'HUB'};
 const c=beautyLivePlayerCall_;
 if(token!==undefined||!['KIOSK','MOBIL'].includes(c.source)||c.revision!==beautyContextToken_()||Date.now()>=c.expires||!/^[a-f0-9]{32}$/.test(c.nonce))throw Error('Invalid player registration context.');
 return {uid:'player:'+c.source,source:c.source};
}
function getLiveRegistrationContext(){
 beautyLiveLoginGuard_();
 const c=beautyLiveTarget_(),checked=beautyLiveEventRead_();
 const names=beautyLiveRegistrationRows_(SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName("PLAYER'S MASTER LIST"),1).map(r=>r[0]).filter(n=>n&&n!=='MITT NAMN FINNS INTE I LISTAN').sort((a,b)=>a.localeCompare(b,'sv-SE'));
 if(names.length>10000||names.some(n=>n.length>120))throw Error('Player list needs review.');
 beautyContextAssert_();return {success:true,names,eventId:c.eventId,eventDate:c.date,eventTitle:checked.event.title,eventContext:c.revision,brand:beautyLiveBrand_()};
}
function getRegistrationDisplayContext(){
 beautyLiveLoginGuard_();const c=beautyLiveTarget_(),checked=beautyLiveEventRead_();beautyContextAssert_();
 return {success:true,eventId:c.eventId,eventDate:c.date,eventTitle:checked.event.title,eventContext:c.revision,brand:beautyLiveBrand_()};
}
function getTonightsPlayerNames(revision){
 beautyLiveLoginGuard_();if(typeof revision!=='string'||revision!==beautyContextToken_())throw Error('Tävlingen har ändrats. Ladda om sidan.');
 const names=beautyCastRoster_().players.map(p=>p.name);beautyContextAssert_();return names;
}
function beautyLivePlayerSubmit_(source,input){
 beautyLiveLoginGuard_();
 try{
  if(beautyLivePlayerCall_||!['KIOSK','MOBIL'].includes(source)||!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid registration.');
  const c=beautyLiveTarget_();
  if(typeof input._context!=='string'||input._context!==c.revision||input.eventDate!==c.date)return {success:false,code:'STALE_EVENT',error:'Tävlingen har ändrats. Ladda om sidan innan du anmäler dig.'};
  const clean={...input};delete clean._context;
  beautyLivePlayerCall_={source,revision:c.revision,nonce:Utilities.getUuid().replace(/-/g,''),expires:Date.now()+120000};
  const saved=beautyLiveRegister_(clean,undefined);
  if(!saved||saved.success!==true)return saved;
  return {...saved,nakka:{...saved.nakka,entryConfirmed:saved.nakka?.entryConfirmed===true,needsAttention:saved.queueState==='REVIEW'}};
 }catch(e){return {success:false,code:'REGISTRATION_CHECK_FAILED',error:'Anmälan kunde inte bekräftas. Be arrangören kontrollera innan du försöker igen.'};}
 finally{beautyLivePlayerCall_=null;}
}
function submitRegistration(input){return beautyLivePlayerSubmit_('MOBIL',input);}
function submitKioskRegistration(input){return beautyLivePlayerSubmit_('KIOSK',input);}
