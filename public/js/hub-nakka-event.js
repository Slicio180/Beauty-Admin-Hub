/* Manual, read-only event and name comparison in the Identity TEST Hub. */
(() => {
  const button=document.getElementById('nakkaEventCheck'),compare=document.getElementById('nakkaCompare'),output=document.getElementById('nakkaEventResult');
  if(!compare||!output)return;
  let ticket=0,lastDate=null,lastPlayers=null;
  const dateNode=document.getElementById('currentEventDate');
  const snapshot=()=>JSON.stringify((window.beautyHubData?.players||[]).map(p=>[p.player,p.newPlayer,p.status]));
  const setBusy=busy=>{if(button)button.disabled=busy;compare.disabled=busy;};
  const reset=()=>{ticket++;lastDate=null;lastPlayers=null;output.replaceChildren();setBusy(false);};
  document.addEventListener('beauty-hub-locked',reset);
  const observe=()=>{if(lastDate!==null&&(dateNode?.textContent!==lastDate||(lastPlayers!==null&&snapshot()!==lastPlayers)))reset();};
  for(const node of [dateNode,document.getElementById('playersTableBody')])if(node)new MutationObserver(observe).observe(node,{childList:true,subtree:true,characterData:true});
  async function run(page,target=output){
    const paragraph=text=>{const p=document.createElement('p');p.textContent=text;target.append(p);};
    const focusResult=()=>{target.setAttribute?.('tabindex','-1');target.focus?.();target.scrollIntoView?.({block:'nearest'});};
    const current=++ticket,startedDate=dateNode?.textContent,startedPlayers=snapshot();setBusy(true);target.textContent='Checking Nakka…';
    try{
      const result=await(await BeautyHubServices.request('https://beauty.invalid/hub?page='+page)).json();
      if(current!==ticket)return;
      if(dateNode?.textContent!==startedDate||(page==='nakkacompare'&&snapshot()!==startedPlayers)){reset();target.textContent='The Hub date or players changed. Check again.';return;}
      target.replaceChildren();if(result.status!=='COMPARED')paragraph(result.message||'The event could not be checked.');
      if(result.status==='MATCHED'&&result.creationReviewRequired){
        paragraph('The event already exists. Verify its saved options against the creation audit; no event will be created again.');
        const verify=document.createElement('button');verify.type='button';verify.textContent='VERIFY EXISTING EVENT';target.append(verify);
        verify.addEventListener('click',async()=>{if(verify.disabled||current!==ticket)return;verify.disabled=true;try{const r=await(await BeautyHubServices.request('https://beauty.invalid/hub?page=nakkacreaterecover')).json();if(current!==ticket)return;target.replaceChildren();paragraph(r.message||r.error);focusResult();}catch(e){if(current===ticket){paragraph('Verification unavailable. No event was recreated. Check Nakka before continuing.');focusResult();}}});
      }
      if(result.status==='NOT_FOUND'){
        let draft=(window.beautyHubData?.activeEvent?.mode==='league'?window.beautyHubData.activeEvent.title+' · ':'AIK Hub TEST ')+(window.beautyHubData?.eventDate||''),revision=0;
        let formatDraft={mode:'combined',stage1:true,stage2:true};
        let settingsDraft={groups:{legs:2,maxDarts:39},stage1:{legs:2,finalLegs:3,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2},stage2:{legs:2,finalLegs:2,maxDarts:39,thirdPlace:false,thirdPlaceLegs:2}};
        const showDraft=()=>{
          const version=++revision;target.replaceChildren();paragraph('No event for '+(result.eventDate||window.beautyHubData?.eventDate||'this date')+'.');
          const name=document.createElement('input');name.value=draft;name.maxLength=60;name.setAttribute('aria-label','New TEST event name');target.append(name);
          const hint=document.createElement('p');hint.className='create-settings-help';hint.textContent=(window.beautyHubData?.activeEvent?'Event name (maximum 60 characters).':'Event name must start with AIK Hub TEST (maximum 60 characters).');target.append(hint);
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
              const u=new URL('https://beauty.invalid/hub');u.searchParams.set('page','nakkacreateprepare');u.searchParams.set('title',draft);u.searchParams.set('settings',JSON.stringify(chosen));
              const p=await(await BeautyHubServices.request(u.toString())).json();if(current!==ticket||version!==revision)return;
              if(!p.success)throw Error(p.error||'Could not review the event. Try reviewing again.');
              target.replaceChildren();paragraph(p.event.title+' · '+p.event.date+' · '+p.event.format);paragraph('Public read-only TEST display. Players and results are not copied.');
              for(const line of p.event.matchSettings||[])paragraph(line);
              const back=document.createElement('button');back.type='button';back.textContent='BACK TO EVENT SETUP';target.append(back);
              back.addEventListener('click',()=>{if(back.disabled||current!==ticket)return;showDraft();});
              const label=document.createElement('label'),ack=document.createElement('input');ack.type='checkbox';label.append(ack,document.createTextNode(' Create this TEST event in Nakka.'));target.append(label);
              const confirm=document.createElement('button');confirm.type='button';confirm.textContent='CREATE EVENT — TEST';confirm.disabled=true;target.append(confirm);ack.addEventListener('change',()=>{confirm.disabled=!ack.checked;});
              confirm.addEventListener('click',async()=>{
                if(confirm.disabled||current!==ticket||version!==revision)return;confirm.disabled=true;ack.disabled=true;back.disabled=true;
                try{
                  const u=new URL('https://beauty.invalid/hub');u.searchParams.set('page','nakkacreateconfirm');u.searchParams.set('ticket',p.ticket);u.searchParams.set('confirmed','true');
                  const r=await(await BeautyHubServices.request(u.toString())).json();if(current!==ticket||version!==revision)return;
                  target.replaceChildren();paragraph(r.message||r.error||'Creation outcome unavailable. Inspect Nakka before retrying.');
                  if(r.success===false&&!r.uncertain){const retry=document.createElement('button');retry.type='button';retry.textContent='REVIEW AGAIN';retry.addEventListener('click',showDraft);target.append(retry);}
                  focusResult();
                }catch(e){if(current===ticket&&version===revision){target.replaceChildren();paragraph('Creation outcome unavailable. Inspect Nakka before retrying.');focusResult();}}
              });focusResult();
            }catch(e){if(current===ticket&&version===revision){paragraph(e.message);monday.disabled=false;create.disabled=false;name.disabled=false;mode.disabled=false;syncFormat();focusResult();}}
          });
        };showDraft();
      }
      if(result.status==='COMPARED'&&result.comparison){
        paragraph('Hub: '+result.hubCount+' · Nakka: '+result.nakkaCount+' · Snapshot: '+new Date(result.checkedAt).toLocaleString('en-GB',{timeZone:'Europe/Stockholm'}));
        paragraph('Matching names do not confirm permanent player identity. OUT and STANDBY remain visible for review.');
        for(const [key,title] of [['both','Same name on both lists'],['hubOnly','Hub only'],['nakkaOnly','Nakka only'],['ambiguous','Duplicate names — needs review']]){
          const rows=result.comparison[key];if(!Array.isArray(rows))throw Error('Invalid comparison');
          const section=document.createElement('details'),summary=document.createElement('summary');summary.textContent=title+' ('+rows.length+')';section.append(summary);
          if(rows.length){const list=document.createElement('ul');for(const row of rows){const item=document.createElement('li');item.textContent=row.name+(key==='ambiguous'?' — Hub '+row.hubCount+', Nakka '+row.nakkaCount:row.status?' — '+row.status:'');list.append(item);}section.append(list);}
          target.append(section);
        }
        lastPlayers=startedPlayers;
      }else lastPlayers=null;
      lastDate=dateNode?.textContent??'';focusResult();
    }catch(e){if(current===ticket){target.replaceChildren();paragraph('The Nakka check could not be completed. Sign in and try again.');}}
    finally{if(current===ticket)setBusy(false);}
  }
  button?.addEventListener('click',()=>run('nakkaevent'));
  window.BeautyNakkaEventCheck=target=>{if(!target)document.getElementById('nakkaNavButton')?.click();return run('nakkaevent',target||output);};
  window.BeautyNakkaEventCancel=()=>{ticket++;setBusy(false);};
  document.getElementById('nakkaSelectEvent')?.addEventListener('click',()=>window.BeautyNakkaEventCheck());
  compare.addEventListener('click',()=>run('nakkacompare'));
})();

