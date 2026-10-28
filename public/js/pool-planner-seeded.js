/* Identity TEST seeded Pool Planner. Approval and draws are server-owned. */
(function(root){
 'use strict';
 let panel,host,opener,state=null,frozen=null,approval=null,busy=false,epoch=0,invalid=true,lastRoster='',hubAvailable=true;
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
 function currentPlan(){return BeautyPoolPlanner.plan(BeautyPoolPlanner.eventCount(root.beautyHubData),Number(host.querySelector('[data-size]').value),Number(host.querySelector('[data-boards]').value));}
 function renderSettings(){
  if(!panel)return;
  const count=hubAvailable?BeautyPoolPlanner.eventCount(root.beautyHubData):null,result=currentPlan(),selected=result[panel.querySelector('[data-draw-scheme]').value];
  panel.querySelector('[data-in-count]').textContent=count===null?'—':String(count);
  panel.querySelector('[data-event-label]').textContent=(state?.event?.title||'Selected Hub event')+' · '+(root.beautyHubData?.eventDateDisplay||root.beautyHubData?.eventDate||'No date');
  const summary=panel.querySelector('[data-plan-summary]');summary.textContent=result.error||(!selected?'One pool per board cannot fit. Choose preferred format or add boards.':selected.pools+' pools · '+result.boards+' boards · '+Math.ceil(selected.pools/result.boards)+' starting batch'+(Math.ceil(selected.pools/result.boards)===1?'':'es'));
  panel.querySelector('[data-generate]').dataset.blocked=String(!hubAvailable||!state?.stats?.fresh||!selected||!!result.error||count>101);
  const options=panel.querySelector('[data-plan-options]');options.textContent=result.error?'':('Preferred: '+result.preferredPlan.three+' × 3 / '+result.preferredPlan.four+' × 4 / '+result.preferredPlan.five+' × 5. '+(result.perBoard?'One pool per board: '+result.perBoard.three+' × 3 / '+result.perBoard.four+' × 4 / '+result.perBoard.five+' × 5.':'No one-pool-per-board arrangement available.'));
  for(const n of panel.querySelectorAll('[data-size-choice]'))n.setAttribute('aria-pressed',String(n.dataset.sizeChoice===host.querySelector('[data-size]').value));
  disable();
 }
 function settingsChanged(){if(frozen){approval=null;invalid=true;message('Draw settings changed. Generate and review a new preview.');renderDraw();}renderSettings();}
 async function generate(send){
  if(!hubAvailable)throw Error('Hub data unavailable. Wait for a verified refresh before drawing.');
  if(!state)throw Error('Load league statistics and review player identities first.');
  if(!panel.querySelector('[data-mapping-reviewed]').checked){panel.querySelector('[data-player-review]').open=true;throw Error('Review and tick the player identity acknowledgement first.');}
  const plan=currentPlan(),scheme=panel.querySelector('[data-draw-scheme]').value;
  if(plan.error||!plan[scheme])throw Error(plan.error||'That arrangement cannot fit the boards. Choose the preferred format or add boards.');
  frozen=await send('pooldraw',{bindings:JSON.stringify(bindings()),sizes:JSON.stringify(BeautyPoolSeeding.sizesFromPlan(plan[scheme])),reviewed:'true'});
  approval=null;invalid=false;lastRoster=fingerprint(root.beautyHubData);panel.querySelector('[data-player-review]').open=false;
  message('Averages are frozen. Review pool balance and make any manual swaps before approving.');renderDraw();
 }

 function fingerprint(data){return data?.success&&Array.isArray(data.players)?JSON.stringify([data.eventDate,data.players.filter(p=>p.status==='IN').map(p=>p.player||p.newPlayer).sort()]):'';}
 function invalidate(text){invalid=true;approval=null;if(panel){message(text);renderDraw();}}
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
  disable();try{await job(send);}catch(e){if(valid())message(e.message);}finally{busy=false;disable();}
 }
 function disable(){if(panel)panel.querySelectorAll('button,input,select').forEach(n=>{n.disabled=busy||n.dataset.blocked==='true';});}
 function bindings(){return [...panel.querySelectorAll('[data-binding]')].map(row=>({id:row.dataset.binding,lpid:row.querySelector('[data-lpid]').value,tpid:row.querySelector('[data-tpid]').value}));}
 function select(parent,key,candidates,field,value){const s=el('select',null,parent);s.dataset[key]='';el('option','Unresolved / Unseeded',s).value='';for(const p of candidates)el('option',p.name+' · '+p[field],s).value=p[field];s.value=value;s.addEventListener('change',()=>{frozen=null;approval=null;invalid=true;const row=parent.parentElement,p=state.mappings.find(p=>p.id===row.dataset.binding),selected=p?.leagueCandidates.find(p=>p.lpid===row.querySelector('[data-lpid]').value);const cell=row.querySelector('.pool-number');if(cell)cell.textContent=averageLabel(selected?.average);panel.querySelector('[data-mapping-reviewed]').checked=false;message('Player identity changed. Review the mappings and generate a new preview.');renderDraw();});return s;}
 function renderSource(){
  const box=panel.querySelector('[data-pool-source]');box.replaceChildren();
  const status=section('div','pool-source-status',box),statsCard=section('section','pool-status-card',status);
  const stats=state?.stats;
  const title=el('strong',stats?(stats.fresh?'League averages current':'Statistics stale / unavailable'):'Load league averages',statsCard);title.dataset.fresh=String(!!stats?.fresh);
  el('p',stats?.fetchedAt?'Last successful update '+new Date(stats.fetchedAt).toLocaleString('sv-SE',{timeZone:'Europe/Stockholm'}):'Overall league three-dart averages',statsCard);
  button(state?'REFRESH STATS':'LOAD / REFRESH LEAGUE STATS',statsCard,()=>run(send=>load(send,true)));
  if(!state){el('p','Load statistics before reviewing player identities.',box);renderSettings();return;}
  const needsReview=state.mappings.filter(p=>!p.lpid||!p.tpid).length,reviewCard=section('section','pool-status-card',status);
  const reviewState=el('strong',needsReview?needsReview+' player identities need review':'Player identities ready for review',reviewCard);reviewState.dataset.reviewState='';
  el('p',needsReview?'Missing identities can be planned as Unseeded. Sending stays blocked.':'Confirm the proposed league and event identities below.',reviewCard);
  const details=el('details',null,box);details.dataset.playerReview='';details.className='pool-player-review';el('summary','Review '+state.mappings.length+' IN players and league / event identities',details);
  button('REVIEW PLAYERS',reviewCard,()=>{details.open=!details.open;details.scrollIntoView?.({block:'nearest',behavior:'smooth'});});
  el('p','Names propose matches. Check the LPID and event entry ID in Nakka. If Nakka does not expose the saved league link, this records your review; it does not prove that hidden link. Missing averages remain Unseeded.',details);
  const wrap=section('div','pool-review-table-wrap',details),table=el('table',null,wrap),head=el('tr',null,el('thead',null,table));['Player','League identity (LPID)','Event entry (TPID)','Overall average'].forEach(t=>el('th',t,head));const body=el('tbody',null,table);
  for(const p of state.mappings){const row=el('tr',null,body);row.dataset.binding=p.id;el('td',p.name,row);select(el('td',null,row),'lpid',p.leagueCandidates,'lpid',p.lpid);select(el('td',null,row),'tpid',p.eventCandidates,'tpid',p.tpid);const avg=numeric('td',averageLabel(p.average),row);if(p.reason)el('small',p.reason,avg);}
  const label=el('label',null,details),review=el('input',null,label);review.type='checkbox';review.dataset.mappingReviewed='';label.appendChild(document.createTextNode(' I reviewed all proposed identities. Unresolved players may be planned as Unseeded; sending requires every league identity and event entry.'));
  review.addEventListener('change',()=>{panel.querySelector('[data-review-state]').textContent=review.checked?'Identity review acknowledged':needsReview?needsReview+' player identities need review':'Player identities ready for review';});
  const source=el('details',null,box);source.className='pool-source-detail';el('summary','Statistics source and calculation',source);
  el('p',(stats.title||'AIK league')+' · '+(stats.method||'Overall three-dart average = 3 × total score / total darts. Display uses two decimals; seeding keeps full precision. Ranking points are separate.'),source);
  if(stats.message)el('p',stats.message,source);if(state.journal)el('p',state.journal,source);
  renderSettings();
 }
 function renderDraw(){
  const box=panel?.querySelector('[data-pool-draw]');if(!box)return;box.replaceChildren();steps();
  if(!frozen){el('p','Generate a preview after reviewing player identities. No Nakka changes are sent by previewing or swapping.',box).className='pool-empty';return;}
  const draw=frozen.draw,heading=section('div','pool-preview-heading',box);el('h3','Pool preview',heading);el('p','Frozen '+draw.frozenAt+' · Statistics '+draw.source.fetchedAt+' · Draw seed '+draw.seed,heading);
  if(invalid)el('p','REVIEW INVALIDATED — source expired, unavailable or changed. Generate a new draw before sending.',box).className='pool-invalid';
  const warnings=BeautyPoolSeeding.warnings(draw);if(warnings.length){const details=el('details',null,box);details.className='pool-draw-notes';el('summary','Draw notes · '+warnings.length,details);warnings.forEach(t=>el('p',t,details));}
  const settings=section('div','pool-preview-tools',box),label=el('label',null,settings),colours=el('input',null,label);colours.type='checkbox';colours.checked=!!root.beautyPoolColours;label.appendChild(document.createTextNode(' Show seeding colours'));
  const bands=el('details',null,settings);el('summary','Edit bands',bands);const bounds=el('label','Band boundaries (three increasing values) ',bands),inputs=[50,55,60].map((v,i)=>{const n=el('input',null,bounds);n.type='number';n.min='0';n.max='180';n.step='0.01';n.value=String(root.beautyPoolBands?.[i]??v);return n;});
  const legend=el('p',null,bands),grid=section('div','pool-grid',box);
  function paint(){
   const thresholds=inputs.map(n=>Number(n.value));try{BeautyPoolSeeding.band(null,thresholds);}catch(e){legend.textContent=e.message;return;}
   root.beautyPoolBands=thresholds;root.beautyPoolColours=colours.checked;legend.textContent='Bands: below '+thresholds[0]+'; '+thresholds[0]+'–<'+thresholds[1]+'; '+thresholds[1]+'–<'+thresholds[2]+'; '+thresholds[2]+'+. Unseeded is separate.';grid.replaceChildren();
   for(const pool of draw.pools){
    const card=section('section','pool-card',grid),top=section('div','pool-card-heading',card);el('h4','Pool '+pool.name,top);numeric('span',pool.players.length+'/'+pool.capacity,top);
    const summary=BeautyPoolSeeding.summary(pool),info=section('div','pool-card-summary',card);el('span','Known average: ',info);numeric('strong',summary.knownAverage===null?'—':summary.knownAverage.toFixed(2),info);el('span','Coverage '+summary.known+'/'+summary.players+' · Unseeded '+summary.unseeded,info);
    const list=el('ol',null,card);
    for(const p of pool.players){const li=el('li',null,list);if(colours.checked)li.className='pool-band-'+BeautyPoolSeeding.band(p.average,thresholds);el('span',p.name,li).className='pool-player-name';const value=el('span',averageLabel(p.average),li);value.className=p.average===null?'pool-unseeded':'pool-number';}
   }
  }
  colours.addEventListener('change',paint);inputs.forEach(n=>n.addEventListener('change',paint));paint();if(invalid){disable();return;}
  const swap=section('fieldset','pool-manual-swap',box);el('legend','Manual swap',swap);el('p','Swap between pools. Your frozen averages and pool sizes are retained.',swap);
  const first=el('label','Player ',swap),left=el('select',null,first),second=el('label','Swap with ',swap),right=el('select',null,second);
  for(const pool of draw.pools)for(const p of pool.players)for(const target of [left,right])el('option','Pool '+pool.name+' · '+p.name,target).value=p.id;
  const footer=section('div','pool-action-bar',box);el('p','Preview only · No Nakka changes sent',footer);
  const unresolved=(frozen.mappings||state?.mappings||[]).filter(p=>!p.lpid||!p.tpid).length;
  button('SWAP PLAYERS',swap,()=>run(async send=>{const target=draw.pools.find(g=>g.players.some(p=>p.id===right.value));frozen=await send('pooladjust',{ticket:frozen.ticket,change:JSON.stringify({playerId:left.value,targetPool:target.id,swapWith:right.value})});approval=null;message('Swap saved in preview. Review the new pool balance.');renderDraw();}));
  const handoff=button('REVIEW NAKKA HANDOFF — TEST',footer,()=>run(async send=>{approval=await send('poolprepare',{ticket:frozen.ticket});frozen.ticket=approval.ticket;message('Handoff checked. Close Nakka editing pages, then confirm these TEST pools.');renderDraw();}));
  handoff.dataset.blocked=String(unresolved>0||!state?.stats?.fresh||!hubAvailable);
  if(unresolved)el('p','Resolve '+unresolved+' player identities before sending. Preview and manual swaps remain available.',footer);
  if(approval){const review=el('section',null,box);review.className='pool-approval';el('h3','Approve TEST pool handoff',review);el('p',approval.event.title+' · '+approval.event.date+' · '+draw.roster.length+' IN players · '+draw.pools.length+' pools · '+approval.expectedCards+' round-robin match cards.',review);
   el('p','Only pool assignments, division count and maximum pool size change. Existing players and other event settings are retained. Sending uses two Nakka operations: groups, then match cards. If either cannot be verified, inspect the audit before another action.',review);
   const details=el('details',null,review);el('summary','Review preserved game settings',details);el('pre',JSON.stringify(approval.setting,null,2),details);
   const label=el('label',null,review),check=el('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode(' I approve these identities, frozen pools and match cards for the named TEST event. Nakka editing pages are closed.'));
   const save=button('SEND APPROVED TEST POOLS',review,()=>run(async send=>{if(!check.checked)throw Error('Tick the final approval first.');const ticket=approval.ticket;approval=null;invalid=true;message('Sending once. Waiting for group and match-card readback…');try{const r=await send('poolsave',{ticket,confirmed:'true'});frozen=null;message(r.message+' Audit: '+r.audit+' · Receipt: '+r.receipt);renderDraw();}catch(e){renderDraw();throw Error(e.message+' Do not repeat a send until the event and audit have been inspected.');}}));save.dataset.blocked='true';save.disabled=true;check.addEventListener('change',()=>{save.dataset.blocked=String(!check.checked);disable();});
  }steps();disable();
 }
 async function load(send,refresh){state=await send('poolload',{refresh:String(refresh)});approval=null;if(frozen)invalid=true;renderSource();renderDraw();message('Review player mappings before generating a draw. '+(state.stats.message||''));}
 function mount(dialog){
  if(BeautyHubServices.mode!=='test')return;host=dialog;panel=section('section','seeded-pool-planner pool-planner-workspace',host);
  const header=section('header','pool-page-heading',panel),intro=el('div',null,header);el('h2','Pool Planner',intro);el('p','Balance the field. Review the draw. Send when ready.',intro);
  const progress=section('ol','pool-progress',header);['Setup','Pool preview','Nakka review'].forEach((text,i)=>{const n=el('li',null,progress);n.dataset.step=String(i+1);numeric('span',i+1,n);el('strong',text,n);});
  const event=section('div','pool-event-label',header);el('strong','TEST EVENT',event);el('p','Selected Hub event',event).dataset.eventLabel='';
  button('BACK TO DASHBOARD',header,()=>{if(!busy){host.close();root.BeautyHubNavigation?.dashboard();opener?.focus();}});
  const setup=section('section','pool-setup',panel),total=el('div',null,setup);el('span','IN PLAYERS',total).className='label';numeric('strong','—',total).dataset.inCount='';el('small','OUT and STANDBY excluded',total);
  const sizeLabel=el('div',null,setup);el('span','PLAYERS PER POOL',sizeLabel).className='label';const size=el('select',null,sizeLabel);size.dataset.size='';size.hidden=true;size.setAttribute('aria-hidden','true');size.tabIndex=-1;
  [3,4].forEach(n=>el('option',String(n),size).value=String(n));const choices=section('div','pool-size-choices',sizeLabel);
  [3,4].forEach(n=>{const b=button(String(n),choices,()=>{size.value=String(n);settingsChanged();});b.dataset.sizeChoice=String(n);b.setAttribute('aria-label',n+' players per pool');});
  const boardsLabel=el('label','AVAILABLE BOARDS',setup),boards=el('input',null,boardsLabel);boards.type='number';boards.min='1';boards.max='1000';boards.step='1';boards.placeholder='Enter boards';boards.dataset.boards='';
  const arrangement=el('label','BOARD LAYOUT',setup),scheme=el('select',null,arrangement);scheme.dataset.drawScheme='';for(const [v,t]of [['preferredPlan','Preferred format'],['perBoard','One pool per dartboard']])el('option',t,scheme).value=v;
  const draw=button('GENERATE SEEDED PREVIEW',setup,()=>run(generate));draw.dataset.generate='';draw.dataset.blocked='true';
  el('p','Enter available boards to see the arrangement.',setup).dataset.planSummary='';
  const advanced=el('details',null,panel);advanced.className='pool-advanced';el('summary','Advanced planning and original scheme',advanced);
  el('p','',advanced).dataset.planOptions='';
  const manual=el('label','Try a different player count (estimate only) ',advanced),count=el('input',null,manual);count.type='number';count.min='5';count.max='101';count.placeholder='e.g. 37';count.dataset.manualCount='';const estimate=el('p','Estimates do not change registrations or the actual draw.',advanced);
  count.addEventListener('input',()=>{const p=BeautyPoolPlanner.plan(Number(count.value),Number(size.value),Number(boards.value));estimate.textContent=Number(count.value)>101?'The supplied scheme covers 5–101.':p.error||p.preferredPlan.pools+' pools: '+p.preferredPlan.three+' × 3, '+p.preferredPlan.four+' × 4, '+p.preferredPlan.five+' × 5. Draws always use the verified IN list.';});
  const reference=el('a','Open original 5–101 pool scheme ↗',advanced);reference.href='assets/pool-scheme.html';
  if(reference.href.startsWith('data:')){const encoded=reference.href.split(',')[1],bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));reference.href=URL.createObjectURL(new Blob([bytes],{type:'text/html;charset=utf-8'}));}reference.target='_blank';reference.rel='noopener noreferrer';
  el('div',null,panel).dataset.poolSource='';const notice=el('p','Load league statistics to review identities and generate a draw.',panel);notice.dataset.poolMessage='';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');el('div',null,panel).dataset.poolDraw='';
  boards.addEventListener('input',settingsChanged);scheme.addEventListener('change',settingsChanged);
  host.addEventListener('cancel',e=>{if(busy)e.preventDefault();});host.addEventListener('close',()=>{epoch++;approval=null;invalid=true;renderDraw();});
  root.setInterval(()=>{if(host?.open&&!document.hidden&&!busy&&state)run(send=>load(send,false));},300000);
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
