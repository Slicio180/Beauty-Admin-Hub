/* Read-only bracket geometry. Positions and results always come from Nakka. */
(function(root){
 'use strict';
 const title=n=>n===2?'Final':n===4?'Semifinal':n===8?'Kvartsfinal':n===16?'Åttondelsfinal':n===32?'Sextondelsfinal':'Sista '+n;
 const playable=stage=>stage.rounds.filter(r=>r.slotCount>1);
 function windowFor(stage,start=0,width=1600){
  const rounds=playable(stage),columns=width>=1300?3:width>=760?2:1;
  start=Math.min(Math.max(0,rounds.length-1),Math.max(0,Number.isInteger(start)?start:0));
  return {start,total:rounds.length,rounds:rounds.slice(start,start+columns)};
 }
 function geometry(counts,heights,width){
  if(!counts.length)return {height:0,cards:[],paths:[]};
  const gap=56,columnWidth=Math.max(260,(width-gap*(counts.length-1))/counts.length),pitch=Math.max(120,...heights.flat().map(h=>h+20));
  const cards=counts.map((count,r)=>Array.from({length:count},(_,i)=>({x:r*(columnWidth+gap),y:((i+.5)*2**r)*pitch,height:heights[r]?.[i]||100,width:columnWidth})));
  const paths=[];
  for(let r=1;r<cards.length;r++)for(let i=0;i<cards[r].length;i++){
   const a=cards[r-1][i*2],b=cards[r-1][i*2+1],c=cards[r][i];if(!a||!b)continue;
   const x=a.x+a.width,middle=x+gap/2;
   paths.push({from:[a,b],to:c,d:'M '+x+' '+a.y+' H '+middle+' V '+b.y+' H '+x+' M '+middle+' '+c.y+' H '+c.x});
  }
  return {cards,paths,height:Math.max(...cards.flat().map(c=>c.y+c.height/2))+20,width:counts.length*columnWidth+(counts.length-1)*gap};
 }
 function render(doc,host,stage,options={},onAction=()=>{}){
  const state=windowFor(stage,options.start,options.width),formatText=options.formatText||root.BeautyCompetitionView?.formatText||(typeof module==='object'?require('./competition-view.js').formatText:s=>s);host.replaceChildren();
  function el(tag,text,parent,css){const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(css)n.className=css;parent.appendChild(n);return n;}
  const nav=el('nav',null,host,'bracket-heading');nav.setAttribute('aria-label','Slutspelsomgångar');
  const previous=el('button','◀',nav,'bracket-arrow');previous.type='button';previous.disabled=state.start===0;previous.setAttribute('aria-label','Visa tidigare omgångar');previous.addEventListener('click',()=>onAction({type:'round',direction:-1}));
  const headings=el('div',null,nav,'bracket-titles');headings.style.setProperty('--round-count',state.rounds.length||1);
  for(const r of state.rounds){const heading=el('div',null,headings,'bracket-title'),h=el('h3',null,heading);el('span',title(r.slotCount),h);if(r.format)el('p',formatText(r.format),heading);}
  const next=el('button','▶',nav,'bracket-arrow');next.type='button';next.disabled=state.start+state.rounds.length>=state.total;next.setAttribute('aria-label','Visa senare omgångar');next.addEventListener('click',()=>onAction({type:'round',direction:1}));
  const viewport=el('div',null,host,'bracket-viewport');viewport.tabIndex=0;viewport.setAttribute('aria-label','Slutspelsträd. Rulla för att se fler matcher.');
  const canvas=el('div',null,viewport,'bracket-canvas'),boxes=[];
  function match(m,parent,opening=false){
   const box=el('article',null,parent,'knockout-match'+(m.live?' live-cell':''));
   if(m.board?.text)el('small','Bana '+m.board.text,box,'knockout-board');
   if(m.live)el('small','LIVE',box,'live-tag');
   for(const [side,p,score,avg]of [['left',m.left,m.leftScore,m.leftAverage],['right',m.right,m.rightScore,m.rightAverage]]){
    const row=el('div',null,box,'knockout-player');
    if(opening&&Number.isInteger(m[side+'DrawNumber']))el('span',m[side+'DrawNumber'],row,'draw-number');
    const identity=el('div',null,row,'knockout-identity');
    el('span',p.state==='bye'?'Frirond':p.state==='pending'?'Väntar på spelare':p.name,identity,'player-name');
    if(p.state==='player')el('small',avg==null?'—':Number(avg).toFixed(2),identity,'match-average');
    el('strong',score==null?'—':score,row,'score');
   }return box;
  }
  for(const r of state.rounds)boxes.push(r.matches.map(m=>match(m,canvas,state.start===0&&r===state.rounds[0])));
  let svg;
  if(doc.createElementNS){svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','bracket-connectors');svg.setAttribute('aria-hidden','true');canvas.appendChild(svg);}
  function layout(){
   const width=viewport.clientWidth||options.width||1400;headings.style.width=width+'px';const columnWidth=Math.max(260,(width-56*(boxes.length-1))/Math.max(1,boxes.length));for(const row of boxes)for(const n of row)n.style.width=columnWidth+'px';const heights=boxes.map(row=>row.map(n=>Math.max(100,n.offsetHeight||100))),g=geometry(boxes.map(r=>r.length),heights,width);
   canvas.style.height=g.height+'px';canvas.style.width=(g.width||width)+'px';
   boxes.forEach((row,r)=>row.forEach((n,i)=>{const c=g.cards[r][i];n.style.left=c.x+'px';n.style.top=(c.y-c.height/2)+'px';n.style.width=c.width+'px';}));
   if(svg){svg.replaceChildren();svg.setAttribute('width',g.width||width);svg.setAttribute('height',g.height);for(const p of g.paths){const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',p.d);svg.appendChild(path);}}
   return g;
  }
  if(!state.rounds.length)el('p','Inget slutspelsträd har hämtats ännu.',viewport,'empty-state');
  if(stage.thirdPlace&&state.start+state.rounds.length>=state.total){const third=el('section',null,viewport,'knockout-third');el('h3','Match om tredje pris',third);if(stage.thirdPlace.format)el('p',formatText(stage.thirdPlace.format),third);match(stage.thirdPlace,third);}
  layout();return {...state,viewport,layout};
 }
 const api=Object.freeze({title,playable,windowFor,geometry,render});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyKnockoutBracket=api;
})(typeof globalThis==='object'?globalThis:this);
