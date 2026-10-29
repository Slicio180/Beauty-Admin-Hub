/* Identity TEST seeded Pool Planner. Approval and draws are server-owned. */
(function(root){
 'use strict';
 let panel,host,opener,state=null,frozen=null,approval=null,busy=false,epoch=0,invalid=true,lastRoster='',hubAvailable=true,invalidReason='',plannedBoards=null,cardLabels={},swapped=[];
 const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;parent?.appendChild(n);return n;};
 const average=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=180?value:null;
 const averageLabel=value=>average(value)===null?'Unseeded':average(value).toFixed(2);
 const button=(text,parent,fn)=>{const b=el('button',text,parent);b.type='button';b.addEventListener('click',fn);return b;};
 function message(text){panel.querySelector('[data-pool-message]').textContent=text;}
 function numeric(tag,text,parent){const n=el(tag,text,parent);n.className='pool-number';return n;}
 function section(tag,cls,parent){const n=el(tag,null,parent);n.className=cls;return n;}
 function steps(){
  const current=approval?3:frozen?2:1;
  for(const n of panel.querySelectorAll('[data-step]')){n.dataset.active=String(Number(n.dataset.step)===current);n.setAttribute('aria-current',Number(n.dataset.step)===current?'step':'false');}
 }
 function selectedBoards(){return root.BeautyPoolBoards.parseBoards(host.querySelector('[data-boards]').value);}
 function currentPlan(){let boards;try{boards=selectedBoards().length;}catch(e){return {error:e.message};}return BeautyPoolPlanner.plan(BeautyPoolPlanner.eventCount(root.beautyHubData),Number(host.querySelector('[data-size]').value),boards);}
 function renderSettings(){
  if(!panel)return;
  const count=hubAvailable?BeautyPoolPlanner.eventCount(root.beautyHubData):null,result=currentPlan(),selected=result[panel.querySelector('[data-draw-scheme]').value];
  panel.querySelector('[data-in-count]').textContent=count===null?'—':String(count);
  panel.querySelector('[data-event-label]').textContent=(state?.event?.title||'Selected Hub event')+' · '+(root.beautyHubData?.eventDateDisplay||root.beautyHubData?.eventDate||'No date');
  const summary=panel.querySelector('[data-plan-summary]');summary.textContent=result.error||(!selected?'Select available boards.':[selected.three+' × 3-manna',selected.four+' × 4-manna',result.boards+' banor',...(selected.five?[selected.five+' × 5-manna']:[])].join(' · '));
  panel.querySelector('[data-generate]').dataset.blocked=String(!hubAvailable||!state?.stats?.fresh||!selected||!!result.error||count>101);
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
  estimate.textContent=result.error||plan.pools+' pools: '+plan.three+' × 3-manna · '+plan.four+' × 4-manna'+(plan.five?' · '+plan.five+' × 5-manna':'')+' · '+(boards.length?boards.length+' banor':'No boards selected')+'. Estimate only; draws use the verified IN list.';
 }
 function settingsChanged(){if(frozen){approval=null;invalid=true;invalidReason='Draw settings changed. Generate and review a new preview.';message('Draw settings changed. Generate and review a new preview.');renderDraw();}renderSettings();}
 async function generate(send){
  if(!hubAvailable)throw Error('Hub data unavailable. Wait for a verified refresh before drawing.');
  if(!state)throw Error('Load league statistics and review player identities first.');
  if(!panel.querySelector('[data-mapping-reviewed]').checked){panel.querySelector('[data-player-review]').open=true;throw Error('Review and tick the player identity acknowledgement first.');}
  const plan=currentPlan(),scheme=panel.querySelector('[data-draw-scheme]').value;
  if(plan.error||!plan[scheme])throw Error(plan.error||'That arrangement cannot fit the boards. Choose the preferred format or add boards.');
  frozen=await send('pooldraw',{bindings:JSON.stringify(bindings()),sizes:JSON.stringify(BeautyPoolSeeding.sizesFromPlan(plan[scheme])),reviewed:'true'});
  plannedBoards=selectedBoards();cardLabels={};swapped=[];approval=null;invalid=false;invalidReason='';lastRoster=fingerprint(root.beautyHubData);panel.querySelector('[data-player-review]').open=false;
  message('Averages are frozen. Review pool balance and make any manual swaps before approving.');renderDraw();
 }

 function fingerprint(data){return data?.success&&Array.isArray(data.players)?JSON.stringify([data.eventDate,data.players.filter(p=>p.status==='IN').map(p=>p.player||p.newPlayer).sort()]):'';}
 function invalidate(text){invalid=true;invalidReason=text;approval=null;if(panel){message(text);renderDraw();}}
 async function request(page,input){
  const url=new URL(BeautyHubServices.endpoint);url.search='';url.searchParams.set('page',page);for(const [k,v]of Object.entries(input))url.searchParams.set(k,v);
  const data=await(await BeautyHubServices.request(url.toString())).json();if(!data.success)throw Error((data.error||'Pool request failed.')+(data.audit?' Audit: '+data.audit:''));// Treat absent optional average fields as explicitly unknown at the RPC boundary.
  for(const p of data.mappings||[])p.average=average(p.average);
  for(const p of data.stats?.profiles||[])p.average=average(p.average);
  for(const p of data.draw?.roster||[])p.average=average(p.average);
  for(const g of data.draw?.pools||[])for(const p of g.players||[])p.average=average(p.average);
  return data;
 }
 async function run(job){
  if(busy)return;busy=true;const generation=BeautyHubAuth.generation(),revision=epoch;
  const valid=()=>revision===epoch&&BeautyHubAuth.isCurrent(generation)&&host?.open;
  const send=async(page,input)=>{const r=await request(page,input);if(!valid())throw Error('Session or panel changed. Reopen the planner.');return r;};
  disable();try{await job(send);}catch(e){if(valid()){if(frozen&&/Expired pool preview/.test(e.message))invalidate('Planning ticket expired or was evicted. Generate a new preview; the old draw remains visible.');message(e.message);}}finally{busy=false;disable();}
 }
 function disable(){if(panel)panel.querySelectorAll('button,input,select').forEach(n=>{n.disabled=busy||n.dataset.blocked==='true';});}
 function bindings(){return [...panel.querySelectorAll('[data-binding]')].map(row=>({id:row.dataset.binding,lpid:row.querySelector('[data-lpid]').value,tpid:row.querySelector('[data-tpid]').value}));}
 function select(parent,key,candidates,field,value){const s=el('select',null,parent);s.dataset[key]='';el('option','Unresolved / Unseeded',s).value='';for(const p of candidates)el('option',p.name+' · '+p[field],s).value=p[field];s.value=value;s.addEventListener('change',()=>{frozen=null;approval=null;invalid=true;const row=parent.parentElement,p=state.mappings.find(p=>p.id===row.dataset.binding),selected=p?.leagueCandidates.find(p=>p.lpid===row.querySelector('[data-lpid]').value);const cell=row.querySelector('.pool-number');if(cell)cell.textContent=averageLabel(selected?.average);panel.querySelector('[data-mapping-reviewed]').checked=false;const count=bindings().filter(p=>!p.lpid||!p.tpid).length;panel.querySelector('[data-identity-notice]').hidden=!count;panel.querySelector('[data-review-state]').textContent=count+' identities need review';panel.querySelector('[data-review-summary]').textContent='Review players'+(count?' · '+count+' need review':'');panel.querySelector('[data-review-toggle]').textContent='Review players'+(count?' · '+count+' need review':'');message('Player identity changed. Review the mappings and generate a new preview.');renderDraw();});return s;}
 function renderSource(){
  const box=panel.querySelector('[data-pool-source]');box.replaceChildren();
  const status=panel.querySelector('[data-league-slot]');status.replaceChildren();const statsCard=section('section','pool-status-card',status);const reviewToggle=panel.querySelector('[data-review-toggle]');reviewToggle.dataset.blocked=String(!state);reviewToggle.setAttribute('aria-expanded','false');reviewToggle.textContent='Review players';
  const stats=state?.stats;panel.querySelector('[data-stat-calculation]').replaceChildren();
  const title=el('strong',stats?(stats.fresh?'League averages current':'Statistics stale / unavailable'):'Load league averages',statsCard);title.dataset.fresh=String(!!stats?.fresh);
  el('p',stats?.fetchedAt?'Last successful update '+new Date(stats.fetchedAt).toLocaleString('sv-SE',{timeZone:'Europe/Stockholm'}):'Overall league three-dart averages',statsCard);
  button(state?'REFRESH STATS':'LOAD / REFRESH LEAGUE STATS',statsCard,()=>run(send=>load(send,true)));
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
  const box=panel?.querySelector('[data-pool-draw]');if(!box)return;box.replaceChildren();const utility=panel.querySelector('[data-draw-utilities]');utility.replaceChildren();steps();
  if(!frozen){el('p','Generate a preview after reviewing player identities. No Nakka changes are sent by previewing or swapping.',box).className='pool-empty';return;}
  const statsTitle=panel.querySelector('[data-fresh]');if(statsTitle)statsTitle.textContent='League averages frozen for this preview';
  let allocation;try{allocation=root.BeautyPoolBoards.allocate(frozen.draw.pools,plannedBoards||selectedBoards());}catch(e){invalid=true;approval=null;}
  const draw=frozen.draw,heading=section('div','pool-preview-heading',utility);el('h3','Gruppöversikt',heading);el('p','Frozen '+draw.frozenAt+' · Statistics '+draw.source.fetchedAt+' · Draw seed '+draw.seed,heading);
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
    const position=cardLabels[pool.id];
    const card=section('section','pool-card',grid);card.dataset.poolId=pool.id;
    const top=section('div','pool-card-heading',card),groupRow=section('div','pool-group-heading',card);
    function editable(key,parent,prefix){const edit=button(prefix+' '+position[key]+' ✎',parent,()=>{
     const dialog=el('dialog',null,utility);dialog.className='pool-preview-confirm';el('h3','Edit Bana / Grupp',dialog);
     const boardLabel=el('label','Bana',dialog),board=el('select',null,boardLabel);board.dataset.editBoard='';for(const n of plannedBoards||selectedBoards())el('option',String(n),board).value=n;board.value=position.board;
     const groupLabel=el('label','Grupp',dialog),group=el('input',null,groupLabel);group.type='number';group.min='1';group.max='1000';group.value=position.group;group.dataset.editGroup='';
     const error=el('p','Changes apply to the Hub board plan.',dialog),actions=section('div','pool-confirm-actions',dialog);button('CANCEL',actions,()=>dialog.close());
     button('SAVE LABELS',actions,()=>{const next={board:Number(board.value),group:Number(group.value)};if(!(plannedBoards||selectedBoards()).includes(next.board)||!Number.isInteger(next.group)||next.group<1||next.group>1000){error.textContent='Choose an available board and group 1–1000.';return;}
      if(Object.entries(cardLabels).some(([id,v])=>id!==String(pool.id)&&v.board===next.board&&v.group===next.group)){error.textContent='That Bana / Grupp is already used. Choose another group number.';return;}
      cardLabels[pool.id]=next;approval=null;dialog.close();message('Bana / Grupp saved in the Hub plan.');renderDraw();});dialog.showModal();
    });edit.className='pool-edit-label';edit.dataset.blocked=String(invalid||!hubAvailable);}
    if(position){editable('board',top,'Bana');editable('group',groupRow,'Grupp');}
    const summary=BeautyPoolSeeding.summary(pool);numeric('strong',summary.knownAverage===null?'—':summary.knownAverage.toFixed(2),groupRow);
    const list=el('ol',null,card);
    for(const p of pool.players){const li=el('li',null,list);if(colours.checked)li.className='pool-band-'+BeautyPoolSeeding.band(p.average,thresholds);
     const name=button(p.name,li,()=>openSwap(p));name.className='pool-player-name';name.dataset.swapPlayer=p.id;name.dataset.blocked=String(invalid||!hubAvailable);if(swapped.includes(p.id))name.dataset.swapped='true';
     const value=el('span',averageLabel(p.average),li);value.className=p.average===null?'pool-unseeded':'pool-number';}
   }

  }
  colours.addEventListener('change',paint);inputs.forEach(n=>n.addEventListener('change',paint));paint();
  function openSwap(player){
   const dialog=el('dialog',null,utility);dialog.className='pool-preview-confirm pool-swap-picker';dialog.dataset.swapPicker='';el('h3','Swap '+player.name+' with…',dialog);
   const search=el('input',null,dialog);search.type='search';search.placeholder='Search player';search.setAttribute('aria-label','Search player');search.dataset.swapSearch='';
   const list=section('div','pool-swap-list',dialog);list.dataset.swapList='';
   const origin=draw.pools.find(g=>g.players.some(p=>p.id===player.id));
   function choices(){list.replaceChildren();for(const pool of draw.pools)if(pool.id!==origin.id)for(const other of pool.players){if(!other.name.toLocaleLowerCase('sv').includes(search.value.toLocaleLowerCase('sv')))continue;
    const pos=cardLabels[pool.id],pick=button(other.name+' · Bana '+pos.board+' · Grupp '+pos.group,list,()=>{dialog.close();run(async send=>{const result=await send('pooladjust',{ticket:frozen.ticket,change:JSON.stringify({playerId:player.id,targetPool:pool.id,swapWith:other.id})});frozen=result;swapped=[player.id,other.id];approval=null;message('Swap saved in preview. Both moved players are yellow.');renderDraw();});});pick.dataset.swapWith=other.id;
   }}search.addEventListener('input',choices);choices();button('CANCEL',dialog,()=>dialog.close());dialog.showModal();search.focus();
  }
  button('DOWNLOAD BOARD PLAN',utility,()=>{
   const lines=['AIK DART · HUB BOARD PLAN · TEST',draw.eventDate,'PLANNED — NOT SENT TO NAKKA',''];
   for(const pool of draw.pools.slice().sort((a,b)=>cardLabels[a.id].board-cardLabels[b.id].board||cardLabels[a.id].group-cardLabels[b.id].group)){const pos=cardLabels[pool.id];lines.push('Bana '+pos.board+' · Grupp '+pos.group,...pool.players.map(p=>p.name+' · '+averageLabel(p.average)),'');}
   const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),link=el('a',null,utility);link.href=url;link.download='Beauty-Board-Plan-TEST-'+draw.eventDate+'.txt';link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const footer=section('div','pool-action-bar',utility);el('p','Preview only · No Nakka changes sent',footer);
  const unresolved=(frozen.mappings||state?.mappings||[]).filter(p=>!p.lpid||!p.tpid).length;
  if(invalid)el('p','Swaps and sending are disabled. '+(invalidReason||'Generate a new preview to continue.'),footer);
  const handoff=button('REVIEW NAKKA HANDOFF — TEST',footer,()=>run(async send=>{approval=await send('poolprepare',{ticket:frozen.ticket});frozen.ticket=approval.ticket;message('Handoff checked. Close Nakka editing pages, then confirm these TEST pools.');renderDraw();}));
  handoff.dataset.blocked=String(invalid||unresolved>0||!state?.stats?.fresh||!hubAvailable);
  if(unresolved)el('p','Resolve '+unresolved+' player identities before sending. '+(invalid?'The frozen preview is retained for reference.':'Preview and manual swaps remain available.'),footer);
  if(approval){const review=el('section',null,utility);review.className='pool-approval';el('h3','Approve TEST pool handoff',review);el('p',approval.event.title+' · '+approval.event.date+' · '+draw.roster.length+' IN players · '+draw.pools.length+' pools · '+approval.expectedCards+' round-robin match cards.',review);
   el('p','Only pool assignments, division count and maximum pool size change. Existing players and other event settings are retained. Sending uses two Nakka operations: groups, then match cards. If either cannot be verified, inspect the audit before another action.',review);
   if(approval.unassignedEntries?.length){el('p','Excluded from these pools but still registered in Nakka: '+approval.unassignedEntries.map(p=>p.name).join(', ')+'. Sending is blocked until these entries are resolved or compatibility is verified in TEST. No automatic removals.',review);}
   const details=el('details',null,review);el('summary','Review preserved game settings',details);el('pre',JSON.stringify(approval.setting,null,2),details);
   const label=el('label',null,review),check=el('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode(' I approve these identities, frozen pools and match cards for the named TEST event. Nakka editing pages are closed.'));
   const save=button('SEND APPROVED TEST POOLS',review,()=>run(async send=>{if(!check.checked)throw Error('Tick the final approval first.');const ticket=approval.ticket;approval=null;invalid=true;message('Sending once. Waiting for group and match-card readback…');try{const r=await send('poolsave',{ticket,confirmed:'true'});frozen=null;message(r.message+' Audit: '+r.audit+' · Receipt: '+r.receipt);renderDraw();}catch(e){renderDraw();throw Error(e.message+' Do not repeat a send until the event and audit have been inspected.');}}));save.dataset.blocked='true';save.disabled=true;check.addEventListener('change',()=>{save.dataset.blocked=String(!check.checked||!!approval?.unassignedEntries?.length);disable();});
  }steps();disable();
 }
 async function load(send,refresh){state=await send('poolload',{refresh:String(refresh)});approval=null;if(frozen){invalid=true;invalidReason='Statistics or identity mappings were reloaded. Generate a new preview.';}renderSource();renderDraw();message('Review player mappings before generating a draw. '+(state.stats.message||''));}
 function mount(dialog){
  if(BeautyHubServices.mode!=='test')return;host=dialog;panel=section('section','seeded-pool-planner pool-planner-workspace',host);
  const header=section('header','pool-page-heading',panel),intro=el('div',null,header);el('h2','Pool Planner',intro);el('p','Balance the field. Review the draw. Send when ready.',intro);
  const progress=section('ol','pool-progress',header);['Setup','Pool preview','Nakka review'].forEach((text,i)=>{const n=el('li',null,progress);n.dataset.step=String(i+1);numeric('span',i+1,n);el('strong',text,n);});
  const event=section('div','pool-event-label',header);el('strong','TEST EVENT',event);el('p','Selected Hub event',event).dataset.eventLabel='';
  const setup=section('section','pool-setup',panel),total=section('div','pool-in-tile',setup);el('span','PLAYERS IN',total).className='label';numeric('strong','—',total).dataset.inCount='';
  const sizeLabel=el('div',null,setup);el('span','PLAYERS PER POOL',sizeLabel).className='label';const size=el('select',null,sizeLabel);size.dataset.size='';size.hidden=true;size.setAttribute('aria-hidden','true');size.tabIndex=-1;
  [3,4].forEach(n=>el('option',String(n),size).value=String(n));const choices=section('div','pool-size-choices',sizeLabel);
  [3,4].forEach(n=>{const b=button(String(n),choices,()=>{size.value=String(n);settingsChanged();});b.dataset.sizeChoice=String(n);b.setAttribute('aria-label',n+' players per pool');});
  const boardsLabel=el('label','BOARDS',setup),boards=el('input',null,boardsLabel);boards.type='text';boards.maxLength=1000;boards.placeholder='Select boards below';boards.dataset.boards='';
  const arrangement=el('label',null,setup);arrangement.hidden=true;const scheme=el('select',null,arrangement);scheme.dataset.drawScheme='';for(const [v,t]of [['preferredPlan','Preferred format'],['perBoard','One pool per dartboard']])el('option',t,scheme).value=v;
  const draw=button('GENERATE SEEDED PREVIEW',setup,()=>{const confirm=panel.querySelector('[data-preview-confirm]');if(!confirm)return;panel.querySelector('[data-mapping-reviewed]').checked=false;const proceed=panel.querySelector('[data-confirm-generate]');proceed.dataset.blocked='true';disable();message('Review the player identity acknowledgement in the popup.');confirm.showModal();});draw.dataset.generate='';draw.dataset.blocked='true';
  const schemeTile=section('div','pool-scheme-tile',setup);el('span','SCHEME',schemeTile).className='label';el('p','Select available boards.',schemeTile).dataset.planSummary='';
  const boardChoices=section('div','pool-board-choices',panel);for(let n=1;n<=16;n++){const b=button(String(n),boardChoices,()=>{let selected=[];try{selected=selectedBoards();}catch(e){}const next=selected.includes(n)?selected.filter(v=>v!==n):[...selected,n];boards.value=next.sort((a,b)=>a-b).join(', ');settingsChanged();});b.dataset.boardChoice=String(n);b.setAttribute('aria-label','Board '+n);}
  const toolbar=section('div','pool-toolbar',panel);toolbar.dataset.poolToolbar='';const reviewToggle=button('Review players',toolbar,()=>{const details=panel.querySelector('[data-player-review]');if(details){details.open=!details.open;reviewToggle.setAttribute('aria-expanded',String(details.open));}});reviewToggle.dataset.reviewToggle='';reviewToggle.setAttribute('aria-controls','pool-player-review');reviewToggle.setAttribute('aria-expanded','false');reviewToggle.dataset.blocked='true';el('div',null,toolbar).dataset.leagueSlot='';const advancedToggle=button('Advanced settings',toolbar,()=>{advanced.open=!advanced.open;advancedToggle.setAttribute('aria-expanded',String(advanced.open));});advancedToggle.dataset.advancedToggle='';advancedToggle.setAttribute('aria-controls','pool-advanced-settings');advancedToggle.setAttribute('aria-expanded','false');
  const advanced=el('details',null,panel);advanced.id='pool-advanced-settings';advanced.addEventListener('toggle',()=>advancedToggle.setAttribute('aria-expanded',String(advanced.open)));advanced.className='pool-advanced';advanced.dataset.advancedSettings='';el('summary','Advanced settings',advanced);
  el('p','',advanced).dataset.planOptions='';
  const manual=el('label','Try a different player count (estimate only) ',advanced),count=el('input',null,manual);count.type='number';count.min='5';count.max='101';count.placeholder='e.g. 37';count.dataset.manualCount='';const estimate=el('p','Estimates do not change registrations or the actual draw.',advanced);
  count.addEventListener('input',renderEstimate);estimate.dataset.estimate='';
  const reference=el('a','Open original 5–101 pool scheme ↗',advanced);reference.href='assets/pool-scheme.html';
  if(reference.href.startsWith('data:')){const encoded=reference.href.split(',')[1],bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));reference.href=URL.createObjectURL(new Blob([bytes],{type:'text/html;charset=utf-8'}));}reference.target='_blank';reference.rel='noopener noreferrer';
  el('section',null,advanced).dataset.statCalculation='';el('div',null,panel).dataset.poolSource='';el('div',null,panel).dataset.drawUtilities='';const notice=el('p','Load league statistics to review identities and generate a draw.',panel);notice.dataset.poolMessage='';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');el('div',null,panel).dataset.poolDraw='';
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
   workspace.close=()=>{if(busy)return;workspace.open=false;workspace.hidden=true;document.body.classList.remove('pool-workspace-active');workspace.dispatchEvent(new Event('close'));};
   mount(workspace);
   for(const nav of document.querySelectorAll('.sidebar > button'))if(nav!==button)nav.addEventListener('click',event=>{if(!workspace.open)return;if(busy){event.preventDefault();event.stopImmediatePropagation();message('Wait for the current operation to finish.');return;}workspace.close();},true);
  }
  host.hidden=false;host.open=true;document.body.classList.add('pool-workspace-active');root.BeautyHubNavigation?.activate(button);renderSettings();renderDraw();host.scrollIntoView?.({block:'start'});return true;
 }
 document.addEventListener('beauty-hub-locked',()=>{epoch++;busy=false;state=null;frozen=null;approval=null;invalid=true;host?.close();panel?.querySelector('[data-pool-source]')?.replaceChildren();panel?.querySelector('[data-pool-draw]')?.replaceChildren();if(panel){renderSource();renderDraw();message('Sign in, then reload league statistics.');}});
 root.BeautySeededPoolUI={mount,open,update(data){hubAvailable=root.BeautyPoolPlanner.eventCount(data)!==null;renderSettings();if(frozen&&fingerprint(data)!==lastRoster)invalidate('The IN roster or event date changed. The frozen preview is retained for reference; generate a new draw.');},unavailable(){hubAvailable=false;renderSettings();if(frozen)invalidate('Hub data unavailable. Wait for a verified refresh, then generate a new draw.');},isBusy:()=>busy};
})(window);
