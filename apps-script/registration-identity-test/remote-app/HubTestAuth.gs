/* Separate Beauty Firebase accounts; exact Identity TEST project only.
 * No passwords/refresh tokens are accepted, stored or logged by this server.
 * The Firebase backend validates the signed ID token via accounts:lookup.
 */
const BEAUTY_HUB_AUTH_PROJECT_ = 'beauty-admin-hub-test';
const BEAUTY_HUB_AUTH_API_KEY_ = 'AIzaSyAVnGQ2_EAyKzylm78uf5ldCRteVgwgflY';
const BEAUTY_HUB_AUTH_IDLE_MS_ = 15 * 60 * 1000;
const BEAUTY_HUB_AUTH_MAX_MS_ = 60 * 60 * 1000;
var beautyHubRequestToken_ = null;
function beautyHubAuthError_(code) { const e = new Error(code); e.name = 'HubAuthError'; throw e; }
function beautyHubAuthAllowed_() {
  const configured=PropertiesService.getScriptProperties().getProperty('BEAUTY_HUB_ADMIN_UIDS');
  const text=configured===null?'z6BS1ErgwDW5J6zrH9lDCtxxAms2':configured;
  return text.split(',').map(s=>s.trim()).filter(s=>/^[A-Za-z0-9_-]{1,128}$/.test(s));
}
function beautyHubAuthEpoch_(uid) { return PropertiesService.getScriptProperties().getProperty('BEAUTY_HUB_AUTH_EPOCH_'+uid)||'0'; }
function beautyHubAuthKey_(token) {
  if(typeof token!=='string'||!/^bhs_[a-f0-9]{64}$/.test(token))beautyHubAuthError_('AUTH_REQUIRED');
  return 'beauty-hub-session:'+token;
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
    expires:Math.min(now+BEAUTY_HUB_AUTH_MAX_MS_,claims.exp*1000)};
  return beautyHubAuthLocked_(()=>{
    record.epoch=beautyHubAuthEpoch_(record.uid);
    CacheService.getScriptCache().put(beautyHubAuthKey_(token),JSON.stringify(record),900);
    return {success:true,authorized:true,token,email:record.email,expiresAt:record.expires,idleMs:BEAUTY_HUB_AUTH_IDLE_MS_};
  });
}
/* Run manually from the TEST editor. It uses fixed test strings and one fake
 * token, and logs only booleans/status codes; never inspects a real login. */
function beautyHubAuthProbe() {
  beautyHubTestGuard_();
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/script.external_request']);
  const result={probe:'BEAUTY_AUTH_ENVIRONMENT',recordedUTC:new Date().toISOString()};
  for(const [name,value] of [['unpadded','YQ'],['padded','YQ==']]){
    try{result[name]=Utilities.newBlob(Utilities.base64DecodeWebSafe(value)).getDataAsString('UTF-8')==='a';}catch(e){result[name]=false;}
  }
  try{
    const response=UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+BEAUTY_HUB_AUTH_API_KEY_,{
      method:'post',contentType:'application/json',payload:JSON.stringify({idToken:'beauty-auth-environment-probe-not-a-token'}),muteHttpExceptions:true,followRedirects:false});
    result.lookupHTTP=response.getResponseCode();
    const allowed=['INVALID_ID_TOKEN','INVALID_TOKEN','API_KEY_INVALID','PROJECT_NOT_FOUND','PERMISSION_DENIED','CREDENTIAL_MISMATCH'];
    const text=response.getContentText();result.lookupCode=allowed.find(code=>text.includes(code))||'OTHER_RESPONSE';
  }catch(e){result.lookupCode=/permission|authorization|authorisation|required scope/i.test(String(e.message))?'GOOGLE_PERMISSION':'CONNECTION_FAILED';}
  console.log(JSON.stringify(result));return result;
}
function beautyHubAuthRequire_(token) {
  beautyHubTestGuard_();
  const key=beautyHubAuthKey_(token),cache=CacheService.getScriptCache();let record;
  try{record=JSON.parse(cache.get(key)||'null');}catch(e){beautyHubAuthError_('AUTH_REQUIRED');}
  const now=Date.now();
  if(!record||!beautyHubAuthAllowed_().includes(record.uid)||record.epoch!==beautyHubAuthEpoch_(record.uid)||!Number.isFinite(record.expires)||!Number.isFinite(record.active)||
    now>=record.expires||now-record.active>=BEAUTY_HUB_AUTH_IDLE_MS_){cache.remove(key);beautyHubAuthError_('AUTH_REQUIRED');}
  return record;
}
function beautyHubAuth(action,input) {
  beautyHubTestGuard_();
  try{
    if(!input||typeof input!=='object'||Array.isArray(input))beautyHubAuthError_('AUTH_INVALID');
    if(action==='login'&&Object.keys(input).length===1&&typeof input.idToken==='string')return beautyHubAuthLogin_(input.idToken);
    if(!['touch','logout'].includes(action)||Object.keys(input).length!==1||typeof input.token!=='string')beautyHubAuthError_('AUTH_INVALID');
    return beautyHubAuthLocked_(()=>{
      if(action==='logout'){
        const cache=CacheService.getScriptCache(),key=beautyHubAuthKey_(input.token);
        let record;try{record=JSON.parse(cache.get(key)||'null');}catch(e){}
        if(record?.uid)PropertiesService.getScriptProperties().setProperty('BEAUTY_HUB_AUTH_EPOCH_'+record.uid,Utilities.getUuid());
        cache.remove(key);return {success:true};
      }
      const record=beautyHubAuthRequire_(input.token);record.active=Date.now();
      CacheService.getScriptCache().put(beautyHubAuthKey_(input.token),JSON.stringify(record),Math.max(1,Math.min(900,Math.ceil((record.expires-Date.now())/1000))));
      return {success:true,expiresAt:record.expires};
    });
  }catch(e){return {success:false,code:e.name==='HubAuthError'?e.message:'AUTH_UNAVAILABLE'};}
}
