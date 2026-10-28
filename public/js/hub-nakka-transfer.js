/* Dedicated Identity TEST, one selected IN player per explicit confirmation. */
(() => {
  const host=document.getElementById('nakkaEventResult');if(!host)return;
  const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const open=make('button','TRANSFER ONE PLAYER — TEST');open.type='button';open.id='nakkaTransferOpen';
  host.parentElement.append(open);
  let dialog=null,generation=0,saving=false,activeObserver=null;
  const signature=()=>JSON.stringify([window.beautyHubData?.eventDate,(window.beautyHubData?.players||[]).map(p=>[p.player,p.newPlayer,p.status])]);
  const reset=()=>{generation++;activeObserver?.disconnect();activeObserver=null;dialog?.remove();dialog=null;saving=false;};
  document.addEventListener('beauty-hub-locked',reset);
  async function request(page,input){
    const url=new URL('https://beauty.invalid/hub');url.searchParams.set('page',page);
    for(const [key,value]of Object.entries(input))url.searchParams.set(key,value);
    return (await BeautyHubServices.request(url.toString())).json();
  }
  open.addEventListener('click',()=>{
    if(dialog)return;
    dialog=make('dialog');dialog.className='pool-planner';dialog.setAttribute('aria-label','Transfer one player to Nakka TEST');
    const active=dialog;
    const title=make('h2','Transfer one player — TEST');
    const note=make('p','Only Beauty Hub TEST — DO NOT USE LIVE (t_RqC2_2034). Existing league players only; IN status required. Close the Nakka editing page before confirming so it cannot overwrite the change.');
    const label=make('label','Hub player '),select=make('select');select.setAttribute('aria-label','Hub player to transfer');
    const empty=make('option','Choose an IN player');empty.value='';select.append(empty);
    const names=new Set();
    for(const p of window.beautyHubData?.players||[]){const name=p.player||p.newPlayer;if(p.status==='IN'&&name&&!names.has(name)){const option=make('option',name);option.value=name;select.append(option);names.add(name);}}
    label.append(select);
    const review=make('button','REVIEW TRANSFER');review.type='button';review.disabled=true;
    const output=make('section');output.setAttribute('role','status');output.setAttribute('aria-live','polite');
    const close=make('button','CLOSE');close.type='button';
    const dismiss=()=>{if(saving)return;observer.disconnect();reset();open.focus();};
    const closeTile=make('button','×');closeTile.type='button';closeTile.className='pool-close';closeTile.setAttribute('aria-label','Close transfer review');
    closeTile.addEventListener('click',dismiss);
    close.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
    const original=signature();let prepared=null,ack=null,confirm=null;
    function invalidate(){prepared=null;if(ack)ack.checked=false;if(confirm)confirm.disabled=true;}
    const observer=new MutationObserver(()=>{
      if(signature()===original)return;
      generation++;invalidate();review.disabled=true;select.disabled=true;
      output.textContent=saving?'The Hub data changed while saving. Inspect the Nakka TEST event and transfer journal before another attempt.':'The Hub event or player list changed. Close this window and review again.';
    });
    activeObserver=observer;
    const table=document.getElementById('playersTableBody');if(table)observer.observe(table,{childList:true,subtree:true,characterData:true});
    select.addEventListener('change',()=>{generation++;invalidate();output.replaceChildren();review.disabled=!select.value;});
    review.addEventListener('click',async()=>{
      if(!select.value||saving||signature()!==original)return;
      const ticket=++generation;invalidate();review.disabled=true;select.disabled=true;output.textContent='Checking TEST event, Hub player and existing league identity…';
      try{
        const result=await request('nakkatransferpreview',{player:select.value});
        if(ticket!==generation||!dialog)return;
        output.replaceChildren();output.append(make('p',result.error||result.message||'Preview unavailable.'));
        if(!result.success||!['PREVIEW','REVIEW_EXISTING'].includes(result.status))return;
        const existingReview=result.status==='REVIEW_EXISTING';
        prepared=result;
        output.append(make('p','Event: '+result.event.title+' · '+result.event.date+' · '+result.event.id));
        output.append(make('p','Hub player: '+result.player));
        output.append(make('p','Existing league player: '+result.identity.name+' · LPID: '+result.identity.lpid));
        if(existingReview)output.append(make('p','Current Nakka event entry ID: '+result.tpid));
        const ackLabel=make('label');ack=make('input');ack.type='checkbox';
        ackLabel.append(ack,make('span',existingReview?'I have checked this existing event entry and league player. Record my review without adding or removing anyone.':'I have checked that this is the correct league player and TEST event.'));
        confirm=make('button',existingReview?'CONFIRM EXISTING ENTRY':'ADD THIS PLAYER TO TEST EVENT');confirm.type='button';confirm.disabled=true;
        ack.addEventListener('change',()=>{confirm.disabled=!ack.checked||!prepared;});
        confirm.addEventListener('click',async()=>{
          if(!prepared||!ack.checked||saving||signature()!==original)return;
          if(Date.now()>=prepared.expires){invalidate();output.textContent='Preview expired. Review again.';return;}
          const preview=prepared,saveTicket=++generation;prepared=null;saving=true;
          closeTile.disabled=close.disabled=select.disabled=review.disabled=ack.disabled=confirm.disabled=true;
          output.append(make('p',existingReview?'Recording your review. No Nakka add or deletion will be sent.':'Saving once. Do not retry or edit Nakka while this request is running.'));
          try{
            const result=await request('nakkatransfersave',{player:preview.player,ticket:preview.ticket,confirmed:'true'});
            if(saveTicket!==generation||!dialog)return;
            output.replaceChildren();output.append(make('p',result.error||result.message||'No verified result. Inspect the TEST event before trying again.'));
            if(result.journal)output.append(make('p','Original journal retained: '+result.journal));
            if(result.review)output.append(make('p','Review reference: '+result.review));
            if(result.status==='TRANSFERRED'&&(result.readbackVerified!==true||result.identityVerified!==true))output.append(make('p','Verification incomplete. Do not repeat this request.'));
          }catch(e){if(saveTicket===generation&&dialog){output.textContent=existingReview?'Review result unavailable. This action does not add or delete Nakka players. Check the attention state before reviewing again.':'No verified response. The player may have been added. Do not retry; inspect the Nakka TEST event and journal.';}}
          finally{if(dialog===active){saving=false;closeTile.disabled=close.disabled=false;}observer.disconnect();}
        });
        output.append(ackLabel,confirm);
      }catch(e){if(ticket===generation&&dialog)output.textContent='Preview could not be checked. Sign in and reopen this window.';}
      finally{if(ticket===generation&&dialog){review.disabled=false;select.disabled=false;}}
    });
    dialog.append(closeTile,title,note,label,review,output,close);document.body.append(dialog);dialog.showModal();select.focus();
  });
})();
