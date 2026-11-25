const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const candidate=process.argv[2],auth=fs.readFileSync(path.join(candidate,'LiveLoginAuth.gs'),'utf8');
const c=vm.createContext({});vm.runInContext(auth,c);c.beautyHubAuthAllowed_=()=>['test'];c.beautyHubAuthClaims_=()=>({});
for(const [error,expected] of [['Service invoked too many times for one day: urlfetch.','AUTH_QUOTA_PAUSED'],['URL_FETCH_COOLDOWN','AUTH_QUOTA_PAUSED'],['TEST_FETCH_BUDGET_EXHAUSTED','AUTH_TEST_BUDGET'],['Network unavailable','AUTH_VERIFY_CONNECTION'],['QUOTA_METER_BUSY','AUTH_VERIFY_CONNECTION'],['Authorization required scope','AUTH_VERIFY_PERMISSION']]){
 c.beautyQuotaFetch_=()=>{throw Error(error)};assert.throws(()=>c.beautyHubAuthLogin_('synthetic'),e=>e.message===expected);console.log('PASS '+error+' -> '+expected);
}
(async()=>{const html=fs.readFileSync(path.join(candidate,'LiveHubView.html'),'utf8'),start=html.indexOf(' const failures={AUTH_QUOTA_PAUSED:'),end=html.indexOf(' async function firebase',start);let reply,ok;
const b=vm.createContext({google:{script:{run:{withSuccessHandler:f=>{ok=f;return {withFailureHandler:()=>({beautyHubAuth:()=>ok(reply)})}}}}}});vm.runInContext(html.slice(start,end),b);
for(const [code,words] of [['AUTH_QUOTA_PAUSED','Google reported'],['AUTH_TEST_BUDGET','TEST has reached'],['AUTH_VERIFY_CONNECTION','could not reach'],['AUTH_DENIED','does not have access'],['AUTH_VERIFY_HTTP_403','AUTH_VERIFY_HTTP_403']]){reply={success:false,code};await assert.rejects(b.rpc('login',{}),e=>e.message.includes(words));}
reply={success:true};assert.equal((await b.rpc('login',{})).success,true);console.log('PASS real browser RPC messages distinguish quota, TEST budget, connection, access and HTTP failures; success unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
