/* Hub-only authenticated editor. No public registration endpoint or arbitrary target. */
(function(){
 let openDialog=null;
 function open(){
  if(openDialog)return;
  const auth=window.BeautyHubAuth,context=window.beautyHubData?.eventContext;
  let token;try{token=auth.token();}catch(e){return;}if(!context)return;
  const generation=auth.generation(),dialog=document.createElement('dialog');openDialog=dialog;dialog.className='message-popup';dialog.setAttribute('aria-label','Player averages');
  const add=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;dialog.appendChild(n);return n;};
  add('h2','Player averages');
  add('p','Staff estimates stay active until the player has played in a completed event and final statistics are verified. Register first; wait for the Nakka identity to appear here.');
  const label=add('label','Player '),select=document.createElement('select');label.appendChild(select);
  const valueLabel=add('label','Estimated three-dart average '),value=document.createElement('input');value.type='number';value.min='0.01';value.max='180';value.step='0.01';valueLabel.appendChild(value);
  const detail=add('p'),status=add('p');status.setAttribute('role','status');
  const save=add('button','Save estimate'),clear=add('button','Mark unrated'),reload=add('button','Reload'),close=add('button','Close');
  let players=[],busy=false,closed=false;
  const valid=()=>!closed&&auth.isCurrent(generation)&&window.beautyHubData?.eventContext===context;
  function dismiss(){closed=true;dialog.close();dialog.remove();openDialog=null;document.removeEventListener('beauty-hub-locked',dismiss);}
  close.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});document.addEventListener('beauty-hub-locked',dismiss);
  function show(){const p=players.find(p=>p.id===select.value);value.value=p?.estimate??'';detail.textContent=p?`${p.name}: ${p.average??'—'} · ${p.source}${p.firstCompletedEvent?' · First completed event verified':''}`:'No verified player identity available yet.';save.disabled=clear.disabled=value.disabled=busy||!p?.editable;select.disabled=reload.disabled=busy;}
  async function request(action,input={}){
   if(!valid()){status.textContent='Event or session changed. Close and reopen.';save.disabled=clear.disabled=true;return;}
   busy=true;show();status.textContent='Checking…';
   try{const r=await new Promise((resolve,reject)=>{let settled=false;const finish=(e,v)=>{if(settled)return;settled=true;clearTimeout(timer);e?reject(e):resolve(v);};const timer=setTimeout(()=>finish(Error('Reply unavailable. Reload before saving again.')),60000);google.script.run.withSuccessHandler(r=>finish(null,r)).withFailureHandler(()=>finish(Error('Reply unavailable. Reload before saving again.'))).beautyHubTest('ratings:'+action,{_context:context,...input},token);});
    if(!valid())return;if(!r?.success)throw Error(r?.error||'Could not verify the saved average.');
    if(r.context!==context)throw Error('Event changed.');
    const selected=select.value;players=r.players;select.replaceChildren();for(const p of players){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.appendChild(o);}if(players.some(p=>p.id===selected))select.value=selected;
    status.textContent=action==='save'?'Saved. Reopen Pool Planner to refresh averages. Existing draws keep their frozen averages.':'Loaded.';
   }catch(e){if(valid()){status.textContent=e.message;players=[];select.replaceChildren();}}finally{busy=false;if(valid())show();}
  }
  function submit(estimate){const p=players.find(p=>p.id===select.value);if(busy||!p)return;if(estimate!==null&&(!Number.isFinite(estimate)||estimate<=0||estimate>180)){status.textContent='Enter an average greater than 0 and no more than 180.';return;}request('save',{lpid:p.id,version:p.version,estimate});}
  select.onchange=show;save.onclick=()=>submit(value.value.trim()?Number(value.value):NaN);clear.onclick=()=>submit(null);reload.onclick=()=>request('list');
  document.body.appendChild(dialog);dialog.showModal();request('list');
 }
 document.getElementById('playerAveragesButton')?.addEventListener('click',open);
 window.BeautyPlayerAverages=Object.freeze({open});
})();
