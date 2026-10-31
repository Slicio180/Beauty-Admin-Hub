/* Display-only name lines. The complete provider name is never rewritten in data. */
(function(root){
 'use strict';
 function split(value){const full=String(value??'').trim(),parts=full.split(/\s+/u);return {full,first:parts.shift()||'',surname:parts.join(' ')};}
 function shorten(value,fits){
  if(fits(value))return value;
  const letters=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('sv',{granularity:'grapheme'}).segment(value)].map(s=>s.segment):Array.from(value);
  let low=0,high=letters.length;
  while(low<high){const mid=Math.ceil((low+high)/2);if(fits(letters.slice(0,mid).join('')+'.'))low=mid;else high=mid-1;}
  return letters.slice(0,low).join('').trimEnd()+'.';
 }
 function apply(host){
  const doc=host.ownerDocument;
  for(const cell of host.querySelectorAll('.pool-player')){
   const name=cell.querySelector('.player-name');if(!name)continue;
   const parts=split(name.dataset.fullName??name.textContent);name.dataset.fullName=parts.full;
   name.replaceChildren();name.classList.add('fixed-name-lines');name.tabIndex=0;
   name.setAttribute('title',parts.full);name.setAttribute('aria-label',parts.full);name.setAttribute('role','button');name.setAttribute('aria-haspopup','dialog');
   for(const [css,original]of [['given-name-line',parts.first],['surname-line',parts.surname]]){
    const line=doc.createElement('span');line.className=css;line.textContent=original;name.appendChild(line);
    if(line.clientWidth>0)line.textContent=shorten(original,text=>{line.textContent=text;return line.scrollWidth<=line.clientWidth;});
   }
   if(!name.dataset.nameAction){
    name.dataset.nameAction='true';
    const show=()=>{
     doc.getElementById('castFullPlayerName')?.remove();const dialog=doc.createElement('dialog');dialog.id='castFullPlayerName';dialog.className='full-player-name';dialog.setAttribute('aria-label','Spelarens fullständiga namn');
     const text=doc.createElement('p');text.textContent=name.dataset.fullName;const close=doc.createElement('button');close.type='button';close.textContent='Stäng';close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();name.focus({preventScroll:true});});dialog.append(text,close);
     // Fullscreen dialogs must belong to the fullscreen subtree to remain visible.
     (doc.fullscreenElement||doc.body).appendChild(dialog);dialog.showModal();
    };
    name.addEventListener('click',show);name.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show();}});
   }
  }
 }
 const api=Object.freeze({split,shorten,apply});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyPoolNames=api;
})(typeof globalThis==='object'?globalThis:this);
