/* AIK dashboard presentation and staff-only attention review. No mutation retry. */
(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  let data=null,attention=null,panel=null,requestId=0,busy=false,refreshQueued=false,requestError='',inFlight=false;
  const messages={
    LEAGUE_IDENTITY_REVIEW:'The league identity is missing or has duplicate names. Review the player in Nakka.',
    HUB_IDENTITY_REVIEW:'The Hub name is missing or appears more than once. Review the registrations.',
    MISSING_EVENT_ENTRY:'Registration is saved, but this player is missing from Nakka.',
    IDENTITY_CONFLICT:'The event has duplicate or conflicting player identity details.',
    LEAGUE_CREATION_REVIEW_REQUIRED:'A previous league creation remains uncertain. Inspect Nakka and the creation journal; do not repeat registration.',
    TRANSFER_REVIEW_REQUIRED:'This player’s Nakka entry needs review. Open the player to see the next steps.',
    LEAGUE_CREATION_UNCERTAIN:'League creation may have saved. Inspect Nakka; do not register again.',
    TRANSFER_UNCERTAIN:'The transfer may have saved. Inspect Nakka; do not retry.',
    REMOVE_UNCERTAIN:'A removal may be partly saved. Keep the recovery reference; do not repeat removal.',
    REMOVE_REVIEW_REQUIRED:'An earlier removal needs reconciliation. Check the recovery record before any new change.'
  };
  const explain=code=>messages[code]||'Registration is saved, but the Nakka entry is unconfirmed. Review Nakka before another action.';
  function render() {
    const items=attention?.items||[],count=items.length;
    const available=attention?.available===true;
    if(get('attentionCount'))get('attentionCount').textContent=count||available?String(count):'—';
    const needsReview=!!data&&(count>0||!available||attention?.complete!==true||!!requestError);
    if(get('attentionCard'))get('attentionCard').dataset.active=String(count>0||!!requestError||!!data&&attention?.available===false);
    if(get('attentionTile')){
      get('attentionTile').hidden=false;
      get('attentionTile').disabled=!data;
      get('attentionTile').dataset.active=String(count>0||!!requestError||!!data&&attention?.available===false);
      get('attentionTile').setAttribute('aria-label',available?`Needs attention: ${count} ${count===1?'player':'players'}. Open review.`:'Player attention status unavailable. Open review.');
    }
    const status=requestError||(busy?'Checking player entries in Nakka…':!available?'Nakka check unavailable. Automatic checks will continue.':
      !attention.complete?'Checking the current event automatically. Saved alerts remain visible.':`Player entries checked ${new Date(attention.checkedAt).toLocaleString('en-GB',{timeZone:'Europe/Stockholm',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}.`);
    if(get('attentionStatus'))get('attentionStatus').textContent=status;
    get('attentionTile')?.setAttribute('title',status);
    panel=get('nakkaAttentionPanel')||panel;
    if(panel){
      const list=panel.querySelector('.attention-list');list.replaceChildren();
      const state=panel.querySelector('[data-attention-status]');state.textContent=status;
      for(const item of items){
        const row=document.createElement('li'),name=document.createElement('strong'),reason=document.createElement('p');
        name.textContent=item.name;reason.textContent=explain(item.code);
        const eligible=(data?.players||[]).filter(p=>(p.player||p.newPlayer)===item.name);
        const supported=['LEAGUE_IDENTITY_REVIEW','MISSING_EVENT_ENTRY','TRANSFER_REVIEW_REQUIRED','TRANSFER_UNCERTAIN','ENTRY_UNCONFIRMED','TRANSFER_BUSY','TEST_TARGET_ONLY','STALE_TRANSFER','NAKKA_UNAVAILABLE','TRANSFER_FAILED'].includes(item.code);
        if(eligible.length===1&&eligible[0].status==='IN'&&supported){
          const action=document.createElement('button');action.type='button';action.className='nakka-issue-open';action.append(name);action.disabled=busy;action.setAttribute('aria-label','Resolve issue for '+item.name);
          action.addEventListener('click',()=>window.BeautyNakkaTransfer?.open(item.name));row.append(action,reason);
          const hint=document.createElement('p');hint.className='nakka-action-hint';hint.textContent='Click the player’s name to find a solution.';row.append(hint);
        }else{
          row.append(name,reason);
          const next=document.createElement('p');next.className='nakka-action-hint';
          next.textContent=item.code.startsWith('REMOVE_')?'Next: inspect the removal recovery sheet and current Nakka entry. No repeat removal is offered.':item.code.startsWith('LEAGUE_CREATION')?'Next: inspect the existing league profile and creation record. Do not register again.':eligible.length!==1?'Next: check the Hub registration and spelling. Do not add another player to resolve this.':eligible[0].status!=='IN'?'Next: check the Hub status. Only IN players are eligible for transfer.':'Next: resolve the duplicate or conflicting league identity in Nakka, then check again.';row.append(next);
        }
        if(item.registrationDiagnostic){
          const d=item.registrationDiagnostic,details=document.createElement('details'),label=document.createElement('summary'),text=document.createElement('p');
          label.textContent='Original registration diagnostic';
          text.textContent='Source: '+d.source+' · Step: '+d.stage+' · Result: '+d.code+' · Recorded: '+d.recordedAt;
          details.append(label,text);row.append(details);
        }
        list.append(row);
      }
      if(!items.length){const row=document.createElement('li');row.textContent=available&&attention.complete?'No players currently need review.':'No saved player alerts. Complete a check before treating the list as clear.';list.append(row);}
      const checkButton=panel.querySelector('[data-attention-refresh]');if(checkButton)checkButton.disabled=busy;
    }
  }
  function update(next) {
    const changed=data?.eventDate!==next.eventDate||JSON.stringify((data?.players||[]).map(p=>[p.player||p.newPlayer,p.status]))!==JSON.stringify((next.players||[]).map(p=>[p.player||p.newPlayer,p.status]));
    if(changed){requestId++;requestError='';attention=null;document.dispatchEvent(new CustomEvent('beauty-nakka-invalidated'));}
    data=next;
    if(get('inPlayerCount'))get('inPlayerCount').textContent=String((next.players||[]).filter(p=>p.status==='IN').length);
    const saved=next.attention?.eventDate===next.eventDate?next.attention:{available:false,items:[],complete:false};
    // An unavailable read must not erase already-known same-event issues.
    if(!changed&&saved.available!==true&&attention?.items?.length)attention={...attention,available:false,complete:false};
    else attention=saved;
    render();
    if(changed&&BeautyHubServices.mode==='test'&&!document.hidden){
      if(inFlight)refreshQueued=true;else refresh();
    }
  }
  async function refresh() {
    if(inFlight||!data?.eventDate)return;
    const started=Date.now();
    document.dispatchEvent(new CustomEvent('beauty-nakka-check-start'));
    const ticket=++requestId,date=data.eventDate,snapshot=JSON.stringify((data.players||[]).map(p=>[p.player||p.newPlayer,p.status]));inFlight=busy=true;/* Keep last failure visible until a verified success. */render();
    try {
      const result=await(await BeautyHubServices.request('https://beauty.invalid/hub?page=attentionrefresh')).json();
      if(ticket!==requestId||date!==data?.eventDate)return;
      if(snapshot!==JSON.stringify((data.players||[]).map(p=>[p.player||p.newPlayer,p.status])))return;
      document.dispatchEvent(new CustomEvent('beauty-nakka-diagnosed',{detail:{...result,clientMs:Date.now()-started}}));
      if(!result.success||result.attention?.eventDate!==date||result.attention.available!==true||result.attention.complete!==true)throw Error('check');
      attention=result.attention;requestError='';
    }catch(e){if(ticket===requestId){document.dispatchEvent(new CustomEvent('beauty-nakka-check-error'));requestError='Nakka could not be checked. Saved alerts are retained; automatic checks will continue.';}}
    finally{inFlight=busy=false;render();if(refreshQueued&&data?.eventDate&&!document.hidden){refreshQueued=false;refresh();}}
  }
  function review() {
    if(window.BeautyNakkaWorkflow){window.BeautyNakkaWorkflow.attention();return;}
    if(panel){if(!panel.open)panel.showModal();return;}
    panel=document.createElement('dialog');panel.className='pool-planner';panel.setAttribute('aria-labelledby','attentionReviewTitle');
    const close=document.createElement('button');close.type='button';close.className='pool-close';close.textContent='×';close.setAttribute('aria-label','Close attention review');
    const title=document.createElement('h2');title.id='attentionReviewTitle';title.textContent='Players needing attention';
    const note=document.createElement('p');note.textContent='Check the named player and existing league identity. A saved registration must not be submitted again to fix Nakka. Alerts clear after a verified check; transfer journals are retained.';
    const state=document.createElement('p');state.dataset.attentionStatus='';state.setAttribute('role','status');
    const list=document.createElement('ul');list.className='attention-list';
    const actions=document.createElement('div');actions.className='attention-actions';
    const check=document.createElement('button');check.type='button';check.dataset.attentionRefresh='';check.textContent='CHECK AGAIN';check.addEventListener('click',refresh);
    const nakka=document.createElement('button');nakka.type='button';nakka.textContent='OPEN NAKKA REVIEW';nakka.addEventListener('click',()=>{panel.close();get('nakkaNavButton')?.click();});
    close.addEventListener('click',()=>panel.close());panel.addEventListener('close',()=>{const target=get('attentionTile');if(target&&!target.hidden)target.focus();else get('dashboardNavButton')?.focus();});
    actions.append(check,nakka);panel.append(close,title,note,state,actions,list);document.body.append(panel);render();panel.showModal();close.focus();
  }
  window.BeautyDashboard=Object.freeze({update,refresh,review});
  get('attentionTile')?.addEventListener('click',review);
  document.addEventListener('beauty-nakka-operation-complete',()=>{if(busy)refreshQueued=true;else refresh();});
  get('dashboardNavButton')?.addEventListener('click',()=>document.querySelector('.main-content')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.addEventListener('beauty-hub-opened',refresh);
  document.addEventListener('beauty-hub-locked',()=>{
    requestId++;busy=false;refreshQueued=false;data=attention=null;requestError='';if(panel&&!get('nakkaAttentionPanel'))panel.remove();panel=null;
    if(get('inPlayerCount'))get('inPlayerCount').textContent='0';render();
  });
  setInterval(()=>{if(BeautyHubServices.mode==='test'&&!document.hidden&&data?.eventDate)refresh();},30000);
  document.addEventListener('visibilitychange',()=>{if(BeautyHubServices.mode==='test'&&!document.hidden&&data?.eventDate)refresh();});
  // Existing Instructions entry now has an actual matching submenu.
  const instructions=[...document.querySelectorAll('.sidebar > button')].find(b=>b.textContent.trim()==='Instructions');
  let help=null;
  instructions?.addEventListener('click',()=>{
    if(help){help.showModal();window.BeautyHubNavigation?.activate(instructions);return;}
    help=document.createElement('dialog');help.className='pool-planner';help.setAttribute('aria-label','Instructions');
    const close=document.createElement('button');close.type='button';close.className='pool-close';close.textContent='×';close.setAttribute('aria-label','Close instructions');close.addEventListener('click',()=>help.close());
    const title=document.createElement('h2');title.textContent='Instructions';help.append(close,title);
    for(const text of ['Check the selected event date before registration. IN is the registration status, not an arrival scan.',
      'Register each player once. SOURCE shows the original Hub, kiosk or mobile route.',
      'Nakka is checked automatically every 30 seconds while the Hub is visible. A red Needs Attention tile means an issue needs review. Click it and choose the named player.',
      'Use Nakka to inspect comparisons and review a single transfer. Close any Nakka editing page before confirming a transfer.',
      'System Status shows the Sheets connection. Nakka health is separate from player attention.',
      'Pool Planner retains the original 5–101 group-size scheme. In TEST, load league statistics, review identities, generate a seeded preview and adjust pools before explicitly approving the Nakka handoff. Missing averages stay Unseeded. OUT and STANDBY are excluded.']){
      const p=document.createElement('p');p.textContent=text;help.append(p);
    }
    help.addEventListener('close',()=>{window.BeautyHubNavigation?.dashboard();instructions.focus();});document.body.append(help);help.showModal();window.BeautyHubNavigation?.activate(instructions);
  });
  document.addEventListener('beauty-hub-locked',()=>{help?.remove();help=null;});
  if(window.beautyHubData)update(window.beautyHubData);
})();

