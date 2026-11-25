/* Project-local attempted-request accounting, not Google's remaining allowance.
 * No URLs, request bodies, credentials or responses are persisted. No retries.
 */
const BEAUTY_QUOTA_KEY_='BEAUTY_FETCH_USAGE_V1';
function beautyQuotaUpdate_(change){
 // Event operations share this lock and may hold it during provider verification.
 // Wait within the Hub's 60-second RPC deadline; never bypass atomic accounting.
 const lock=LockService.getScriptLock(),owned=!lock.hasLock();if(owned&&!lock.tryLock(30000))throw Error('QUOTA_METER_BUSY');
 try{const p=PropertiesService.getScriptProperties(),now=Date.now();
  let s=JSON.parse(p.getProperty(BEAUTY_QUOTA_KEY_)||'null');
  if(!s)s={version:1,buckets:[],blockedUntil:0};
  if(s.version!==1||!Array.isArray(s.buckets)||!Number.isFinite(s.blockedUntil))throw Error('QUOTA_METER_REVIEW');
  // Retain the current partial hour plus 24 hours: deliberately conservative.
  s.buckets=s.buckets.filter(b=>b.hour>=Math.floor(now/3600000)*3600000-86400000);
  const result=change(s,now);p.setProperty(BEAUTY_QUOTA_KEY_,JSON.stringify(s));return result;
 }finally{if(owned)lock.releaseLock();}
}
function beautyQuotaReserve_(feature,count){
 return beautyQuotaUpdate_((s,now)=>{
  if(now<s.blockedUntil)throw Error('URL_FETCH_COOLDOWN');
  if(!Number.isInteger(count)||count<1||count>100)throw Error('QUOTA_BATCH_REVIEW');
  const total=s.buckets.reduce((n,b)=>n+b.count,0);
  // TEST cannot consume the full account allowance. LIVE is metered, not capped.
  if(beautyReleaseEnvironment_().test&&total+count>2000)throw Error('TEST_FETCH_BUDGET_EXHAUSTED');
  const hour=Math.floor(now/3600000)*3600000;
  let b=s.buckets.find(b=>b.hour===hour);if(!b){b={hour,count:0,features:{}};s.buckets.push(b);}
  b.count+=count;b.features[feature]=(b.features[feature]||0)+count;
 });
}
function beautyQuotaFailure_(error){
 if(/Service invoked too many times for one day:\s*urlfetch/i.test(String(error.message||error))){
  beautyQuotaUpdate_((s,now)=>{s.blockedUntil=Math.max(s.blockedUntil,now+1800000);s.lastQuotaErrorAt=now;});
 }
}
function beautyQuotaFetch_(feature,url,options){
 beautyQuotaReserve_(feature,1);
 try{const response=UrlFetchApp.fetch(url,options);beautyQuotaSuccess_();return response;}catch(e){try{beautyQuotaFailure_(e);}catch(ignored){}throw e;}
}
function beautyQuotaFetchAll_(feature,requests){
 beautyQuotaReserve_(feature,requests.length);
 try{const response=UrlFetchApp.fetchAll(requests);beautyQuotaSuccess_();return response;}catch(e){try{beautyQuotaFailure_(e);}catch(ignored){}throw e;}
}
function beautyQuotaRead(){
 beautyBackgroundOwner_();
 return beautyQuotaUpdate_((s,now)=>({scope:'THIS_PROJECT_ONLY',countKind:'ATTEMPTED_REQUESTS',window:'CURRENT_HOUR_PLUS_PREVIOUS_24_HOURS',
  attempted:s.buckets.reduce((n,b)=>n+b.count,0),buckets:s.buckets,blockedUntil:s.blockedUntil,lastQuotaErrorAt:s.lastQuotaErrorAt||null,
  googleRemaining:null,googleResetAt:null,testBudget:beautyReleaseEnvironment_().test?2000:null,checkedAt:now}));
}
function beautyQuotaBackgroundAllowed_(config){
 return !beautyReleaseEnvironment_().test||(Number.isFinite(config.testExpiresAt)&&Date.now()<config.testExpiresAt);
}
function beautyQuotaBackgroundExpiry_(config){
 return beautyReleaseEnvironment_().test?{...config,testExpiresAt:Date.now()+7200000}:config;
}
// Display-only health result. Never used by registration/removal verification.
function beautyQuotaHealthRead_(read){
 const key='BEAUTY_HEALTH_V1_'+beautyContextToken_(),cache=CacheService.getScriptCache();
 try{const raw=cache.get(key);if(raw){const hit=JSON.parse(raw),age=Date.now()-hit.storedAt;
  if(age>=0&&age<60000&&hit.result?.status==='OK')return {...hit.result,cached:true};}}catch(ignored){}
 const result=read();
 if(result?.status==='OK')try{cache.put(key,JSON.stringify({storedAt:Date.now(),result}),60);}catch(ignored){}
 return result;
}
// Called only after the Hub session check. No fetches and no property writes.
function beautyQuotaStatus_(){
 const p=PropertiesService.getScriptProperties(),now=Date.now(),raw=p.getProperty(BEAUTY_QUOTA_KEY_);
 const s=raw?JSON.parse(raw):{version:1,buckets:[],blockedUntil:0};
 if(s.version!==1||!Array.isArray(s.buckets)||!Number.isFinite(s.blockedUntil))throw Error('QUOTA_METER_REVIEW');
 const buckets=s.buckets.filter(b=>b.hour>=Math.floor(now/3600000)*3600000-86400000);
 const attempted=buckets.reduce((n,b)=>n+b.count,0),test=beautyReleaseEnvironment_().test;
 const config=JSON.parse(p.getProperty('BEAUTY_COMBINED_BACKGROUND_V1')||'null');
 const state=now<s.blockedUntil?'COOLDOWN':test&&attempted>=2000?'TEST_LIMIT':s.lastQuotaErrorAt?'RECHECK_DUE':'COUNTING';
 return {success:true,measured:!!raw,attempted,state,blockedUntil:s.blockedUntil,checkedAt:now,test,
  testBudget:test?2000:null,backgroundState:config?.state==='ENABLED'?(beautyQuotaBackgroundAllowed_(config)?'ACTIVE':'EXPIRED'):'PAUSED',
  testExpiresAt:test&&Number.isFinite(config?.testExpiresAt)?config.testExpiresAt:null};
}

function beautyQuotaSuccess_(){
 try{const s=JSON.parse(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUOTA_KEY_)||'null');
  // Do not clear a cooldown opened by a concurrent failing request.
  if(s?.lastQuotaErrorAt&&Date.now()>=s.blockedUntil)beautyQuotaUpdate_((current,now)=>{if(now>=current.blockedUntil)delete current.lastQuotaErrorAt;});
 }catch(ignored){}
}
