// Operator chapters derived from the original Beauty handbook. No service calls.
(() => {
  'use strict';
  const GUIDE = __BEAUTY_OPERATOR_GUIDE_DATA__;
  const instructions=[...document.querySelectorAll('.sidebar > button')].find(b=>b.textContent.trim()==='Instructions');
  if(!instructions)return;
  instructions.id='beautyInstructionsButton';
  const navLabel=instructions.querySelector('span');if(navLabel)navLabel.textContent='Instruktioner';
  const text={sv:{title:'Instruktioner',search:'Sök i instruktionerna',placeholder:'Till exempel anmälan, banor eller Nakka',clear:'Rensa sökning',language:'Språk',close:'Stäng instruktioner',chapters:'Kapitel',found:n=>n+' kapitel',empty:'Inga kapitel matchar. Prova ett annat ord eller rensa sökningen.',source:'Öppna hela handboken',scope:'TEST: kontrollera alltid tävlingens namn och datum. Funktioner i TEST är inte automatiskt släppta i LIVE.',flow:'Så fungerar återställningen i förgrunden',flowDescription:'Kontrollera tävling, spelare och sparad åtgärd. Utan problem är allt klart. Vid problem gör Beauty bara säkra reparationer och verifierar resultatet. Osäkra eller olösta problem behöver granskas via Resolve issue.',labels:['Kontrollera tävling, spelare och sparad åtgärd','Finns ett problem?','Allt klart','Kan det åtgärdas säkert?','Slutför säkra steg och verifiera','Behöver hjälp','Verifierat','Resolve issue och kontroll','Läs resultatet: löst eller behöver hjälp','Nej','Ja','Verifierat','Olöst']},
    en:{title:'Instructions',search:'Search instructions',placeholder:'For example registration, boards or Nakka',clear:'Clear search',language:'Language',close:'Close instructions',chapters:'Chapters',found:n=>n+' chapters',empty:'No chapters match. Try another word or clear the search.',source:'Open the complete handbook',scope:'TEST: always check the event title and date. TEST features are not automatically released in LIVE.',flow:'How foreground recovery works',flowDescription:'Check the event, player and saved operation. With no problem, all is clear. If there is a problem, Beauty completes only safe repairs and verifies the result. Unsafe or unresolved problems need review through Resolve issue.',labels:['Check event, player and saved operation','Issue found?','All clear','Safe automatic repair?','Complete safe steps and verify','Needs attention','Verified','Resolve issue and check','Read result: solved or needs help','No','Yes','Verified','Unresolved']}};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('sv-SE').replace(/\s+/g,' ').trim();
  const matches=(chapter,query,language)=>{
    const body=chapter[language],haystack=normalize([body.title,body.intro,...(body.steps||[]),...(body.notes||[]),...(body.table||[]).flat(),chapter.keywords].join(' '));
    return normalize(query).split(' ').filter(Boolean).every(word=>haystack.includes(word));
  };
  const create=(tag,value,parent)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;if(parent)parent.appendChild(node);return node;};
  let panel=null,language='sv',selected='start',query='';
  let search,list,article,status,heading,scope,clear,languageLabel,close,source;
  function flow(parent){
    const t=text[language],figure=create('figure',undefined,parent);figure.className='beauty-manual-flow';
    const caption=create('figcaption',t.flow,figure);caption.id='beautyManualFlowCaption';
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 720 640');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby','beautyManualFlowTitle beautyManualFlowDescription');
    const title=document.createElementNS(ns,'title');title.id='beautyManualFlowTitle';title.textContent=t.flow;svg.append(title);
    const desc=document.createElementNS(ns,'desc');desc.id='beautyManualFlowDescription';desc.textContent=t.flowDescription;svg.append(desc);
    const defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');marker.id='beautyManualArrow';marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','9');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','6');marker.setAttribute('markerHeight','6');marker.setAttribute('orient','auto-start-reverse');const arrow=document.createElementNS(ns,'path');arrow.setAttribute('d','M0 0 L10 5 L0 10 z');arrow.setAttribute('fill','#c7cbd1');marker.append(arrow);defs.append(marker);svg.append(defs);
    const edge=(d,label,x,y)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke','#c7cbd1');p.setAttribute('stroke-width','2');p.setAttribute('marker-end','url(#beautyManualArrow)');svg.append(p);if(label){const n=document.createElementNS(ns,'text');n.setAttribute('x',String(x));n.setAttribute('y',String(y));n.setAttribute('fill','#fff');n.setAttribute('font-size','17');n.textContent=label;svg.append(n);}};
    edge('M360 68 V100');edge('M240 136 H110 V200',t.labels[9],142,126);edge('M360 172 V202',t.labels[10],373,192);
    edge('M425 274 V320',t.labels[10],438,302);edge('M260 236 H115 V440',t.labels[9],130,226);
    edge('M590 352 H615 V440',t.labels[11],605,402);edge('M260 352 H225 V412 H115 V440',t.labels[12],142,402);edge('M115 506 V550');edge('M270 582 H350');
    const nodes=[[180,10,360,58,0,'#d8b400'],[240,100,240,72,1,'#d8b400'],[10,200,200,64,2,'#65d491'],[260,202,330,72,3,'#d8b400'],[260,320,330,64,4,'#e8a54e'],[10,440,210,66,5,'#ff8585'],[490,440,220,66,6,'#65d491'],[10,550,260,64,7,'#d8b400'],[350,550,360,64,8,'#d8b400']];
    for(const [x,y,w,h,label,color] of nodes){const rect=document.createElementNS(ns,'rect');for(const [k,v]of Object.entries({x,y,width:w,height:h,rx:8,fill:'#14171b',stroke:color,'stroke-width':2}))rect.setAttribute(k,String(v));svg.append(rect);const n=document.createElementNS(ns,'text');n.setAttribute('x',String(x+w/2));n.setAttribute('fill','#fff');n.setAttribute('font-size','18');n.setAttribute('text-anchor','middle');const words=t.labels[label].split(' '),lines=[''];for(const word of words){const last=lines.length-1;if((lines[last]+' '+word).trim().length>Math.floor(w/10)&&lines[last])lines.push(word);else lines[last]=(lines[last]+' '+word).trim();}lines.forEach((line,i)=>{const span=document.createElementNS(ns,'tspan');span.setAttribute('x',String(x+w/2));span.setAttribute('y',String(y+h/2-(lines.length-1)*11+i*22+6));span.textContent=line;n.append(span);});svg.append(n);}
    figure.append(svg);
  }
  function renderArticle(chapter){
    article.replaceChildren();
    if(!chapter){create('p',text[language].empty,article);return;}
    const body=chapter[language],title=create('h3',body.title,article);title.id='beautyManualChapterTitle';title.tabIndex=-1;
    if(body.intro)create('p',body.intro,article);
    if(body.table){const wrap=create('div',undefined,article);wrap.className='beauty-manual-table';wrap.tabIndex=0;wrap.setAttribute('aria-label',body.title);const table=create('table',undefined,wrap),thead=create('thead',undefined,table),head=create('tr',undefined,thead);for(const cell of body.table[0]){const th=create('th',cell,head);th.scope='col';}const tbody=create('tbody',undefined,table);for(const row of body.table.slice(1)){const tr=create('tr',undefined,tbody);row.forEach(value=>create('td',value,tr));}}
    if(body.steps){const ol=create('ol',undefined,article);body.steps.forEach(value=>create('li',value,ol));}
    if(body.notes){const notes=create('div',undefined,article);notes.className='beauty-manual-notes';body.notes.forEach(value=>create('p',value,notes));}
    if(body.flow)flow(article);
    article.scrollTop=0;
  }
  function render(){
    const t=text[language],found=GUIDE.chapters.filter(chapter=>matches(chapter,query,language));
    if(!found.some(c=>c.id===selected))selected=found[0]?.id||'';
    panel.lang=language;heading.textContent=t.title;scope.textContent=t.scope;search.placeholder=t.placeholder;search.setAttribute('aria-label',t.search);clear.textContent=t.clear;clear.disabled=!query;close.setAttribute('aria-label',t.close);languageLabel.textContent=t.language;source.textContent=t.source;list.setAttribute('aria-label',t.chapters);
    status.textContent=t.found(found.length);list.replaceChildren();
    for(const chapter of found){const body=chapter[language],button=create('button',undefined,list);create('span',body.title,button);if(query){const excerpt=body.intro||body.steps?.[0]||body.table?.[1]?.join(' — ')||'';create('small',excerpt.length>135?excerpt.slice(0,132)+'…':excerpt,button);}button.type='button';button.dataset.chapter=chapter.id;button.setAttribute('aria-controls','beautyManualArticle');if(chapter.id===selected)button.setAttribute('aria-current','page');button.addEventListener('click',()=>{selected=chapter.id;render();article.querySelector('h3')?.focus();});}
    renderArticle(found.find(c=>c.id===selected));
  }
  function open(){
    if(panel){panel.showModal();window.BeautyHubNavigation?.activate(instructions);search.focus();return;}
    panel=create('dialog');panel.className='beauty-operator-manual';panel.setAttribute('aria-labelledby','beautyManualTitle');
    close=create('button','×',panel);close.type='button';close.className='beauty-manual-close';close.addEventListener('click',()=>panel.close());
    heading=create('h2','',panel);heading.id='beautyManualTitle';scope=create('p','',panel);scope.className='beauty-manual-scope';
    const controls=create('div',undefined,panel);controls.className='beauty-manual-controls';
    search=create('input',undefined,controls);search.type='search';search.id='beautyManualSearch';search.autocomplete='off';search.value=query;search.addEventListener('input',()=>{query=search.value;render();});
    clear=create('button','',controls);clear.type='button';clear.addEventListener('click',()=>{query='';search.value='';render();search.focus();});
    const langWrap=create('label',undefined,controls);languageLabel=create('span','',langWrap);const select=create('select',undefined,langWrap);select.id='beautyManualLanguage';for(const [value,label]of [['sv','Svenska'],['en','English']]){const option=create('option',label,select);option.value=value;}select.value=language;select.addEventListener('change',()=>{language=select.value;render();});
    status=create('p','',panel);status.className='beauty-manual-results';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const body=create('div',undefined,panel);body.className='beauty-manual-body';list=create('nav',undefined,body);article=create('article',undefined,body);article.id='beautyManualArticle';article.setAttribute('aria-labelledby','beautyManualChapterTitle');
    const footer=create('footer',undefined,panel);source=create('a','',footer);source.href=GUIDE.source.url;source.target='_blank';source.rel='noopener noreferrer';
    panel.addEventListener('close',()=>{window.BeautyHubNavigation?.dashboard();instructions.focus();});document.body.append(panel);render();panel.showModal();window.BeautyHubNavigation?.activate(instructions);search.focus();
  }
  const style=create('style');style.id='beauty-operator-manual-style';style.textContent=`
dialog.beauty-operator-manual{box-sizing:border-box;width:min(1140px,96vw);max-width:96vw;max-height:92vh;max-height:92dvh;padding:26px;background:#090a0c;color:#f3f4f6;border:2px solid #ffd700;border-radius:14px;font:inherit;overflow:auto;}
.beauty-operator-manual::backdrop{background:rgba(0,0,0,.78)}.beauty-operator-manual h2{margin:0 45px 8px 0;font-size:32px}.beauty-operator-manual h3{font-size:27px;margin:0 0 18px}.beauty-operator-manual p,.beauty-operator-manual li,.beauty-operator-manual td,.beauty-operator-manual th{font-size:20px;line-height:1.5}.beauty-operator-manual li{margin:0 0 13px}.beauty-operator-manual button,.beauty-operator-manual input,.beauty-operator-manual select{font:inherit;font-size:19px;min-height:44px;border:1px solid #5c6068;border-radius:7px;background:#181b20;color:#fff;padding:10px 12px;box-sizing:border-box}.beauty-operator-manual button{cursor:pointer}.beauty-operator-manual button:disabled{cursor:default;opacity:.55}.beauty-operator-manual :focus-visible{outline:3px solid #ffd700;outline-offset:3px}.beauty-manual-close{position:absolute;right:18px;top:14px;width:44px;font-size:30px!important}.beauty-manual-scope{color:#d4d7dc;margin:0 0 18px;font-size:17px!important}.beauty-manual-controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap}.beauty-manual-controls input{flex:1 1 300px;min-width:0}.beauty-manual-controls label{display:grid;gap:3px;font-size:15px}.beauty-manual-results{font-size:16px!important;color:#c5cad2;margin:12px 0}.beauty-manual-body{display:grid;grid-template-columns:260px minmax(0,1fr);gap:24px;align-items:start}.beauty-manual-body nav{display:flex;flex-direction:column;gap:7px;max-height:56vh;overflow:auto;padding:3px}.beauty-manual-body nav button{text-align:left;width:100%;line-height:1.3;white-space:normal}.beauty-manual-body nav button[aria-current=page]{border-color:#ffd700;color:#ffd700;background:#292510}.beauty-manual-body article{max-height:56vh;overflow:auto;padding:4px 10px 10px 4px;min-width:0}.beauty-manual-notes{border-left:3px solid #ffd700;padding-left:16px}.beauty-manual-table{overflow:auto;margin:16px 0}.beauty-manual-table table{width:100%;border-collapse:collapse}.beauty-manual-table th,.beauty-manual-table td{border-bottom:1px solid #41464f;text-align:left;padding:10px;vertical-align:top}.beauty-manual-table th{color:#ffd700}.beauty-manual-flow{margin:24px 0 8px;overflow:auto}.beauty-manual-flow figcaption{font-size:21px;color:#ffd700;margin-bottom:10px}.beauty-manual-flow svg{display:block;width:100%;min-width:640px;height:auto}.beauty-operator-manual footer{margin-top:18px;padding-top:12px;border-top:1px solid #353942}.beauty-operator-manual a{color:#ffd700;font-size:17px}
.beauty-manual-body nav button small{display:block;color:#d2d5db;font-size:15px;line-height:1.4;margin-top:6px}
@media(max-width:760px){dialog.beauty-operator-manual{padding:18px;width:97vw;max-width:97vw}.beauty-manual-body{grid-template-columns:minmax(0,1fr);gap:18px}.beauty-manual-body nav{max-height:180px}.beauty-manual-body article{max-height:none;overflow:visible}.beauty-manual-controls input{flex-basis:100%}.beauty-operator-manual h2{font-size:28px}.beauty-operator-manual h3{font-size:24px}.beauty-operator-manual p,.beauty-operator-manual li,.beauty-operator-manual td,.beauty-operator-manual th{font-size:19px}}
`;document.head.appendChild(style);
  instructions.addEventListener('click',open);
  document.addEventListener('beauty-hub-locked',()=>{panel?.remove();panel=null;query='';selected='start';language='sv';});
})();
