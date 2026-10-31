/* Reusable read-only renderer. Provider text is always inserted as text, never HTML. */
(function(root){
 'use strict';
 function formatText(text){return typeof text==='string'?text.replace(/^First to (\d+) legs$/,'Först till $1 leg').replace(/^First to (\d+) sets$/,'Först till $1 set').replace(/^Limit (\d+) legs · draws allowed$/,'Högst $1 leg · oavgjort tillåtet').replace(/^Limit (\d+) sets · draws allowed$/,'Högst $1 set · oavgjort tillåtet'):text;}
 const value=n=>n==null?'—':String(n);
 const average=n=>n==null?'—':Number(n).toFixed(2);
 function views(){return [{id:'pools',label:'Gruppspel'},{id:'t',label:'Slutspel 1'},{id:'s2',label:'Slutspel 2'}];}
 function page(data,options={}){
  const choices=views(data), selected=(options.view==='tonight'||choices.some(v=>v.id===options.view))?options.view:'pools', size=6;
  const hasPools=selected==='pools', total=hasPools?Math.max(1,Math.ceil(data.pools.length/size)):1;
  const index=Math.min(total-1,Math.max(0,Number.isInteger(options.index)?options.index:0));
  const collapsed={},roundStarts={};
  for(const id of ['pools',...data.knockouts.map(s=>s.kind)]) collapsed[id]=options.collapsed?.[id]===true;
  for(const stage of data.knockouts){const requested=options.roundStarts?.[stage.kind];roundStarts[stage.kind]=Math.min(Math.max(0,stage.rounds.length-1),Math.max(0,Number.isInteger(requested)?requested:0));}
  return {view:selected,size,index,total,choices,collapsed,roundStarts,showFullBracket:options.showFullBracket||{},pools:hasPools?data.pools.slice(index*size,(index+1)*size):[],stages:data.knockouts.filter(s=>s.kind===selected),stage:data.knockouts.find(s=>s.kind===selected)||null};
 }
 function focusRemaining(data,options={}){
  const state=page(data,{...options,view:'pools'}), collapsed={...state.collapsed}, roundStarts={...state.roundStarts};
  collapsed.pools=data.pools.length>0&&data.pools.every(p=>Array.isArray(p.matrix)&&p.matrix.length>1&&p.matrix.every(row=>row.cells.every(c=>c.state==='self'||c.state==='result')));
  for(const stage of data.knockouts){
   const isRecorded=m=>m.left.state==='bye'||m.right.state==='bye'||(m.left.state==='player'&&m.right.state==='player'&&m.leftScore!=null&&m.rightScore!=null);
   const playable=stage.rounds.filter(r=>r.slotCount>1),open=playable.findIndex(r=>r.matches.some(m=>!isRecorded(m)));
   const thirdOpen=stage.thirdPlace&&!isRecorded(stage.thirdPlace);
   collapsed[stage.kind]=playable.length>0&&open<0&&!thirdOpen;
   roundStarts[stage.kind]=Math.min(Math.max(0,stage.rounds.length-2),Math.max(0,open<0?stage.rounds.length-2:open));
  }
  return {...options,view:'pools',index:0,collapsed,roundStarts};
 }
 function splitName(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(parts.length===0)return {line1:'',line2:''};
  if(parts.length===1)return {line1:parts[0],line2:''};
  const line1=parts[0];
  const surname=parts.slice(1).join(' ');
  const maxLen=17;
  return {line1, line2:surname.length>maxLen?surname.slice(0,maxLen-1).trimEnd()+'.':surname};
 }
 function legsFor(row){
  let won=0,lost=0;
  for(const cell of row.cells||[]){if((cell.state==='result'||cell.state==='live')&&cell.score!=null&&cell.opponentScore!=null){won+=cell.score;lost+=cell.opponentScore;}}
  return {won,lost};
 }
 function render(doc,host,data,options,onAction=()=>{}){
  const state=page(data,options); host.replaceChildren();
  function el(tag,text,parent,css){const n=doc.createElement(tag); if(text!=null)n.textContent=text; if(css)n.className=css; parent.appendChild(n); return n;}
  function drawMatch(m,column,winner=false,showSeed=false){
     const box=el('article',null,column,winner?'match winner':'match'); if(m.board?.state==='in-progress')box.classList.add('match-live');
     if(!winner){const badge=el('span',m.board.text?'Bana '+m.board.text:m.board.state==='unavailable'?'Bana ej tillgänglig':'Väntar på bana',box,'stage-board-badge'); badge.dataset.state=m.board.state; const labels={'assigned':'Tilldelad','in-progress':'Pågår','finished':'Avslutad','unassigned':'Ej tilldelad','unavailable':'Ej tillgänglig'}; badge.setAttribute('aria-label',badge.textContent+' · '+labels[m.board.state]);}
     const players=winner?[[m.left,null,null]]:[[m.left,m.leftScore,m.leftAverage],[m.right,m.rightScore,m.rightAverage]];
     for(const [p,score,avg] of players){ const line=el('div',null,box,'match-player'); const name=el('div',null,line,'participant'); if(showSeed&&p.seed!=null&&p.state==='player')el('span',String(p.seed)+' ',name,'match-seed'); el('span',p.state==='bye'?'Frirond':p.state==='pending'?'Väntar på spelare':p.name,name,'player-name'); if(!winner&&p.state==='player')el('small','Matchsnitt '+average(avg),name,'muted'); if(!winner)el('strong',value(score),line,'score'); }
     return box;
  }
  function section(id){ const outer=el('section',null,host,'competition-section'), content=el('div',null,outer,'stage-content'); content.id='content-'+id; return content; }
  if(state.view==='pools'){
   const poolHost=section('pools');
   if(!state.pools.length) el('p','Ingen gruppställning har hämtats för tävlingen.',poolHost,'empty-state');
   const grid=el('div',null,poolHost,'pool-grid'); grid.dataset.size='6';
   for(const pool of state.pools){
    const card=el('section',null,grid,'stage-card stage-card-pool'), header=el('header',null,card,'pool-card-header');
    const left=el('div',null,header,'pool-board-title'); el('h3','Bana '+value(pool.board),left);
    const right=el('div',null,header,'pool-card-meta'); el('h3','Grupp '+value(pool.group??pool.number),right);
    const averages=el('div',null,right,'group-averages'); const start=el('span','Start '+average(pool.startAverage),averages,'start-average'); start.setAttribute('title','Fryst snitt vid gruppindelningen · '+value(pool.startCoverage)+' kända spelarvärden'); const current=el('span','Nu '+average(pool.currentAverage),averages,'current-average'); current.setAttribute('title','Poäng / kastade pilar × 3 i gruppspelet hittills');
    if(pool.matrix){
      const wrap=el('div',null,card,'table-scroll'), matrix=el('table',null,wrap,'pool-matrix');
      el('caption','Grupp '+pool.number+' · matchresultat per spelarposition',matrix); const thead=el('thead',null,matrix), h=el('tr',null,thead);
      for(const title of ['#','Spelare',...pool.matrix.map(p=>String(p.position)),'V–F','Legs','Rank']){const th=el('th',title,h); th.setAttribute('scope','col'); if(title==='Spelare')th.className='name-col';}
      const body=el('tbody',null,matrix);
      for(const p of pool.matrix){
        const row=el('tr',null,body); const standing=pool.players.find(q=>q.id===p.id)||{}; const lg=legsFor(p); const split=splitName(p.name);
        el('td',p.position,row,'position number white-pos');
        const player=el('td',null,row,'pool-player');
        const nameWrap=el('span',null,player,'player-name two-line-name'); el('span',split.line1,nameWrap,'name-line name-line-1'); el('span',split.line2,nameWrap,'name-line name-line-2'); el('small',average(p.overallAverage),player,'overall-average');
        for(const cell of p.cells){
          const td=el('td',null,row,cell.state==='self'?'self-cell':'number'+(cell.live?' live-cell':''));
          if(cell.state==='result'||cell.state==='live'){el('span',cell.score+'–'+cell.opponentScore,td,'cell-score'); el('small','('+average(cell.average)+')',td,'muted');}
          else if(cell.state==='multiple')el('span','Flera',td);
          else el('span',cell.state==='self'?'':'—',td);
        }
        el('td',value(standing.wins)+'–'+value(standing.losses),row,'number result-col');
        el('td',value(lg.won)+'–'+value(lg.lost),row,'number result-col');
        const rankCell=el('td',null,row,'number result-col rank-col'); const rankBadge=el('span',value(standing.rank),rankCell,'rank-badge'); if(standing.rank===1)rankBadge.classList.add('rank-first'); else if(standing.rank===2)rankBadge.classList.add('rank-second');
      }
    } else {
      el('p','Ingen gruppmatris ännu.',card,'muted');
    }
   }
  }
  for(const stage of state.stages){
   const stageHost=section(stage.kind), start=state.roundStarts[stage.kind];
   const navigation=el('nav',null,stageHost,'round-navigation'); navigation.setAttribute('aria-label','Omgångar i '+(stage.kind==='t'?'slutspel 1':'slutspel 2'));
   const count=stage.rounds.length, showAll=state.showFullBracket?.[stage.kind]===true;
   if(count===0){el('p','Slutspelsträdet har ännu inte publicerats i Nakka. Ingen lottning visas.',stageHost,'empty-state');}
   else {
    for(const [direction,label,disabled] of [[-1,'Tidigare omgångar',start===0||showAll],[1,'Senare omgångar',start>=count-1||showAll]]){ const button=el('button',(direction<0?'◀ ':'▶ ')+label,navigation); button.type='button'; button.id='round-'+stage.kind+'-'+(direction<0?'previous':'next'); button.disabled=disabled; button.addEventListener('click',()=>onAction({type:'round',id:stage.kind,direction,focusId:button.id})); }
    const full=el('button',showAll?'Visa två omgångar':'Visa hela slutspelsträdet',navigation,'bracket-full-toggle'); full.type='button'; full.id='full-'+stage.kind; full.setAttribute('aria-pressed',String(showAll)); full.addEventListener('click',()=>onAction({type:'full',id:stage.kind,focusId:full.id}));
    el('p',showAll?'Alla '+count+' omgångar':'Visar omgång '+(start+1)+'–'+Math.min(start+2,count)+' av '+count,navigation,'muted');
    const rounds=el('div',null,stageHost,'rounds'+(showAll?' bracket-all':'')); rounds.setAttribute('tabindex','0'); rounds.setAttribute('aria-label','Slutspelsomgångar. Rulla i sidled för att se alla omgångar.');
    const visible=showAll?stage.rounds:stage.rounds.slice(start,start+2);
    for(const r of visible){const ri=stage.rounds.indexOf(r), column=el('section',null,rounds,'round'); const winner=r.slotCount===1&&ri===count-1&&ri>0; const title=winner?'Vinnare':r.slotCount===2?'Final':r.slotCount===4?'Semifinal':r.slotCount===8?'Kvartsfinal':r.slotCount===16?'Åttondelsfinal':r.slotCount===32?'Sextondelsfinal':r.slotCount>32?'Omgång med '+r.slotCount+' spelare':'Omgång '+r.round; el('h3',title,column); if(r.format&&!winner)el('p',formatText(r.format),column,'muted'); const track=el('div',null,column,'round-match-track'); if(showAll&&count>2&&stage.rounds[0].matches.length>1){track.classList.add('bracket-track'); track.style.minHeight=Math.max(900,stage.rounds[0].matches.length*132)+'px';}
      for(const [matchIndex,m] of r.matches.entries()){const box=drawMatch(m,track,winner,ri===0); if(showAll&&count>2&&stage.rounds[0].matches.length>1){ const baseSlots=stage.rounds[0].slotCount; const trackPosition=(matchIndex+0.5)*Math.pow(2,ri+1)/baseSlots; box.style.top=(trackPosition*100)+'%'; box.classList.add('bracket-positioned'); if(ri>0)box.style.setProperty('--join-offset',String(Math.max(900,stage.rounds[0].matches.length*132)*Math.pow(2,ri-1)/baseSlots)+'px'); }}
    }
    if(count<=2&&stage.rounds.every(r=>r.matches.every(m=>[m.left,m.right].every(p=>p.state!=='player')))) el('p','Nakka har ännu inte lämnat ett bekräftat slutspelsträd. Vinnare och final är platshållare.',stageHost,'empty-state');
   }
   if(stage.thirdPlace){const third=el('section',null,stageHost,'stage-third-place'); el('h3','Match om tredje pris',third); if(stage.thirdPlace.format)el('p',formatText(stage.thirdPlace.format),third,'muted'); drawMatch(stage.thirdPlace,third);}
  }
  return state;
 }
 const api=Object.freeze({views,page,focusRemaining,render}); if(typeof module==='object'&&module.exports)module.exports=api; else root.BeautyCompetitionView=api;
})(typeof globalThis==='object'?globalThis:this);
