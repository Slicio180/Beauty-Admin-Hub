(() => {
  const list=document.getElementById('liveNames'), count=document.getElementById('liveCount'), status=document.getElementById('liveStatus');
  const viewport=document.getElementById('liveScroll');
  const sort=document.getElementById('liveSort'), stats=document.getElementById('liveStats');
  let latest=null, sequence=0, lastSignature='', scrollDirection=1, holdUntil=0,pageIndex=0;
  function draw() {
    if(!latest)return;
    const players=BeautyLiveModel.project(latest,stats.checked&&latest.rankingAvailable?'ranking':sort.value);
    count.textContent=String(players.length);
    const page=BeautyLiveModel.page(players,pageIndex);pageIndex=page.index;
    const signature=JSON.stringify([players,stats.checked,latest.rankingAvailable,pageIndex]);
    if(signature===lastSignature)return;
    lastSignature=signature;
    const previousTop=viewport.scrollTop||0;
    const columns=innerWidth<700?2:3,rows=innerWidth<700?15:10;
    list.style.setProperty('--live-columns',columns);
    list.style.setProperty('--live-rows',rows);
    list.replaceChildren();
    if(!players.length){const item=document.createElement('li');item.textContent='Inga spelare anmälda ännu';list.append(item);}
    page.players.forEach((p,slot)=>{
      const index=page.start+slot;
      const item=document.createElement('li');
      
      item.style.gridColumn=String(Math.floor(slot/rows)+1);
      item.style.gridRow=String((slot%rows)+1);
      const number=document.createElement('span');number.className='live-number';number.textContent=stats.checked?(p.rank===null?'—':String(p.rank)):String(index+1);
      const name=document.createElement('span');name.className='live-name';name.textContent=p.name;
      const identity=document.createElement('div');identity.className='live-identity';identity.append(number);identity.append(name);item.append(identity);
      if(stats.checked){const stat=document.createElement('small');stat.textContent=(p.points===null?'—':p.points)+' poäng · Snitt '+(p.average===null?'—':p.average.toFixed(2));item.append(stat);}
      list.append(item);
    });
    viewport.scrollTop=previousTop;
    document.getElementById('livePage').textContent='Sida '+(page.index+1)+' / '+page.pages+' · '+(players.length?page.start+1:0)+'–'+(page.start+page.players.length)+' av '+players.length;
  }
  function apply(data){BeautyLiveModel.project(data,sort.value); latest=data;
    document.getElementById('rankingOrder').disabled=!data.rankingAvailable;stats.disabled=!(data.statsAvailable||data.rankingAvailable);
    if(!data.rankingAvailable){if(!data.statsAvailable)stats.checked=false;if(sort.value==='ranking')sort.value='alphabetical';}
    draw();const note=document.getElementById('liveStatsSource');if(note)note.textContent=(data.statsFetchedAt?'Statistik '+new Date(data.statsFetchedAt).toLocaleString('sv-SE')+' · ':'')+(data.rankingAvailable?'Verifierad Nakka-ranking':data.statsAvailable?'Poäng/snitt anslutna · ranking ej verifierad':'Statistik ej tillgänglig');status.textContent='Uppdaterad '+new Date().toLocaleTimeString('sv-SE')+' · TEST';status.dataset.state='ok';}
  function refresh(){const ticket=++sequence;let finished=false;
    const done=(data,error)=>{if(finished||ticket!==sequence)return;finished=true;clearTimeout(timeout);
      try{if(error)throw Error();apply(data);}catch(e){status.textContent=latest?'Anslutningen bruten – senast hämtade lista visas · TEST':'Kunde inte hämta spelarna · TEST';status.dataset.state='error';}
      setTimeout(refresh,15000);};
    const timeout=setTimeout(()=>done(null,true),20000);
    if(typeof google==='undefined'||!google.script?.run){done(null,true);return;}
    google.script.run.withSuccessHandler(d=>done(d,false)).withFailureHandler(()=>done(null,true)).beautyLiveTestData();
  }
  sort.addEventListener('change',()=>{pageIndex=0;viewport.scrollTop=0;scrollDirection=1;holdUntil=Date.now()+3000;lastSignature='';draw();});
  stats.addEventListener('change',()=>{pageIndex=0;lastSignature='';draw();});
  window.addEventListener('resize',()=>{lastSignature='';draw();});
  viewport.addEventListener('pointerenter',()=>{holdUntil=Infinity;});
  viewport.addEventListener('pointerleave',()=>{holdUntil=Date.now()+3000;});
  viewport.addEventListener('touchstart',()=>{holdUntil=Date.now()+10000;},{passive:true});
  document.getElementById('liveFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){status.textContent='Använd webbläsarens helskärmsläge';}});
  setInterval(()=>{
    if(!latest||latest.players.length<=30||Date.now()<holdUntil||document.hidden)return;
    pageIndex++;lastSignature='';viewport.scrollTop=0;draw();
  },12000);
  refresh();
})();
