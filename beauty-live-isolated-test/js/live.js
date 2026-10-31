/* Beauty Live isolated TEST shell: no writes and no alterations to existing Overview sources. */
(()=>{'use strict';
const $=id=>document.getElementById(id), content=$('content');
const viewNames={tonight:'Kvällens spelare',pools:'Gruppspel',t:'Slutspel 1',s2:'Slutspel 2'};
const state={view:'pools',index:0,rounds:{t:0,s2:0}},data=null,ok:false,controller:null;
const e=(tag,parent,txt,cls)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;if(cls)n.className=cls;parent.appendChild(n);return n;};
const val=n=>n==null?'—':String(n),avg=n=>Number.isFinite(n)?n.toFixed(2):'—';
function nameParts(name){const words=String(name||'').trim().split(/\s+/);return {first:words[0]||'',surname:words.slice(1).join(' ')}};
function trimSurname(s){return s.length>17?s.slice(0,16).trimEnd()+'.':s;}
function status(msg,err=false){$('status').textContent=msg;$('status').classList.toggle('error',err);}
function drawPool(p,parent){
 const box=e('article',parent,null,'pool'),h=e('div',box,null,'pool-head'),l=e('h2',h,'Bana '+val(p.board)),r=e('div',h);e('strong',r,'Grupp '+val(p.group??p.number));e('p',r,'Start '+avg(p.startAverage)+'  Nu '+avg(p.currentAverage));
 if(!p.matrix||!p.matrix.length){e('p',box,'Ingen verifierad matchmatris ännu.','placeholder');return;}
 const table=e('table',box),head=e('tr',e('thead',table));
 for(const label of ['#','Spelare',...p.matrix.map(x=>x.position),'V–F','Legs','Rank'])e('th',head,label);
 const body=e('tbody',table);
 for(const player of p.matrix){const row=e('tr',body),stats=(p.players||[]).find(x=>x.id===player.id)||{};e('td',row,player.position);const name=e('td',row);const parsed=nameParts(player.name);e('span',name,parsed.first,'name');e('span',name,trimSurname(parsed.surname),'surname');e('span',name,avg(player.overallAverage),'avg');let legsFor=0,legsAgainst=0;
 for(const cell of player.cells){const td=e('td',row,null,cell.state==='self'?'self':cell.live?'active':'');if(cell.state==='self')continue;if(cell.state==='result'||cell.state==='live'){e('span',td,val(cell.score)+'–'+val(cell.opponentScore),'score');e('span',td,'('+avg(cell.average)+')','avg');if(Number.isFinite(cell.score))legsFor+=cell.score;if(Number.isFinite(cell.opponentScore))legsAgainst+=cell.opponentScore;}else e('span',td,'—');}
 e('td',row,val(stats.wins)+'–'+val(stats.losses));e('td',row,legsFor+'–'+legsAgainst);e('span',e('td',row),val(stats.rank),'rank'+(stats.rank===1||stats.rank===2?' top':''));}
 for(let i=p.matrix.length;i<4;i++)e('tr',body,null,'emptyrow');
}
function drawBracket(kind){
 const stage=state.data.knockouts?.find(k=>k.kind===kind);if(!stage||!stage.rounds.length){e('p',content,'Nakka har ännu inte publicerat ett slutspelsträd för denna tävling.','placeholder');return;}
 const controls=e('div',content,null,'bracket-controls'),prev=e('button',controls,'◀ Tidigare'),next=e('button',controls,'Senare ▶'),all=e('button',controls,'Visa hela slutspelsträdet');let showAll=false;
 const holder=e('div',content,null,'bracket-scroll');
 const draw=()=>{holder.replaceChildren();prev.disabled=state.rounds[kind]===0||showAll;next.disabled=state.rounds[kind]>=stage.rounds.length-2||showAll;const partial={...state.data,knockouts:[{...stage,rounds:showAll?stage.rounds:stage.rounds.slice(state.rounds[kind],state.rounds[kind]+2)}]};
 BeautyCompetitionView.render(document,holder,partial,{view:kind,roundStarts:{[kind]:0}},()=>{});};
 prev.addEventListener('click',()=>{state.rounds[kind]=Math.max(0,state.rounds[kind]-1);draw()});next.addEventListener('click',()=>{state.rounds[kind]=Math.min(stage.rounds.length-2,state.rounds[kind]+1);draw()});all.addEventListener('click',()=>{showAll=!showAll;all.textContent=showAll?'Visa färre omgångar':'Visa hela slutspelsträdet';draw()});draw();
}
function render(){const kind=state.view;content.replaceChildren();$('title').textContent=viewNames[kind];for(const b of document.querySelectorAll('[data-view]')){if(b.dataset.view===kind)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 const pager=$('pager');pager.hidden=kind!=='pools';if(kind==='tonight'){
  const url=new URL(window.location.href);if(url.searchParams.get('page')==='stages'){url.searchParams.set('page','live');const frame=e('iframe',content,null,'tonight');frame.title='Kvällens spelare · TEST';frame.src=url.href;frame.referrerPolicy='no-referrer';}else e('p',content,'Kvällens spelare kräver anslutning till befintlig Beauty Live TEST-webbapp.','placeholder');return;}
 if(!state.data){e('p',content,'Väntar på verifierade TEST-data.','placeholder');return;}
 if(kind==='pools'){const list=state.data.pools||[],total=Math.max(1,Math.ceil(list.length/6));state.index=Math.max(0,Math.min(state.index,total-1));const grid=e('div',content,null,'grid');for(const p of list.slice(state.index*6,state.index*6+6))drawPool(p,grid);$('pages').textContent='Sida '+(state.index+1)+' / '+total;$('previous').disabled=state.index===0;$('next').disabled=state.index>=total-1;}
 else drawBracket(kind);
}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{state.view=b.dataset.view;state.index=0;render()});
$('previous').addEventListener('click',()=>{state.index=Math.max(0,state.index-1);render()});$('next').addEventListener('click',()=>{state.index++;render()});$('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>status('Helskärm ej tillgänglig.',true));});
try{state.controller=BeautyNakkaStageFeed.create({fetch:window.fetch.bind(window),includeLive:true,onData(data){state.data=data;state.ok=true;$('event').textContent=data.title||'NAKKA TEST';status('Nakka TEST · Senast hämtad '+new Date().toLocaleTimeString('sv-SE'));render()},onError(){state.ok=false;status('Nakka TEST-data kunde inte verifieras. Visar endast senast hämtad data.',true)}});state.controller.refresh();}catch(error){status('Kunde inte starta TEST-anslutningen.',true)}
const timer=setInterval(()=>{if(!document.hidden&&navigator.onLine)state.controller?.refresh()},10000),liveTimer=setInterval(()=>{if(!document.hidden&&navigator.onLine)state.controller?.refreshLive?.()},2000),rotate=setInterval(()=>{if(state.view==='pools'&&state.data?.pools?.length>6){state.index=(state.index+1)%Math.ceil(state.data.pools.length/6);render()}},12000);
window.addEventListener('pagehide',()=>{clearInterval(timer);clearInterval(liveTimer);clearInterval(rotate);state.controller?.stop()});render();
})();
