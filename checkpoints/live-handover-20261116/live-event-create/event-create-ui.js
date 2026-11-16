/* Same approved event form, with LIVE archive/switch and durable create recovery. */
(()=>{'use strict';let active=null;
 function open(choice,resolving=false){if(active)return;let busy=false,revision=0,ticket=1;const current=1,generation=BeautyHubAuth.generation(),context=choice.context;
  const dialog=document.createElement('dialog');dialog.className='message-popup event-inspection event-selector beauty-live-create';dialog.setAttribute('aria-label','Event Setup');document.body.append(dialog);active=dialog;
  const add=(tag,text,parent=dialog)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
  const close=()=>{if(busy)return;ticket++;dialog.close();dialog.remove();active=null;document.removeEventListener('beauty-hub-locked',locked);};
  const locked=()=>{busy=false;close();};document.addEventListener('beauty-hub-locked',locked);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  const x=add('button','×');x.type='button';x.className='message-popup-close';x.setAttribute('aria-label','Close Event Setup');x.addEventListener('click',close);
  add('h2','EVENT SETUP');add('p',choice.title+' · '+choice.date);const target=add('section');target.className='event-nakka-step';
  const paragraph=text=>add('p',text,target),focusResult=()=>{target.setAttribute('tabindex','-1');target.focus();};
  const button=(text,fn,parent=target)=>{const n=add('button',text,parent);n.type='button';n.addEventListener('click',fn);return n;};
  const valid=()=>current===ticket&&BeautyHubAuth.isCurrent(generation);
  const request=(action,input)=>new Promise((resolve,reject)=>{let token;try{token=BeautyHubAuth.token();}catch(e){reject(e);return;}google.script.run.withSuccessHandler(r=>{if(!valid())return; if(r?.code==='AUTH_REQUIRED'){BeautyHubAuth.expired();reject(Error('Sign in to continue.'));return;}resolve(r);}).withFailureHandler(()=>reject(Error('Reply unavailable. Resolve the saved issue before creating again.'))).beautyHubTest('eventCreate:'+action,{_context:context,...input},token);});
  let draft=(choice.title+' '+choice.date).slice(0,60),formatDraft={mode:'combined',stage1:true,stage2:true};
  let settingsDraft={groups:{legs:2,maxDarts:39},stage1:{legs:2,finalLegs:3,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2},stage2:{legs:2,finalLegs:2,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2}};
  function advanced(report){const d=add('details',undefined,target);add('summary','Advanced',d);add('pre',JSON.stringify(report,(key,value)=>key==='ticket'?undefined:value,2),d);}
  function showIssue(r){target.replaceChildren();paragraph('Issue not solved');paragraph(r.uncertain?'The saved event creation needs checking.':r.error||'Event setup needs review.');if(r.uncertain)button('Resolve issue',resolve);else button('Back to Event Setup',showDraft);advanced(r);button('Close',close);}
  async function refresh(){await loadBeautyHubData();window.BeautyHubChrome?.refresh();document.dispatchEvent(new Event('beauty-nakka-operation-complete'));}
  function showResult(r){target.replaceChildren();paragraph(r.outcome==='SELECTED'?'✓ Event created and selected.':r.outcome==='EXISTING'?'Event found.':'✓ Event created.');if(r.outcome!=='SELECTED')paragraph('Open the new event when ready. The current registrations will be kept in event history.');
   button('CONTINUE TO EVENT',async()=>{if(busy)return;busy=true;try{if(r.outcome!=='SELECTED')await BeautyHubServices.context('activate',{mode:'league',leagueId:choice.leagueId,eventId:r.event.eventId||r.event.id,date:choice.date});await refresh();if(!valid())return;busy=false;close();window.BeautyHubNavigation?.dashboard();}catch(e){if(valid()){busy=false;showIssue({uncertain:true,error:e.message});}}});advanced(r);if(r.outcome==='SELECTED')void refresh();
  }
  async function resolve(){if(busy)return;busy=true;target.replaceChildren();paragraph('Checking…');try{const r=await request('resolve',{leagueId:choice.leagueId,date:choice.date});if(!valid())return;busy=false;r.success?showResult(r):showIssue(r);}catch(e){if(valid()){busy=false;showIssue({uncertain:true,error:e.message});}}}
        const showDraft=()=>{
          const version=++revision;target.replaceChildren();paragraph('No event for '+(choice.date)+'.');
          const name=document.createElement('input');name.value=draft;name.maxLength=60;name.setAttribute('aria-label','Event name');target.append(name);
          const hint=document.createElement('p');hint.className='create-settings-help';hint.textContent='Event name (maximum 60 characters).';target.append(hint);
          const formatBox=document.createElement('fieldset');formatBox.className='create-format-choice';target.append(formatBox);
          const formatLabel=document.createElement('label'),mode=document.createElement('select');formatLabel.append(document.createTextNode('Competition format'));mode.setAttribute('aria-label','Competition format');
          for(const [value,text]of [['rr','Round Robin only'],['knockout','Slutspel only'],['combined','Round Robin + Slutspel']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}mode.value=formatDraft.mode;formatLabel.append(mode);formatBox.append(formatLabel);
          const switches={},switchLabels={};for(const [key,text]of [['stage1','Enable Slutspel 1'],['stage2','Enable Slutspel 2']]){const label=document.createElement('label'),input=document.createElement('input');label.className='create-setting-toggle';input.type='checkbox';input.checked=formatDraft[key];input.setAttribute('aria-label',text);label.append(input,document.createTextNode(text));formatBox.append(label);switches[key]=input;switchLabels[key]=label;}
          const settings=document.createElement('div');settings.className='create-event-settings';target.append(settings);
          const controls=[],readers=[];
          for(const [key,title]of [['groups','Groups'],['stage1','Slutspel 1'],['stage2','Slutspel 2']]){
            const firstControl=controls.length,value=settingsDraft[key],box=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=title;box.append(legend);settings.append(box);
            const number=(text,initial,min=1,max=99,step=1)=>{
              const label=document.createElement('label'),input=document.createElement('input');label.append(document.createTextNode(text));input.type='number';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(initial);input.required=true;input.setAttribute('aria-label',title+' '+text);label.append(input);box.append(label);controls.push(input);return input;
            };
            const toggle=(text,initial)=>{
              const label=document.createElement('label'),input=document.createElement('input');label.className='create-setting-toggle';input.type='checkbox';input.checked=initial;input.setAttribute('aria-label',title+' '+text);label.append(input,document.createTextNode(text));box.append(label);controls.push(input);return input;
            };
            let slots=null,slotLabel=null;if(key!=='groups'){slotLabel=document.createElement('label');slots=document.createElement('select');slotLabel.append(document.createTextNode('Bracket slots'));slots.setAttribute('aria-label',title+' Bracket slots');for(const count of [2,4,8,16,32,64,128]){const option=document.createElement('option');option.value=String(count);option.textContent=String(count);slots.append(option);}slots.value=String(value.slots||16);slotLabel.append(slots);box.append(slotLabel);controls.push(slots);}
            const legs=number('Legs to win',value.legs),final=key==='groups'?null:number('Final: legs to win',value.finalLegs);
            const limit=toggle('Limit darts per leg',value.maxDarts!==null),darts=number('Darts per player (multiples of 3)',value.maxDarts||39,3,297,3);
            const third=key==='groups'?null:toggle('Third-place match',value.thirdPlace),thirdLegs=third?number('Third place: legs to win',value.thirdPlaceLegs):null;
            const sync=()=>{darts.disabled=!limit.checked;if(thirdLegs)thirdLegs.disabled=!third.checked;};limit.addEventListener('change',sync);third?.addEventListener('change',sync);sync();
            readers.push({key,box,slotLabel,inputs:controls.slice(firstControl),read:()=>[key,{legs:Number(legs.value),maxDarts:limit.checked?Number(darts.value):null,...(final?{finalLegs:Number(final.value),thirdPlace:third.checked,thirdPlaceLegs:Number(thirdLegs.value),slots:Number(slots.value)}:{})}],sync});
          }
          const monday=document.createElement('button');monday.type='button';monday.textContent='USE MONDAY SETUP — RR + A/B';target.append(monday);
          monday.addEventListener('click',()=>{if(monday.disabled||current!==ticket||version!==revision)return;draft=name.value;settingsDraft=Object.fromEntries(readers.map(r=>{const [key,value]=r.read();return [key,{legs:2,maxDarts:39,...(key==='groups'?{}:{finalLegs:key==='stage1'?3:2,thirdPlace:false,thirdPlaceLegs:2,slots:value.slots||16})}];}));formatDraft={mode:'combined',stage1:true,stage2:true};showDraft();});
          const help=document.createElement('p');help.className='create-settings-help';help.textContent='Dart limits use complete visits: 39 darts = 13 rounds. Nakka handles the decision at the limit. Third place is skipped when only two players qualify.';settings.append(help);
          const create=document.createElement('button');create.type='button';create.textContent='REVIEW CREATE EVENT';target.append(create);
          const syncFormat=()=>{for(const label of Object.values(switchLabels))label.hidden=mode.value==='rr';for(const r of readers){const selected=r.key==='groups'?mode.value!=='knockout':mode.value!=='rr'&&switches[r.key].checked;r.box.hidden=!selected;r.inputs.forEach(n=>n.disabled=!selected);r.sync();if(!selected)r.inputs.forEach(n=>n.disabled=true);if(r.slotLabel)r.slotLabel.hidden=mode.value!=='knockout';}for(const n of Object.values(switches))n.disabled=mode.value==='rr';create.disabled=mode.value!=='rr'&&!switches.stage1.checked&&!switches.stage2.checked;};
          mode.addEventListener('change',syncFormat);for(const input of Object.values(switches))input.addEventListener('change',syncFormat);syncFormat();
          create.addEventListener('click',async()=>{
            if(create.disabled||current!==ticket||version!==revision)return;if(controls.some(n=>!n.disabled&&n.checkValidity?.()===false)){controls.find(n=>!n.disabled&&n.checkValidity?.()===false)?.reportValidity?.();return;}draft=name.value;settingsDraft=Object.fromEntries(readers.map(r=>r.read()));formatDraft={mode:mode.value,stage1:switches.stage1.checked,stage2:switches.stage2.checked};const chosen=Object.fromEntries(Object.entries(settingsDraft).map(([key,value])=>{const selected=key==='groups'?mode.value!=='knockout':mode.value!=='rr'&&switches[key].checked;if(!selected)return [key,null];const copy={...value};if(mode.value!=='knockout')delete copy.slots;return [key,copy];}));monday.disabled=true;mode.disabled=true;Object.values(switches).forEach(n=>n.disabled=true);create.disabled=true;name.disabled=true;controls.forEach(n=>n.disabled=true);
            try{
              busy=true;const p=await request('prepare',{leagueId:choice.leagueId,date:choice.date,title:draft,settings:JSON.stringify(chosen)});busy=false;if(current!==ticket||version!==revision)return;
              if(!p.success)throw Error(p.error||'Could not review the event. Try reviewing again.');
              target.replaceChildren();paragraph(p.event.title+' · '+p.event.date+' · '+p.event.format);paragraph('The current event registrations will be kept in event history. Players and results are not copied to the new event.');
              for(const line of p.event.matchSettings||[])paragraph(line);
              const back=document.createElement('button');back.type='button';back.textContent='BACK TO EVENT SETUP';target.append(back);
              back.addEventListener('click',()=>{if(back.disabled||current!==ticket)return;showDraft();});
              const label=document.createElement('label'),ack=document.createElement('input');ack.type='checkbox';label.append(ack,document.createTextNode(' Create this event in Nakka and open it in the Hub.'));target.append(label);
              const confirm=document.createElement('button');confirm.type='button';confirm.textContent='CREATE EVENT';confirm.disabled=true;target.append(confirm);ack.addEventListener('change',()=>{confirm.disabled=!ack.checked;});
              confirm.addEventListener('click',async()=>{
                if(confirm.disabled||current!==ticket||version!==revision)return;confirm.disabled=true;ack.disabled=true;back.disabled=true;
                try{
                  busy=true;const r=await request('confirm',{ticket:p.ticket,confirmed:'true'});busy=false;if(current!==ticket||version!==revision)return;
                  if(r.success)showResult(r);else showIssue(r);focusResult();
                }catch(e){if(current===ticket&&version===revision){busy=false;showIssue({uncertain:true,error:'The reply was not received. Resolve the saved issue.'});focusResult();}}
              });focusResult();
            }catch(e){if(current===ticket&&version===revision){busy=false;paragraph(e.message);monday.disabled=false;create.disabled=false;name.disabled=false;mode.disabled=false;syncFormat();focusResult();}}
          });
        };
  const footer=add('div');footer.className='evening-actions';button('CHANGE EVENT DATE',()=>{if(busy)return;close();window.BeautyEventSelector.open('date');},footer);
  dialog.showModal();paragraph('Checking…');
  if(resolving){resolve();return;}
  busy=true;request('draft',{leagueId:choice.leagueId,date:choice.date}).then(r=>{if(!valid())return;busy=false;if(!r.success){showIssue(r);return;}if(r.creationPending){showIssue({uncertain:true,error:'A saved event creation needs checking.'});return;}if(r.events.length){target.replaceChildren();paragraph('An event already exists for this date.');for(const e of r.events)button(e.title,()=>showResult({outcome:'EXISTING',event:{...e,eventId:e.id}}));return;}showDraft();}).catch(e=>{if(valid()){busy=false;showIssue({error:e.message});}});
 }
 window.BeautyEventCreate=Object.freeze({open});
})();
