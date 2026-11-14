/* Fixed destination inserted by the verified rollout installer. No local save fallback. */
var BEAUTY_REGISTRATION_HUB_URL_='https://script.google.com/macros/s/AKfycbwEPJdO-DATlD0IfQtlsSw4SAhYURYgfPzKDIOxASI1eOibi-LhB6LaEnfKD6jorEaIwQ/exec';
var BEAUTY_REGISTRATION_BRIDGE_BUILD_='beauty-shared-registration-20261108-v1';
function beautyRegistrationHub_(action,input){
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(BEAUTY_REGISTRATION_HUB_URL_))throw Error('Registration connection unavailable.');
 if(!['context','display','tonight','kiosk','mobile'].includes(action))throw Error('Unsupported registration action.');
 const payload=JSON.stringify({protocol:BEAUTY_REGISTRATION_BRIDGE_BUILD_,action,input});
 if(payload.length>16000)throw Error('Registration input too large.');
 // Never retry a submission: a missing response may follow a completed write.
 const response=UrlFetchApp.fetch(BEAUTY_REGISTRATION_HUB_URL_,{method:'post',contentType:'application/json',payload,muteHttpExceptions:true,followRedirects:true});
 if(response.getResponseCode()!==200)throw Error('Anmälan kunde inte bekräftas. Be arrangören kontrollera innan du försöker igen.');
 let envelope;try{envelope=JSON.parse(response.getContentText());}catch(e){throw Error('Registreringstjänsten kunde inte nås. Be arrangören kontrollera.');}
 if(envelope?.success!==true||envelope.protocol!==BEAUTY_REGISTRATION_BRIDGE_BUILD_||envelope.action!==action||!Object.prototype.hasOwnProperty.call(envelope,'result'))throw Error('Tävlingen kunde inte verifieras. Ladda om sidan eller kontakta arrangören.');
 return envelope.result;
}
function getLiveRegistrationContext(){return beautyRegistrationHub_('context',null);}
function getRegistrationDisplayContext(){return beautyRegistrationHub_('display',null);}
function getTonightsPlayerNames(revision){return beautyRegistrationHub_('tonight',revision);}
function getPlayerNames(){throw Error('Registreringen har uppdaterats. Ladda om sidan.');}
function submitRegistration(input){return beautyRegistrationHub_('mobile',input);}
function submitKioskRegistration(input){return beautyRegistrationHub_('kiosk',input);}
function beautyRegistrationBridgeHealth_(){return {success:true,build:BEAUTY_REGISTRATION_BRIDGE_BUILD_,role:'kiosk',context:getRegistrationDisplayContext()};}

function doGet(e){
 const page=String(e?.parameter?.page||'').toLowerCase();
 if(page==='registration-health')return ContentService.createTextOutput(JSON.stringify(beautyRegistrationBridgeHealth_())).setMimeType(ContentService.MimeType.JSON);
 if(['hubdata','hubstatus','hubregister','nakkahealth'].includes(page))return ContentService.createTextOutput(JSON.stringify({success:false,code:'ROUTE_DISABLED'})).setMimeType(ContentService.MimeType.JSON);
 const name=page==='remote'?'RemoteRegistration':'Kiosk';
 return HtmlService.createHtmlOutputFromFile(name).setTitle('AIK DART — Registrering').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport','width=device-width, initial-scale=1');
}
