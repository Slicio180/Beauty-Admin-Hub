/* Reusable read-only renderer. Provider text is always inserted as text, never HTML. */
(function(root){
 'use strict';
 function formatText(text){return typeof text==='string'?text.replace(/^First to (\d+) legs$/,'Först till $1 leg').replace(/^First to (\d+) sets$/,'Först till $1 set').replace(/^Limit (\d+) legs · draws allowed$/,'Högst $1 leg · oavgjort tillåtet').replace(/^Limit (\d+) sets · draws allowed$/,'Högst $1 set · oavgjort tillåtet'):text;}
 const value=n=>n==null?'—':String(n);
 const average=n=>n==null?'—':Number(n).toFixed(2);
 function views(data){return [{id:'all',label:'Alla spelstadier'},{id:'pools',label:'Gruppställning'},{id:'boards',label:'Banöversikt'},...data.knockouts.map(s=>({id:s.kind,label:s.kind==='t'?'Slutspel 1':'Slutspel 2'}))];}
 function page(data,options={}){
  const choices=views(data),selected=choices.some(v=>v.id===options.view)?options.view:'pools',size=options.size===6?6:4;
  const hasPools=selected==='pools'||selected==='all',total=hasPools?Math.max(1,Math.ceil(data.pools.length/size)):1;
  const index=Math.min(total-1,Math.max(0,Number.isInteger(options.index)?options.index:0));
  const collapsed={},roundStarts={};for(const id of ['pools',...data.knockouts.map(s=>s.kind)])collapsed[id]=options.collapsed?.[id]===true;
  for(const stage of data.knockouts){const requested=options.roundStarts?.[stage.kind];roundStarts[stage.kind]=Math.min(Math.max(0,stage.rounds.length-2),Math.max(0,Number.isInteger(requested)?requested:0));}
  return {view:selected,size,index,total,choices,collapsed,roundStarts,pools:hasPools?data.pools.slice(index*size,(index+1)*size):[],stages:selected==='all'?data.knockouts:data.knockouts.filter(s=>s.kind===selected),stage:data.knockouts.find(s=>s.kind===selected)||null};
 }
 function focusRemaining(data,options={}){
  const state=page(data,{...options,view:'all'}),collapsed={...state.collapsed},roundStarts={...state.roundStarts};
  // Only a complete provider result matrix establishes a completed pool.
  collapsed.pools=data.pools.length>0&&data.pools.every(p=>Array.isArray(p.matrix)&&p.matrix.length>1&&p.matrix.every(row=>row.cells.every(c=>c.state==='self'||c.state==='result')));
  for(const stage of data.knockouts){
   const isRecorded=m=>m.left.state==='bye'||m.right.state==='bye'||(m.left.state==='player'&&m.right.state==='player'&&m.leftScore!=null&&m.rightScore!=null);
   const playable=stage.rounds.filter(r=>r.slotCount>1),open=playable.findIndex(r=>r.matches.some(m=>!isRecorded(m)));
   const thirdOpen=stage.thirdPlace&&!isRecorded(stage.thirdPlace);
   collapsed[stage.kind]=playable.length>0&&open<0&&!thirdOpen;
   roundStarts[stage.kind]=Math.min(Math.max(0,stage.rounds.length-2),Math.max(0,open<0?stage.rounds.length-2:open));
  }
  return {...options,view:'all',index:0,collapsed,roundStarts};
 }
 function render(doc,host,data,options,onAction=()=>{}){
  const state=page(data,options);host.replaceChildren();
  function el(tag,text,parent,css){const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(css)n.className=css;parent.appendChild(n);return n;}
  function drawMatch(m,column,winner=false){
     const box=el('article',null,column,winner?'match winner':'match');
     if(!winner){const badge=el('span',m.board.text?'Bana '+m.board.text:m.board.state==='unavailable'?'Bana ej tillgänglig':'Väntar på bana',box,'stage-board-badge');badge.dataset.state=m.board.state;
      const labels={'assigned':'Tilldelad','in-progress':'Pågår','finished':'Avslutad','unassigned':'Ej tilldelad','unavailable':'Ej tillgänglig'};badge.setAttribute('aria-label',badge.textContent+' · '+labels[m.board.state]);}
     const players=winner?[[m.left,null,null]]:[[m.left,m.leftScore,m.leftAverage],[m.right,m.rightScore,m.rightAverage]];
     for(const [p,score,avg]of players){const line=el('div',null,box,'match-player');const name=el('div',null,line,'participant');el('span',p.state==='bye'?'Frirond':p.state==='pending'?'Väntar på spelare':p.name,name,'player-name');if(!winner&&p.state==='player')el('small','Matchsnitt '+average(avg),name,'muted');if(!winner)el('strong',value(score),line,'score');}
  }
  function section(id,title){
   const outer=el('section',null,host,'competition-section'),heading=el('h2',null,outer),button=el('button',(state.collapsed[id]?'▸ ':'▾ ')+title,heading,'stage-toggle');button.type='button';button.id='toggle-'+id;button.setAttribute('aria-expanded',String(!state.collapsed[id]));button.setAttribute('aria-controls','content-'+id);
   button.addEventListener('click',()=>onAction({type:'toggle',id,focusId:button.id}));const content=el('div',null,outer,'stage-content');content.id='content-'+id;content.hidden=state.collapsed[id];return content;
  }
  if(state.view==='pools'||state.view==='all'){
   const formats=[...new Set(data.pools.map(p=>p.format))],format=formats.length===1&&formats[0]?formatText(formats[0]):null;
   const poolHost=section('pools','Gruppspel'+(format?' · '+format:''));
   if(!state.pools.length)el('p','Ingen gruppställning har hämtats för tävlingen.',poolHost,'empty-state');
   const grid=el('div',null,poolHost,'pool-grid');grid.dataset.size=String(state.size);
   for(const pool of state.pools){
    const card=el('section',null,grid,'stage-card'),header=el('header',null,card,'pool-card-header');
    const left=el('div',null,header,'pool-board-title');el('h3','Bana '+value(pool.board),left);
    const right=el('div',null,header,'pool-card-meta');
    if(pool.shared||!pool.board)el('h3','Grupp '+value(pool.group??pool.number),right);
    const averages=el('div',null,right,'group-averages');
    const start=el('span','Start '+average(pool.startAverage),averages,'start-average');start.setAttribute('title','Fryst snitt vid gruppindelningen · '+value(pool.startCoverage)+' kända spelarvärden');
    const current=el('span','Nu '+average(pool.currentAverage),averages,'current-average');current.setAttribute('title','Poäng / kastade pilar × 3 i gruppspelet hittills');
    let standingsHost=card;
    if(pool.matrix){
     const wrap=el('div',null,card,'table-scroll'),matrix=el('table',null,wrap,'pool-matrix');el('caption','Grupp '+pool.number+' · matchresultat per spelarposition',matrix);const h=el('tr',null,el('thead',null,matrix));
     for(const title of ['#','Spelare',...pool.matrix.map(p=>String(p.position)),'V–F']){const th=el('th',title,h);th.setAttribute('scope','col');}
     const body=el('tbody',null,matrix);
     for(const p of pool.matrix){const row=el('tr',null,body);el('td',p.position,row,'position number');const player=el('td',null,row,'pool-player');el('span',p.name,player,'player-name');el('small',average(p.overallAverage),player,'overall-average');
      for(const cell of p.cells){const td=el('td',null,row,cell.state==='self'?'self-cell':'number'+(cell.live?' live-cell':''));
       if(cell.state==='result'||cell.state==='live'){if(cell.live){el('small','LIVE',td,'live-tag');td.setAttribute('aria-label','Pågående match · '+cell.score+'–'+cell.opponentScore);}el('span',cell.score+'–'+cell.opponentScore,td);el('small','('+average(cell.average)+')',td,'muted');}
       else if(cell.state==='multiple')el('span','Flera matcher',td);else el('span',cell.state==='self'?'':'—',td);
      }const standing=pool.players.find(q=>q.id===p.id);el('td',value(standing?.wins)+'–'+value(standing?.losses),row,'number');}
     standingsHost=el('details',null,card,'pool-standings');el('summary','Tabell och poäng',standingsHost);
    }
    const scroll=el('div',null,standingsHost,'table-scroll'),table=el('table',null,scroll);
    el('caption','Grupp '+pool.number+' · tabell från Nakka',table);
    const head=el('tr',null,el('thead',null,table));for(const title of ['#','Spelare','S','V–F','Poäng']){const th=el('th',title,head);th.setAttribute('scope','col');}
    const body=el('tbody',null,table);
    for(const p of pool.players){const row=el('tr',null,body);for(const [i,text]of [value(p.rank),p.name,value(p.played),value(p.wins)+'–'+value(p.losses),value(p.points)].entries())el('td',text,row,i===1?'player-name':'number');}
    if(!pool.players.length)el('p','Ingen tabell ännu.',card,'muted');
   }
  }
  if(state.view==='boards'){
   const boardHost=section('boards','Banöversikt'),list=el('div',null,boardHost,'board-overview');
   const boards=[...new Set(data.pools.map(p=>p.board).filter(Boolean))].sort((a,b)=>a-b);
   for(const board of boards){const item=el('article',null,list,'stage-card');el('h3','Bana '+board,item);el('p',data.pools.filter(p=>p.board===board).map(p=>'Grupp '+value(p.group??p.number)).join(' / '),item);el('small','Planerad i Hubben · direkttilldelning styrs av Nakka',item,'muted');}
   if(!boards.length)el('p','Ingen verifierad banplan tillgänglig. Spara banetiketterna i Hubben.',boardHost,'empty-state');
  }
  for(const stage of state.stages){
   const stageHost=section(stage.kind,stage.kind==='t'?'Slutspel 1':'Slutspel 2'),start=state.roundStarts[stage.kind];
   const navigation=el('nav',null,stageHost,'round-navigation');navigation.setAttribute('aria-label','Omgångar i '+(stage.kind==='t'?'slutspel 1':'slutspel 2'));
   for(const [direction,label,disabled]of [[-1,'Tidigare omgångar',start===0],[1,'Senare omgångar',start>=stage.rounds.length-2]]){const button=el('button',(direction<0?'◀ ':'▶ ')+label,navigation);button.type='button';button.id='round-'+stage.kind+'-'+(direction<0?'previous':'next');button.disabled=disabled;button.addEventListener('click',()=>onAction({type:'round',id:stage.kind,direction,focusId:button.id}));}
   el('p',stage.rounds.length?'Visar omgång '+(start+1)+'–'+Math.min(start+2,stage.rounds.length)+' av '+stage.rounds.length:'Inga omgångar',navigation,'muted');
   const rounds=el('div',null,stageHost,'rounds');rounds.setAttribute('tabindex','0');rounds.setAttribute('aria-label','Slutspelsomgångar. Rulla i sidled till senare omgångar.');
   if(!stage.rounds.length)el('p','Inget slutspelsträd har hämtats för detta spelstadium.',stageHost,'empty-state');
   for(const [offset,r]of stage.rounds.slice(start,start+2).entries()){
    const ri=start+offset,column=el('section',null,rounds,'round');
    const winner=r.slotCount===1&&ri===stage.rounds.length-1&&ri>0;
    el('h3',winner?'Vinnare':r.slotCount===2?'Final':r.slotCount===4?'Semifinal':r.slotCount>4?'Topp '+r.slotCount:'Omgång '+r.round,column);
    if(r.format&&!winner)el('p',formatText(r.format),column,'muted');
    for(const m of r.matches){
     drawMatch(m,column,winner);
    }
   }
   if(stage.thirdPlace){const third=el('section',null,stageHost,'stage-third-place');el('h3','Match om tredje pris',third);if(stage.thirdPlace.format)el('p',formatText(stage.thirdPlace.format),third,'muted');drawMatch(stage.thirdPlace,third);}
  }
  return state;
 }
 const api=Object.freeze({views,page,focusRemaining,render});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyCompetitionView=api;
})(typeof globalThis==='object'?globalThis:this);
