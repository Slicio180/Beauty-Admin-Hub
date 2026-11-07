/* Fixed Identity TEST staff controls. Every write follows a separate server review. */
(() => {
 'use strict';
 let active=null,uncertain=false;
 const make=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;if(parent)parent.appendChild(e);return e;};
 function open(){
  if(active)return;
  const previous=document.activeElement,overlay=make('div',undefined,document.body,'message-popup-overlay'),panel=make('section',undefined,overlay,'message-popup tournament-control');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Tournament Control — TEST');
  const close=make('button','×',panel,'message-popup-close');close.type='button';close.setAttribute('aria-label','Close tournament control');
  make('h2','TOURNAMENT CONTROL — TEST',panel);
  const status=make('p','Loading completed groups…',panel,'tournament-control-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const content=make('div',undefined,panel),actions=make('div',undefined,panel,'tournament-control-actions');
  const reload=make('button','REFRESH',actions),review=make('button','REVIEW QUALIFIERS',actions),cancel=make('button','CLOSE',actions);
  for(const e of [reload,review,cancel])e.type='button';
  let busy=false,saving=false,generation=0,prepared=null,view=null;
  active=overlay;
  function dismiss(force=false){if(saving&&!force)return;generation++;overlay.remove();active=null;document.removeEventListener('keydown',keys);previous?.focus();}
  function keys(e){if(e.key==='Escape'){e.preventDefault();dismiss();}if(e.key==='Tab'){const items=[...panel.querySelectorAll('button,input')].filter(x=>!x.disabled&&!x.hidden),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  function controls(){reload.disabled=busy||uncertain;review.disabled=busy||uncertain||!view?.ready;review.hidden=!!prepared||view?.assigned===true;close.disabled=cancel.disabled=saving;}
  async function request(page,input={}){const url=new URL(BeautyHubServices.endpoint);url.searchParams.set('page',page);for(const [k,v]of Object.entries(input))url.searchParams.set(k,v);const r=await(await BeautyHubServices.request(url.toString())).json();if(!r.success)throw Error((r.error||'Tournament control is unavailable.')+(r.audit?' Audit: '+r.audit:''));return r;}
  function draw(){
   content.textContent='';
   if(!view)return;
   make('p',view.title,content,'tournament-control-event');
   const groups=make('div',undefined,content,'tournament-control-groups');
   for(const g of view.groups)make('span',(g.complete?'✓ ':'! ')+g.title+' · '+(g.complete?'Complete':'In progress'),groups,g.complete?'is-complete':'is-attention');
   const grid=make('div',undefined,content,'tournament-control-grid');
   for(const s of view.stages){
    const card=make('section',undefined,grid,'tournament-control-stage');make('h3',s.title,card);
    make('p',(s.key==='t'?'1st + 2nd from each pool':'Remaining players')+' · '+s.players.length+' players'+(s.byes?' · '+s.byes+' bye':''),card,'tournament-control-rule');
    const list=make('ol',undefined,card);for(const p of s.players)make('li',p.name,list);
    if(view.ready||view.assigned){
     make('h4',view.assigned?'Opening matches':'Proposed opening matches',card);
     const names=new Map(s.players.map(p=>[p.id,p.name])),row=s.table[0];
     for(let i=0;i<row.length;i+=2)make('p',(names.get(row[i])||(row[i]?'Unresolved player':'Bye'))+' — '+(names.get(row[i+1])||(row[i+1]?'Unresolved player':'Bye')),card,'tournament-control-pair');
    }
   }
   if(prepared){
    const box=make('div',undefined,content,'tournament-control-confirm');
    make('p','Close other Nakka admin pages before confirming. Assign these players to both TEST knockout brackets?',box);
    const label=make('label',undefined,box),check=make('input',undefined,label);check.type='checkbox';check.setAttribute('aria-label','I approve these TEST knockout players and matches');make('span','Players and matches are correct.',label);
    const confirm=make('button','ASSIGN KNOCKOUTS — TEST',box);confirm.type='button';confirm.disabled=true;
    const back=make('button','CANCEL REVIEW',box);back.type='button';
    check.addEventListener('change',()=>confirm.disabled=!check.checked||busy||uncertain);
    back.addEventListener('click',()=>{if(busy)return;prepared=null;draw();controls();review.focus();});
    confirm.addEventListener('click',async()=>{
     if(busy||uncertain||!prepared||!check.checked)return;
     const ticket=prepared.ticket;prepared=null;busy=saving=true;check.disabled=confirm.disabled=back.disabled=true;controls();status.textContent='Assigning once. Waiting for Nakka readback…';const token=++generation;
     try{const r=await request('poolqualifysave',{ticket,confirmed:'true'});if(active!==overlay||generation!==token)return;if(r.readbackVerified!==true)throw Error('Assignment readback is missing.');view.ready=false;view.assigned=true;status.textContent=r.message+' Audit: '+r.audit;status.className='tournament-control-status is-complete';draw();}
     catch(e){if(active===overlay&&generation===token){uncertain=true;status.textContent=e.message+' Do not repeat assignment. Inspect the TEST event before another change.';status.className='tournament-control-status is-attention';draw();}}
     finally{if(active===overlay&&generation===token){busy=saving=false;controls();}}
    });check.focus();
   }
  }
  async function load(prepare=false){
   if(busy||uncertain)return;busy=true;prepared=null;controls();status.textContent=prepare?'Checking qualifiers and bracket…':'Loading completed groups…';status.className='tournament-control-status';const token=++generation;
   try{const r=await request(prepare?'poolqualifyprepare':'poolcontrol');if(active!==overlay||generation!==token)return;view=r.control;prepared=prepare?r:null;draw();status.textContent=prepare?'Review the players and matches below.':view.reason||(view.assigned?'✓ Knockout players are assigned. Open Live to follow play.':'✓ Groups complete · Qualifiers ready for review.');}
   catch(e){if(active===overlay&&generation===token){view=null;prepared=null;draw();status.textContent=e.message;status.className='tournament-control-status is-attention';}}
   finally{if(active===overlay&&generation===token){busy=false;controls();}}
  }
  close.addEventListener('click',()=>dismiss());cancel.addEventListener('click',()=>dismiss());reload.addEventListener('click',()=>load());review.addEventListener('click',()=>load(true));
  overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});document.addEventListener('keydown',keys);close.focus();
  overlay.beautyDismiss=()=>dismiss(true);
  if(uncertain){status.textContent='A previous assignment is unverified. Inspect the TEST event and audit before another change.';controls();}else load();
 }
 document.addEventListener('beauty-hub-locked',()=>{active?.beautyDismiss();});
 globalThis.BeautyTournamentControl=Object.freeze({open});
})();
