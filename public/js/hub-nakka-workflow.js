/* Guided navigation inside the existing Nakka menu. All changes use guarded routes. */
(() => {
  'use strict';
  const get=id=>document.getElementById(id),menu=get('nakkaStatusPanel'),section=get('nakkaAttentionPanel');
  if(!menu||!section)return;
  let checkedDate='',checking=false,clock=null,started=0;
  const diagnose=get('nakkaDiagnose'),status=get('nakkaDiagnosis'),progress=get('nakkaCheckProgress');
  const errorSteps={
    EVENT_DATE_MISMATCH:'No TEST event was found for the selected date. Open Nakka event check to review creating one.',
    EVENT_AMBIGUOUS:'The TEST event appears more than once in the response. No target was selected. Inspect the TEST event in Nakka before checking again.',
    EVENT_UNAVAILABLE:'The TEST event could not be verified. Automatic checks will continue. Connection details are available under Advanced. No player action is available from this result.',
    STALE_CHECK:'The Hub date or players changed during the check. Check again to get a current result.',
    BUSY:'Another operation is running. Wait for its result, then check again.',
    CHECK_UNAVAILABLE:'Nakka player entries could not be verified. Automatic checks will continue. Review connection details if this persists. Saved alerts remain visible.'
  };
  function stop(){checking=false;clearInterval(clock);clock=null;diagnose.disabled=false;}
  function start(){stop();checking=true;started=Date.now();diagnose.disabled=true;progress.textContent='Checking the event, league identities and player entries…';
    clock=setInterval(()=>{progress.textContent='Still checking… '+Math.floor((Date.now()-started)/1000)+' seconds. No player adds or removals are requested by this check.';},1000);
  }
  function showTiming(result){
    const detail=get('nakkaCheckTiming'),output=get('nakkaCheckTimingResult');output.replaceChildren();
    if(!result.timing||!Number.isFinite(result.clientMs)){detail.hidden=true;return;}
    detail.hidden=false;
    const line=text=>{const p=document.createElement('p');p.textContent=text;output.append(p);};
    line('Total wait: '+(result.clientMs/1000).toFixed(1)+' s · Server: '+(result.timing.totalMs/1000).toFixed(1)+' s');
    const names={'nakka-read-batch':'Parallel Nakka reads','nakka-read':'Nakka read'};
    for(const step of result.timing.steps||[])if(Number.isFinite(step.ms))line((names[step.stage]||'Verification')+': '+(step.ms/1000).toFixed(1)+' s');
  }
  document.addEventListener('beauty-nakka-check-start',start);
  document.addEventListener('beauty-nakka-diagnosed',event=>{
    stop();const result=event.detail;showTiming(result);
    if(!result.success||result.attention?.available!==true||result.attention?.complete!==true||!result.event){checkedDate='';status.textContent=errorSteps[result.code]||errorSteps.CHECK_UNAVAILABLE;get('nakkaConnectedEvent').textContent='';progress.textContent='Check incomplete. Saved alerts are retained.';return;}
    checkedDate=result.eventDate;
    status.textContent=result.attention.items.length?'Player issues need attention.':'✓ Event and players checked.';
    get('nakkaConnectedEvent').textContent=result.event.title+' · '+result.eventDate;
    const count=result.attention?.items?.length??0;
    progress.textContent=count?count+' player '+(count===1?'issue needs':'issues need')+' review. Choose a player below.':'No player attention alerts found.';
  });
  document.addEventListener('beauty-nakka-check-error',()=>{if(checking){stop();checkedDate='';status.textContent='The check did not complete. Automatic checks will continue; open Advanced to check sooner.';progress.textContent='No automatic add or removal was sent.';}});
  document.addEventListener('beauty-nakka-invalidated',()=>{stop();checkedDate='';status.textContent='The Hub date or players changed. Checking automatically…';get('nakkaConnectedEvent').textContent='';progress.textContent='';get('nakkaCheckTiming').hidden=true;get('nakkaCheckTimingResult').replaceChildren();});
  const refresh=()=>window.BeautyDashboard?.refresh();
  diagnose.addEventListener('click',refresh);
  get('nakkaNavButton')?.addEventListener('click',()=>{if(checkedDate!==window.beautyHubData?.eventDate)refresh();});
  window.BeautyNakkaWorkflow=Object.freeze({attention(){
    get('nakkaNavButton')?.click();
    get('attentionReviewTitle').focus();section.scrollIntoView?.({block:'start',behavior:'smooth'});
  }});
  // API availability is supporting evidence, not proof that a player's entry is confirmed.
  const health=get('nakkaHealthCard');if(health){const details=document.createElement('details'),summary=document.createElement('summary');details.className='nakka-api-details';summary.textContent='Nakka API status';get('nakkaComparisonDetails').append(details);details.append(summary,health);}
  document.addEventListener('beauty-hub-locked',()=>{stop();checkedDate='';status.textContent='Sign in to check the TEST event.';get('nakkaConnectedEvent').textContent='';progress.textContent='';get('nakkaCheckTimingResult').replaceChildren();get('nakkaCheckTiming').hidden=true;});
})();
