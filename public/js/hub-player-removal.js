/* TEST-only staff removal: one preview, explicit confirmation, no save retry. */
(() => {
  let dialog=null, busy=false, revision=0, opener=null;
  const close=()=>{if(busy)return;revision++;dialog?.close();dialog?.remove();dialog=null;opener?.focus();};
  async function send(page,input){
    const url=new URL(BeautyHubServices.endpoint);url.search='';url.searchParams.set('page',page);
    for(const [k,v] of Object.entries(input))url.searchParams.set(k,v);
    return (await BeautyHubServices.request(url.toString())).json();
  }
  function node(tag,text,parent){const el=document.createElement(tag);if(text!==null)el.textContent=text;parent?.appendChild(el);return el;}
  async function open(player,button){
    if(busy)return;close();opener=button;
    const generation=BeautyHubAuth.generation(),version=++revision;
    const valid=()=>version===revision&&BeautyHubAuth.isCurrent(generation)&&dialog?.isConnected;
    const input={player:player.player||player.newPlayer,eventDate:window.beautyHubData?.eventDate||''};
    const panel=dialog=document.createElement('dialog');panel.className='remove-player-dialog';panel.setAttribute('aria-labelledby','removePlayerTitle');
    const x=node('button','×',panel);x.type='button';x.className='remove-player-close';x.setAttribute('aria-label','Close remove player');x.addEventListener('click',close);
    const title=node('h2','Remove player — TEST',panel);title.id='removePlayerTitle';
    const detail=node('p','Checking '+input.player+'…',panel);detail.setAttribute('role','status');
    panel.addEventListener('cancel',event=>{event.preventDefault();close();});
    document.body.appendChild(panel);panel.showModal();x.focus();
    try{
      const preview=await send('removepreview',input);if(!valid())return;
      if(!preview.success){detail.textContent=preview.error||'Removal could not be checked.';return;}
      detail.textContent='Player: '+preview.player+'\nEvent: '+preview.event.title+' · '+preview.event.date+'\nLeague player ID: '+preview.identity.lpid+'\nNakka event entry ID: '+(preview.tpid||'Not present — Hub registration only')+'\nHub status: '+preview.statusInHub+'\n\nThis removes the registration from this Hub event and its Nakka event entry. The league profile is kept. Close Nakka editing pages before confirming.';
      const label=node('label',null,panel),check=node('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode('I have checked this player and event, and want to remove this registration.'));
      const save=node('button','REMOVE FROM EVENT',panel);save.type='button';save.className='remove-player-confirm';save.disabled=true;
      check.addEventListener('change',()=>{save.disabled=!check.checked||busy;});
      save.addEventListener('click',async()=>{
        if(busy||!check.checked||!valid())return;
        busy=true;save.disabled=true;check.disabled=true;x.disabled=true;
        detail.textContent+='\n\nRemoving…';
        try{
          const result=await send('removesave',{...input,ticket:preview.ticket,confirmed:'true'});
          if(!valid())return;
          save.remove();label.remove();
          detail.textContent=result.success&&result.readbackVerified?'Removed '+input.player+' from this event. League profile kept.':(result.error||'Result uncertain. Inspect Hub and Nakka before another action.');
          if(result.journal)detail.textContent+='\nReference: '+result.journal;
          if(result.backup)detail.textContent+='\nRecovery sheet: '+result.backup;
          if(result.success&&result.readbackVerified&&result.data)updateHub(result.data);
        }catch(e){if(valid()){save.remove();label.remove();detail.textContent='The result is uncertain. Do not repeat removal. Inspect the Hub and Nakka event.';}}
        finally{busy=false;x.disabled=false;}
      });
    }catch(e){if(valid())detail.textContent='The removal preview could not be loaded. Nothing was confirmed.';}
  }
  document.addEventListener('beauty-hub-locked',()=>{revision++;busy=false;dialog?.close();dialog?.remove();dialog=null;opener=null;});
  window.BeautyPlayerRemoval=Object.freeze({open});
})();
