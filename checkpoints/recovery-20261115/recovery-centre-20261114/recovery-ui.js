/* Explicit staff recovery UI. No automatic confirmation or uncertain retries. */
window.BeautyRecovery=(()=>{
 let openDialog=null;
 function open(mode='recovery'){
  if(openDialog?.open)return;
  const data=window.beautyHubData,generation=BeautyHubAuth.generation(),context=data?.eventContext;
  if(!context)return;
  const dialog=document.createElement('dialog');dialog.className='message-popup';dialog.style.maxWidth='760px';dialog.style.width='calc(100% - 32px)';dialog.setAttribute('aria-label','Recovery and player transfer');openDialog=dialog;
  const add=(tag,text,parent=dialog)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent.appendChild(n);return n;};
  add('h2','Recovery & player transfer');add('p',data.eventDate+' · Selected event');
  const status=add('p','Loading saved operations…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const body=add('div'),refresh=add('button','REFRESH'),close=add('button','CLOSE');refresh.type=close.type='button';
  let busy=false,closed=false,epoch=0;
  const valid=()=>!closed&&BeautyHubAuth.isCurrent(generation)&&context===window.beautyHubData?.eventContext;
  const dismiss=()=>{closed=true;epoch++;dialog.close();dialog.remove();if(openDialog===dialog)openDialog=null;document.removeEventListener('beauty-hub-locked',dismiss);};
  document.addEventListener('beauty-hub-locked',dismiss);close.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  const button=(label,parent,fn)=>{const b=add('button',label,parent);b.type='button';b.setAttribute('data-live-nakka','');b.addEventListener('click',()=>{if(!valid()){status.textContent='The event or session changed. Close this window and reopen it.';return;}if(!busy)fn(b);});return b;};
  async function call(action,input,working){
   if(busy||!valid())return null;busy=true;refresh.disabled=true;const turn=++epoch;status.textContent=working;let timer;const finish=window.BeautyActionFeedback?.begin(dialog);
   try{const r=await Promise.race([BeautyHubServices.recovery(action,{...input,_context:context}),new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),60000);})]);if(!valid()||turn!==epoch)return null;if(!r?.success){status.textContent=r?.error||'Result could not be verified. Refresh before trying another action.';return null;}return r;}
   catch(e){if(valid()&&turn===epoch)status.textContent='Result unavailable. The operation may still be running. Close and reopen Recovery to inspect its saved receipt; do not register again.';return null;}
   finally{clearTimeout(timer);finish?.();if(turn===epoch){busy=false;refresh.disabled=false;}}
  }
  async function check(ref,b){
   b.disabled=true;const r=await call('recheck',{ref},'Checking saved effects… No duplicate registration will be sent.');
   if(r){status.textContent=r.message;await load(false);if(valid()){void loadBeautyHubData();window.BeautyNakkaMonitor?.refresh();}}
   else if(valid()){b.disabled=false;}
  }
  async function preview(kind,player){
   const r=await call('preview',{kind,player},'Checking this player and event…');if(!r)return;
   body.replaceChildren();status.textContent=r.message;
   if(r.outcome!=='PREVIEW'){button('BACK',body,()=>load());return;}
   add('h3',r.player,body);add('p',r.event.title+' · '+r.event.date,body);
   if(r.identity.lpid)add('p','Proposed existing league identity: '+r.identity.name+' · '+r.identity.lpid,body);
   add('p',kind==='transfer'?'Confirm only after checking the player identity.':'Consent has not been collected: N/A will be shown to the organiser.',body);
   button('BACK',body,()=>load());const confirm=button(kind==='transfer'?'CONFIRM TRANSFER':'CONFIRM IMPORT',body,async()=>{
    confirm.disabled=true;const result=await call('save',{ticket:r.ticket,confirmed:'true'},kind==='transfer'?'Transferring and verifying…':'Importing and verifying…');
    // A consumed confirmation is never enabled again, even after a lost reply.
    if(result){status.textContent=result.message;await load(false);if(valid()){void loadBeautyHubData();window.BeautyNakkaMonitor?.refresh();}}
    else if(valid())button('CHECK SAVED OPERATIONS',body,()=>{mode='recovery';load(false);});
   });
  }
  function section(label,rows,kind){
   const details=add('details',undefined,body);details.open=mode===kind;add('summary',label+' ('+rows.length+')',details);
   if(!rows.length)add('p',kind==='transfer'?'No unmatched IN players to transfer.':'No unmatched Nakka players to import.',details);
   for(const row of rows){const p=add('div',undefined,details);add('p',row.name,p);button('REVIEW '+(kind==='transfer'?'TRANSFER':'IMPORT'),p,()=>preview(kind,row.name));}
  }
  async function load(reset=true){
   const previous=status.textContent,r=await call('list',{},'Checking saved operations and both player lists…');if(!r)return;
   body.replaceChildren();status.textContent=reset?'Checked. Review one action at a time.':previous;
   if(r.ambiguous.length)add('p','Duplicate names need identity review. They are excluded from transfer and import.',body);
   const details=add('details',undefined,body);details.open=mode==='recovery'||r.items.length>0;add('summary','Saved operations ('+r.items.length+')',details);
   if(!r.items.length)add('p','No unfinished transfer, import or older player-save receipts. Registration queue rechecks remain in the Nakka overview.',details);
   for(const item of r.items){const row=add('div',undefined,details);add('h3',item.player+' · '+item.kind,row);add('p',(item.date?item.date+' · ':'')+item.message,row);add('small','Reference: '+item.ref,row);if(item.canCheck)button('RECHECK SAVED RESULT',row,b=>check(item.ref,b));else add('p','Owner inspection required. No repeat or dismissal is available.',row);}
   section('Transfer Players — Hub to Nakka',r.transfer,'transfer');section('Import from Nakka — Nakka to Hub',r.import,'import');
   button('EVENT SWITCH RECOVERY',body,()=>{dismiss();window.BeautyEventSelector?.open();});
   add('p','Interrupted event switch: use League / Tournament → RECHECK EVENT SWITCH. Transfer never moves players between events. Import never changes the permanent master list.',body);
  }
  refresh.addEventListener('click',()=>{if(!valid()){status.textContent='The event or session changed. Close this window and reopen it.';refresh.disabled=true;return;}if(!busy)load();});
  document.body.appendChild(dialog);dialog.showModal();void load();
 }
 return Object.freeze({open});
})();
