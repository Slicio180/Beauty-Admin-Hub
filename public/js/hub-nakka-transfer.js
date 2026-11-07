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
  function openTransfer(player){
    if(dialog)return;
    dialog=make('dialog');dialog.className='pool-planner';dialog.setAttribute('aria-label','Transfer one player to Nakka TEST');
    const active=dialog;
    const title=make('h2','Check & review player — TEST');
    const note=make('p','Only the selected date-matched TEST event. Existing league players only; IN status required. Close the Nakka editing page before confirming so it cannot overwrite the change.');
    const label=make('label','Hub player '),select=make('select');select.setAttribute('aria-label','Hub player to transfer');
    const empty=make('option','Choose an IN player');empty.value='';select.append(empty);
    const names=new Set();
    for(const p of window.beautyHubData?.players||[]){const name=p.player||p.newPlayer;if(p.status==='IN'&&name&&!names.has(name)){const option=make('option',name);option.value=name;select.append(option);names.add(name);}}
    label.append(select);
    const named=typeof player==='string'&&names.has(player);
    if(named){
      title.textContent=player;
      note.textContent='Your Hub registration is saved. We will check this player and show the available next steps.';
    }
    const review=make('button','CHECK PLAYER');review.type='button';review.disabled=true;
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
    function recoveryChoices(result){
      const r=result.recovery;
      if(!r||r.event?.id!==result.event?.id||r.player!==select.value||!/^t_[A-Za-z0-9_]{1,80}$/.test(r.event?.id||'')||r.event?.date!==window.beautyHubData?.eventDate||
         !['CONFIRMED_ENTRY_MISSING','UNCONFIRMED_ENTRY_MISSING'].includes(r.kind))return false;
      const confirmed=r.kind==='CONFIRMED_ENTRY_MISSING';
      output.append(make('h3',confirmed?'Choose what should happen next':'Check the earlier unconfirmed request'));
      output.append(make('p','Player: '+r.player+' · Event: '+r.event.title+' · '+r.event.date));
      output.append(make('p','Use the existing league player: '+r.identity.name+' · League player ID: '+r.identity.lpid));
      const link=make('a',confirmed?'1. RESTORE ENTRY IN NAKKA':'OPEN TEST ENTRY LIST');
      link.href='https://n01darts.com/n01/league/season.php?id='+encodeURIComponent(r.event.id);link.target='_blank';link.rel='noopener noreferrer';
      output.append(link);
      if(confirmed){
        const steps=make('ol');
        for(const text of [
          'Open the TEST event entry list. Confirm '+r.player+' is absent.',
          'Choose Add from league, select the existing '+r.identity.name+' profile, and save the entry list. Do not create a new league player.',
          'Close the Nakka editing tab, return here, and click CHECK RESTORED ENTRY.',
          'Review the returned entry and confirm it. The Hub keeps the earlier transfer history.'
        ])steps.append(make('li',text));
        output.append(steps);
        const check=make('button','CHECK RESTORED ENTRY');check.type='button';check.addEventListener('click',()=>review.click());output.append(check);
        output.append(make('h3','Or remove this registration'));
        output.append(make('p','If this player should not take part, remove their Hub registration. The next screen checks Nakka again and asks for confirmation. Their league profile is kept.'));
        const remove=make('button','2. REMOVE HUB REGISTRATION');remove.type='button';
        remove.addEventListener('click',()=>{
          if(saving||signature()!==original)return;
          const rows=(window.beautyHubData?.players||[]).filter(p=>(p.player||p.newPlayer)===r.player);
          if(rows.length!==1||!window.BeautyPlayerRemoval?.open)return;
          const row=rows[0];dismiss();window.BeautyPlayerRemoval.open(row,open);
        });output.append(remove);
      }else{
        output.append(make('p','The earlier request has no confirmed result. This screen cannot safely offer another add. Inspect the TEST entry list without changing it. If the player is present, close that editing tab and check again to review the current entry. If absent, keep this registration and transfer reference for organiser investigation.'));
        const check=make('button','CHECK CURRENT ENTRY AGAIN');check.type='button';check.addEventListener('click',()=>review.click());output.append(check);
      }
      if(result.journal){
        const details=make('details');details.append(make('summary','Support reference'),make('p',result.journal));output.append(details);
      }
      return true;
    }

    review.addEventListener('click',async()=>{
      if(!select.value||saving||signature()!==original)return;
      const ticket=++generation;invalidate();review.disabled=true;select.disabled=true;output.textContent='Checking TEST event, Hub player and existing league identity…';
      try{
        const result=await request('nakkatransferpreview',{player:select.value});
        if(ticket!==generation||!dialog)return;
        output.replaceChildren();output.append(make('p',result.error||result.message||'Preview unavailable. No add was sent.'));
        if(!result.success||!['PREVIEW','REVIEW_EXISTING'].includes(result.status)){
          if(result.success&&result.readbackVerified)document.dispatchEvent(new CustomEvent('beauty-nakka-operation-complete'));
          if(!result.success&&!recoveryChoices(result)){const next=make('p',result.code==='TRANSFER_REVIEW_REQUIRED'?'Next: inspect the current TEST entry and original transfer record. This check could not reconcile them; no new add is offered.':result.code==='PLAYER_NOT_ELIGIBLE'?'Next: close this review and check that the player is IN.':'Next: resolve the reported event or identity issue, then let the automatic check confirm the result. Do not submit another registration.');output.append(next);}
          return;
        }
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
            document.dispatchEvent(new CustomEvent('beauty-nakka-operation-complete'));
            if(result.journal)output.append(make('p','Earlier transfer reference: '+result.journal));
            if(result.review)output.append(make('p','Review reference: '+result.review));
            if(result.status==='TRANSFERRED'&&(result.readbackVerified!==true||result.identityVerified!==true))output.append(make('p','Verification incomplete. Do not repeat this request.'));
          }catch(e){if(saveTicket===generation&&dialog){output.textContent=existingReview?'Review result unavailable. This action does not add or delete Nakka players. Check the attention state before reviewing again.':'No verified response. The player may have been added. Do not retry; inspect the Nakka TEST event and journal.';document.dispatchEvent(new CustomEvent('beauty-nakka-operation-complete'));}}
          finally{if(dialog===active){saving=false;closeTile.disabled=close.disabled=false;}observer.disconnect();}
        });
        output.append(ackLabel,confirm);
      }catch(e){if(ticket===generation&&dialog)output.textContent='Preview could not be checked. Sign in and reopen this window.';}
      finally{if(ticket===generation&&dialog){review.disabled=false;select.disabled=false;}}
    });
    dialog.append(closeTile,title,note);if(!named)dialog.append(label,review);dialog.append(output,close);document.body.append(dialog);dialog.showModal();
    if(typeof player==='string'&&names.has(player)){select.value=player;review.disabled=false;review.click();closeTile.focus();}else select.focus();
  }
  open.addEventListener('click',()=>openTransfer());
  window.BeautyNakkaTransfer=Object.freeze({open:openTransfer});
})();
