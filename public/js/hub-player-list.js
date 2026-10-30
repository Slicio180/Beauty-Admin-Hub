/* Hub-only list presentation. No registration, status or provider writes. */
(function(root){
 'use strict';
 const name=p=>String(p.player||p.newPlayer||'');
 const stamp=p=>typeof p.registeredAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(p.registeredAt)?Date.parse(p.registeredAt):NaN;
 function capabilities(players,data){return {ranking:data?.rankingAvailable===true&&players.some(p=>Number.isInteger(p.rank)&&p.rank>0),registration:players.length>0&&players.every(p=>Number.isFinite(stamp(p)))};}
 function arrange(players,{sort='alphabetical',search='',rankingAvailable=false}={}){
  const allowed=capabilities(players,{rankingAvailable});if(sort==='ranking'&&!allowed.ranking||sort==='registration'&&!allowed.registration)sort='alphabetical';
  const query=String(search).normalize('NFC').trim().toLocaleLowerCase('sv-SE');
  const rows=players.map((p,i)=>({p,i})).filter(x=>name(x.p).normalize('NFC').toLocaleLowerCase('sv-SE').includes(query));
  const alpha=(a,b)=>name(a.p).localeCompare(name(b.p),'sv-SE')||a.i-b.i;
  rows.sort((a,b)=>sort==='original'?a.i-b.i:sort==='registration'?stamp(a.p)-stamp(b.p)||a.i-b.i:sort==='ranking'?((Number.isInteger(a.p.rank)&&a.p.rank>0?a.p.rank:Infinity)-(Number.isInteger(b.p.rank)&&b.p.rank>0?b.p.rank:Infinity))||alpha(a,b):alpha(a,b));return rows.map(x=>x.p);
 }
 if(typeof module==='object'&&module.exports){module.exports={arrange,capabilities};return;}
 const get=id=>document.getElementById(id),sort=get('hubPlayerSort'),search=get('hubPlayerSearch');let hubConnected=false;
 function rows(players){
  const available=capabilities(players,root.beautyHubData);
  if(sort){for(const option of sort.options){if(option.value==='ranking'){option.disabled=!available.ranking;option.textContent=available.ranking?'Nakka ranking':'Nakka ranking — not verified';}if(option.value==='registration'){option.disabled=!available.registration;option.textContent=available.registration?'Registration order':'Registration order — not recorded';}}
   if(sort.value==='ranking'&&!available.ranking||sort.value==='registration'&&!available.registration)sort.value='alphabetical';}
  return arrange(players,{sort:sort?.value,search:search?.value,rankingAvailable:root.beautyHubData?.rankingAvailable});
 }
 function redraw(){if(typeof updatePlayersTable==='function')updatePlayersTable(root.beautyHubData?.players||[]);const wrap=document.querySelector('.players-table-wrap');if(wrap)wrap.scrollTop=0;}
 sort?.addEventListener('change',redraw);search?.addEventListener('input',redraw);
 function connection(value){if(typeof value==='boolean')hubConnected=value;const node=get('hubListConnection');if(!node)return;
  if(BeautyHubServices.mode!=='test'){node.textContent='Offline demo · no live connection';node.dataset.state='waiting';return;}
  if(!hubConnected){node.textContent='Hub connection unavailable';node.dataset.state='problem';return;}
  const matched=get('nakkaTournamentTitle')?.dataset.state==='matched';node.dataset.state=matched?'ok':'waiting';node.textContent='Hub updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Stockholm'})+' · '+(matched?'Nakka event verified':'Nakka event not verified');
 }
 document.addEventListener('beauty-hub-locked',()=>{if(search)search.value='';if(sort)sort.value='alphabetical';hubConnected=false;const node=get('hubListConnection');if(node){node.textContent='Sign in to load players';node.dataset.state='waiting';}});
 root.BeautyPlayerList=Object.freeze({rows,connection,searching:()=>!!search?.value.trim()});
})(typeof window==='object'?window:globalThis);
