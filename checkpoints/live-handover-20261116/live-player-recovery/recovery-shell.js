/* One LIVE recovery entry point; existing saved-operation tools remain under Advanced. */
(()=>{'use strict';
 const old=window.BeautyRecovery;
 const add=(tag,text,parent)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const panel=add('dialog',undefined,document.body);panel.id='beautyRecoveryLivePanel';panel.setAttribute('aria-labelledby','beautyLiveRecoveryTitle');
 const x=add('button','×',panel);x.type='button';x.className='health-panel-close';x.setAttribute('aria-label','Close Recovery');x.addEventListener('click',()=>panel.close());
 add('h2','RECOVERY',panel).id='beautyLiveRecoveryTitle';add('p','See what needs attention and what to do next',panel).className='beauty-menu-subtitle';
 const context=add('p','Waiting for the selected event',panel);context.className='beauty-menu-context';
 const host=add('section',undefined,panel);host.id='beautyLiveRecoveryEventControls';add('section',undefined,host).id='beautyLiveRecoverySavedArea';
 const advanced=add('details',undefined,panel);advanced.id='beautyLiveRecoveryAdvanced';add('summary','Advanced',advanced);
 const tools=add('div',undefined,advanced);
 for(const [label,mode] of [['Saved operations and registration queue','recovery'],['Transfer players','transfer'],['Import from Nakka','import']]){const b=add('button',label,tools);b.type='button';b.addEventListener('click',()=>old.open(mode));}
 const refresh=add('button','Refresh',advanced);refresh.type='button';refresh.addEventListener('click',()=>window.BeautyPlayerRecovery?.refresh());
 const close=add('button','Close',panel);close.type='button';close.addEventListener('click',()=>panel.close());
 const sync=()=>{const data=window.beautyHubData;context.textContent=data?.eventDate?(document.getElementById('nakkaTournamentTitle')?.textContent||data.activeEvent?.title||'Selected event')+' · '+data.eventDate:'Sign in to view Recovery';};
 document.addEventListener('beauty-menu-data',sync);document.addEventListener('beauty-hub-locked',()=>{panel.close();sync();});
 window.BeautyRecovery=Object.freeze({...old,open(mode='recovery'){
  if(mode!=='recovery')return old.open(mode);try{window.BeautyHubAuth.token();}catch(e){return;}
  sync();advanced.open=false;if(!panel.open)panel.showModal();window.BeautyHubNavigation?.activate(document.getElementById('beautyRecoveryNavButton'));window.BeautyPlayerRecovery?.refresh();
 }});
})();
