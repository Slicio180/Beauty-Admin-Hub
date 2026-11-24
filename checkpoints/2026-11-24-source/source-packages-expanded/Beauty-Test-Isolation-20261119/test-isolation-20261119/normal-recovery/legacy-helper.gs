// Read-only assessment for older registrations. Never creates a receipt or player.
function beautyRegistrationLegacyVerify_(name){
 const context=beautyContextToken_(),date=beautyHubNakkaDate_().date,ss=beautyHubSpreadsheet_(),key=BeautyNameResolution.key;
 const stop=code=>{throw Error(code);};
 const rows=(title,typed)=>{const sh=ss.getSheetByName(title);if(!sh||sh.getLastRow()>10000)stop('REGISTRATION_LAYOUT_REVIEW');if(sh.getLastRow()<2)return [];const range=sh.getRange(2,1,sh.getLastRow()-1,6);return typed?range.getValues():range.getDisplayValues();};
 const scan=()=>{
  const control=ss.getSheetByName('Control');if(!control)stop('REGISTRATION_CONTEXT_CHANGED');
  const value=control.getRange('A2').getValue();
  if(!(value instanceof Date)||Utilities.formatDate(value,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')!==date)stop('REGISTRATION_CONTEXT_CHANGED');
  const source=rows(RESPONSE_SHEET,true).filter(r=>key(r[1]===NEW_PLAYER_OPTION?r[2]:r[1])===key(name));
  // A receiptless advance entry has no durable event ownership. Do not guess.
  const matches=source.filter(r=>r[0] instanceof Date&&Utilities.formatDate(r[0],ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')===date);
  if(matches.length!==1)stop('REGISTRATION_LEGACY_SOURCE_REVIEW');
  const r=matches[0];if(!['JA, JAG GODKÄNNER','NEJ, JAG GODKÄNNER INTE'].includes(r[3])||!['HUB','KIOSK','MOBIL'].includes(r[5]))stop('REGISTRATION_LEGACY_SOURCE_REVIEW');
  const expected=['IN',r[3]==='JA, JAG GODKÄNNER'?'JA':'NEJ',r[4],r[5]];
  const master=rows(MASTER_SHEET).filter(x=>key(x[0])===key(name));
  const stored=rows('PLAYER STATUS DATA').filter(x=>key(x[0])===key(name));
  const shown=rows("TONIGHT'S PLAYERS").filter(x=>key(x[0]||x[1])===key(name));
  if(master.length!==1||stored.length!==1||shown.length!==1)stop('REGISTRATION_LEGACY_IDENTITY_REVIEW');
  if(JSON.stringify(stored[0].slice(2,6))!==JSON.stringify(expected)||JSON.stringify(shown[0].slice(2,6))!==JSON.stringify(expected))stop('REGISTRATION_LEGACY_FIELDS_REVIEW');
  return JSON.stringify({source:r,master,stored,shown});
 };
 const before=scan(),after=scan();
 if(before!==after||beautyContextToken_()!==context||beautyHubNakkaDate_().date!==date)stop('REGISTRATION_CONTEXT_CHANGED');
 return {success:true,registrationVerified:true,changed:false,evidence:'LEGACY_CURRENT_ROWS',providerVerified:false};
}
