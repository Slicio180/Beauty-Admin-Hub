/* Public registration transport for the existing kiosk/mobile web apps.
 * Only player registration/read operations; no staff actions or redirects to caller URLs.
 */
var BEAUTY_PUBLIC_REGISTRATION_BUILD_='beauty-shared-registration-20261108-v1';
function beautyPublicRegistrationReply_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function beautyPublicRegistrationHealth_(){
 const context=getRegistrationDisplayContext();
 return {success:true,build:BEAUTY_PUBLIC_REGISTRATION_BUILD_,context};
}
function doPost(e){
 beautyLiveLoginGuard_();
 try{
  if(!e||!e.postData||typeof e.postData.contents!=='string'||e.postData.contents.length>16000||!/^application\/json(?:;|$)/i.test(e.postData.type||''))throw Error('Invalid request');
  const r=JSON.parse(e.postData.contents);
  if(!r||Array.isArray(r)||Object.keys(r).sort().join(',')!=='action,input,protocol'||r.protocol!==BEAUTY_PUBLIC_REGISTRATION_BUILD_)throw Error('Invalid request');
  let result;
  switch(r.action){
   case 'context':if(r.input!==null)throw Error('Invalid input');result=getLiveRegistrationContext();break;
   case 'display':if(r.input!==null)throw Error('Invalid input');result=getRegistrationDisplayContext();break;
   case 'tonight':if(typeof r.input!=='string'||r.input.length>100)throw Error('Invalid input');result=getTonightsPlayerNames(r.input);break;
   case 'kiosk':result=submitKioskRegistration(r.input);break;
   case 'mobile':result=submitRegistration(r.input);break;
   default:throw Error('Unsupported action');
  }
  return beautyPublicRegistrationReply_({success:true,protocol:BEAUTY_PUBLIC_REGISTRATION_BUILD_,action:r.action,result});
 }catch(e){return beautyPublicRegistrationReply_({success:false,protocol:BEAUTY_PUBLIC_REGISTRATION_BUILD_,error:'Registration service unavailable. Reload or ask the organiser to check.'});}
}
