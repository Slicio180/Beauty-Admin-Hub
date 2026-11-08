/* LIVE login acceptance check; exact LIVE project and approved account only.
 * No passwords/refresh tokens are accepted, stored or logged by this server.
 * The Firebase backend validates the signed ID token via accounts:lookup.
 */
const BEAUTY_HUB_AUTH_PROJECT_ = 'beauty-admin-hub-live';
const BEAUTY_HUB_AUTH_API_KEY_ = 'AIzaSyCNSoes3UvCM7Uk5jxmC-QMchlTgsjSgsk';
const BEAUTY_HUB_AUTH_IDLE_MS_ = 6 * 60 * 60 * 1000;
const BEAUTY_HUB_AUTH_MAX_MS_ = 6 * 60 * 60 * 1000;
var beautyHubRequestToken_ = null;
function beautyHubAuthError_(code) { const e = new Error(code); e.name = 'HubAuthError'; throw e; }
function beautyHubAuthAllowed_() { return ['607O4cFmrTMPSk2CgADhwNu7k742']; }
function beautyHubAuthEpoch_(uid) { return PropertiesService.getScriptProperties().getProperty('BEAUTY_HUB_AUTH_EPOCH_'+uid)||'0'; }
function beautyHubAuthKey_(token) {
  if(typeof token!=='string'||!/^bhs_[a-f0-9]{64}$/.test(token))beautyHubAuthError_('AUTH_REQUIRED');
  return 'beauty-hub-session:'+token;
}
// Cache eviction must not sign out an open Hub. Only opaque Hub session records
// are retained server-side; the browser session remains memory-only.
function beautyHubAuthLoad_(key) {
  const text=CacheService.getScriptCache().get(key)||PropertiesService.getScriptProperties().getProperty(key);
  try{return JSON.parse(text||'null');}catch(e){return null;}
}
function beautyHubAuthStore_(key,record) {
  const text=JSON.stringify(record);PropertiesService.getScriptProperties().setProperty(key,text);
  CacheService.getScriptCache().put(key,text,Math.max(1,Math.min(600,Math.ceil((record.expires-Date.now())/1000))));
}
function beautyHubAuthForget_(key) {
  CacheService.getScriptCache().remove(key);PropertiesService.getScriptProperties().deleteProperty(key);
}
function beautyHubAuthPrune_() {
  const properties=PropertiesService.getScriptProperties();
  for(const [key,text]of Object.entries(properties.getProperties()))if(key.startsWith('beauty-hub-session:')){
    let record;try{record=JSON.parse(text);}catch(e){}
    if(!record||!Number.isFinite(record.expires)||Date.now()>=record.expires||record.epoch!==beautyHubAuthEpoch_(record.uid))beautyHubAuthForget_(key);
  }
}
function beautyHubAuthLocked_(callback) {
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))beautyHubAuthError_('AUTH_BUSY');
  try{return callback();}finally{lock.releaseLock();}
}
function beautyHubAuthClaims_(idToken) {
  if(typeof idToken!=='string'||idToken.length>12000||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(idToken))beautyHubAuthError_('AUTH_TOKEN_FORMAT');
  let claims;
  try{
    const segment=idToken.split('.')[1];
    // JWT uses unpadded Base64url; normalize only the decoding copy for GAS.
    const padded=segment+'='.repeat((4-segment.length%4)%4);
    claims=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString('UTF-8'));
  }catch(e){beautyHubAuthError_('AUTH_TOKEN_DECODE');}
  const now=Date.now()/1000;
  if(!claims||typeof claims!=='object'||Array.isArray(claims))beautyHubAuthError_('AUTH_TOKEN_DECODE');
  if(claims.aud!==BEAUTY_HUB_AUTH_PROJECT_||claims.iss!=='https://securetoken.google.com/'+BEAUTY_HUB_AUTH_PROJECT_||claims.firebase?.tenant)beautyHubAuthError_('AUTH_TOKEN_PROJECT');
  if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128)beautyHubAuthError_('AUTH_TOKEN_FORMAT');
  if(!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+30||
    !Number.isFinite(claims.auth_time)||claims.auth_time>now+30||now-claims.auth_time>300)beautyHubAuthError_('AUTH_TOKEN_TIME');
  // Decoding alone is NEVER authentication: the exact token must also be
  // accepted by Firebase's HTTPS backend, with its returned UID matching sub.
  return claims;
}
function beautyHubAuthLogin_(idToken) {
  const allowed=beautyHubAuthAllowed_();if(!allowed.length)beautyHubAuthError_('AUTH_SETUP');
  const claims=beautyHubAuthClaims_(idToken);
  let response,body;
  try{
    response=UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+BEAUTY_HUB_AUTH_API_KEY_,{
      method:'post',contentType:'application/json',payload:JSON.stringify({idToken}),muteHttpExceptions:true,followRedirects:false});
    if(response.getResponseCode()!==200)beautyHubAuthError_('AUTH_VERIFY_HTTP_'+response.getResponseCode());
    body=JSON.parse(response.getContentText());
  }catch(e){
    if(e.name==='HubAuthError')throw e;
    beautyHubAuthError_(/permission|authorization|authorisation|required scope/i.test(String(e.message))?'AUTH_VERIFY_PERMISSION':'AUTH_VERIFY_CONNECTION');
  }
  const account=body?.users?.length===1?body.users[0]:null;
  if(!account||account.localId!==claims.sub||account.disabled===true||account.tenantId||
    !allowed.includes(account.localId)||typeof account.email!=='string'||
    (Number(account.validSince)||0)>claims.auth_time)beautyHubAuthError_('AUTH_DENIED');
  const token='bhs_'+Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  const now=Date.now(),record={uid:account.localId,email:account.email,created:now,active:now,
    expires:now+BEAUTY_HUB_AUTH_MAX_MS_};
  return beautyHubAuthLocked_(()=>{
    record.epoch=beautyHubAuthEpoch_(record.uid);
    beautyHubAuthPrune_();beautyHubAuthStore_(beautyHubAuthKey_(token),record);
    return {success:true,authorized:true,token,email:record.email,expiresAt:record.expires,idleMs:BEAUTY_HUB_AUTH_IDLE_MS_};
  });
}
function beautyHubAuthRequire_(token) {
  if(typeof beautyContextAssert_==='function')beautyContextAssert_();
  beautyLiveLoginGuard_();
  const key=beautyHubAuthKey_(token),record=beautyHubAuthLoad_(key);
  const now=Date.now();
  if(!record||!beautyHubAuthAllowed_().includes(record.uid)||record.epoch!==beautyHubAuthEpoch_(record.uid)||!Number.isFinite(record.expires)||!Number.isFinite(record.active)||
    now>=record.expires||now-record.active>=BEAUTY_HUB_AUTH_IDLE_MS_){beautyHubAuthForget_(key);beautyHubAuthError_('AUTH_REQUIRED');}
  return record;
}
function beautyHubAuth(action,input) {
  beautyLiveLoginGuard_();
  try{
    if(!input||typeof input!=='object'||Array.isArray(input))beautyHubAuthError_('AUTH_INVALID');
    if(action==='login'&&Object.keys(input).length===1&&typeof input.idToken==='string')return beautyHubAuthLogin_(input.idToken);
    if(!['touch','logout'].includes(action)||Object.keys(input).length!==1||typeof input.token!=='string')beautyHubAuthError_('AUTH_INVALID');
    return beautyHubAuthLocked_(()=>{
      if(action==='logout'){
        const key=beautyHubAuthKey_(input.token),record=beautyHubAuthLoad_(key);
        if(record?.uid)PropertiesService.getScriptProperties().setProperty('BEAUTY_HUB_AUTH_EPOCH_'+record.uid,Utilities.getUuid());
        beautyHubAuthForget_(key);return {success:true};
      }
      const record=beautyHubAuthRequire_(input.token);record.active=Date.now();
      beautyHubAuthStore_(beautyHubAuthKey_(input.token),record);
      return {success:true,expiresAt:record.expires};
    });
  }catch(e){return {success:false,code:e.name==='HubAuthError'?e.message:'AUTH_UNAVAILABLE'};}
}

