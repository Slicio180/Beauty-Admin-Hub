(()=>{'use strict';
 const get=id=>document.getElementById(id),host=get('beautyRecoveryEventControls'),old=get('nakkaAttentionPanel');if(!host||!old)return;
 const section=document.createElement('section');section.id='beautyPlayerRecovery';section.setAttribute('aria-label','Player registration health');old.before(section);old.hidden=true;
 const summary=document.createElement('p');summary.setAttribute('role','status');summary.textContent='Loading player registration status…';const cards=document.createElement('div');cards.className='beauty-player-health-cards';section.append(summary,cards);
 const dialog=document.createElement('dialog');dialog.id='beautyPlayerRecoveryDialog';dialog.setAttribute('aria-labelledby','beautyPlayerRecoveryName');document.body.append(dialog);
 const title=document.createElement('h2');title.id='beautyPlayerRecoveryName';const status=document.createElement('p');status.setAttribute('role','status');const steps=document.createElement('ol'),detail=document.createElement('p'),actions=document.createElement('div'),history=document.createElement('details'),historyTitle=document.createElement('summary'),report=document.createElement('pre');historyTitle.textContent='Issue history and report';history.append(historyTitle,report);
 const close=document.createElement('button');close.type='button';close.textContent='Close';close.addEventListener('click',()=>dialog.close());dialog.append(title,status,steps,detail,actions,history,close);
 let state=null,busy=false,epoch=0,selected='',guidance=null,lastRead=0,unlocked=false,queued=false,notice='',currentContext='',providerPaused=false;
 const labels={red:'Needs your help',orange:'Beauty is checking',green:'Verified',unknown:'Automatic check pending',neutral:'Not IN'};
 function addButton(label,fn,parent=actions){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);parent.append(b);return b;}
 function reportText(p){return ['Beauty player recovery', 'Event: '+state.title+' · '+state.eventDate,'Player: '+p.name,'Status: '+labels[p.tone],'Issue: '+p.code,'Last entry check: '+(p.checkedAt||'Not confirmed'),'Entry verification: '+(p.entry?JSON.stringify(p.entry):'See the current check; no recovery entry record'),'Original registration: '+(p.original?JSON.stringify(p.original):'No diagnostic available'),...p.history.map(h=>h.at+' · '+h.source+' · '+h.state+' · '+h.code)].join('\n');}
 function renderDialog(){if(!dialog.open)return;const p=state?.players.find(p=>p.name===selected);if(!p){title.textContent=selected;status.textContent='This player is no longer in the selected event. Close this window.';steps.replaceChildren();actions.replaceChildren();report.textContent='';return;}
  title.textContent=p.name;dialog.dataset.tone=p.tone;status.textContent=notice||((busy&&selected)?'Beauty is checking the saved result…':p.problem);steps.replaceChildren();actions.replaceChildren();detail.textContent='';report.textContent=reportText(p);
  if(p.tone==='green'){status.textContent='Verified. No action needed.';detail.textContent='The current event entry is verified. Where Nakka omits the league link, its exact saved ID remains unverified; see the report.';}
  else if(p.tone==='neutral'){detail.textContent=p.next;}
  else if(p.tone==='unknown'||p.tone==='orange'){detail.textContent='Beauty checks automatically. No action is needed from you while this check runs.';}
  else{
   const g=guidance?.player===p.name?guidance:null;
   for(const text of g?.steps||['Beauty checks the registration and any earlier transfer.','If your help is needed, the specific next steps appear here.']){const li=document.createElement('li');li.textContent=text;steps.append(li);}
   if(g){status.textContent=g.problem;detail.textContent=[g.event?.title,g.identity?.name].filter(Boolean).join(' · ');}
   if(g?.event?.id&&/^t_[A-Za-z0-9_]+$/.test(g.event.id)){const a=document.createElement('a');a.href='https://n01darts.com/n01/league/season.php?id='+encodeURIComponent(g.event.id);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open this event in Nakka';actions.append(a);}
   if(g?.ticket&&Date.now()<g.expires){addButton(g.code==='REVIEW_EXISTING'?'Confirm this is the correct entry':'Confirm reviewed action',()=>{if(busy||!guidance?.ticket)return;const review=guidance;guidance=null;run('confirm',{player:p.name,kind:review.kind,ticket:review.ticket,confirmed:'true'});});}
   else if(g?.code!=='EVENT_REGISTRATION_CLOSED')addButton(g?'Check after correction':'Show next step',()=>run('review',{player:p.name}));
  }
  addButton('Copy report',async()=>{try{await navigator.clipboard.writeText(reportText(p));notice='Report copied.';}catch(e){history.open=true;notice='Select and copy the report below.';}status.textContent=notice;});
  for(const b of actions.querySelectorAll('button'))b.disabled=busy;
 }
 function open(name){const target=state?.players.find(p=>p.name===name);if(!target||!(['red','orange'].includes(target.tone)||(target.tone==='green'&&target.history?.length)))return;selected=name;notice='';if(guidance?.player!==name)guidance=null;if(!dialog.open)dialog.showModal();renderDialog();const p=state?.players.find(p=>p.name===name);if(p?.tone==='red'&&!guidance&&!busy)run('review',{player:name});}
 function paintCell(cell){
  const name=cell.dataset.beautyHealthPlayer,p=state?.players.find(p=>p.name===name);let badge=cell.querySelector('.beauty-player-recovery-badge');
  const visible=p&&(['red','orange'].includes(p.tone)||(p.tone==='green'&&p.history?.length));
  if(!visible){if(badge)badge.remove();return;}
  if(!badge){badge=addButton('',()=>open(name),cell);badge.className='beauty-player-recovery-badge';}
  badge.dataset.tone=p.tone;badge.textContent=p.tone==='red'?'Needs help':p.tone==='orange'?'Checking':'Resolved';
  badge.setAttribute('aria-label',name+': '+badge.textContent+'. Open recovery details.');
 }
 function paintTable(){for(const cell of document.querySelectorAll('[data-beauty-health-player]'))paintCell(cell);}
 function render(){cards.replaceChildren();if(!state){summary.textContent=notice||'Waiting for the current event check.';renderDialog();return;}const red=state.players.filter(p=>p.tone==='red').length,orange=state.players.filter(p=>p.tone==='orange').length,unknown=state.players.filter(p=>p.tone==='unknown').length;
  summary.textContent=notice||(providerPaused?'The event connection is not verified. Saved registrations are retained.':'')||state.system||(red?red+' player'+(red===1?' needs':'s need')+' your help. Other registrations can continue.':orange? 'Beauty is checking '+orange+' player'+(orange===1?'':'s')+'.':unknown?'Beauty is checking this event automatically. You do not need to verify players.':state.players.some(p=>p.status==='IN')?'No player issues found. No action needed.':'No IN players to check.');
  for(const p of state.players.filter(p=>['red','orange'].includes(p.tone)||(p.tone==='green'&&p.history?.length)).sort((a,b)=>['red','orange','unknown','green','neutral'].indexOf(a.tone)-['red','orange','unknown','green','neutral'].indexOf(b.tone))){const b=addButton(p.name+' · '+labels[p.tone],()=>open(p.name),cards);b.className='beauty-player-health';b.dataset.tone=p.tone;}
  paintTable();renderDialog();
 }
 async function run(action,input={}){
  if(busy){if(action==='read')queued=true;return;}
  let token,generation,context;try{token=window.BeautyHubAuth.token();generation=window.BeautyHubAuth.generation();context=window.beautyHubData?.eventContext;if(!context)return;}catch(e){return;}
  const turn=epoch;busy=true;notice='';renderDialog();
  let timer;const valid=()=>turn===epoch&&window.BeautyHubAuth.isCurrent(generation)&&window.beautyHubData?.eventContext===context;
  timer=setTimeout(()=>{if(valid()){notice='The reply is taking longer than expected. Beauty is waiting; do not register again.';render();}},60000);
  try{const r=await new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(()=>reject(Error('Reply unavailable. The saved operation will be checked; do not register again.'))).beautyHubTest('playerRecovery:'+action,{_context:context,...input},token));
   if(!valid())return;if(r?.code==='AUTH_REQUIRED'){window.BeautyHubAuth.expired();return;}if(!r?.success)throw Error(r?.error||'The saved result could not be checked.');
   if(r.eventContext!==context||!Array.isArray(r.players))throw Error('The selected event changed. Waiting for its current status.');
   state=r;currentContext=context;lastRead=Date.now();notice='';if(r.guidance)guidance=r.guidance;else if(action!=='read')guidance=null;
  }catch(e){if(valid())notice=e.message;}
  finally{clearTimeout(timer);if(turn===epoch){busy=false;render();if(queued){queued=false;setTimeout(()=>run('read'),500);}else if(!notice&&!providerPaused&&unlocked&&!document.hidden){const next=state?.players.find(p=>p.autoEligible);if(next)setTimeout(()=>run('auto',{player:next.name}),500);}}}
 }
 function sync(){const context=window.beautyHubData?.eventContext;if(context!==currentContext){epoch++;busy=false;state=null;guidance=null;selected='';notice='';currentContext=context;lastRead=0;providerPaused=false;queued=false;if(dialog.open)dialog.close();render();}if(unlocked&&!document.hidden&&Date.now()-lastRead>10000)run('read');}
 document.addEventListener('beauty-menu-data',sync);
 document.addEventListener('beauty-nakka-diagnosed',e=>{providerPaused=e.detail?.success!==true||e.detail?.attention?.available!==true||e.detail?.attention?.complete!==true;if(unlocked)run('read');});
 document.addEventListener('beauty-nakka-check-error',()=>{providerPaused=true;notice='The event connection could not be checked. Saved registrations are retained; automatic checks will continue.';render();});
 document.addEventListener('beauty-hub-opened',()=>{unlocked=true;sync();});
 document.addEventListener('beauty-hub-locked',()=>{unlocked=false;epoch++;busy=false;queued=false;state=null;guidance=null;selected='';notice='';currentContext='';if(dialog.open)dialog.close();cards.replaceChildren();report.textContent='';summary.textContent='Sign in to view player status.';});
 get('beautyRecoveryTestOpen')?.addEventListener('click',()=>{if(!unlocked)return;window.BeautyDashboard?.refresh();run('read');});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&unlocked)sync();});
 window.BeautyPlayerRecovery=Object.freeze({open,cell:(cell,name)=>{cell.dataset.beautyHealthPlayer=name;paintCell(cell);}});
 try{window.BeautyHubAuth.token();unlocked=!!window.beautyHubData;}catch(e){}
 if(unlocked)sync();
})();
