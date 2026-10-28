/* Manual, read-only event and name comparison in the Identity TEST Hub. */
(() => {
  const button=document.getElementById('nakkaEventCheck'),compare=document.getElementById('nakkaCompare'),output=document.getElementById('nakkaEventResult');
  if(!button||!compare||!output)return;
  let ticket=0,lastDate=null,lastPlayers=null;
  const dateNode=document.getElementById('currentEventDate');
  const snapshot=()=>JSON.stringify((window.beautyHubData?.players||[]).map(p=>[p.player,p.newPlayer,p.status]));
  const setBusy=busy=>{button.disabled=busy;compare.disabled=busy;};
  const reset=()=>{ticket++;lastDate=null;lastPlayers=null;output.replaceChildren();setBusy(false);};
  document.addEventListener('beauty-hub-locked',reset);
  const observe=()=>{if(lastDate!==null&&(dateNode?.textContent!==lastDate||(lastPlayers!==null&&snapshot()!==lastPlayers)))reset();};
  for(const node of [dateNode,document.getElementById('playersTableBody')])if(node)new MutationObserver(observe).observe(node,{childList:true,subtree:true,characterData:true});
  const paragraph=text=>{const p=document.createElement('p');p.textContent=text;output.append(p);};
  async function run(page){
    const current=++ticket,startedDate=dateNode?.textContent,startedPlayers=snapshot();setBusy(true);output.textContent='Checking Nakka…';
    try{
      const result=await(await BeautyHubServices.request('https://beauty.invalid/hub?page='+page)).json();
      if(current!==ticket)return;
      if(dateNode?.textContent!==startedDate||(page==='nakkacompare'&&snapshot()!==startedPlayers)){reset();output.textContent='The Hub date or players changed. Check again.';return;}
      output.replaceChildren();paragraph(result.message||'The event could not be checked.');
      if(result.eventDate)paragraph('Hub date: '+result.eventDate);
      if(['MATCHED','COMPARED'].includes(result.status)&&result.event){
        const event=result.event;
        if(!/^t_[A-Za-z0-9_]{1,80}$/.test(event.id)||event.url!=='https://n01darts.com/n01/league/season.php?id='+encodeURIComponent(event.id))throw Error('Invalid event link');
        const link=document.createElement('a');link.textContent=event.title+' ('+event.id+') ↗';link.href=event.url;link.target='_blank';link.rel='noopener noreferrer';link.style.color='#ffd700';output.append(link);
      }
      if(result.status==='COMPARED'&&result.comparison){
        paragraph('Hub: '+result.hubCount+' · Nakka: '+result.nakkaCount+' · Snapshot: '+new Date(result.checkedAt).toLocaleString());
        paragraph('Matching names do not confirm permanent player identity. OUT and STANDBY remain visible for review.');
        for(const [key,title] of [['both','Same name on both lists'],['hubOnly','Hub only'],['nakkaOnly','Nakka only'],['ambiguous','Duplicate names — needs review']]){
          const rows=result.comparison[key];if(!Array.isArray(rows))throw Error('Invalid comparison');
          const section=document.createElement('details'),summary=document.createElement('summary');summary.textContent=title+' ('+rows.length+')';section.append(summary);
          if(rows.length){const list=document.createElement('ul');for(const row of rows){const item=document.createElement('li');item.textContent=row.name+(key==='ambiguous'?' — Hub '+row.hubCount+', Nakka '+row.nakkaCount:row.status?' — '+row.status:'');list.append(item);}section.append(list);}
          output.append(section);
        }
        lastPlayers=startedPlayers;
      }else lastPlayers=null;
      lastDate=dateNode?.textContent??'';
    }catch(e){if(current===ticket){output.replaceChildren();paragraph('The Nakka check could not be completed. Sign in and try again.');}}
    finally{if(current===ticket)setBusy(false);}
  }
  button.addEventListener('click',()=>run('nakkaevent'));
  compare.addEventListener('click',()=>run('nakkacompare'));
})();
