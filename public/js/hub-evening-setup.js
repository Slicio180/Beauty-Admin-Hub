/* One saved evening overview. Edits require a fresh native snapshot and explicit review. */
(()=>{
 let dialog=null,revision=0,busy=false,view=null,version=null,opener=null;
 const node=(tag,text,parent)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent?.appendChild(n);return n;};
 const button=(text,parent,fn)=>{const b=node('button',text,parent);b.type='button';b.addEventListener('click',fn);return b;};
 function close(){if(busy)return;revision++;dialog?.close();dialog?.remove();dialog=null;opener?.focus();}
 document.addEventListener('beauty-hub-locked',()=>{busy=false;close();view=null;version=null;});
 async function request(page,input={}){const u=new URL(BeautyHubServices.endpoint);u.search='';u.searchParams.set('page',page);for(const [key,value]of Object.entries(input))u.searchParams.set(key,value);const r=await(await BeautyHubServices.request(u.toString())).json();if(!r.success){const e=Error(r.error||'Event Setup unavailable.');e.uncertain=r.uncertain;throw e;}return r;}
 function start(){if(dialog)return;opener=document.activeElement;dialog=node('dialog');dialog.className='message-popup event-inspection evening-setup';dialog.setAttribute('aria-label','Event Setup');dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.appendChild(dialog);dialog.showModal();load();}
 function header(title='EVENT SETUP'){dialog.replaceChildren();const x=button('×',dialog,close);x.className='message-popup-close';x.setAttribute('aria-label','Close Event Setup');node('h2',title,dialog);}
 async function load(){if(!dialog||busy)return;const token=++revision;busy=true;header();node('p','Reading this event’s saved Nakka settings…',dialog);
  try{let r=await request('eveningsetup');if(!dialog||token!==revision)return;let notice;
   if(r.setup.creationReviewRequired){try{await request('nakkacreaterecover');if(!dialog||token!==revision)return;r=await request('eveningsetup');if(!dialog||token!==revision)return;}catch(e){if(!dialog||token!==revision)return;notice=e.message;}}
   view=r.setup;version=r.version;busy=false;overview(notice);}catch(e){if(dialog&&token===revision){busy=false;header();node('p',e.message,dialog);button('CHANGE EVENT DATE',dialog,()=>{close();window.BeautyEventControlDate?.();});button('RELOAD EVENT SETUP',dialog,load);button('CLOSE',dialog,close);}}finally{if(token===revision)busy=false;}
 }
 function overview(message){revision++;header();if(message)node('p',message,dialog).setAttribute('role','status');
  node('h3',view.event.title,dialog);node('p',view.event.date+' · '+view.event.status,dialog);const format=node('p',view.format,dialog);format.className='evening-format';
  const list=node('dl',undefined,dialog);list.className='evening-rules';for(const row of view.rows){node('dt',row.title,list);node('dd',row.text,list);}
  node('p','Registered in Nakka: '+(view.registered??'Unavailable')+' · '+view.pools,dialog);node('p',view.boardNote,dialog);
  const actions=node('div',undefined,dialog);actions.className='evening-actions';const edit=button('CHANGE SETTINGS',actions,()=>editForm());edit.disabled=!view.editable;
  if(view.blocked)node('p',view.creationReviewRequired?'The existing event check needs attention. See the message above.':view.blocked,dialog);
  button('POOL PLANNER',actions,()=>{close();document.getElementById('poolPlannerButton')?.click();});
  
  button('CHANGE EVENT DATE',actions,()=>{close();window.BeautyEventControlDate?.();});button('RELOAD SETTINGS',actions,load);button('CONTINUE TO EVENT',actions,close);
  const link=node('a','OPEN NAKKA EVENT ↗',dialog);link.href=view.event.url;link.target='_blank';link.rel='noopener noreferrer';
  node('p','Saved in Nakka · checked '+new Date(view.checkedAt).toLocaleTimeString('en-GB',{timeZone:'Europe/Stockholm'}),dialog).className='evening-checked';
 }
 function editForm(draft){
  const token=++revision;header('CHANGE EVENT SETTINGS');node('p',view.event.title+' · '+view.event.date,dialog);
  draft=draft||JSON.parse(JSON.stringify(view.config));const form=node('div',undefined,dialog);form.className='create-event-settings';const readers=[];
  for(const [key,title]of [['groups','Groups / Round Robin'],['stage1','Slutspel 1'],['stage2','Slutspel 2']]){
   const box=node('fieldset',undefined,form);node('legend',title,box);const label=node('label',undefined,box),enabled=node('input',undefined,label);enabled.type='checkbox';enabled.checked=draft[key]!==null;enabled.setAttribute('aria-label','Enable '+title);label.appendChild(document.createTextNode(' Enabled'));
   const value=draft[key]||{legs:2,finalLegs:key==='stage1'?3:2,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2,slots:16},inputs=[];
   function number(title,n,min=1,max=99,step=1){const l=node('label',title,box),input=node('input',undefined,l);input.type='number';input.value=String(n);input.min=String(min);input.max=String(max);input.step=String(step);input.required=true;input.setAttribute('aria-label',key+' '+title);inputs.push(input);return input;}
   const legs=number('Legs to win',value.legs),final=key==='groups'?null:number('Final legs to win',value.finalLegs),limitLabel=node('label','Limit darts per leg ',box),limit=node('input',undefined,limitLabel);limit.type='checkbox';limit.checked=value.maxDarts!==null;inputs.push(limit);const darts=number('Darts per player (multiples of 3)',value.maxDarts||39,3,297,3);
   const thirdLabel=key==='groups'?null:node('label','Third-place match ',box),third=thirdLabel?node('input',undefined,thirdLabel):null;if(third){third.type='checkbox';third.checked=value.thirdPlace;inputs.push(third);}const thirdLegs=third?number('Third-place legs to win',value.thirdPlaceLegs):null,slots=third?number('Bracket slots (2, 4, 8, 16, 32, 64, 128)',value.slots||16,2,128):null;
   const sync=()=>{inputs.forEach(n=>n.disabled=!enabled.checked);darts.disabled=!enabled.checked||!limit.checked;if(thirdLegs)thirdLegs.disabled=!enabled.checked||!third.checked;};enabled.addEventListener('change',sync);limit.addEventListener('change',sync);third?.addEventListener('change',sync);sync();
   readers.push({inputs,read:()=>[key,!enabled.checked?null:{legs:Number(legs.value),maxDarts:limit.checked?Number(darts.value):null,...(third?{finalLegs:Number(final.value),thirdPlace:third.checked,thirdPlaceLegs:Number(thirdLegs.value),slots:Number(slots.value)}:{})}]});
  }
  button('USE MONDAY SETUP — RR + A/B',dialog,()=>{if(busy||token!==revision)return;const chosen=Object.fromEntries(readers.map(r=>r.read()));for(const key of ['groups','stage1','stage2'])chosen[key]={legs:2,maxDarts:39,...(key==='groups'?{}:{finalLegs:key==='stage1'?3:2,thirdPlace:false,thirdPlaceLegs:2,slots:chosen[key]?.slots||16})};editForm(chosen);});
  const status=node('p','Change only what you need, then review. Nothing is saved yet.',dialog);status.setAttribute('role','status');
  button('BACK TO SAVED SETUP',dialog,()=>overview());
  const review=button('REVIEW CHANGES',dialog,async()=>{if(busy||token!==revision)return;const bad=readers.flatMap(r=>r.inputs).find(n=>!n.disabled&&n.checkValidity?.()===false);if(bad){bad.reportValidity?.();return;}const chosen=Object.fromEntries(readers.map(r=>r.read()));busy=true;for(const b of dialog.querySelectorAll('button,input'))b.disabled=true;
   try{const r=await request('eveningprepare',{settings:JSON.stringify(chosen),version});if(!dialog||token!==revision)return;busy=false;reviewChanges(r,chosen);}catch(e){if(dialog&&token===revision){busy=false;editForm(chosen);node('p',e.message,dialog);}}finally{if(token===revision)busy=false;}
  });
 }
 function reviewChanges(review,draft){const token=++revision;header('REVIEW EVENT SETTINGS');node('p',review.title+' · '+review.date+' · '+review.format,dialog);for(const text of review.summary)node('p',text,dialog);button('BACK TO CHANGES',dialog,()=>editForm(draft));
  const label=node('label',undefined,dialog),ack=node('input',undefined,label);ack.type='checkbox';label.appendChild(document.createTextNode(' These settings are correct. Save them to this Nakka event.'));
  const save=button('SAVE EVENT SETTINGS',dialog,async()=>{if(busy||save.disabled||token!==revision)return;busy=true;for(const n of dialog.querySelectorAll('button,input'))n.disabled=true;try{const r=await request('eveningsave',{ticket:review.ticket,confirmed:'true'});if(!dialog||token!==revision)return;busy=false;header();node('p',r.message,dialog);button('SHOW SAVED EVENT SETUP',dialog,load);button('CLOSE',dialog,close);document.dispatchEvent(new Event('beauty-nakka-operation-complete'));}catch(e){if(dialog&&token===revision){busy=false;header();node('p',e.message,dialog);button('RELOAD SAVED SETUP',dialog,load);button('CLOSE',dialog,close);}}finally{if(token===revision)busy=false;}});save.disabled=true;ack.addEventListener('change',()=>save.disabled=!ack.checked);
 }
 window.BeautyEveningSetup=Object.freeze({open:start});
})();

