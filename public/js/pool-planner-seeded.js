/* Identity TEST seeded Pool Planner. Approval and draws are server-owned. */
(function(root){
 'use strict';
 let panel,host,opener,state=null,frozen=null,approval=null,busy=false,epoch=0,invalid=true,lastRoster='',hubAvailable=true,invalidReason='',plannedBoards=null,cardLabels={},swapped=[],workflow=null,startReview=null,boardChoices={},sourceLoadFailed=false,jobSerial=0;
 const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;parent?.appendChild(n);return n;};
 const average=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=180?value:null;
 const averageLabel=value=>average(value)===null?'Unseeded':average(value).toFixed(2);
 const button=(text,parent,fn)=>{const b=el('button',text,parent);b.type='button';b.addEventListener('click',fn);return b;};
 function message(text){panel.querySelector('[data-pool-message]').textContent=text;}
 function numeric(tag,text,parent){const n=el(tag,text,parent);n.className='pool-number';return n;}
 function section(tag,cls,parent){const n=el(tag,null,parent);n.className=cls;return n;}
 function steps(){
  const current=workflow?4:approval?3:frozen?2:1;
  for(const n of panel.querySelectorAll('[data-step]')){if(Number(n.dataset.step)===3){const handoff=panel.querySelector('[data-handoff]');n.dataset.blocked=String(!handoff||handoff.dataset.blocked==='true');n.title='Review Nakka handoff — TEST';}if(Number(n.dataset.step)===4)n.dataset.blocked=String(!workflow);n.dataset.active=String(Number(n.dataset.step)===current);n.setAttribute('aria-current',Number(n.dataset.step)===current?'step':'false');}
 }
 function selectedBoards(){return root.BeautyPoolBoards.parseBoards(host.querySelector('[data-boards]').value);}
 function currentPlan(){let boards;try{boards=selectedBoards().length;}catch(e){return {error:e.message};}return BeautyPoolPlanner.plan(BeautyPoolPlanner.eventCount(root.beautyHubData),Number(host.querySelector('[data-size]').value),boards);}
 function renderSettings(){
  if(!panel)return;
  const count=hubAvailable?BeautyPoolPlanner.eventCount(root.beautyHubData):null,result=currentPlan(),selected=result[panel.querySelector('[data-draw-scheme]').value];
  panel.querySelector('[data-in-count]').textContent=count===null?'—':String(count);
  panel.querySelector('[data-event-label]').textContent=(state?.event?.title||'Selected Hub event')+' · '+(root.beautyHubData?.eventDateDisplay||root.beautyHubData?.eventDate||'No date');
  const summary=panel.querySelector('[data-plan-summary]');summary.replaceChildren();
  const needed=panel.querySelector('[data-boards-needed]'),used=!result.error&&selected?Math.min(result.boards,selected.pools):null;
  needed.textContent=used===null?'—':String(used);needed.setAttribute('aria-label',used===null?'Choose boards to calculate':used+' boards used by this plan');
  if(result.error||!selected)summary.textContent=result.error||'Select available boards.';
  else for(const size of (Number(panel.querySelector('[data-size]').value)===4?[4,3,5]:[3,4,5])){
   const n=selected[({3:'three',4:'four',5:'five'})[size]];if(!n)continue;
   const tile=section('div','pool-scheme-chip',summary);numeric('strong',n,tile);el('span','×',tile);numeric('strong',size,tile);el('span','players',tile);
  }
  panel.querySelector('[data-generate]').dataset.blocked=String(!hubAvailable||!state?.stats?.fresh||!selected||!!result.error||count>101||!!workflow);
  const options=panel.querySelector('[data-plan-options]');options.textContent=result.error?'':('Preferred: '+result.preferredPlan.three+' × 3 / '+result.preferredPlan.four+' × 4 / '+result.preferredPlan.five+' × 5. '+(result.perBoard?'One pool per board: '+result.perBoard.three+' × 3 / '+result.perBoard.four+' × 4 / '+result.perBoard.five+' × 5.':'No one-pool-per-board arrangement available.'));
  for(const n of panel.querySelectorAll('[data-size-choice]'))n.setAttribute('aria-pressed',String(n.dataset.sizeChoice===host.querySelector('[data-size]').value));
  let selectedIds=[];try{selectedIds=selectedBoards();}catch(e){}for(const b of panel.querySelectorAll('[data-board-choice]'))b.setAttribute('aria-pressed',String(selectedIds.includes(Number(b.dataset.boardChoice))));
  renderEstimate();disable();
 }
 function renderEstimate(){
  const count=panel?.querySelector('[data-manual-count]'),estimate=panel?.querySelector('[data-estimate]');if(!estimate||!count)return;
  if(!count.value){estimate.textContent='Enter 5–101 players to estimate the scheme. This does not change registrations.';return;}
  const n=Number(count.value);if(!Number.isInteger(n)||n<5||n>101){estimate.textContent='Enter a whole player count from 5 to 101.';return;}
  let boards=[];try{boards=selectedBoards();}catch(e){}
  const result=BeautyPoolPlanner.plan(n,Number(host.querySelector('[data-size]').value),boards.length||1),plan=result.preferredPlan;
  estimate.textContent=result.error||plan.pools+' pools: '+plan.three+' × 3-player groups · '+plan.four+' × 4-player groups'+(plan.five?' · '+plan.five+' × 5-player groups':'')+' · '+(boards.length?boards.length+' boards':'No boards selected')+'. Estimate only; draws use the verified IN list.';
 }
 function settingsChanged(){startReview=null;if(workflow){boardChoices={};renderDraw();}if(frozen){approval=null;invalid=true;invalidReason='Draw settings changed. Generate and review a new preview.';message('Draw settings changed. Generate and review a new preview.');renderDraw();}renderSettings();}
 async function generate(send){
  if(!hubAvailable)throw Error('Hub data unavailable. Wait for a verified refresh before drawing.');
  if(!state)throw Error('Load league statistics and review player identities first.');
  if(!panel.querySelector('[data-mapping-reviewed]').checked){panel.querySelector('[data-player-review]').open=true;throw Error('Review and tick the player identity acknowledgement first.');}
  const plan=currentPlan(),scheme=panel.querySelector('[data-draw-scheme]').value;
  if(plan.error||!plan[scheme])throw Error(plan.error||'That arrangement cannot fit the boards. Choose the preferred format or add boards.');
  frozen=await send('pooldraw',{bindings:JSON.stringify(bindings()),sizes:JSON.stringify(BeautyPoolSeeding.sizesFromPlan(plan[scheme])),reviewed:'true'});
  plannedBoards=selectedBoards();cardLabels={};boardChoices={};swapped=[];approval=null;invalid=false;invalidReason='';lastRoster=fingerprint(root.beautyHubData);panel.querySelector('[data-player-review]').open=false;
  message('Averages are frozen. Review pool balance and make any manual swaps before approving.');renderDraw();
 }

 function fingerprint(data){return data?.success&&Array.isArray(data.players)?JSON.stringify([data.eventDate,data.players.filter(p=>p.status==='IN').map(p=>p.player||p.newPlayer).sort()]):'';}
 function invalidate(text){invalid=true;invalidReason=text;approval=null;if(panel){message(text);renderDraw();}}
 async function request(page,input){
  const url=new URL(BeautyHubServices.endpoint);url.search='';url.searchParams.set('page',page);for(const [k,v]of Object.entries(input))url.searchParams.set(k,v);
  let deadline;const pending=BeautyHubServices.request(url.toString()).then(r=>r.json());
  const data=await(page==='poolload'&&typeof root.setTimeout==='function'?new Promise((resolve,reject)=>{deadline=root.setTimeout(()=>reject(Error('Loading timed out. Reload the Hub to check saved boards. Do not resend pools or repeat Start.')),45000);pending.then(resolve,reject);}):pending).finally(()=>{if(deadline!==undefined)root.clearTimeout(deadline);});if(!data.success)throw Error((data.error||'Pool request failed.')+(data.audit?' Audit: '+data.audit:''));// Treat absent optional average fields as explicitly unknown at the RPC boundary.
  for(const p of data.mappings||[])p.average=average(p.average);
  for(const p of data.stats?.profiles||[])p.average=average(p.average);
  for(const draw of [data.draw,data.workflow?.draw]){
   for(const p of draw?.roster||[])p.average=average(p.average);
   for(const g of draw?.pools||[])for(const p of g.players||[])p.average=average(p.average);
  }
  return data;
 }
 async function run(job){
  if(busy)return;let generation;try{generation=BeautyHubAuth.generation();}catch(e){message('Sign in to load the planner.');return;}busy=true;const jobId=++jobSerial,revision=epoch;
  const valid=()=>revision===epoch&&BeautyHubAuth.isCurrent(generation)&&host?.open;
  const send=async(page,input)=>{const r=await request(page,input);if(!valid())throw Error('Session or panel changed. Reopen the planner.');return r;};
  disable();try{await job(send);}catch(e){if(valid()){if(frozen&&/Expired pool preview/.test(e.message))invalidate('Planning ticket expired or was evicted. Generate a new preview; the old draw remains visible.');message(e.message);}}finally{if(jobId===jobSerial){busy=false;disable();}}
 }
 function disable(){if(panel)panel.setAttribute('aria-busy',String(busy));if(panel)panel.querySelectorAll('button,input,select').forEach(n=>{n.disabled=busy||n.dataset.blocked==='true';});}
 function bindings(){return [...panel.querySelectorAll('[data-binding]')].map(row=>({id:row.dataset.binding,lpid:row.querySelector('[data-lpid]').value,tpid:row.querySelector('[data-tpid]').value}));}
 function select(parent,key,candidates,field,value){const s=el('select',null,parent);s.dataset[key]='';el('option','Unresolved / Unseeded',s).value='';for(const p of candidates)el('option',p.name+' · '+p[field],s).value=p[field];s.value=value;s.addEventListener('change',()=>{frozen=null;approval=null;invalid=true;const row=parent.parentElement,p=state.mappings.find(p=>p.id===row.dataset.binding),selected=p?.leagueCandidates.find(p=>p.lpid===row.querySelector('[data-lpid]').value);const cell=row.querySelector('.pool-number');if(cell)cell.textContent=averageLabel(selected?.average);panel.querySelector('[data-mapping-reviewed]').checked=false;const count=bindings().filter(p=>!p.lpid||!p.tpid).length;panel.querySelector('[data-identity-notice]').hidden=!count;panel.querySelector('[data-review-state]').textContent=count+' identities need review';panel.querySelector('[data-review-summary]').textContent='Review players'+(count?' · '+count+' need review':'');panel.querySelector('[data-review-toggle]').textContent='Review players'+(count?' · '+count+' need review':'');message('Player identity changed. Review the mappings and generate a new preview.');renderDraw();});return s;}
 function renderSource(){
  const box=panel.querySelector('[data-pool-source]');box.replaceChildren();
  const status=panel.querySelector('[data-league-slot]');status.replaceChildren();const statsCard=section('section','pool-status-card',status);status.className=workflow?'pool-saved-slot':'';const reviewToggle=panel.querySelector('[data-review-toggle]');reviewToggle.dataset.blocked=String(!state);reviewToggle.setAttribute('aria-expanded','false');reviewToggle.textContent='Review players';
  const stats=state?.stats;panel.querySelector('[data-stat-calculation]').replaceChildren();
  const title=el('strong',stats?(stats.fresh?'League averages current':'Statistics stale / unavailable'):'Load league averages',statsCard);title.dataset.fresh=String(!!stats?.fresh);
  const updated=el('p',stats?.fetchedAt?'Last successful update '+new Date(stats.fetchedAt).toLocaleString('en-GB',{timeZone:'Europe/Stockholm'}):'Overall league three-dart averages',statsCard);statsCard.title=updated.textContent;
  const reload=button(workflow?'↻':state?'REFRESH STATS':'LOAD / REFRESH LEAGUE STATS',statsCard,()=>run(send=>load(send,!workflow)));if(workflow){reload.setAttribute('aria-label','Refresh competition status');reload.title='Refresh competition status';}
  if(workflow){statsCard.className='pool-status-card pool-saved-status';title.dataset.fresh=String(!sourceLoadFailed);title.textContent=sourceLoadFailed?'Check pools':workflow.running?'Competition running':'Pools saved';renderSettings();return;}
  if(!state){el('p','Load statistics before reviewing player identities.',box);renderSettings();return;}
  const needsReview=state.mappings.filter(p=>!p.lpid||!p.tpid).length;const details=el('details',null,box);details.dataset.playerReview='';details.className='pool-player-review';const reviewSummary=el('summary','Review players'+(needsReview?' · '+needsReview+' need review':''),details);reviewSummary.dataset.reviewSummary='';details.id='pool-player-review';reviewToggle.textContent=reviewSummary.textContent;details.addEventListener('toggle',()=>reviewToggle.setAttribute('aria-expanded',String(details.open)));const reviewCard=section('section','pool-status-card pool-identity-notice',details);reviewCard.hidden=!needsReview;reviewCard.dataset.identityNotice='';
  const reviewState=el('strong',needsReview?needsReview+' identities need review':'Player identities ready for review',reviewCard);reviewState.dataset.reviewState='';
  el('p',needsReview?'Missing identities can be planned as Unseeded. Sending stays blocked.':'Confirm the proposed league and event identities below.',reviewCard);
  el('p','Names propose matches. Check the LPID and event entry ID in Nakka. If Nakka does not expose the saved league link, this records your review; it does not prove that hidden link. Missing averages remain Unseeded.',details);
  const wrap=section('div','pool-review-table-wrap',details),table=el('table',null,wrap),head=el('tr',null,el('thead',null,table));['Player','League identity (LPID)','Event entry (TPID)','Overall average'].forEach(t=>el('th',t,head));const body=el('tbody',null,table);
  for(const p of state.mappings.slice().sort((a,b)=>Number(!b.lpid||!b.tpid)-Number(!a.lpid||!a.tpid)||a.name.localeCompare(b.name,'sv'))){const row=el('tr',null,body);row.dataset.binding=p.id;el('td',p.name,row);select(el('td',null,row),'lpid',p.leagueCandidates,'lpid',p.lpid);select(el('td',null,row),'tpid',p.eventCandidates,'tpid',p.tpid);const avg=numeric('td',averageLabel(p.average),row);if(p.reason)el('small',p.reason,avg);}
  const confirm=el('dialog',null,box);confirm.className='pool-preview-confirm';confirm.dataset.previewConfirm='';confirm.setAttribute('aria-labelledby','poolPreviewConfirmTitle');
  const confirmTitle=el('h3','Generate pool preview',confirm);confirmTitle.id='poolPreviewConfirmTitle';
  el('p','This creates a Hub preview only. No Nakka changes will be sent.',confirm);
  const label=el('label',null,confirm),review=el('input',null,label);review.type='checkbox';review.dataset.mappingReviewed='';label.appendChild(document.createTextNode(' I reviewed all proposed identities. Unresolved players may be planned as Unseeded; sending requires every league identity and event entry.'));
  const actions=section('div','pool-confirm-actions',confirm);button('CANCEL',actions,()=>confirm.close());
  const proceed=button('GENERATE PREVIEW',actions,()=>{if(!review.checked)return;confirm.close();run(generate);});proceed.dataset.confirmGenerate='';proceed.dataset.blocked='true';proceed.disabled=true;
  review.addEventListener('change',()=>{proceed.dataset.blocked=String(!review.checked);disable();});
  confirm.addEventListener('close',()=>panel.querySelector('[data-generate]')?.focus());
  const source=panel.querySelector('[data-stat-calculation]');source.replaceChildren();el('h3','Statistics source and calculation',source);
  el('p',(stats.title||'AIK league')+' · '+(stats.method||'Overall three-dart average = 3 × total score / total darts. Display uses two decimals; seeding keeps full precision. Ranking points are separate.'),source);
  if(stats.message)el('p',stats.message,source);if(state.journal)el('p',state.journal,source);
  renderSettings();
 }
 function renderDraw(){
  const box=panel?.querySelector('[data-pool-draw]');if(!box)return;box.replaceChildren();panel.querySelector('[data-saved-plan-settings]')?.replaceChildren();const utility=panel.querySelector('[data-draw-utilities]');utility.replaceChildren();steps();
  if(workflow){renderSaved(box);return;}
  if(!frozen){el('p','Generate a preview after reviewing player identities. No Nakka changes are sent by previewing or swapping.',box).className='pool-empty';return;}
  const statsTitle=panel.querySelector('[data-fresh]');if(statsTitle)statsTitle.textContent='League averages frozen for this preview';
  let allocation;try{allocation=root.BeautyPoolBoards.allocate(frozen.draw.pools,plannedBoards||selectedBoards());}catch(e){invalid=true;approval=null;}
  const draw=frozen.draw,heading=section('div','pool-preview-heading',utility);el('h3','Group overview',heading);el('p','Frozen '+draw.frozenAt+' · Statistics '+draw.source.fetchedAt+' · Draw seed '+draw.seed,heading);
  if(invalid)el('p','REVIEW INVALIDATED — '+(invalidReason||'Preview is no longer active. Generate a new draw before sending.'),utility).className='pool-invalid';
  const warnings=BeautyPoolSeeding.warnings(draw);if(warnings.length){const details=el('details',null,utility);details.className='pool-draw-notes';el('summary','Draw notes · '+warnings.length,details);warnings.forEach(t=>el('p',t,details));}
  const settings=section('div','pool-preview-tools',utility),label=el('label',null,settings),colours=el('input',null,label);colours.type='checkbox';colours.checked=!!root.beautyPoolColours;label.appendChild(document.createTextNode(' Show seeding colours'));
  const bands=el('details',null,settings);el('summary','Edit bands',bands);const bounds=el('label','Band boundaries (three increasing values) ',bands),inputs=[50,55,60].map((v,i)=>{const n=el('input',null,bounds);n.type='number';n.min='0';n.max='180';n.step='0.01';n.value=String(root.beautyPoolBands?.[i]??v);return n;});
  const legend=el('p',null,bands),grid=section('div','pool-grid',box);
  function paint(){
   const thresholds=inputs.map(n=>Number(n.value));try{BeautyPoolSeeding.band(null,thresholds);}catch(e){legend.textContent=e.message;return;}
   root.beautyPoolBands=thresholds;root.beautyPoolColours=colours.checked;legend.textContent='Bands: below '+thresholds[0]+'; '+thresholds[0]+'–<'+thresholds[1]+'; '+thresholds[1]+'–<'+thresholds[2]+'; '+thresholds[2]+'+. Unseeded is separate.';grid.replaceChildren();
   const assignments=allocation?.assignments||[];
   for(const a of assignments)if(!cardLabels[a.poolId])cardLabels[a.poolId]={board:a.board,group:a.batch};
   const ordered=draw.pools.slice().sort((a,b)=>(cardLabels[a.id]?.board||0)-(cardLabels[b.id]?.board||0)||(cardLabels[a.id]?.group||0)-(cardLabels[b.id]?.group||0));
   for(const pool of ordered){
    const position=cardLabels[pool.id],shared=position&&ordered.filter(g=>cardLabels[g.id]?.board===position.board).length>1;
    const card=section('section','pool-card',grid);card.dataset.poolId=pool.id;
    const top=section('div','pool-card-heading',card),groupRow=section('div','pool-group-heading',top);
    function editable(key,parent,prefix){const edit=button(prefix+' '+position[key],parent,()=>{
     const dialog=el('dialog',null,utility);dialog.className='pool-preview-confirm';el('h3','Edit Board / Group',dialog);
     const boardLabel=el('label','Board',dialog),board=el('select',null,boardLabel);board.dataset.editBoard='';for(const n of plannedBoards||selectedBoards())el('option',String(n),board).value=n;board.value=position.board;
     const groupLabel=el('label','Group',dialog),group=el('input',null,groupLabel);group.type='number';group.min='1';group.max='1000';group.value=position.group;group.dataset.editGroup='';
     const error=el('p','Changes apply to the Hub board plan.',dialog),actions=section('div','pool-confirm-actions',dialog);button('CANCEL',actions,()=>dialog.close());
     button('SAVE LABELS',actions,()=>{const next={board:Number(board.value),group:Number(group.value)};if(!(plannedBoards||selectedBoards()).includes(next.board)||!Number.isInteger(next.group)||next.group<1||next.group>1000){error.textContent='Choose an available board and group 1–1000.';return;}
      if(Object.entries(cardLabels).some(([id,v])=>id!==String(pool.id)&&v.board===next.board&&v.group===next.group)){error.textContent='That Board / Group is already used. Choose another group number.';return;}
      next.manualGroup=true;cardLabels[pool.id]=next;if(boardChoices[pool.id])boardChoices[pool.id].boards[0]=next.board;approval=null;dialog.close();message('Board / Group saved in the Hub plan.');renderDraw();});dialog.showModal();
    });edit.className='pool-edit-label';edit.setAttribute('aria-label','Edit '+prefix+' '+position[key]);edit.dataset.blocked=String(invalid||!hubAvailable);}
    if(position){editable('board',top,'Board');if(shared)editable('group',top,'Group');}
    renderBoardChoices(pool,card,position?.board);
    const summary=BeautyPoolSeeding.summary(pool);numeric('strong',summary.knownAverage===null?'—':summary.knownAverage.toFixed(2),groupRow);
    const list=el('ol',null,card);
    for(const p of pool.players){const li=el('li',null,list);if(colours.checked)li.className='pool-band-'+BeautyPoolSeeding.band(p.average,thresholds);
     const name=button(null,li,()=>openSwap(p));el('span',p.name,name);name.className='pool-player-name';name.dataset.swapPlayer=p.id;name.dataset.blocked=String(invalid||!hubAvailable);if(swapped.includes(p.id))name.dataset.swapped='true';
     const value=el('span',p.average===null?'—':averageLabel(p.average),name);value.setAttribute('aria-label',p.average===null?'Unseeded':'Average '+averageLabel(p.average));value.className=p.average===null?'pool-unseeded':'pool-number';}
   }

  }
  colours.addEventListener('change',paint);inputs.forEach(n=>n.addEventListener('change',paint));paint();
  // Keep the preview heading tied to the same inline selector as the saved card.
  const chosenBoards=p=>{const c=boardChoices[p.id],a=c?.boards.slice(0,c.count)||[];return c?.count&&a.length===c.count&&new Set(a).size===a.length&&a.every(n=>selectedBoardsSafe().includes(n))?a:[];};
  for(const pool of draw.pools){
   const card=[...grid.children].find(n=>String(n.dataset.poolId)===String(pool.id)),top=card?.querySelector('.pool-card-heading'),boards=chosenBoards(pool);if(!top)continue;
   const title=top.querySelector('.pool-edit-label');if(title){title.textContent=boards.length>1?'Bana '+boards.join(' + '):boards.length?'Board '+boards[0]:'Pool '+(draw.pools.indexOf(pool)+1);title.setAttribute('aria-label',title.textContent);}
   const shared=boards.find(b=>draw.pools.some(p=>p!==pool&&chosenBoards(p).includes(b)));
   const start=top.querySelector('.pool-group-heading');top.replaceChildren(...[title,start].filter(Boolean));
   if(shared)el('span','Group '+(cardLabels[pool.id]?.manualGroup?cardLabels[pool.id].group:draw.pools.filter(p=>chosenBoards(p).includes(shared)).findIndex(p=>p.id===pool.id)+1),top);
  }
  function openSwap(player){
   const dialog=el('dialog',null,utility);dialog.className='pool-preview-confirm pool-swap-picker';dialog.dataset.swapPicker='';el('h3','Swap '+player.name+' with…',dialog);
   const search=el('input',null,dialog);search.type='search';search.placeholder='Search player';search.setAttribute('aria-label','Search player');search.dataset.swapSearch='';
   const list=section('div','pool-swap-list',dialog);list.dataset.swapList='';
   const origin=draw.pools.find(g=>g.players.some(p=>p.id===player.id));
   function choices(){list.replaceChildren();for(const pool of draw.pools)if(pool.id!==origin.id)for(const other of pool.players){if(!other.name.toLocaleLowerCase('sv').includes(search.value.toLocaleLowerCase('sv')))continue;
    const pos=cardLabels[pool.id],pick=button(other.name+' · Board '+pos.board+' · Group '+pos.group,list,()=>{dialog.close();run(async send=>{const result=await send('pooladjust',{ticket:frozen.ticket,change:JSON.stringify({playerId:player.id,targetPool:pool.id,swapWith:other.id})});frozen=result;swapped=[player.id,other.id];approval=null;message('Swap saved in preview. Both moved players are yellow.');renderDraw();});});pick.dataset.swapWith=other.id;
   }}search.addEventListener('input',choices);choices();button('CANCEL',dialog,()=>dialog.close());dialog.showModal();search.focus();
  }
  button('DOWNLOAD BOARD PLAN',utility,()=>{
   const lines=['AIK DART · HUB BOARD PLAN · TEST',draw.eventDate,'PLANNED — NOT SENT TO NAKKA',''];
   for(const pool of draw.pools.slice().sort((a,b)=>cardLabels[a.id].board-cardLabels[b.id].board||cardLabels[a.id].group-cardLabels[b.id].group)){const pos=cardLabels[pool.id];lines.push('Board '+pos.board+' · Group '+pos.group,...pool.players.map(p=>p.name+' · '+averageLabel(p.average)),'');}
   const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),link=el('a',null,utility);link.href=url;link.download='Beauty-Board-Plan-TEST-'+draw.eventDate+'.txt';link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const footer=section('div','pool-action-bar',utility);el('p','Preview only · No Nakka changes sent',footer);
  const unresolved=(frozen.mappings||state?.mappings||[]).filter(p=>!p.lpid||!p.tpid).length;
  if(invalid)el('p','Swaps and sending are disabled. '+(invalidReason||'Generate a new preview to continue.'),footer);
  const formatLabel=el('label','After the groups ',footer),formatSelect=el('select',null,formatLabel);formatSelect.dataset.eventFormat='';
  for(const [v,t]of [['preserve','Keep current Nakka format'],['top2-rest','First 2 up → Slutspel 1 · remaining players down → Slutspel 2'],['top2-bottom2','Top 2 → Slutspel 1; bottom 2 → Slutspel 2 (groups of 4)']])el('option',t,formatSelect).value=v;
  formatSelect.value=approval?.format?.mode||root.beautyPoolFormatChoice||state?.formatPreset||'top2-rest';el('p','Groups of 3: first 2 up, last 1 down. Groups of 4: first 2 up, last 2 down. Groups of 5: first 2 up, last 3 down.',footer).className='pool-qualification-help';formatSelect.addEventListener('change',()=>{root.beautyPoolFormatChoice=formatSelect.value;approval=null;renderDraw();});
  const handoff=button('REVIEW NAKKA HANDOFF — TEST',footer,()=>run(async send=>{approval=await send('poolprepare',{ticket:frozen.ticket,format:panel.querySelector('[data-event-format]').value,boardPlan:JSON.stringify(boardInput(frozen.draw.pools))});frozen.ticket=approval.ticket;message('Handoff checked. Close Nakka editing pages, then confirm these TEST pools.');renderDraw();}));
  let boardsReady=true;try{root.BeautyPoolBoards.matchPlan(draw.pools,selectedBoards(),boardInput(draw.pools).choices);}catch(e){boardsReady=false;el('p',e.message,footer);}
  handoff.dataset.handoff='';handoff.dataset.blocked=String(invalid||unresolved>0||!state?.stats?.fresh||!hubAvailable||!boardsReady);
  if(unresolved)el('p','Resolve '+unresolved+' player identities before sending. '+(invalid?'The frozen preview is retained for reference.':'Preview and manual swaps remain available.'),footer);
  if(approval){const review=el('section',null,utility);review.className='pool-approval';el('h3','Approve TEST pool handoff',review);el('p',approval.event.title+' · '+approval.event.date+' · '+draw.roster.length+' IN players · '+draw.pools.length+' pools · '+approval.expectedCards+(approval.groupMode==='rr'?' native Round Robin pairings.':' round-robin match cards.'),review);
   if(approval.boardPlan)renderMatchPlan(approval.boardPlan,draw,review);
   if(approval.format){const f=approval.format;el('h3','Competition format',review);el('p','Slutspel 1: top 2 per group · '+f.stage1.qualifiers+' players · '+f.stage1.slots+' slots · '+f.stage1.byes+' byes. Slutspel 2: remaining players · '+f.stage2.qualifiers+' players · '+f.stage2.slots+' slots · '+f.stage2.byes+' byes.',review);el('p','Three-player groups: 2 + 1. Four-player groups: 2 + 2. Five-player groups: 2 + 3. Assign completed groups only; automatic referee assignment off. Match formats are shown below. The format is saved as a preset after a verified send.',review);}
   el('p',approval.format?'Groups, knockout sizes and qualification rules will be sent once and checked. Match settings are retained from existing knockout settings, or copied from this event’s group settings when absent. An incomplete operation needs audit review.':(approval.groupMode==='rr'?'Only Round Robin groups, group count and maximum group size change. Placement-dependent match order and board fields are cleared for the new draw. Existing players and game settings are retained. Groups are sent once and read back.':'Only pool assignments, division count and maximum pool size change. Existing players and other event settings are retained. Sending uses two Nakka operations: groups, then match cards. If either cannot be verified, inspect the audit before another action.'),review);
   if(approval.unassignedEntries?.length){el('p','Excluded from these pools but still registered in Nakka: '+approval.unassignedEntries.map(p=>p.name).join(', ')+'. Sending is blocked until these entries are resolved or compatibility is verified in TEST. No automatic removals.',review);}
   const details=el('details',null,review);el('summary','Review preserved game settings',details);el('pre',JSON.stringify(approval.format?{groups:approval.setting,slutspel1:approval.format.set.t_setting,slutspel2:approval.format.set.s2_setting}:approval.setting,null,2),details);
   const label=el('label',null,review),check=el('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode(' I approve these identities, frozen pools and match cards for the named TEST event. Nakka editing pages are closed.'));
   const save=button('SEND APPROVED TEST POOLS',review,()=>run(async send=>{if(!check.checked)throw Error('Tick the final approval first.');const ticket=approval.ticket;approval=null;invalid=true;message('Sending once. Waiting for group and match-card readback…');try{const labels=frozen.draw.pools.map(p=>({ids:p.players.map(q=>(frozen.mappings||state.mappings).find(m=>m.id===q.id)?.tpid),board:boardChoices[p.id]?.boards[0]||cardLabels[p.id]?.board,group:cardLabels[p.id]?.group}));const r=await send('poolsave',{ticket,confirmed:'true'});root.beautyStagePendingLabels=labels;frozen=null;message(r.message+' Loading saved competition…');const saved=await send('poolload',{refresh:'false'});workflow=saved.workflow;state=saved;renderSource();message(r.message+' Audit: '+r.audit+' · Receipt: '+r.receipt);renderDraw();const labelEpoch=epoch;try{await new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).beautyStageLabelsTest(root.BeautyHubAuth.token(),labels));if(labelEpoch===epoch)root.beautyStagePendingLabels=null;}catch(e){if(labelEpoch===epoch)message(r.message+' Cast board labels pending. Open the stage screen from the Hub to retry labels only. Do not resend pools.');}}catch(e){renderDraw();throw Error(e.message+' Do not repeat a send until the event and audit have been inspected.');}}));save.dataset.blocked='true';save.disabled=true;check.addEventListener('change',()=>{save.dataset.blocked=String(!check.checked||!!approval?.unassignedEntries?.length);disable();});
  }steps();disable();
 }
 function selectedBoardsSafe(){try{return selectedBoards();}catch(e){return [];}}
 function boardInput(pools){return {available:selectedBoards(),choices:pools.map(p=>{
  const c=boardChoices[p.id];if(!c?.count)throw Error('Choose 1 or 2 boards for every four-player pool.');if(c.boards.slice(0,c.count).length!==c.count)throw Error('Choose a second available board.');
  return {poolId:p.id,boards:c.boards.slice(0,c.count)};
 })};}
 function renderBoardChoices(pool,parent,primary){
  if(!boardChoices[pool.id]){const saved=workflow?.boardPlan?.assignments.find(a=>a.poolId===pool.id)?.boards;boardChoices[pool.id]={count:saved?.length||(pool.players.length===4?0:1),boards:saved?.slice()||[primary]};}
  const c=boardChoices[pool.id],row=section('div','pool-board-options',parent);
  if(pool.players.length===4){const label=el('label','Play on',row),select=el('select',null,label);select.dataset.poolBoardCount=String(pool.id);
   for(const [v,t]of [[0,'Choose 1 or 2 boards'],[1,'1 board'],[2,'2 boards']])el('option',t,select).value=String(v);
   select.value=String(c.count);select.addEventListener('change',()=>{c.count=Number(select.value);approval=null;startReview=null;renderDraw();});
  }
  for(let i=0;i<(c.count||1);i++){
   const label=el('label',c.count===2?(i?'Board 2':'Board 1'):'Board',row),select=el('select',null,label);select.dataset.poolBoardNumber=String(pool.id)+':'+i;el('option','Choose board',select).value='';
   for(const n of selectedBoardsSafe())el('option',String(n),select).value=String(n);select.value=c.boards[i]?String(c.boards[i]):'';
   select.addEventListener('change',()=>{c.boards[i]=Number(select.value);approval=null;startReview=null;renderDraw();});
  }
 }
 function renderMatchPlan(plan,draw,parent){
  const details=el('details',null,parent);el('summary','Board match order · '+plan.matches.length+' matches',details);
  el('p','Matches on the same row number may run together. Wait for both boards before the next row. This is the Hub venue plan; Nakka remains the scoring system.',details);
  const players=new Map(draw.pools.flatMap(p=>p.players.map(q=>[q.id,q.name]))),table=el('table',null,details),head=el('tr',null,table);['Order','Board','Match'].forEach(t=>el('th',t,head));
  for(const m of plan.matches){const row=el('tr',null,table);el('td',String(m.wave),row);el('td',String(m.board),row);el('td',m.players.map(id=>players.get(id)).join(' vs '),row);}
 }
 function renderSaved(box){
  const grid=section('div','pool-grid',box),pools=workflow.draw.pools;
  for(const [i,pool]of pools.entries())if(!boardChoices[pool.id]){const saved=workflow.boardPlan?.assignments.find(a=>a.poolId===pool.id)?.boards;boardChoices[pool.id]={count:saved?.length||(pool.players.length===4?0:1),boards:saved?.slice()||[selectedBoardsSafe()[i%selectedBoardsSafe().length]]};}
  const chosen=p=>{const c=boardChoices[p.id],boards=c?.boards.slice(0,c.count)||[];return c?.count&&boards.length===c.count&&new Set(boards).size===boards.length&&boards.every(b=>selectedBoardsSafe().includes(b))?boards:[];};
  const boardsMatch=pools.every(p=>JSON.stringify(chosen(p))===JSON.stringify(workflow.boardPlan?.assignments.find(a=>a.poolId===p.id)?.boards||[]));
  const startReady=workflow.canStart&&boardsMatch&&!sourceLoadFailed;
  for(const [i,pool]of pools.entries()){
   const boards=chosen(pool),shared=boards.find(b=>pools.some(p=>p!==pool&&chosen(p).includes(b)));
   const card=section('section','pool-card',grid),top=section('div','pool-card-heading',card);
   el('h3',boards.length?'Bana '+boards.join(' + '):'Pool '+(i+1),top).className='pool-edit-label';
   if(shared){const number=pools.filter(p=>chosen(p).includes(shared)).findIndex(p=>p.id===pool.id)+1;el('span','Group '+number+(boards.length>1?' · Bana '+shared:''),top);}
   const avg=BeautyPoolSeeding.summary(pool).knownAverage,groupRow=section('div','pool-group-heading',top);
   el('span','START ',groupRow);numeric('strong',avg===null?'—':avg.toFixed(2),groupRow);
   const players=el('ol',null,card);for(const player of pool.players){
    const row=section('div','pool-player-name',el('li',null,players));el('span',player.name,row);
    const value=el('span',player.average===null?'—':averageLabel(player.average),row);value.className=player.average===null?'pool-unseeded':'pool-number';value.setAttribute('aria-label',player.average===null?'Unseeded':'Frozen average '+averageLabel(player.average));
   }
   if(!workflow.running){renderBoardChoices(pool,card,boards?.[0]||selectedBoardsSafe()[i%selectedBoardsSafe().length]||1);const saved=workflow.boardPlan?.assignments.find(a=>a.poolId===pool.id)?.boards;const ready=!!saved&&JSON.stringify(saved)===JSON.stringify(boards);const status=el('span',ready?'✓ Boards saved':'! Save boards',card);status.className='pool-inline-status';status.dataset.ready=String(ready);status.setAttribute('role','status');}
  }
  const start=section('section','pool-approval',box);start.dataset.startSection='';
  el('h3','4 · Start event',start);
  const settings=panel.querySelector('[data-saved-plan-settings]');
  if(workflow.format){const f=workflow.format,rules=el('details',null,settings);el('summary','Qualification rules',rules);el('p','3-player pool: 1st & 2nd → Slutspel 1; 3rd → Slutspel 2.',rules);el('p','4-player pool: 1st & 2nd → Slutspel 1; 3rd & 4th → Slutspel 2.',rules);el('p','Slutspel 1: '+f.stage1.qualifiers+' Players · Slutspel 2: '+f.stage2.qualifiers+' Players',rules);}
  if(workflow.boardPlan)renderMatchPlan(workflow.boardPlan,workflow.draw,settings);
  if(workflow.startPending){el('p','Starting TEST event… Checking Nakka.',start);steps();disable();return;}
  if(!workflow.running){const saveBoards=button('SAVE BOARDS & MATCH PLAN',start,()=>run(async send=>{const r=await send('poolboardplan',{boardPlan:JSON.stringify(boardInput(workflow.draw.pools))});workflow=r.workflow;startReview=null;renderDraw();message(r.message);}));saveBoards.dataset.blocked=String(sourceLoadFailed);}
  if(workflow.running){el('p','Competition is running in Nakka. Open Beauty Live from the sidebar.',start);if(root.BeautyTournamentControl)button('TOURNAMENT CONTROL',start,()=>root.BeautyTournamentControl.open());steps();disable();return;}
  if(!startReady){el('p',sourceLoadFailed?'! Reload Hub to check saved boards':workflow.startUncertain?'Start is unverified. Inspect the event and its audit before another action.':'! Save boards first',start);steps();disable();return;}
  const begin=button('START EVENT — TEST',start,()=>run(async send=>{
   const result=await send('poolstartprepare',{});startReview=result;renderDraw();
  }));begin.dataset.startPrepare='';begin.dataset.blocked=String(workflow.draw.pools.some(p=>p.players.length===4)&&!workflow.boardPlan);
  if(startReview){begin.hidden=true;el('p','Start '+workflow.event.title+'? Registration will move to In session. The saved pools and qualification rules stay in place.',start);
   const label=el('label',null,start),check=el('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode(' The players, pools and qualification rules are correct. Start this TEST competition.'));
   const confirm=button('CONFIRM START — TEST',start,()=>run(async send=>{
    if(!check.checked||!startReview)return;const ticket=startReview.ticket;startReview=null;workflow.canStart=false;workflow.startPending=true;renderDraw();message('Starting once. Checking Nakka…');
    try{const result=await send('poolstart',{ticket,confirmed:'true'});workflow.running=true;workflow.event.status=30;renderSource();message(result.message+' Audit: '+result.audit);}catch(e){workflow.startUncertain=true;throw e;}finally{workflow.startPending=false;renderDraw();}
   }));confirm.dataset.startConfirm='';confirm.dataset.blocked='true';check.addEventListener('change',()=>{confirm.dataset.blocked=String(!check.checked);disable();});
   button('CANCEL START',start,()=>{startReview=null;renderDraw();});
  }steps();disable();
 }
 async function load(send,refresh){try{state=await send('poolload',{refresh:String(refresh)});sourceLoadFailed=false;}catch(e){sourceLoadFailed=true;if(state?.stats)state.stats.fresh=false;approval=null;startReview=null;renderSource();renderDraw();throw e;}workflow=state.workflow||null;if(workflow)boardChoices={};if(workflow?.boardPlan&&!selectedBoardsSafe().length)host.querySelector('[data-boards]').value=[...new Set(workflow.boardPlan.assignments.flatMap(a=>a.boards))].sort((a,b)=>a-b).join(', ');startReview=null;approval=null;if(frozen){invalid=true;invalidReason='Statistics or identity mappings were reloaded. Generate a new preview.';}renderSource();renderDraw();message(workflow?(workflow.running?'Competition is running. Open Beauty Live to follow play.':(!selectedBoardsSafe().length?'! Select available boards above':'')):'Review player mappings before generating a draw. '+(state.stats?.message||''));}
 function mount(dialog){
  if(BeautyHubServices.mode!=='test')return;host=dialog;panel=section('section','seeded-pool-planner pool-planner-workspace',host);
  const header=section('header','pool-page-heading',panel),intro=el('div',null,header);el('h2','Pool Planner',intro);el('p','Choose boards → review players → make pools → choose qualifiers → send → start.',intro);
  const progress=section('ol','pool-progress',header);['Setup','Pools','Review & send','Start'].forEach((text,i)=>{const li=el('li',null,progress),n=button(null,li,()=>{if(i===0){panel.querySelector('[data-size-choice]')?.focus();panel.querySelector('.pool-setup')?.scrollIntoView?.({block:'center'});}else if(i===1){panel.querySelector('[data-pool-draw]')?.scrollIntoView?.({block:'start'});}else if(i===2)panel.querySelector('[data-handoff]')?.click();else panel.querySelector('[data-start-section]')?.scrollIntoView?.({block:'center'});});n.dataset.step=String(i+1);numeric('span',i+1,n);el('strong',text,n);n.setAttribute('aria-label',text);});
  const event=section('div','pool-event-label',header);el('strong','TEST EVENT',event);el('p','Selected Hub event',event).dataset.eventLabel='';
  const setup=section('section','pool-setup',panel),total=section('div','pool-in-tile',setup);el('span','PLAYERS IN',total).className='label';numeric('strong','—',total).dataset.inCount='';
  const sizeLabel=section('div','pool-size-setting',setup);el('span','PLAYERS PER POOL',sizeLabel).className='label';const size=el('select',null,sizeLabel);size.dataset.size='';size.hidden=true;size.setAttribute('aria-hidden','true');size.tabIndex=-1;
  [3,4].forEach(n=>el('option',String(n),size).value=String(n));const choices=section('div','pool-size-choices',sizeLabel);
  [3,4].forEach(n=>{const b=button(String(n),choices,()=>{size.value=String(n);settingsChanged();});b.dataset.sizeChoice=String(n);b.setAttribute('aria-label',n+' players per pool');});
  const boardsLabel=el('label','BOARDS',setup),boards=el('input',null,boardsLabel);boards.type='text';boards.maxLength=1000;boards.setAttribute('aria-label','Selected boards');boards.dataset.boards='';
  const arrangement=el('label',null,setup);arrangement.hidden=true;const scheme=el('select',null,arrangement);scheme.dataset.drawScheme='';for(const [v,t]of [['preferredPlan','Preferred format'],['perBoard','One pool per dartboard']])el('option',t,scheme).value=v;
  const draw=button('GENERATE PREVIEW',setup,()=>{const confirm=panel.querySelector('[data-preview-confirm]');if(!confirm)return;panel.querySelector('[data-mapping-reviewed]').checked=false;const proceed=panel.querySelector('[data-confirm-generate]');proceed.dataset.blocked='true';disable();message('Review the player identity acknowledgement in the popup.');confirm.showModal();});draw.dataset.generate='';draw.dataset.blocked='true';
  const schemeTile=section('div','pool-scheme-tile',setup),boardSummary=section('div','pool-board-summary',schemeTile),poolSummary=section('div','pool-pools-summary',schemeTile);
  el('span','BOARDS',boardSummary).className='label';const needed=numeric('strong','—',boardSummary);needed.className='pool-number pool-needed-number';needed.dataset.boardsNeeded='';needed.setAttribute('title','Boards used by this plan; pools may share a board.');
  const poolsLabel=el('span','POOLS',poolSummary);poolsLabel.className='label';poolsLabel.dataset.poolsLabel='';el('div','Select available boards.',poolSummary).dataset.planSummary='';
  const boardChoices=section('div','pool-board-choices',panel);for(let n=1;n<=16;n++){const b=button(String(n),boardChoices,()=>{let selected=[];try{selected=selectedBoards();}catch(e){}const next=selected.includes(n)?selected.filter(v=>v!==n):[...selected,n];boards.value=next.sort((a,b)=>a-b).join(', ');settingsChanged();});b.dataset.boardChoice=String(n);b.setAttribute('aria-label','Board '+n);}
  const toolbar=section('div','pool-toolbar',panel);toolbar.dataset.poolToolbar='';const reviewToggle=button('Review players',toolbar,()=>{const details=panel.querySelector('[data-player-review]');if(details){details.open=!details.open;reviewToggle.setAttribute('aria-expanded',String(details.open));}});reviewToggle.dataset.reviewToggle='';reviewToggle.setAttribute('aria-controls','pool-player-review');reviewToggle.setAttribute('aria-expanded','false');reviewToggle.dataset.blocked='true';el('div',null,toolbar).dataset.leagueSlot='';const advancedToggle=button('Advanced settings',toolbar,()=>{advanced.open=!advanced.open;advancedToggle.setAttribute('aria-expanded',String(advanced.open));});advancedToggle.dataset.advancedToggle='';advancedToggle.setAttribute('aria-controls','pool-advanced-settings');advancedToggle.setAttribute('aria-expanded','false');
  toolbar.appendChild(progress);const boardRow=section('div','pool-board-row',panel);const boardTitle=el('span','BOARDS',boardRow);boardTitle.className='label';boardRow.appendChild(boardChoices);boardRow.appendChild(draw);setup.after?.(boardRow);
  const advanced=el('details',null,panel);advanced.id='pool-advanced-settings';advanced.addEventListener('toggle',()=>advancedToggle.setAttribute('aria-expanded',String(advanced.open)));advanced.className='pool-advanced';advanced.dataset.advancedSettings='';el('summary','Advanced settings',advanced);
  boardsLabel.hidden=true;advanced.appendChild(boardsLabel);const planOptions=el('p','',advanced);planOptions.dataset.planOptions='';planOptions.hidden=true;
  const manual=el('label','Try a different player count (estimate only) ',advanced),count=el('input',null,manual);count.type='number';count.min='5';count.max='101';count.placeholder='e.g. 37';count.dataset.manualCount='';const estimate=el('p','Estimates do not change registrations or the actual draw.',advanced);
  count.addEventListener('input',renderEstimate);estimate.dataset.estimate='';
  const reference=el('a','Open original 5–101 pool scheme ↗',advanced);reference.href='assets/pool-scheme.html';
  if(reference.href.startsWith('data:')){const encoded=reference.href.split(',')[1],bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));reference.href=URL.createObjectURL(new Blob([bytes],{type:'text/html;charset=utf-8'}));}reference.target='_blank';reference.rel='noopener noreferrer';
  el('section',null,advanced).dataset.statCalculation='';el('section',null,advanced).dataset.savedPlanSettings='';el('div',null,panel).dataset.poolSource='';el('div',null,panel).dataset.drawUtilities='';const notice=el('p','Load league statistics to review identities and generate a draw.',panel);notice.dataset.poolMessage='';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');el('div',null,panel).dataset.poolDraw='';
  boards.addEventListener('input',settingsChanged);scheme.addEventListener('change',settingsChanged);
  host.addEventListener('cancel',e=>{if(busy)e.preventDefault();});host.addEventListener('close',()=>{epoch++;approval=null;invalid=true;renderDraw();});
  root.setInterval(()=>{if(host?.open&&!document.hidden&&!busy&&state&&!frozen&&!panel.querySelector('[data-player-review]')?.open)run(send=>load(send,false));},300000);
  renderSource();renderDraw();steps();
 }
 function open(button){
  if(BeautyHubServices.mode!=='test')return false;
  opener=button;
  if(!host){
   const main=document.querySelector('.main-content');if(!main)return false;
   const workspace=el('section',null,main);workspace.className='pool-workspace';workspace.setAttribute('aria-label','Pool Planner');workspace.hidden=true;workspace.open=false;
   workspace.close=()=>{if(busy)return;workspace.open=false;workspace.hidden=true;document.body.classList.remove('pool-workspace-active');const title=document.querySelector('.masthead-title');if(title)title.textContent='Event Hub';workspace.dispatchEvent(new Event('close'));};
   mount(workspace);
   for(const nav of document.querySelectorAll('.sidebar > button'))if(nav!==button)nav.addEventListener('click',event=>{if(!workspace.open)return;if(busy){event.preventDefault();event.stopImmediatePropagation();message('Wait for the current operation to finish.');return;}workspace.close();},true);
  }
  host.hidden=false;host.open=true;const masthead=document.querySelector('.masthead-title');if(masthead)masthead.textContent='Pool Plan';document.body.classList.add('pool-workspace-active');root.BeautyHubNavigation?.activate(button);renderSettings();renderDraw();host.scrollIntoView?.({block:'start'});if(!busy){message('Loading players, league averages and saved competition…');run(send=>load(send,false));}return true;
 }
 document.addEventListener('beauty-hub-locked',()=>{epoch++;jobSerial++;root.beautyStagePendingLabels=null;busy=false;state=null;frozen=null;approval=null;workflow=null;startReview=null;boardChoices={};invalid=true;host?.close();panel?.querySelector('[data-pool-source]')?.replaceChildren();panel?.querySelector('[data-pool-draw]')?.replaceChildren();if(panel){renderSource();renderDraw();message('Sign in, then reload league statistics.');}});
 root.BeautySeededPoolUI={mount,open,update(data){hubAvailable=root.BeautyPoolPlanner.eventCount(data)!==null;renderSettings();if(frozen&&fingerprint(data)!==lastRoster)invalidate('The IN roster or event date changed. The frozen preview is retained for reference; generate a new draw.');},unavailable(){hubAvailable=false;renderSettings();if(frozen)invalidate('Hub data unavailable. Wait for a verified refresh, then generate a new draw.');},isBusy:()=>busy};
})(window);
