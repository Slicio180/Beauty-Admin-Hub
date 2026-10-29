/* AIK dashboard presentation and staff-only attention review. No mutation retry. */
(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  let data=null,attention=null,panel=null,requestId=0,busy=false,requestError='';
  const messages={
    LEAGUE_IDENTITY_REVIEW:'The league identity is missing or has duplicate names. Review the player in Nakka.',
    HUB_IDENTITY_REVIEW:'The Hub name is missing or appears more than once. Review the registrations.',
    MISSING_EVENT_ENTRY:'This IN player was not found in the Nakka event.',
    IDENTITY_CONFLICT:'The event has duplicate or conflicting player identity details.',
    LEAGUE_CREATION_REVIEW_REQUIRED:'A previous league creation remains uncertain. Inspect Nakka and the creation journal; do not repeat registration.',
    TRANSFER_REVIEW_REQUIRED:'An earlier transfer needs review. Inspect the event and transfer journal before another action.',
    LEAGUE_CREATION_UNCERTAIN:'League creation may have saved. Inspect Nakka; do not register again.',
    TRANSFER_UNCERTAIN:'The transfer may have saved. Inspect Nakka; do not retry.'
  };
  const explain=code=>messages[code]||'Beauty registration is saved, but the Nakka entry is unconfirmed. Review Nakka before another action.';
  function render() {
    const items=attention?.items||[],count=items.length;
    const available=attention?.available===true;
    if(get('attentionCount'))get('attentionCount').textContent=available?String(count):'—';
    const needsReview=!!data&&(count>0||!available||attention?.complete!==true||!!requestError);
    if(get('attentionCard'))get('attentionCard').dataset.active=String(count>0);
    if(get('attentionTile')){
      get('attentionTile').hidden=!needsReview;
      get('attentionTile').dataset.active=String(count>0);
      get('attentionTile').setAttribute('aria-label',available?`Needs attention: ${count} ${count===1?'player':'players'}. Open review.`:'Player attention status unavailable. Open review.');
    }
    const status=requestError||(busy?'Checking player entries in Nakka…':!available?'Player attention check unavailable. Open review to check again.':
      !attention.complete?'Saved alerts shown. A full event check is pending.':`Player entries checked ${new Date(attention.checkedAt).toLocaleString('en-GB',{timeZone:'Europe/Stockholm',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}. Name presence does not prove the exact league link.`);
    if(get('attentionStatus'))get('attentionStatus').textContent=status;
    if(panel){
      const list=panel.querySelector('.attention-list');list.replaceChildren();
      const state=panel.querySelector('[data-attention-status]');state.textContent=status;
      for(const item of items){
        const row=document.createElement('li'),name=document.createElement('strong'),reason=document.createElement('p');
        name.textContent=item.name;reason.textContent=explain(item.code);row.append(name,reason);list.append(row);
      }
      if(!items.length){const row=document.createElement('li');row.textContent=available&&attention.complete?'No players currently need review.':'No saved player alerts. Complete a check before treating the list as clear.';list.append(row);}
      panel.querySelector('[data-attention-refresh]').disabled=busy;
    }
  }
  function update(next) {
    if(data?.eventDate!==next.eventDate){requestId++;busy=false;requestError='';attention=null;}
    data=next;
    if(get('inPlayerCount'))get('inPlayerCount').textContent=String((next.players||[]).filter(p=>p.status==='IN').length);
    attention=next.attention?.eventDate===next.eventDate?next.attention:{available:false,items:[],complete:false};
    render();
  }
  async function refresh() {
    if(busy||!data?.eventDate)return;
    const ticket=++requestId,date=data.eventDate,snapshot=JSON.stringify((data.players||[]).map(p=>[p.player||p.newPlayer,p.status]));busy=true;requestError='';render();
    try {
      const result=await(await BeautyHubServices.request('https://beauty.invalid/hub?page=attentionrefresh')).json();
      if(ticket!==requestId||date!==data?.eventDate)return;
      if(snapshot!==JSON.stringify((data.players||[]).map(p=>[p.player||p.newPlayer,p.status])))return;
      if(!result.success||result.attention?.eventDate!==date)throw Error('check');
      attention=result.attention;
    }catch(e){if(ticket===requestId)requestError='The check could not be completed. Saved alerts are retained. Check the event date and Nakka; no players were added.';}
    finally{if(ticket===requestId){busy=false;render();}}
  }
  function review() {
    if(panel){if(!panel.open)panel.showModal();return;}
    panel=document.createElement('dialog');panel.className='pool-planner';panel.setAttribute('aria-labelledby','attentionReviewTitle');
    const close=document.createElement('button');close.type='button';close.className='pool-close';close.textContent='×';close.setAttribute('aria-label','Close attention review');
    const title=document.createElement('h2');title.id='attentionReviewTitle';title.textContent='Players needing attention';
    const note=document.createElement('p');note.textContent='Check the named player and existing league identity. A saved Beauty registration must not be submitted again to fix Nakka. Alerts clear after a verified check; transfer journals are retained.';
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
  get('dashboardNavButton')?.addEventListener('click',()=>document.querySelector('.main-content')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.addEventListener('beauty-hub-opened',refresh);
  document.addEventListener('beauty-hub-locked',()=>{
    requestId++;busy=false;data=attention=null;requestError='';panel?.remove();panel=null;
    if(get('inPlayerCount'))get('inPlayerCount').textContent='0';render();
  });
  setInterval(()=>{if(!document.hidden&&data?.eventDate)refresh();},300000);
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
      'Needs attention opens named player issues. CHECK AGAIN reads Nakka; it does not send or repeat transfers.',
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
