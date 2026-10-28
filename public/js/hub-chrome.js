/* Branding and current-section presentation. Nakka title is staff-only, GET-only. */
(() => {
  'use strict';
  const nav=[...document.querySelectorAll('.sidebar > button')],home=document.getElementById('dashboardNavButton');
  let selected=home,date='',version=0,busy=false,checkedDate='';
  const title=document.getElementById('nakkaTournamentTitle');
  function activate(button){
    if(!button||!nav.includes(button))return;
    selected=button;
    for(const node of nav){node.classList.toggle('active',node===button);if(node===button)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');}
  }
  function dashboard(){activate(home);}
  window.BeautyHubNavigation=Object.freeze({activate,dashboard});
  home?.addEventListener('click',dashboard);
  window.addEventListener('focus',()=>{if(selected?.textContent.trim()==='Beauty Live')dashboard();});
  function show(text,state){if(title){title.textContent=text;title.dataset.state=state;}}
  async function refresh(){
    if(!date||busy)return;
    const current=++version,startedDate=date;busy=true;
    show('Checking Nakka…','loading');
    try {
      const r=await(await BeautyHubServices.request('https://beauty.invalid/hub?page=nakkaevent')).json();
      if(current!==version||date!==startedDate)return;
      if(r.success!==true||r.status!=='MATCHED'||r.eventDate!==startedDate||r.event?.date!==startedDate||
        typeof r.event?.id!=='string'||!/^t_[A-Za-z0-9_]{1,80}$/.test(r.event.id)||
        typeof r.event?.title!=='string'||!r.event.title.trim()||r.event.title.length>300)throw Error('unavailable');
      show(r.event.title,'matched');checkedDate=startedDate;
    }catch(e){if(current===version){checkedDate='';show('Event unavailable — check Nakka','unavailable');}}
    finally{if(current===version)busy=false;}
  }
  function update(data){
    const next=typeof data?.eventDate==='string'?data.eventDate:'';
    if(next===date)return;
    version++;busy=false;date=next;checkedDate='';
    show(next?'Checking Nakka…':'No event selected',next?'loading':'unavailable');
    if(next)refresh();
  }
  document.addEventListener('beauty-hub-opened',()=>{if(checkedDate!==date)refresh();});
  document.addEventListener('beauty-hub-locked',()=>{version++;busy=false;date=checkedDate='';show('Sign in to view tournament','locked');dashboard();});
  setInterval(()=>{if(!document.hidden&&date)refresh();},300000);
  window.BeautyHubChrome=Object.freeze({update,refresh});
  if(window.beautyHubData)update(window.beautyHubData);
})();
