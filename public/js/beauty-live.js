(() => {
  const list=document.getElementById('liveNames'), count=document.getElementById('liveCount'), status=document.getElementById('liveStatus');
  const viewport=document.getElementById('liveScroll');
  const sort=document.getElementById('liveSort'), stats=document.getElementById('liveStats');
  let disposed=false,refreshTimer,refreshDeadline;let latest=null, sequence=0, lastSignature='', scrollDirection=1, holdUntil=0,pageIndex=0;
  function draw() {
    if(!latest)return;
    const players=BeautyLiveModel.project(latest,sort.value);
    count.textContent=String(players.length);
    const freshness=document.getElementById('liveStatsState');freshness.textContent=stats.checked?(latest.statsStale?'Statistik inte uppdaterad · '+new Date(latest.statsFetchedAt).toLocaleString('sv-SE'):!latest.statsAvailable?'Statistik ej tillgänglig':''):'';
    const page=BeautyLiveModel.page(players,pageIndex);pageIndex=page.index;
    const signature=JSON.stringify([players,stats.checked,latest.rankingAvailable,pageIndex]);
    if(signature===lastSignature)return;
    lastSignature=signature;
    const previousTop=viewport.scrollTop||0;
    const columns=innerWidth<700?2:3,rows=innerWidth<700?15:10;
    list.style.setProperty('--live-columns',columns);
    list.style.setProperty('--live-rows',rows);
    list.className=stats.checked?'with-stats':'';
    const headings=document.getElementById('liveColumns');headings.hidden=!stats.checked;headings.replaceChildren();
    headings.style.setProperty('--live-columns',columns);
    if(stats.checked)for(let i=0;i<columns;i++){
      const head=document.createElement('div');head.className='live-column-heading';
      for(const text of ['SPELARE','SNITT']){const label=document.createElement('span');label.textContent=text;head.append(label);}headings.append(head);
    }
    list.replaceChildren();
    if(!players.length){const item=document.createElement('li');item.textContent='Inga spelare anmälda ännu';list.append(item);}
    page.players.forEach((p,slot)=>{
      const index=page.start+slot;
      const item=document.createElement('li');
      
      item.style.gridColumn=String(Math.floor(slot/rows)+1);
      item.style.gridRow=String((slot%rows)+1);
      const number=document.createElement('span');number.className='live-number';number.textContent=sort.value==='ranking'?(p.rank===null?'—':String(p.rank)):String(index+1);
      const name=document.createElement('span');name.className='live-name';name.textContent=p.name;
      const identity=document.createElement('div');identity.className='live-identity';identity.append(number);identity.append(name);item.append(identity);
      if(stats.checked){
        const average=document.createElement('span');average.className='live-average';average.textContent=p.average===null?'—':p.average.toFixed(2);average.setAttribute('aria-label','Snitt '+average.textContent);
        item.append(average);
      }
      list.append(item);
    });
    fitNames();
    viewport.scrollTop=previousTop;
    document.getElementById('livePage').textContent='Sida '+(page.index+1)+' / '+page.pages+' · '+(players.length?page.start+1:0)+'–'+(page.start+page.players.length)+' av '+players.length;
  }
  function fitNames(){
    for(const name of list.querySelectorAll('.live-name')){
      name.classList.remove('is-long');name.style.fontSize='';
      const line=parseFloat(getComputedStyle(name).lineHeight);
      if(name.scrollHeight>line*1.2||name.scrollWidth>name.clientWidth){
        name.classList.add('is-long');
        for(let i=0;i<8&&(name.scrollHeight>name.clientHeight+1||name.scrollWidth>name.clientWidth+1);i++)name.style.fontSize=(parseFloat(getComputedStyle(name).fontSize)*.93)+'px';
      }
    }
  }
  function apply(data){BeautyLiveModel.project(data,sort.value); latest=data;window.BeautyLiveBranding?.apply(data);window.BeautyCastShell?.playersUpdated(data);
    document.getElementById('rankingOrder').disabled=!data.rankingAvailable;stats.disabled=!(data.statsAvailable||data.rankingAvailable);
    if(!data.rankingAvailable&&sort.value==='ranking')sort.value='alphabetical';
    draw();const note=document.getElementById('liveStatsSource');if(note)note.textContent=(data.statsFetchedAt?'Statistik '+new Date(data.statsFetchedAt).toLocaleString('sv-SE')+' · ':'')+(data.rankingAvailable?'Verifierad Nakka-ranking':data.statsAvailable?(data.statsStale?'Senast hämtade värden · inte uppdaterade':'Snitt anslutet · ranking ej verifierad'):'Statistik ej tillgänglig');status.textContent='Uppdaterad '+new Date().toLocaleTimeString('sv-SE')+' · TEST';status.dataset.state='ok';}
  function refresh(){if(disposed)return;const ticket=++sequence;let finished=false;
    const done=(data,error)=>{if(disposed||finished||ticket!==sequence)return;finished=true;clearTimeout(timeout);
      try{if(error)throw Error();apply(data);}catch(e){status.textContent=latest?'Anslutningen bruten – senast hämtade lista visas · TEST':'Kunde inte hämta spelarna · TEST';status.dataset.state='error';}
      refreshTimer=setTimeout(refresh,15000);};
    const timeout=refreshDeadline=setTimeout(()=>done(null,true),20000);
    if(typeof google==='undefined'||!google.script?.run){done(null,true);return;}
    google.script.run.withSuccessHandler(d=>done(d,false)).withFailureHandler(()=>done(null,true)).beautyLiveTestData();
  }
  const settings=document.getElementById('liveSettings'),open=document.getElementById('liveSettingsOpen');
  function showListSettings(show){
    if(typeof settings.showModal==='function'){if(show)settings.showModal();else settings.close();}
    else{settings.hidden=!show;settings.open=show;open.setAttribute('aria-expanded',String(show));if(!show)open.focus();}
    holdUntil=show?Infinity:Date.now()+3000;
  }
  open.addEventListener('click',()=>showListSettings(!settings.open));
  document.getElementById('liveSettingsClose')?.addEventListener('click',()=>showListSettings(false));
  settings.addEventListener('close',()=>{holdUntil=Date.now()+3000;open.focus();});
  window.addEventListener('beauty-display-menu-closed',()=>{if(settings.open){settings.hidden=true;settings.open=false;open.setAttribute('aria-expanded','false');holdUntil=Date.now()+3000;}});
  window.BeautyLiveListControls=Object.freeze({refresh,closeSettings:()=>showListSettings(false)});
  sort.addEventListener('change',()=>{pageIndex=0;viewport.scrollTop=0;scrollDirection=1;holdUntil=Date.now()+3000;lastSignature='';draw();});
  stats.addEventListener('change',()=>{pageIndex=0;lastSignature='';draw();});
  document.fonts?.ready.then(()=>{lastSignature='';draw();});
  window.addEventListener('resize',()=>{lastSignature='';draw();});
  viewport.addEventListener('pointerenter',()=>{holdUntil=Infinity;});
  viewport.addEventListener('pointerleave',()=>{holdUntil=Date.now()+3000;});
  viewport.addEventListener('touchstart',()=>{holdUntil=Date.now()+10000;},{passive:true});
  document.getElementById('liveFullscreen')?.addEventListener('click',async()=>{if(settings.open)settings.close();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){status.textContent='Använd webbläsarens helskärmsläge';}});
  const rotationTimer=setInterval(()=>{
    if(disposed||window.BeautyCastShell&&!window.BeautyCastShell.playersVisible()||settings.open||!latest||latest.players.length<=30||Date.now()<holdUntil||document.hidden)return;
    pageIndex++;lastSignature='';viewport.scrollTop=0;draw();
  },12000);
  window.addEventListener('pagehide',()=>{disposed=true;sequence++;if(typeof clearInterval==='function')clearInterval(rotationTimer);clearTimeout(refreshTimer);clearTimeout(refreshDeadline);});
  refresh();
})();
