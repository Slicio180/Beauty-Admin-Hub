/* Identity TEST seeded Pool Planner. Approval and draws are server-owned. */
(function(root){
 'use strict';
 let panel,host,state=null,frozen=null,approval=null,busy=false,epoch=0,invalid=true,lastRoster='';
 const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;parent?.appendChild(n);return n;};
 const average=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=180?value:null;
 const averageLabel=value=>average(value)===null?'Unseeded':average(value).toFixed(2);
 const button=(text,parent,fn)=>{const b=el('button',text,parent);b.type='button';b.addEventListener('click',fn);return b;};
 function message(text){panel.querySelector('[data-pool-message]').textContent=text;}
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
 function select(parent,key,candidates,field,value){const s=el('select',null,parent);s.dataset[key]='';el('option','Unresolved / Unseeded',s).value='';for(const p of candidates)el('option',p.name+' · '+p[field],s).value=p[field];s.value=value;s.addEventListener('change',()=>{frozen=null;approval=null;invalid=true;const row=parent.parentElement,p=state.mappings.find(p=>p.id===row.dataset.binding),selected=p?.leagueCandidates.find(p=>p.lpid===row.querySelector('[data-lpid]').value);const cell=row.querySelector('.pool-number');if(cell)cell.textContent=averageLabel(selected?.average);panel.querySelector('[data-mapping-reviewed]').checked=false;renderDraw();});return s;}
 function renderSource(){
  const box=panel.querySelector('[data-pool-source]');box.replaceChildren();if(!state)return;const stats=state.stats;
  el('p',(stats.fresh?'CURRENT':'STALE / UNAVAILABLE')+' · Last successful statistics: '+(stats.fetchedAt||'None')+' · '+(stats.title||'AIK league'),box);
  el('p',stats.message||'Overall three-dart average = 3 × total score / total darts. Display uses two decimals; seeding keeps full precision. Ranking points are separate.',box);if(state.journal)el('p',state.journal,box);
  const details=el('details',null,box);el('summary','Review '+state.mappings.length+' IN players and league / event identities',details);
  el('p','Names propose matches. Check the LPID and event entry ID in Nakka. If Nakka does not expose the saved league link, this records your review; it does not prove that hidden link. Missing averages remain Unseeded.',details);
  const table=el('table',null,details),head=el('tr',null,el('thead',null,table));['Player','League identity (LPID)','Event entry (TPID)','Overall average'].forEach(t=>el('th',t,head));const body=el('tbody',null,table);
  for(const p of state.mappings){const row=el('tr',null,body);row.dataset.binding=p.id;el('td',p.name,row);select(el('td',null,row),'lpid',p.leagueCandidates,'lpid',p.lpid);select(el('td',null,row),'tpid',p.eventCandidates,'tpid',p.tpid);const avg=el('td',averageLabel(p.average),row);avg.className='pool-number';if(p.reason)el('small',p.reason,avg);}
  const label=el('label',null,box),review=el('input',null,label);review.type='checkbox';review.dataset.mappingReviewed='';label.appendChild(document.createTextNode(' I reviewed all proposed identities. Unresolved players may be planned as Unseeded; sending requires every league identity and event entry.'));
  const choice=el('label','Pool-size arrangement ',box),scheme=el('select',null,choice);scheme.dataset.drawScheme='';for(const [v,t]of [['preferredPlan','Preferred format'],['perBoard','One pool per dartboard']])el('option',t,scheme).value=v;
  const draw=button('GENERATE SEEDED PREVIEW',box,()=>run(async send=>{
   if(!review.checked)throw Error('Review and tick the player identity acknowledgement first.');
   const p=BeautyPoolPlanner.plan(BeautyPoolPlanner.eventCount(root.beautyHubData),Number(host.querySelector('[data-size]').value),Number(host.querySelector('[data-boards]').value));
   if(p.error||!p[scheme.value])throw Error(p.error||'That arrangement cannot fit the boards. Choose the preferred format or add boards.');
   frozen=await send('pooldraw',{bindings:JSON.stringify(bindings()),sizes:JSON.stringify(BeautyPoolSeeding.sizesFromPlan(p[scheme.value])),reviewed:'true'});approval=null;invalid=false;lastRoster=fingerprint(root.beautyHubData);message('Averages are frozen. Review pool balance and make any manual swaps before approving.');renderDraw();
  }));draw.dataset.blocked=String(!stats.fresh);
 }
 function renderDraw(){
  const box=panel?.querySelector('[data-pool-draw]');if(!box)return;box.replaceChildren();if(!frozen)return;const draw=frozen.draw;
  el('h3','Seeded pool preview',box);el('p','Frozen '+draw.frozenAt+' · Statistics '+draw.source.fetchedAt+' · Draw seed '+draw.seed,box);
  if(invalid)el('p','REVIEW INVALIDATED — source expired, unavailable or changed. Generate a new draw before sending.',box);BeautyPoolSeeding.warnings(draw).forEach(t=>el('p',t,box));
  const settings=el('div',null,box),label=el('label',null,settings),colours=el('input',null,label);colours.type='checkbox';colours.checked=!!root.beautyPoolColours;label.appendChild(document.createTextNode(' Show seeding colours'));
  const bounds=el('label','Band boundaries (three increasing values) ',settings),inputs=[50,55,60].map((v,i)=>{const n=el('input',null,bounds);n.type='number';n.min='0';n.max='180';n.step='0.01';n.value=String(root.beautyPoolBands?.[i]??v);return n;});
  const legend=el('p',null,settings),grid=el('div',null,box);grid.className='pool-grid';
  function paint(){const thresholds=inputs.map(n=>Number(n.value));try{BeautyPoolSeeding.band(null,thresholds);}catch(e){legend.textContent=e.message;return;}root.beautyPoolBands=thresholds;root.beautyPoolColours=colours.checked;legend.textContent='Bands: below '+thresholds[0]+'; '+thresholds[0]+'–<'+thresholds[1]+'; '+thresholds[1]+'–<'+thresholds[2]+'; '+thresholds[2]+'+. Unseeded is separate.';grid.replaceChildren();
   for(const pool of draw.pools){const card=el('section',null,grid);card.className='pool-card';const s=BeautyPoolSeeding.summary(pool);const heading=el('h4','Pool '+pool.name+' · ',card);el('span',s.players+'/'+s.capacity,heading).className='pool-number';el('p','Known average: '+(s.knownAverage===null?'—':s.knownAverage.toFixed(2))+' · Coverage '+s.known+'/'+s.players+' · Unseeded '+s.unseeded,card);const list=el('ol',null,card);
    for(const p of pool.players){const li=el('li',null,list);if(colours.checked)li.className='pool-band-'+BeautyPoolSeeding.band(p.average,thresholds);el('span',p.name,li);el('span',averageLabel(p.average),li).className='pool-number';}}
  }colours.addEventListener('change',paint);inputs.forEach(n=>n.addEventListener('change',paint));paint();if(invalid){disable();return;}
  const swap=el('fieldset',null,box);el('legend','Manual swap',swap);const left=el('select',null,swap),right=el('select',null,swap);for(const pool of draw.pools)for(const p of pool.players)for(const s of [left,right])el('option','Pool '+pool.name+' · '+p.name,s).value=p.id;
  button('SWAP PLAYERS',swap,()=>run(async send=>{const target=draw.pools.find(g=>g.players.some(p=>p.id===right.value));frozen=await send('pooladjust',{ticket:frozen.ticket,change:JSON.stringify({playerId:left.value,targetPool:target.id,swapWith:right.value})});approval=null;message('Swap saved in preview. Review the new pool balance.');renderDraw();}));
  button('REVIEW NAKKA HANDOFF — TEST',box,()=>run(async send=>{approval=await send('poolprepare',{ticket:frozen.ticket});frozen.ticket=approval.ticket;message('Handoff checked. Close Nakka editing pages, then confirm these TEST pools.');renderDraw();}));
  if(approval){const review=el('section',null,box);review.className='pool-approval';el('h3','Approve TEST pool handoff',review);el('p',approval.event.title+' · '+approval.event.date+' · '+draw.roster.length+' IN players · '+draw.pools.length+' pools · '+approval.expectedCards+' round-robin match cards.',review);
   el('p','Only pool assignments, division count and maximum pool size change. Existing players and other event settings are retained. Sending uses two Nakka operations: groups, then match cards. If either cannot be verified, inspect the audit before another action.',review);
   const details=el('details',null,review);el('summary','Review preserved game settings',details);el('pre',JSON.stringify(approval.setting,null,2),details);
   const label=el('label',null,review),check=el('input',null,label);check.type='checkbox';label.appendChild(document.createTextNode(' I approve these identities, frozen pools and match cards for the named TEST event. Nakka editing pages are closed.'));
   const save=button('SEND APPROVED TEST POOLS',review,()=>run(async send=>{if(!check.checked)throw Error('Tick the final approval first.');const ticket=approval.ticket;approval=null;invalid=true;message('Sending once. Waiting for group and match-card readback…');try{const r=await send('poolsave',{ticket,confirmed:'true'});frozen=null;message(r.message+' Audit: '+r.audit+' · Receipt: '+r.receipt);renderDraw();}catch(e){renderDraw();throw Error(e.message+' Do not repeat a send until the event and audit have been inspected.');}}));save.dataset.blocked='true';save.disabled=true;check.addEventListener('change',()=>{save.dataset.blocked=String(!check.checked);disable();});
  }disable();
 }
 async function load(send,refresh){state=await send('poolload',{refresh:String(refresh)});approval=null;if(frozen)invalid=true;renderSource();renderDraw();message('Review player mappings before generating a draw. '+(state.stats.message||''));}
 function mount(dialog){
  if(BeautyHubServices.mode!=='test')return;host=dialog;panel=el('section',null,dialog);panel.className='seeded-pool-planner';el('h3','Seeded pools — TEST',panel);el('p','IN players only. Overall three-dart averages balance strength; players without an average are spread evenly as Unseeded. Manual swaps keep each chosen pool size.',panel);
  const tools=el('div',null,panel);button('LOAD / REFRESH LEAGUE STATS',tools,()=>run(send=>load(send,true)));
  const manual=el('label','Planning count (recommendations only) ',tools),count=el('input',null,manual);count.type='number';count.min='5';count.max='101';const estimate=el('p',null,tools);
  count.addEventListener('input',()=>{const p=BeautyPoolPlanner.plan(Number(count.value),Number(host.querySelector('[data-size]').value),Number(host.querySelector('[data-boards]').value));estimate.textContent=Number(count.value)>101?'The supplied scheme covers 5–101.':p.error||p.preferredPlan.pools+' pools: '+p.preferredPlan.three+' × 3, '+p.preferredPlan.four+' × 4, '+p.preferredPlan.five+' × 5. Draws always use the verified IN list.';});
  const notice=el('p','Load league statistics to review identities and generate a draw.',panel);notice.dataset.poolMessage='';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');el('div',null,panel).dataset.poolSource='';el('div',null,panel).dataset.poolDraw='';
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>{epoch++;approval=null;invalid=true;renderDraw();});
  root.setInterval(()=>{if(host?.open&&!document.hidden&&!busy&&state)run(send=>load(send,false));},300000);
 }
 document.addEventListener('beauty-hub-locked',()=>{epoch++;busy=false;state=null;frozen=null;approval=null;invalid=true;host?.close();panel?.querySelector('[data-pool-source]')?.replaceChildren();panel?.querySelector('[data-pool-draw]')?.replaceChildren();if(panel)message('Sign in, then reload league statistics.');});
 root.BeautySeededPoolUI={mount,update(data){if(frozen&&fingerprint(data)!==lastRoster)invalidate('The IN roster or event date changed. The frozen preview is retained for reference; generate a new draw.');},unavailable(){if(frozen)invalidate('Hub data unavailable. Wait for a verified refresh, then generate a new draw.');},isBusy:()=>busy};
})(window);
