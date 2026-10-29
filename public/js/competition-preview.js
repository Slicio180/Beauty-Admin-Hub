/* Standalone TEST review; no provider writes, credentials or independent progression. */
(()=>{
 'use strict';
 const automatic=document.body?.dataset.stageMode==='test-live';
 const fixture={result:0,tournament:{tdid:'t_RqC2_2034',lgid:'lg_tM2v_3523',title:'Example competition · not live',status:30,entry_list:[{tpid:'aaaa',name:'Example Player 1'},{tpid:'bbbb',name:'Example Player 2'},{tpid:'cccc',name:'Example Player 3'}],t_table:[['aaaa','bbbb','cccc','empty'],['bbbb','cccc'],['bbbb']],t_result:[{aaaa:{bbbb:{r:1,a:40.83}},bbbb:{aaaa:{r:2,a:43.99}}}],badge:{'t-0-0':{str:'14',st:1}}}};
 const standings={result:0,tdid:'t_RqC2_2034',groups:[{kind:'lg',index:0,players:[{tpid:'bbbb',rank:1,p:2,w:2,l:0,pts:4},{tpid:'aaaa',rank:2,p:2,w:1,l:1,pts:2},{tpid:'cccc',rank:3,p:2,w:0,l:2,pts:0}]}]};
 const byId=id=>document.getElementById(id),host=byId('stagePreview');
 let data=automatic?null:BeautyNakkaStages.project(fixture,standings),state={view:'all',index:0,size:4,collapsed:{},roundStarts:{}},controller=null,lastSuccess=null,busy=false,disposed=false,failed=false;
 function text(id,value){byId(id).textContent=value;}
 function render(){
  if(!data){host.replaceChildren();return;}
  const focused=document.activeElement?.id;
  state=BeautyCompetitionView.render(document,host,data,state,action=>{
   if(action.type==='toggle')state={...state,collapsed:{...state.collapsed,[action.id]:!state.collapsed[action.id]}};
   if(action.type==='round')state={...state,roundStarts:{...state.roundStarts,[action.id]:state.roundStarts[action.id]+action.direction}};
   render();const target=document.getElementById(action.focusId);(target&&!target.disabled?target:document.getElementById('toggle-'+action.id))?.focus({preventScroll:true});
  });
  byId('stageView').replaceChildren();for(const v of state.choices){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;byId('stageView').appendChild(option);}byId('stageView').value=state.view;
  const poolsShown=['pools','all'].includes(state.view)&&!state.collapsed.pools;
  byId('pageSizeLabel').hidden=!poolsShown;byId('previousPage').disabled=state.index===0||!poolsShown;byId('nextPage').disabled=state.index>=state.total-1||!poolsShown;
  text('pageIndicator',poolsShown?'Page '+(state.index+1)+' / '+state.total+' · '+data.pools.length+' pools':state.choices.find(v=>v.id===state.view).label);
  if(focused&&/^(toggle-|round-)/.test(focused))document.getElementById(focused)?.focus({preventScroll:true});
 }
 function freshness(){
  const stale=!!controller&&(failed||lastSuccess==null||Date.now()-lastSuccess>=30000||!byId('autoRefresh').checked||!navigator.onLine);
  host.classList.toggle('stage-stale',stale);byId('staleNotice').hidden=!stale;
  if(controller&&!byId('autoRefresh').checked)text('stageStatus','Automatic refresh paused · last known view. Use Refresh now to recheck.');
  else if(controller&&!navigator.onLine)text('stageStatus','Offline · last known view. Reconnect and refresh to recheck boards.');
  else if(controller&&lastSuccess!=null&&!busy&&!failed&&Date.now()-lastSuccess>=30000)text('stageStatus','Refresh overdue · last known view.');
 }
 async function refresh(){if(!controller||busy||disposed||document.hidden)return;busy=true;byId('refreshStage').disabled=true;try{await controller.refresh();}finally{busy=false;byId('refreshStage').disabled=false;freshness();}}
 byId('loadTest').addEventListener('click',()=>{
  if(controller)return;state={view:'all',index:0,size:state.size,collapsed:{},roundStarts:{}};data=null;host.replaceChildren();text('sourceLabel','NAKKA · TEST');text('eventTitle','Loading fixed TEST event…');text('stageStatus','Loading Nakka TEST data…');text('pageIndicator','');byId('loadTest').disabled=true;
  controller=BeautyNakkaStageFeed.create({fetch:window.fetch.bind(window),onData(next){data=next;lastSuccess=Date.now();failed=false;text('eventTitle',next.title||'TEST event');render();text('stageStatus','Nakka TEST · received '+new Date(lastSuccess).toLocaleTimeString()+' · read-only');freshness();},onError(){failed=true;text('stageStatus',lastSuccess==null?'TEST data unavailable. Check connection and qualified response shape; try Refresh now.':'Refresh failed · last known view. Board assignments must be rechecked.');freshness();}});
  refresh();
 });
 byId('focusRemaining').addEventListener('click',()=>{if(!data)return;state=BeautyCompetitionView.focusRemaining(data,state);render();text('displayMessage','Focused on play without recorded results. Collapsed sections can still be reopened.');});
 byId('refreshStage').addEventListener('click',refresh);
 byId('stageView').addEventListener('change',()=>{state={...state,view:byId('stageView').value,index:0};render();});
 byId('pageSize').addEventListener('change',()=>{state={...state,size:Number(byId('pageSize').value),index:0};render();});
 function move(step){if(data&&['pools','all'].includes(state.view)){state={...state,index:state.index+step};render();}}
 byId('previousPage').addEventListener('click',()=>move(-1));byId('nextPage').addEventListener('click',()=>move(1));
 byId('autoRefresh').addEventListener('change',()=>{freshness();if(byId('autoRefresh').checked)refresh();});
 byId('fullScreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();text('displayMessage','');}catch{text('displayMessage','Full screen is unavailable here. You can use your browser’s full-screen control.');}});
 document.addEventListener('fullscreenchange',()=>text('fullScreen',document.fullscreenElement?'Exit full screen':'Full screen'));
 document.addEventListener('visibilitychange',()=>{freshness();if(!document.hidden&&byId('autoRefresh').checked)refresh();});
 window.addEventListener('offline',freshness);window.addEventListener('online',()=>{freshness();if(byId('autoRefresh').checked)refresh();});
 const polling=window.setInterval(()=>{freshness();if(byId('autoRefresh').checked)refresh();},10000);
 const rotation=window.setInterval(()=>{if(!document.hidden&&byId('rotatePages').checked&&data&&['pools','all'].includes(state.view)&&state.total>1&&!state.collapsed.pools){state={...state,index:(state.index+1)%state.total};render();}},12000);
 window.addEventListener('pagehide',()=>{disposed=true;failed=true;freshness();controller?.stop();window.clearInterval(polling);window.clearInterval(rotation);});
 window.addEventListener('pageshow',event=>{if(event.persisted&&disposed&&controller){failed=true;freshness();byId('refreshStage').disabled=true;text('stageStatus','Display suspended after navigation. Reload this page and load TEST again to recheck boards.');}});if(automatic)byId('loadTest').click();else render();
})();
