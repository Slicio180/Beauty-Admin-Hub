/* League / Tournament: authenticated event selection, no demo data. */
(()=>{
 'use strict';
 let dialog=null,busy=false,generation=0,connections=[],selected=null,date='',opener=null,requestSerial=0;
 const node=(tag,text,parent)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 function button(text,fn,parent=dialog){const b=node('button',text,parent);b.type='button';b.addEventListener('click',()=>{if(busy)return;b.classList.add('event-choice-selected');fn();});return b;}
 function close(){if(busy)return;generation++;dialog?.close();dialog?.remove();dialog=null;opener?.focus();}
 function header(title,sub){generation++;dialog.replaceChildren();const x=button('×',close);x.className='message-popup-close';x.setAttribute('aria-label','Close League / Tournament');node('h2',title,dialog);if(sub)node('p',sub,dialog);}
 function error(message){const p=node('p',message,dialog);p.setAttribute('role','alert');}
 async function run(work,next){if(busy)return;busy=true;const requestId=++requestSerial,turn=generation;dialog.querySelectorAll('button,input').forEach(n=>n.disabled=true);
  try{const r=await work();if(!dialog||generation!==turn)return;busy=false;await next(r);}catch(e){if(dialog&&generation===turn)error(e.message);}finally{if(dialog&&generation===turn)dialog.querySelectorAll('button,input').forEach(n=>n.disabled=false);if(requestId===requestSerial)busy=false;}
 }
 const api=(action,input)=>BeautyHubServices.context(action,input);
 function open(initial){if(dialog)return;opener=document.activeElement;dialog=node('dialog');dialog.className='message-popup event-inspection event-selector';dialog.setAttribute('aria-label','League / Tournament');dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dialog);dialog.showModal();header('LEAGUE / TOURNAMENT','Loading connected competitions…');run(()=>api('list'),r=>{connections=r.connections;date=r.active?.date||window.beautyHubData?.eventDate||new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Stockholm'});if(initial==='date'&&r.active?.mode==='league'){selected=connections.find(i=>i.id===r.active.leagueId);if(selected){checkDate();return;}}if(initial==='date'&&r.active?.mode==='tournament'){saved('tournament');return;}menu();});}
 function menu(){header('LEAGUE / TOURNAMENT','Select where you want to run the event.');const choices=node('div',undefined,dialog);choices.className='event-choice-list';button('LEAGUE',leagueMenu,choices);button('TOURNAMENT',tournamentMenu,choices);}
 function leagueMenu(){header('LEAGUE','Open a saved league or connect a league by URL.');const list=node('div',undefined,dialog);list.className='event-choice-list';button('EXISTING LEAGUE',()=>saved('league'),list);button('ADD NEW LEAGUE',()=>connect('league'),list);button('BACK',menu);}
 function tournamentMenu(){header('TOURNAMENT','Keep standalone tournaments separate from your leagues.');const list=node('div',undefined,dialog);list.className='event-choice-list';button('OPEN TOURNAMENT',()=>saved('tournament'),list);button('NEW TOURNAMENT',()=>connect('tournament'),list);button('BACK',menu);}
 function saved(kind){header(kind==='league'?'EXISTING LEAGUE':'OPEN TOURNAMENT','Choose the competition to open.');const list=node('div',undefined,dialog);list.className='event-choice-list';const rows=connections.filter(r=>r.mode===kind);
  for(const item of rows)button(item.title,()=>{selected=item;if(kind==='league')checkDate();else checkTournament(item);},list);
  if(!rows.length)node('p','No '+(kind==='league'?'leagues':'tournaments')+' connected yet.',list);
  button('BACK',kind==='league'?leagueMenu:tournamentMenu);
 }
 function input(label,type,value=''){const l=node('label',label,dialog),i=node('input',undefined,l);i.type=type;i.value=value;i.required=true;l.className='event-selector-field';return i;}
 function connect(kind){header(kind==='league'?'ADD NEW LEAGUE':'NEW TOURNAMENT',kind==='league'?'Paste the league URL. Its name will be read from Nakka.':'Create the tournament in Nakka first, then paste its URL here.');
  if(kind==='tournament'){const a=node('a','OPEN NAKKA TOURNAMENTS ↗',dialog);a.href='https://n01darts.com/n01/tournament/';a.target='_blank';a.rel='noopener noreferrer';}
  const url=input(kind==='league'?'League URL':'Tournament URL','url');url.placeholder=kind==='league'?'https://n01darts.com/n01/league/portal.php?lgid=…':'https://n01darts.com/n01/tournament/comp.php?id=…';
  button('BACK',kind==='league'?leagueMenu:tournamentMenu);
  button(kind==='league'?'CHECK LEAGUE':'CHECK TOURNAMENT',()=>{if(!url.reportValidity())return;run(()=>api('check',{kind,url:url.value.trim()}),r=>checked(r));});
 }
 function checked(r){selected=r.item;header(selected.mode==='league'?'LEAGUE FOUND':'TOURNAMENT FOUND',selected.title);if(selected.date)node('p',selected.date,dialog);node('p','Nakka account access verified.',dialog);
  button('BACK',()=>connect(selected.mode));button('ADD TO HUB',()=>run(()=>api('add',{ticket:r.ticket}),v=>{selected=v.item;connections=connections.filter(i=>i.id!==selected.id).concat(selected);selected.mode==='league'?checkDate():activateTournament();}));
 }
 function checkDate(){header(selected.title,'Check whether an event exists for the selected date.');const d=input('Event date','date',date);button('BACK',()=>saved('league'));button('CHECK FOR EVENT',()=>{if(!d.reportValidity())return;date=d.value;run(()=>api('find',{leagueId:selected.id,date}),r=>found(r.events));});}
 function found(events){header(events.length?'EVENT FOUND':'NO EVENT FOR THIS DATE',selected.title);node('p',date,dialog);
  if(events.length){for(const event of events){node('h3',event.title,dialog);const actions=node('div',undefined,dialog);actions.className='event-found-actions';button('BACK',checkDate,actions);button(events.length>1?'OPEN THIS EVENT':'START EVENT',()=>activate({mode:'league',leagueId:selected.id,eventId:event.id,date},false),actions);const change=button('CHANGE EVENT DATE',checkDate,actions);change.classList.add('event-date-action');}return;}
  else{node('p','No event exists for this date.',dialog);button('MAKE NEW EVENT FOR THIS LEAGUE',()=>run(()=>api('draft',{leagueId:selected.id,date}),()=>afterActivate(true)));}
  button('CHANGE EVENT DATE',checkDate);button('BACK',checkDate);
 }
 function checkTournament(item){header('CHECK TOURNAMENT',item.title);run(()=>api('check',{kind:'tournament',url:'https://n01darts.com/n01/tournament/comp.php?id='+encodeURIComponent(item.id)}),r=>{selected=r.item;header(selected.title,selected.date);button('BACK',()=>saved('tournament'));button('CONTINUE TO EVENT',activateTournament);});}
 function activateTournament(){activate({mode:'tournament',leagueId:'',eventId:selected.id,date:selected.date},true);}
 function activate(payload,setup){run(()=>api('activate',payload),()=>afterActivate(false,setup));}
 async function afterActivate(create,setup){
  header(create?'EVENT SETUP':'OPENING EVENT','Refreshing the selected event…');
  try{
   await loadBeautyHubData();if(!window.beautyHubData?.activeEvent)throw Error('Reload the Hub to verify the selected event.');window.BeautyHubChrome?.refresh();document.dispatchEvent(new Event('beauty-nakka-operation-complete'));
   if(create){header('EVENT SETUP',selected.title+' · '+date);const target=node('div',undefined,dialog);await window.BeautyNakkaEventCheck(target);button('CHANGE EVENT DATE',checkDate);button('CONTINUE TO EVENT',()=>{close();window.BeautyHubNavigation?.dashboard();});}
   else{close();window.BeautyHubNavigation?.dashboard();if(setup)window.BeautyEveningSetup?.open();}
  }catch(e){if(dialog){header('EVENT NEEDS REVIEW');error(e.message);button('CLOSE',close);}}
 }
 const legacyDate=window.BeautyEventControlDate;
 window.BeautyEventControlDate=()=>{
  if(!window.beautyHubData?.activeEvent){legacyDate?.();return;}
  open('date');
  // Select a league/date through the same chooser; never rewrite a tournament's Nakka date.
 };
 function mount(){
  const title=document.getElementById('nakkaTournamentTitle'),dateNode=document.getElementById('nakkaTournamentDate');if(!title||document.getElementById('hubCompetitionSelector'))return;
  const picker=document.createElement('button');picker.type='button';picker.id='hubCompetitionSelector';picker.setAttribute('aria-label','League / Tournament');
  const label=node('span','LEAGUE / TOURNAMENT',picker);label.className='event-selector-label';title.before(picker);picker.append(title);if(dateNode)picker.append(dateNode);picker.addEventListener('click',open);
  const nav=document.getElementById('eventControlNavButton')||[...document.querySelectorAll('.sidebar button')].find(b=>b.textContent.trim()==='Evening Setup');if(nav){const span=nav.querySelector('span');if(span)span.textContent='Event Setup';}
 }
 document.addEventListener('beauty-hub-locked',()=>{busy=false;close();connections=[];selected=null;});
 window.BeautyEventSelector=Object.freeze({open});mount();
})();
