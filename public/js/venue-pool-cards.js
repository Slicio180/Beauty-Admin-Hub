/* Approved six-card public view. Read-only; identities/results remain provider-owned. */
(function(root){
 'use strict';
 const value=n=>n==null?'—':String(n),average=n=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(2):'—';
 function legs(player){
  if(!Array.isArray(player.cells))return null;
  let won=0,lost=0;
  for(const c of player.cells){
   if(c.state==='self'||c.state==='pending')continue;
   if(!['result','live'].includes(c.state)||![c.score,c.opponentScore].every(n=>Number.isInteger(n)&&n>=0))return null;
   won+=c.score;lost+=c.opponentScore;
  }return [won,lost];
 }
 // Keep only neighbours equal; compact the complete visible page when required.
 function geometry(counts,width=1400,height=0,size=6){
  const columns=width>760?2:1,pairs=[];
  for(let i=0;i<counts.length;i+=columns)pairs.push(Math.max(3,...counts.slice(i,i+columns)));
  const gap=12,space=Math.max(0,pairs.length-1)*gap,total=pairs.reduce((a,b)=>a+b,0),natural=pairs.map(n=>80+n*52);
  // Four-group pages reserve two equal card tracks even on the final partial page.
  const four=Number(size)===4&&columns===2&&height>0,slots=four?2:pairs.length;
  const wanted=four?Math.floor((height-gap)/2):0,maxRows=Math.max(3,...pairs);
  const compact=four?wanted<80+maxRows*52:height>0&&natural.reduce((a,b)=>a+b,space)>height;
  const overhead=compact?64:80;
  const rowHeight=four?Math.max(40,Math.floor((wanted-overhead)/maxRows)):compact?Math.max(40,Math.min(52,Math.floor((height-space-overhead*slots)/Math.max(1,total)))):52;
  const fixedHeight=four?Math.max(wanted,overhead+maxRows*40):0;
  const heights=pairs.map(n=>four?fixedHeight:overhead+n*rowHeight),typeRow=Math.min(rowHeight,52),line=Math.min(Math.floor((typeRow-4)/2),Math.floor(typeRow*.44)+1);
  return {columns,pairs,heights,rowHeight,compact,header:compact?40:48,thead:compact?20:27,nameFont:line-1,nameLine:line,averageFont:Math.floor(typeRow/2),height:heights.reduce((a,b)=>a+b,space),fits:!height||heights.reduce((a,b)=>a+b,space)<=height};
 }
 function applyLayout(grid,width,height){
  const layout=geometry(JSON.parse(grid.dataset.counts),width,height,Number(grid.dataset.size));grid.style.gridTemplateColumns='repeat('+layout.columns+',minmax(0,1fr))';grid.style.gridTemplateRows=layout.heights.map(n=>n+'px').join(' ');grid.dataset.compact=String(layout.compact);
  for(const [key,value]of Object.entries({row:layout.rowHeight,header:layout.header,thead:layout.thead,'name-font':layout.nameFont,'name-line':layout.nameLine,'average-font':layout.averageFont,'header-average-font':layout.header/2,'header-caption-font':layout.header/4}))grid.style.setProperty('--pool-'+key,value+'px');
  return layout;
 }
 function fitAverageWidths(host){
  if(typeof root.getComputedStyle!=='function')return;
  for(const text of host.querySelectorAll('.match-cell-average')){
   text.style.fontSize='';let size=parseFloat(root.getComputedStyle(text).fontSize);
   while(text.clientWidth>0&&text.scrollWidth>text.clientWidth&&size>14)text.style.fontSize=(--size)+'px';
  }
 }
 function fit(host,width,height){const grid=host.querySelector('.venue-pool-grid');const layout=grid?applyLayout(grid,width,height):null;fitAverageWidths(host);return layout;}
 function render(doc,host,data,options={}){
  const view=typeof module==='object'&&module.exports?require('./competition-view.js'):root.BeautyCompetitionView;
  const state=view.page(data,{...options,view:'pools'});host.replaceChildren();
  function el(tag,text,parent,css){const n=doc.createElement(tag);if(text!=null)n.textContent=String(text);if(css)n.className=css;parent.appendChild(n);return n;}
  const section=el('section',null,host,'competition-section venue-pools'),content=el('div',null,section,'stage-content');
  if(!state.pools.length){el('p','Ingen gruppställning har hämtats för tävlingen.',content,'empty-state');return state;}
  const grid=el('div',null,content,'pool-grid venue-pool-grid');grid.dataset.size=String(state.size);
  const counts=state.pools.map(p=>p.matrix?.length??p.players.length),layout=geometry(counts,options.width,options.height,state.size);grid.dataset.counts=JSON.stringify(counts);grid.dataset.rows=String(Math.max(3,...counts));
  for(const [index,pool] of state.pools.entries()){
   const count=layout.pairs[Math.floor(index/layout.columns)];
   const card=el('section',null,grid,'stage-card venue-pool-card'),header=el('header',null,card,'pool-card-header');
   card.dataset.rows=String(count);
   const left=el('div',null,header,'pool-board-title');el('h3','Bana '+(pool.boards?.length?pool.boards.join(' + '):value(pool.board)),left);
   const right=el('div',null,header,'pool-card-meta');
   if(pool.shared||!pool.board)el('h3','Grupp '+value(pool.group??pool.number),header,'pool-group-title');
   const averages=el('div',null,right,'group-averages');
   for(const [label,value,css,title]of [['START',pool.startAverage,'start-average','Fryst gruppsnitt vid gruppindelningen'],['NU',pool.currentAverage,'current-average','Poäng / kastade pilar × 3 i gruppspelet hittills']]){const pair=el('span',null,averages,css);pair.setAttribute('title',title);el('span',label,pair,'average-caption');el('strong',average(value),pair,'average-value');}
   if(!Array.isArray(pool.matrix)){
    el('p','Matchmatris saknas från Nakka.',card,'empty-state');continue;
   }
   const wrap=el('div',null,card,'table-scroll'),table=el('table',null,wrap,'pool-matrix');
   table.setAttribute('aria-label','Grupp '+pool.number+' · matchresultat');
   const cols=el('colgroup',null,table);el('col',null,cols,'position-col');el('col',null,cols,'name-col');
   for(const p of pool.matrix)el('col',null,cols,'result-col');for(let i=0;i<3;i++)el('col',null,cols,'total-col');
   const head=el('tr',null,el('thead',null,table));
   for(const title of ['#','Spelare',...pool.matrix.map(p=>p.position),'V–F','Legs','Rank'])el('th',title,head).setAttribute('scope','col');
   const body=el('tbody',null,table);
   for(const p of pool.matrix){
    const row=el('tr',null,body);el('td',p.position,row,'position number');const player=el('td',null,row,'pool-player'),identity=el('div',null,player,'pool-player-line');el('span',p.name,identity,'player-name');el('small',average(p.overallAverage),identity,'overall-average').setAttribute('aria-label','Gruppspelssnitt '+average(p.overallAverage));
    for(const c of p.cells){
     const td=el('td',null,row,c.state==='self'?'self-cell':'number'+(c.live?' live-cell':''));
     if(['result','live'].includes(c.state)){
      el('span',value(c.score)+'–'+value(c.opponentScore),td,'match-cell-score');el('small','('+average(c.average)+')',td,'muted match-cell-average');
      if(c.live)td.setAttribute('aria-label','Pågående match · '+value(c.score)+'–'+value(c.opponentScore));
     }else el('span',c.state==='self'?'':c.state==='multiple'?'—':'—',td);
    }
    const standing=pool.players.find(q=>q.id===p.id),total=legs(p),rank=standing?.rank;
    el('td',value(standing?.wins)+'–'+value(standing?.losses),row,'number');
    el('td',total?total.join('–'):'—',row,'number legs-total');
    el('td',value(rank),row,'number pool-rank'+([1,2].includes(rank)?' qualifying-rank':''));
   }
   for(let i=pool.matrix.length;i<count;i++){
    const row=el('tr',null,body,'empty-player-row');row.setAttribute('aria-hidden','true');
    for(let c=0;c<pool.matrix.length+5;c++)el('td','',row);
   }
  }applyLayout(grid,options.width,options.height);fitAverageWidths(host);return state;
 }
 const api=Object.freeze({render,legs,geometry,fit});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyVenuePools=api;
})(typeof globalThis==='object'?globalThis:this);
