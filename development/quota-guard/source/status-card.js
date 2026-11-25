/* One property-only read when System Status opens; no polling or provider check. */
(() => {
 let version=0;
 const text=(id,value)=>{document.getElementById(id).textContent=value;};
 const time=value=>new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 function clear(message){text('beautyUsageState',message);for(const id of ['beautyUsageCount','beautyUsageMessage','beautyUsageDetail'])text(id,'');}
 async function refresh(){
  const current=++version;let generation;
  try{generation=BeautyHubAuth.generation();BeautyHubAuth.token();}catch{clear('Sign in to view usage.');return;}
  clear('Checking usage…');
  try{
   const result=await BeautyHubServices.quota();
   if(current!==version||!BeautyHubAuth.isCurrent(generation))return;
   if(!result?.success)throw Error('Unavailable');
   const labels={COOLDOWN:'Requests paused',TEST_LIMIT:'TEST request limit reached',RECHECK_DUE:'Ready to recheck',COUNTING:'Usage tracking active'};
   text('beautyUsageState',labels[result.state]||'Usage unavailable');
   text('beautyUsageCount',result.measured?result.attempted.toLocaleString()+' requests counted'+(result.test?' · TEST limit '+result.testBudget.toLocaleString():''):'No requests recorded yet.');
   text('beautyUsageMessage',result.state==='COOLDOWN'?'Google reported its daily limit. The next request may try after '+time(result.blockedUntil)+'.':result.state==='TEST_LIMIT'?'TEST requests will resume as older counts leave the usage window.':result.state==='RECHECK_DUE'?'The cooldown has ended. Google’s allowance has not yet been confirmed.':'This is Beauty’s count, not Google’s remaining allowance.');
   text('beautyUsageDetail','Checked '+time(result.checkedAt)+'.'+(result.test?' TEST background work: '+result.backgroundState.toLowerCase()+'.'+(result.backgroundState==='ACTIVE'&&result.testExpiresAt?' Stops at '+time(result.testExpiresAt)+'.':''):''));
  }catch{if(current===version&&BeautyHubAuth.isCurrent(generation))clear('Usage unavailable. Open System Status again to retry.');}
 }
 document.getElementById('systemStatusNavButton').addEventListener('click',refresh);
 document.addEventListener('beauty-hub-locked',()=>{version++;clear('Sign in to view usage.');});
})();
