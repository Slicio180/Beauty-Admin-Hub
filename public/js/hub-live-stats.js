/* Refresh league display values only while staff are signed in. No roster writes. */
(()=>{
  let busy=false,unlocked=false;
  function refresh(){
    if(!unlocked||busy||document.hidden||typeof google==='undefined')return;
    let token;try{token=window.BeautyHubAuth.token();}catch{return;}
    busy=true;let finished=false;
    const done=()=>{if(finished)return;finished=true;busy=false;clearTimeout(timeout);};
    const timeout=setTimeout(done,45000);
    try{google.script.run.withSuccessHandler(done).withFailureHandler(done).beautyLiveRefreshStats(token);}catch{done();}
  }
  document.addEventListener('beauty-hub-opened',()=>{unlocked=true;refresh();});
  document.addEventListener('beauty-hub-locked',()=>{unlocked=false;});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(refresh,240000);
})();
