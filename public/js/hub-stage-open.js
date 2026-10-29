/* TEST display opener. No session token in URLs; late callbacks cannot reopen a signed-out view. */
(()=>{
 'use strict';
 function valid(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/(exec|dev)$/.test(u.pathname)&&u.search==='?page=stages'&&!u.hash;}catch{return false;}}
 document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('nakkaStagesOpen');if(!button)return;let busy=false;
  button.addEventListener('click',()=>{
   if(busy)return;let token,generation;try{token=window.BeautyHubAuth.token();generation=window.BeautyHubAuth.generation();}catch{alert('Sign in before opening the stage display.');return;}
   const tab=window.open('about:blank','_blank');if(!tab){alert('Allow pop-ups to open the stage display.');return;}tab.opener=null;tab.document.body.textContent='Opening TEST pool and knockout display…';busy=true;button.disabled=true;
   const fail=()=>{tab.close();busy=false;button.disabled=false;if(window.BeautyHubAuth.isCurrent(generation))alert('Could not open the stage display. Check the selected TEST event and session.');};
   try{google.script.run.withSuccessHandler(url=>{if(!window.BeautyHubAuth.isCurrent(generation)||!valid(url)){fail();return;}busy=false;button.disabled=false;if(!tab.closed)tab.location.href=url;}).withFailureHandler(fail).beautyStageTestUrl(token);}catch{fail();}
  });
 });
})();
