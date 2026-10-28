(() => {
  const list=document.getElementById('liveNames'), count=document.getElementById('liveCount'), status=document.getElementById('liveStatus');
  const viewport=document.getElementById('liveScroll');
  const sort=document.getElementById('liveSort'), stats=document.getElementById('liveStats');
  let latest=null, sequence=0, lastSignature='', scrollDirection=1, holdUntil=0;
  function draw() {
    if(!latest)return;
    const players=BeautyLiveModel.project(latest,sort.value);
    count.textContent=String(players.length);
    const signature=JSON.stringify([players,stats.checked,latest.rankingAvailable]);
    if(signature===lastSignature)return;
    lastSignature=signature;
    const previousTop=viewport.scrollTop||0;
    const columns=innerWidth<700?2:Math.max(1,Math.min(4,Math.ceil(players.length/15)));
    const rows=players.length>60?15:Math.min(15,Math.max(6,Math.ceil(players.length/columns)));
    list.style.setProperty('--live-columns',columns);
    list.style.setProperty('--live-rows',rows);
    const bankSize=columns*rows;
    list.replaceChildren();
    if(!players.length){const item=document.createElement('li');item.textContent='Inga spelare anmälda ännu';list.append(item);}
    players.forEach((p,index)=>{
      const item=document.createElement('li');
      const slot=index%bankSize, bank=Math.floor(index/bankSize);
      item.style.gridColumn=String(Math.floor(slot/rows)+1);
      item.style.gridRow=String(bank*rows+(slot%rows)+1);
      const number=document.createElement('span');number.className='live-number';number.textContent=String(index+1);
      const name=document.createElement('span');name.className='live-name';name.textContent=p.name;
      const identity=document.createElement('div');identity.className='live-identity';identity.append(number);identity.append(name);item.append(identity);
      if(stats.checked&&latest.rankingAvailable){const stat=document.createElement('small');stat.textContent=(p.rank===null?'Ej rankad':'Plats '+p.rank)+(p.points===null?'':' · '+p.points+' poäng');item.append(stat);}
      list.append(item);
    });
    viewport.scrollTop=previousTop;
    document.getElementById('livePage').textContent=players.length>60?'Automatisk rullning · '+players.length+' spelare':'';
  }
  function apply(data){BeautyLiveModel.project(data,sort.value); latest=data;
    document.getElementById('rankingOrder').disabled=!data.rankingAvailable;stats.disabled=!data.rankingAvailable;
    if(!data.rankingAvailable){stats.checked=false;if(sort.value==='ranking')sort.value='alphabetical';}
    draw();status.textContent='Uppdaterad '+new Date().toLocaleTimeString('sv-SE')+' · TEST';status.dataset.state='ok';}
  function refresh(){const ticket=++sequence;let finished=false;
    const done=(data,error)=>{if(finished||ticket!==sequence)return;finished=true;clearTimeout(timeout);
      try{if(error)throw Error();apply(data);}catch(e){status.textContent=latest?'Anslutningen bruten – senast hämtade lista visas · TEST':'Kunde inte hämta spelarna · TEST';status.dataset.state='error';}
      setTimeout(refresh,15000);};
    const timeout=setTimeout(()=>done(null,true),20000);
    if(typeof google==='undefined'||!google.script?.run){done(null,true);return;}
    google.script.run.withSuccessHandler(d=>done(d,false)).withFailureHandler(()=>done(null,true)).beautyLiveTestData();
  }
  sort.addEventListener('change',()=>{viewport.scrollTop=0;scrollDirection=1;holdUntil=Date.now()+3000;lastSignature='';draw();});
  stats.addEventListener('change',()=>{lastSignature='';draw();});
  window.addEventListener('resize',()=>{lastSignature='';draw();});
  viewport.addEventListener('pointerenter',()=>{holdUntil=Infinity;});
  viewport.addEventListener('pointerleave',()=>{holdUntil=Date.now()+3000;});
  viewport.addEventListener('touchstart',()=>{holdUntil=Date.now()+10000;},{passive:true});
  document.getElementById('liveFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){status.textContent='Använd webbläsarens helskärmsläge';}});
  setInterval(()=>{
    if(!latest||latest.players.length<=60||Date.now()<holdUntil)return;
    const max=viewport.scrollHeight-viewport.clientHeight;
    if(max<=0)return;
    viewport.scrollTop=Math.max(0,Math.min(max,viewport.scrollTop+scrollDirection));
    if(viewport.scrollTop>=max){scrollDirection=-1;holdUntil=Date.now()+3000;}
    else if(viewport.scrollTop<=0){scrollDirection=1;holdUntil=Date.now()+3000;}
  },40);
  refresh();
})();
