/* Read-only planning. No registration, status or Nakka writes. */
(function (root) {
  'use strict';
  function arrangements(players) {
    if (!Number.isInteger(players) || players < 5 || players > 10000) return [];
    if (players === 5) return [{three:0, four:0, five:1, pools:1}];
    const result=[];
    for(let four=0;four<=Math.floor(players/4);four++) {
      const rest=players-four*4;
      if(rest%3===0) result.push({three:rest/3,four,five:0,pools:rest/3+four});
    }
    return result;
  }
  function plan(players, preferred, boards) {
    if (![3,4].includes(preferred) || !Number.isInteger(boards) || boards<1 || boards>1000)
      return {error:'Choose 3 or 4 players per pool and enter 1–1000 available dartboards.'};
    const options=arrangements(players);
    if(!options.length) return {error:players<5?'The supplied scheme starts at 5 players. No arrangement is proposed below 5.':'Player count must be a whole number from 5 to 10,000.'};
    const key=preferred===3?'three':'four';
    options.sort((a,b)=>b[key]-a[key] || a.pools-b.pools);
    const preferredPlan=options[0];
    return {players,preferred,boards,preferredPlan,perBoard:options.find(p=>p.pools<=boards)||null,
      waves:Math.ceil(preferredPlan.pools/boards), beyondScheme:players>101};
  }
  function eventCount(data) {
    if(!data || data.success!==true || !data.eventDate || !Array.isArray(data.players))return null;
    // Unknown statuses must not silently count as IN.
    if(data.players.some(p=>!p || !['IN','OUT','STANDBY'].includes(p.status)))return null;
    return data.players.filter(p=>p.status==='IN').length;
  }
  const api={plan,eventCount};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(!root.document)return;
  let snapshot=null,stale=true,dialog=null;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  function description(p){return [[p.three,3],[p.four,4],[p.five,5]].filter(([n])=>n).map(([n,size])=>`${n} pool${n===1?'':'s'} of ${size}`).join(' + ')+` — ${p.pools} pools total`;}
  function render(){
    if(!dialog)return;
    const out=dialog.querySelector('[data-results]');out.replaceChildren();
    const count=eventCount(snapshot);
    dialog.querySelector('[data-count]').textContent=count===null?'No verified event count':`${count} IN players · ${snapshot.eventDateDisplay||snapshot.eventDate}`;
    if(stale || count===null){out.appendChild(el('p','Event data is unavailable or out of date. Wait for a successful Hub refresh before planning.'));return;}
    const result=plan(count,Number(dialog.querySelector('[data-size]').value),Number(dialog.querySelector('[data-boards]').value));
    if(result.error){out.appendChild(el('p',result.error));return;}
    out.appendChild(el('h3','Your preferred format'));
    out.appendChild(el('p',description(result.preferredPlan)));
    if(result.waves===1)out.appendChild(el('p',`${result.preferredPlan.pools} of ${result.boards} dartboards needed with one board per pool.`));
    else out.appendChild(el('p',`${result.preferredPlan.pools-result.boards} more pools than boards. Some pools must share a board or start later. At least ${result.waves} starting batches if each pool keeps one board until finished; this is not a timed schedule.`));
    out.appendChild(el('h3','One pool per dartboard'));
    out.appendChild(el('p',result.perBoard?description(result.perBoard):'Not possible with only 3- and 4-player pools on the available boards. Use shared boards or staggered starts, or make more boards available.'));
    if(result.beyondScheme)out.appendChild(el('p','Above the supplied 101-player scheme: calculated using the same 3-/4-player rules.'));
    out.appendChild(el('p','IN players only; OUT and STANDBY excluded. Recommendations update after verified Hub refreshes. '+(root.BeautySeededPoolUI?'Use the seeded TEST controls below to draw and review a Nakka handoff.':'This does not draw players or create Nakka pools.')));
  }
  api.update=data=>{snapshot=data;stale=false;root.BeautySeededPoolUI?.update(data);render();};
  api.unavailable=()=>{stale=true;root.BeautySeededPoolUI?.unavailable();render();};
  root.BeautyPoolPlanner=api;
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('poolPlannerButton');if(!button)return;
    button.addEventListener('click',()=>{
      if(dialog){dialog.showModal();root.BeautyHubNavigation?.activate(button);render();return;}
      dialog=el('dialog');dialog.className='pool-planner';dialog.setAttribute('aria-labelledby','poolPlannerTitle');
      const close=el('button','×');close.className='pool-close';close.setAttribute('aria-label','Close Pool Planner');close.addEventListener('click',()=>{if(!root.BeautySeededPoolUI?.isBusy())dialog.close();});
      const title=el('h2','Pool Planner');title.id='poolPlannerTitle';dialog.append(close,title);
      const count=el('p');count.dataset.count='';dialog.appendChild(count);
      const label=el('label','Preferred players per pool '),size=el('select');size.dataset.size='';
      [3,4].forEach(n=>{const option=el('option',String(n));option.value=String(n);size.appendChild(option);});label.appendChild(size);
      const boardsLabel=el('label','Available dartboards '),boards=el('input');boards.type='number';boards.min='1';boards.max='1000';boards.step='1';boards.dataset.boards='';boards.placeholder='Enter number';boardsLabel.appendChild(boards);
      dialog.append(label,boardsLabel);
      const results=el('section');results.dataset.results='';results.setAttribute('aria-live','polite');dialog.appendChild(results);
      const reference=el('a','Open your pool scheme ↗');reference.href='assets/pool-scheme.html';
      // Open a readable HTML reference. The original workbook is downloadable
      // only from an explicit link inside that page.
      if(reference.href.startsWith('data:')) {
        const encoded=reference.href.split(',')[1];
        const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
        reference.href=URL.createObjectURL(new Blob([bytes],{type:'text/html;charset=utf-8'}));
      }
      reference.target='_blank';reference.rel='noopener noreferrer';dialog.appendChild(reference);
      const note=el('p','Original supplied file: two preferences covering 5–101 players.');dialog.appendChild(note);
      boards.addEventListener('input',render);size.addEventListener('change',render);
      dialog.addEventListener('close',()=>{root.BeautyHubNavigation?.dashboard();button.focus();});
      document.body.appendChild(dialog);root.BeautySeededPoolUI?.mount(dialog);dialog.showModal();root.BeautyHubNavigation?.activate(button);render();
    });
  });
})(typeof window!=='undefined'?window:globalThis);
