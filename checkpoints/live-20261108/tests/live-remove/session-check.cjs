const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=JSON.parse(fs.readFileSync('live-remove/prepared.json')).files.find(f=>f.name==='LiveLoginAuth').source;
function fixture(){
 let now=1000000;const props=new Map(),cache=new Map();const uid='607O4cFmrTMPSk2CgADhwNu7k742';
 class Clock extends Date{static now(){return now;}}
 const c={Date:Clock,beautyLiveLoginGuard_:()=>{},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},Utilities:{getUuid:()=> 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'},UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({users:[{localId:uid,email:'fixture@example.com'}]})})}};
 vm.createContext(c);vm.runInContext(source,c);c.beautyHubAuthClaims_=()=>({sub:uid,auth_time:now/1000});
 const login=c.beautyHubAuthLogin_('fixture');return {c,login,cache,props,advance:ms=>now+=ms};
}
test('LIVE login returns six-hour absolute and idle limits',()=>{const f=fixture();assert.equal(f.login.expiresAt,1000000+21600000);assert.equal(f.login.idleMs,21600000);});
test('cache eviction at ten minutes does not end session',()=>{const f=fixture();f.advance(600000);f.cache.clear();assert.ok(f.c.beautyHubAuthRequire_(f.login.token));});
test('session remains valid past old 15-minute cutoff',()=>{const f=fixture();f.advance(16*60000);assert.ok(f.c.beautyHubAuthRequire_(f.login.token));});
test('absolute six-hour expiry enforced even with recent activity',()=>{const f=fixture();f.advance(21600000-1);assert.equal(f.c.beautyHubAuth('touch',{token:f.login.token}).success,true);f.advance(1);assert.throws(()=>f.c.beautyHubAuthRequire_(f.login.token),/AUTH_REQUIRED/);});
test('explicit logout still revokes durable session',()=>{const f=fixture();assert.equal(f.c.beautyHubAuth('logout',{token:f.login.token}).success,true);f.cache.clear();assert.throws(()=>f.c.beautyHubAuthRequire_(f.login.token),/AUTH_REQUIRED/);});
