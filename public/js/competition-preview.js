/* Standalone TEST review; no provider writes, credentials or independent progression. */
(()=>{
 'use strict';
 const automatic=document.body?.dataset.stageMode==='test-live';
 const fixture={result:0,tournament:{tdid:'t_QHaG_7792',lgid:'lg_M2wQ_4189',title:'Exempeltävling · inte direktsänd',status:30,entry_list:[{tpid:'aaaa',name:'Exempelspelare 1'},{tpid:'bbbb',name:'Exempelspelare 2'},{tpid:'cccc',name:'Exempelspelare 3'}],t_table:[['aaaa','bbbb','cccc','empty'],['bbbb','cccc'],['bbbb']],t_result:[{aaaa:{bbbb:{r:1,a:40.83}},bbbb:{aaaa:{r:2,a:43.99}}}],badge:{'t-0-0':{str:'14',st:1}}}};
 const standings={result:0,tdid:'t_QHaG_7792',groups:[{kind:'lg',index:0,players:[{tpid:'bbbb',rank:1,p:2,w:2,l:0,pts:4},{tpid:'aaaa',rank:2,p:2,w:1,l:1,pts:2},{tpid:'cccc',rank:3,p:2,w:0,l:2,pts:0}]}]};
 const byId=id=>document.getElementById(id),host=byId('stagePreview');
 let data=automatic?null:BeautyNakkaStages.project(fixture,standings),state={view:'all',index:0,size:6,collapsed:{pools:true,t:true,s2:true},roundStarts:{}},controller=null,lastSuccess=null,busy=false,disposed=false,failed=false;
 function text(id,value){byId(id).textContent=value;}
 function render(){
  if(!data){host.replaceChildren();return;}
  const focused=document.activeElement?.id;
  const label=state.view==='boards'?'Banöversikt':state.view==='all'?'Tävlingsöversikt':['t','s2'].includes(state.view)?'Slutspel':'Gruppspel';text('screenTitle',label);
  for(const [id,selected]of [['tabPools',state.view!=='boards'],['tabBoards',state.view==='boards']])byId(id).setAttribute('aria-pressed',String(selected));
  state=BeautyCompetitionView.render(document,host,data,state,action=>{
   if(action.type==='toggle')state={...state,collapsed:{...state.collapsed,[action.id]:!state.collapsed[action.id]}};
   if(action.type==='round')state={...state,roundStarts:{...state.roundStarts,[action.id]:state.roundStarts[action.id]+action.direction}};
   render();const target=document.getElementById(action.focusId);(target&&!target.disabled?target:document.getElementById('toggle-'+action.id))?.focus({preventScroll:true});
  });
  byId('stageView').replaceChildren();for(const v of state.choices){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;byId('stageView').appendChild(option);}byId('stageView').value=state.view;
  const poolsShown=['pools','all'].includes(state.view)&&!state.collapsed.pools;
  byId('pageSizeLabel').hidden=!poolsShown;byId('previousPage').disabled=state.index===0||!poolsShown;byId('nextPage').disabled=state.index>=state.total-1||!poolsShown;
  text('pageIndicator',poolsShown?'Sida '+(state.index+1)+' / '+state.total+' · '+data.pools.length+' grupper':state.choices.find(v=>v.id===state.view).label);
  if(focused&&/^(toggle-|round-)/.test(focused))document.getElementById(focused)?.focus({preventScroll:true});
 }
 function freshness(){
  const stale=!!controller&&(failed||lastSuccess==null||Date.now()-lastSuccess>=30000||!byId('autoRefresh').checked||!navigator.onLine);
  host.classList.toggle('stage-stale',stale);for(const cell of host.querySelectorAll?.('.live-cell')||[])cell.setAttribute('aria-label',stale?'Senast hämtad match · direktstatus ej bekräftad':'Pågående match');byId('staleNotice').hidden=!stale;
  if(controller&&!byId('autoRefresh').checked)text('stageStatus','Automatisk uppdatering pausad · senast hämtade vy. Välj Uppdatera nu för att kontrollera.');
  else if(controller&&!navigator.onLine)text('stageStatus','Ingen anslutning · senast hämtade vy. Återanslut och uppdatera för att kontrollera banorna.');
  else if(controller&&lastSuccess!=null&&!busy&&!failed&&Date.now()-lastSuccess>=30000)text('stageStatus','Uppdateringen är försenad · senast hämtade vy.');
 }
 async function refresh(){if(!controller||busy||disposed||document.hidden)return;busy=true;byId('refreshStage').disabled=true;try{await controller.refresh();}finally{busy=false;byId('refreshStage').disabled=false;freshness();}}
 byId('loadTest').addEventListener('click',()=>{
  if(controller)return;state={view:'all',index:0,size:state.size,collapsed:{pools:true,t:true,s2:true},roundStarts:{}};data=null;host.replaceChildren();text('sourceLabel','NAKKA · TEST');text('eventTitle','Hämtar vald TEST-tävling…');text('stageStatus','Hämtar TEST-data från Nakka…');text('pageIndicator','');byId('loadTest').disabled=true;
  controller=BeautyNakkaStageFeed.create({includeLive:true,fetch:window.fetch.bind(window),onData(next){data=next;lastSuccess=Date.now();failed=false;text('eventTitle',(next.title||'TEST-tävling')+(next.eventDate?' · '+new Date(next.eventDate*1000).toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'long',year:'numeric'}):''));render();text('stageStatus','Nakka TEST · hämtat '+new Date(lastSuccess).toLocaleTimeString('sv-SE')+' · endast visning');freshness();},onError(){failed=true;text('stageStatus',lastSuccess==null?'TEST-data kan inte visas. Kontrollera anslutningen och välj Uppdatera nu.':'Uppdateringen misslyckades · senast hämtade vy. Bantilldelningen måste kontrolleras igen.');freshness();}});
  if(typeof google!=='undefined'&&google.script?.run){try{google.script.run.withSuccessHandler(plan=>{if(!disposed)controller.setPlan?.(plan);}).withFailureHandler(()=>{}).beautyStagePlanTest();}catch(e){}}
  refresh();
 });
 byId('focusRemaining').addEventListener('click',()=>{if(!data)return;state=BeautyCompetitionView.focusRemaining(data,state);render();text('displayMessage','Visar spel utan registrerade resultat. Hopfällda avsnitt kan öppnas igen.');});
 byId('refreshStage').addEventListener('click',refresh);
 byId('displaySettings').addEventListener('click',()=>{const box=byId('castSettings');box.hidden=!box.hidden;byId('displaySettings').setAttribute('aria-expanded',String(!box.hidden));});
 for(const [id,select]of [['tabPools',()=> 'all'],['tabBoards',()=> 'boards']])byId(id).addEventListener('click',()=>{state={...state,view:select(),index:0};render();});
 byId('stageView').addEventListener('change',()=>{state={...state,view:byId('stageView').value,index:0};render();});
 byId('pageSize').addEventListener('change',()=>{state={...state,size:Number(byId('pageSize').value),index:0};render();});
 function move(step){if(data&&['pools','all'].includes(state.view)){state={...state,index:state.index+step};render();}}
 byId('previousPage').addEventListener('click',()=>move(-1));byId('nextPage').addEventListener('click',()=>move(1));
 byId('autoRefresh').addEventListener('change',()=>{freshness();if(byId('autoRefresh').checked)refresh();});
 byId('fullScreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();text('displayMessage','');}catch{text('displayMessage','Helskärm är inte tillgänglig här. Använd webbläsarens helskärmsläge.');}});
 document.addEventListener('fullscreenchange',()=>text('fullScreen',document.fullscreenElement?'Lämna helskärm':'Helskärm'));
 document.addEventListener('visibilitychange',()=>{freshness();if(!document.hidden&&byId('autoRefresh').checked)refresh();});
 window.addEventListener('offline',freshness);window.addEventListener('online',()=>{freshness();if(byId('autoRefresh').checked)refresh();});
 const polling=window.setInterval(()=>{freshness();if(byId('autoRefresh').checked)refresh();},10000);
 const livePolling=window.setInterval(()=>{freshness();if(controller&&!busy&&!disposed&&!document.hidden&&navigator.onLine&&byId('autoRefresh').checked)controller.refreshLive?.();},2000);
 const rotation=window.setInterval(()=>{if(!document.hidden&&byId('rotatePages').checked&&data&&['pools','all'].includes(state.view)&&state.total>1&&!state.collapsed.pools){state={...state,index:(state.index+1)%state.total};render();}},12000);
 window.addEventListener('pagehide',()=>{disposed=true;failed=true;freshness();controller?.stop();window.clearInterval(polling);window.clearInterval(livePolling);window.clearInterval(rotation);});
 window.addEventListener('pageshow',event=>{if(event.persisted&&disposed&&controller){failed=true;freshness();byId('refreshStage').disabled=true;text('stageStatus','Visningen pausades efter navigering. Ladda om sidan och hämta TEST-tävlingen igen för att kontrollera banorna.');}});if(automatic)byId('loadTest').click();else render();
})();
