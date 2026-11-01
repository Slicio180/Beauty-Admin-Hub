/* Independent four-view public TEST cast. No credentials or provider writes. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),automatic=document.body.dataset.stageMode==='test-live';
 const labels={players:'Kvällens spelare',pools:'Gruppspel',t:'Slutspel 1',s2:'Slutspel 2'},tabs={players:'tabPlayers',pools:'tabGroup',t:'tabT',s2:'tabS2'};
 let selected='players',data=null,feed=null,disposed=false,busy=false,failed=false,at=0,bracket=null,signature='',playerDate=null,dateMismatch=false;
 let poolState={view:'pools',size:6,index:0,collapsed:{pools:false}},starts={t:0,s2:0},tops={t:0,s2:0},direction=1,holdUntil=0,lastTick=0;
 const panel=$('castPanel'),host=$('stagePreview'),timers=[];let planBusy=false;
 function dockHeader(){
  const fullscreen=!!document.fullscreenElement;
  const titleDock=fullscreen?$('panelToolbar'):$('pageTitleDock'),actionsDock=fullscreen?$('panelToolbar'):$('navigationActions');
  for(const [node,dock]of [[$('castTitleGroup'),titleDock],[$('castActions'),actionsDock]])if(node.parentElement!==dock)dock.appendChild(node);
  $('screenTitle').hidden=!!selected;$('castTitleGroup').hidden=!selected;$('navigationActions').hidden=!selected;
 }
 function text(id,value){$(id).textContent=value;}
 function eventCaption(){
  dateMismatch=!!(playerDate&&data?.eventDate&&new Date(data.eventDate*1000).toLocaleDateString('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'})!==playerDate);
  const caption=data&&!dateMismatch?(data.title||'TEST-tävling')+(data.eventDate?' · '+new Date(data.eventDate*1000).toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'long',year:'numeric'}):''):'Vald TEST-tävling';
  text('eventTitle',caption);text('panelEvent',caption);
 }
 function remember(){if(bracket&&['t','s2'].includes(selected))tops[selected]=bracket.viewport.scrollTop||0;}
 function freshness(){
  const stale=!!feed&&(failed||!at||Date.now()-at>=30000||!$('autoRefresh').checked||!navigator.onLine||disposed);
  host.classList.toggle('stage-stale',stale);$('staleNotice').hidden=!stale;
  for(const cell of host.querySelectorAll('.live-cell'))cell.setAttribute('aria-label',stale?'Senast hämtad match · direktstatus ej bekräftad':'Pågående match');
  if(feed&&!$('autoRefresh').checked)text('stageStatus','Automatisk uppdatering pausad · senast hämtade vy.');
  else if(feed&&!navigator.onLine)text('stageStatus','Ingen anslutning · senast hämtade vy.');
  else if(stale&&!busy&&!failed)text('stageStatus','Uppdateringen är försenad · senast hämtade vy.');
 }
 function render(force=false){
  eventCaption();
  for(const [id,button]of Object.entries(tabs)){$(button).setAttribute('aria-expanded',String(selected===id));$(button).classList.toggle('active',selected===id);}
  panel.hidden=selected===null;dockHeader();if(!selected)return;
  text('screenTitle','BEAUTY LIVE');text('panelTitle',labels[selected].toLocaleUpperCase('sv-SE'));
  $('playerCountTile').hidden=selected!=='players';$('liveSettingsOpen').hidden=selected!=='players';
  $('castFooter').hidden=selected==='players'&&!$('displayMessage').textContent;
  $('playersPanel').hidden=selected!=='players';$('stageArea').hidden=selected==='players';
  $('scrollOption').hidden=!['t','s2'].includes(selected);$('pauseScroll').hidden=$('scrollOption').hidden;
  const pools=selected==='pools';$('pageSizeLabel').hidden=!pools;$('rotatePagesLabel').hidden=!pools;$('pageIndicator').hidden=selected==='players';
  $('previousPage').parentElement.hidden=!pools;
  $('stageView').parentElement.hidden=true;$('focusRemaining').hidden=!['t','s2'].includes(selected);
  if(selected==='players'){bracket=null;return;}
  const nextSignature=JSON.stringify([selected,data,dateMismatch,poolState.index,poolState.size,starts,window.innerWidth]);
  if(!force&&signature===nextSignature){freshness();return;}signature=nextSignature;
  remember();bracket=null;
  if(dateMismatch){host.replaceChildren();const p=document.createElement('p');p.textContent='Nakka-tävlingen stämmer inte med kvällens spelarlista. Öppna visningen från Hubben igen.';host.appendChild(p);text('pageIndicator','');return;}
  if(!data){host.replaceChildren();text('pageIndicator','');return;}
  if(pools){
   poolState=BeautyVenuePools.render(document,host,data,{...poolState,width:host.clientWidth||window.innerWidth-48,height:host.clientHeight||0});
   BeautyPoolNames.apply(host);
   text('pageIndicator','Sida '+(poolState.index+1)+' / '+poolState.total+' · '+data.pools.length+' grupper');
   $('previousPage').disabled=poolState.index===0;$('nextPage').disabled=poolState.index>=poolState.total-1;
  }else{
   const stage=data.knockouts.find(s=>s.kind===selected);
   if(!stage){host.replaceChildren();const p=document.createElement('p');p.textContent='Inget slutspelsträd har hämtats ännu.';host.appendChild(p);text('pageIndicator','');return;}
   bracket=BeautyKnockoutBracket.render(document,host,stage,{start:starts[selected],width:host.clientWidth||window.innerWidth-48},action=>{
    remember();starts[selected]+=action.direction;tops[selected]=0;direction=1;bracket=null;render(true);
   });
   starts[selected]=bracket.start;if(bracket.viewport.classList.contains('bracket-fits'))tops[selected]=0;bracket.viewport.scrollTop=tops[selected];
   text('pageIndicator',bracket.total?'Omgång '+(bracket.start+1)+'–'+(bracket.start+bracket.rounds.length)+' av '+bracket.total:'');
   const pause=()=>{holdUntil=Date.now()+8000;};
   for(const name of ['wheel','touchstart','pointerdown','keydown'])bracket.viewport.addEventListener(name,pause,{passive:true});
   bracket.viewport.addEventListener('pointerenter',()=>{holdUntil=Infinity;});bracket.viewport.addEventListener('pointerleave',()=>{holdUntil=Date.now()+3000;});
  }freshness();
 }
 function choose(id){closeMenu();remember();selected=selected===id?null:id;bracket=null;signature='';render(true);window.dispatchEvent(new Event('resize'));}
 for(const [id,button]of Object.entries(tabs))$(button).addEventListener('click',()=>choose(id));
 async function refresh(){if(!feed||busy||disposed||document.hidden||!navigator.onLine)return;busy=true;$('refreshStage').disabled=true;try{await feed.refresh();}finally{busy=false;$('refreshStage').disabled=false;freshness();}}
 function load(){
  if(feed||disposed)return;text('sourceLabel','NAKKA · TEST');text('stageStatus','Hämtar TEST-data från Nakka…');$('loadTest').disabled=true;
  feed=BeautyNakkaStageFeed.create({includeLive:true,includeKnockouts:true,fetch:window.fetch.bind(window),onData(next){if(disposed)return;data=next;at=Date.now();failed=false;render();text('stageStatus','Nakka TEST · hämtat '+new Date(at).toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm'})+' · endast visning');freshness();},onError(){if(disposed)return;failed=true;text('stageStatus',at?'Uppdateringen misslyckades · senast hämtade vy.':'TEST-data kan inte visas. Kontrollera anslutningen och välj Uppdatera nu.');freshness();}});
  refreshPlan();
  refresh();
 }
 function refreshPlan(){
  if(planBusy||disposed||!feed||document.hidden||!navigator.onLine||!$('autoRefresh').checked||typeof google==='undefined'||!google.script?.run)return;
  planBusy=true;try{google.script.run.withSuccessHandler(plan=>{planBusy=false;if(!disposed)feed.setPlan(plan);}).withFailureHandler(()=>{planBusy=false;}).beautyStagePlanTest();}catch{planBusy=false;}
 }
 function closeMenu(focus=false){
  const box=$('castSettings');if(box.hidden)return;box.hidden=true;$('displaySettings').setAttribute('aria-expanded','false');
  window.dispatchEvent(new Event('beauty-display-menu-closed'));if(focus)$('displaySettings').focus();
 }
 $('loadTest').addEventListener('click',load);
 $('refreshStage').addEventListener('click',()=>{if(selected==='players')window.BeautyLiveListControls?.refresh();else if(!feed)load();else refresh();closeMenu();});
 $('displaySettings').addEventListener('click',()=>{const box=$('castSettings');if(box.hidden){box.hidden=false;$('displaySettings').setAttribute('aria-expanded','true');}else closeMenu();});
 document.addEventListener('pointerdown',event=>{if(!$('castSettings').hidden&&!$('castSettings').contains(event.target)&&!$('displaySettings').contains(event.target))closeMenu();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('castSettings').hidden){event.preventDefault();closeMenu(true);}});
 $('pageSize').addEventListener('change',()=>{poolState={...poolState,size:Number($('pageSize').value),index:0};render(true);});
 for(const [id,step]of [['previousPage',-1],['nextPage',1]])$(id).addEventListener('click',()=>{poolState.index+=step;render(true);});
 $('autoRefresh').addEventListener('change',()=>{freshness();if($('autoRefresh').checked)refresh();});
 $('focusRemaining').addEventListener('click',()=>{
  const stage=data?.knockouts.find(s=>s.kind===selected);if(!stage)return;
  const rounds=BeautyKnockoutBracket.playable(stage),index=rounds.findIndex(r=>r.matches.some(m=>m.left.state==='player'&&m.right.state==='player'&&(m.live||m.leftScore==null||m.rightScore==null)));
  starts[selected]=index<0?Math.max(0,rounds.length-2):index;tops[selected]=0;bracket=null;render(true);
 });
 $('pauseScroll').addEventListener('click',()=>{const paused=$('pauseScroll').getAttribute('aria-pressed')!=='true';$('pauseScroll').setAttribute('aria-pressed',String(paused));text('pauseScroll',paused?'Fortsätt':'Pausa');});
 async function fullscreen(){closeMenu();try{if(document.fullscreenElement)await document.exitFullscreen();else if(panel.webkitRequestFullscreen)panel.webkitRequestFullscreen();else await panel.requestFullscreen();}catch{$('castFooter').hidden=false;text('displayMessage','Helskärm är inte tillgänglig här. Använd webbläsarens helskärmsläge.');}}
 $('fullScreen').addEventListener('click',fullscreen);
 document.addEventListener('fullscreenchange',()=>{const label=document.fullscreenElement?'Lämna helskärm':'Helskärm';$('fullScreen').setAttribute('aria-label',label);$('fullScreen').setAttribute('title',label);$('fullScreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));render(true);});
 window.BeautyCastShell=Object.freeze({playersVisible:()=>selected==='players'&&!panel.hidden,fullscreen,playersUpdated(next){if(disposed)return;playerDate=/^\d{4}-\d{2}-\d{2}$/.test(next.eventDate)?next.eventDate:null;render();}});
 window.addEventListener('resize',()=>{remember();render(true);});document.fonts?.ready.then(()=>render(true));
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{bracket?.layout();if(selected==='pools'){BeautyVenuePools.fit(host,host.clientWidth,host.clientHeight);BeautyPoolNames.apply(host);}}).observe(host);
 document.addEventListener('visibilitychange',()=>{freshness();lastTick=0;if(!document.hidden&&$('autoRefresh').checked)refresh();});
 window.addEventListener('offline',freshness);window.addEventListener('online',()=>{freshness();if($('autoRefresh').checked)refresh();});
 timers.push(window.setInterval(()=>{freshness();if($('autoRefresh').checked){refreshPlan();refresh();}},10000));
 timers.push(window.setInterval(()=>{freshness();if(feed&&!disposed&&!document.hidden&&navigator.onLine&&$('autoRefresh').checked)feed.refreshLive();},2000));
 timers.push(window.setInterval(()=>{if(selected==='pools'&&data&&!document.hidden&&$('rotatePages').checked&&poolState.total>1){poolState.index=(poolState.index+1)%poolState.total;render(true);}},12000));
 timers.push(window.setInterval(()=>{
  const now=Date.now(),elapsed=lastTick?Math.min(100,now-lastTick):0;lastTick=now;
  if(!bracket||bracket.viewport.classList.contains('bracket-fits')||document.hidden||disposed||!$('castSettings').hidden||!$('autoScroll').checked||$('pauseScroll').getAttribute('aria-pressed')==='true'||now<holdUntil||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const v=bracket.viewport,max=v.scrollHeight-v.clientHeight;if(max<=1||elapsed===0)return;
  const next=Math.max(0,Math.min(max,v.scrollTop+direction*elapsed*.025));v.scrollTop=next;tops[selected]=next;
  if(next>=max||next<=0){direction*=-1;holdUntil=now+2500;}
 },50));
 window.addEventListener('pagehide',()=>{disposed=true;failed=true;feed?.stop();for(const timer of timers)window.clearInterval(timer);freshness();});
 window.addEventListener('pageshow',event=>{if(event.persisted&&disposed){text('stageStatus','Visningen pausades efter navigering. Ladda om sidan för att fortsätta.');text('liveStatus','Ladda om sidan för att fortsätta uppdatera spelarlistan.');}});
 render();if(automatic)load();
})();

