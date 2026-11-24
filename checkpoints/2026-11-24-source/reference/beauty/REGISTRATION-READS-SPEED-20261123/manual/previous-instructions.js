  // Existing Instructions entry now has an actual matching submenu.
  const instructions=[...document.querySelectorAll('.sidebar > button')].find(b=>b.textContent.trim()==='Instructions');
  let help=null;
  instructions?.addEventListener('click',()=>{
    if(help){help.showModal();window.BeautyHubNavigation?.activate(instructions);return;}
    help=document.createElement('dialog');help.className='pool-planner';help.setAttribute('aria-label','Instructions');
    const close=document.createElement('button');close.type='button';close.className='pool-close';close.textContent='×';close.setAttribute('aria-label','Close instructions');close.addEventListener('click',()=>help.close());
    const title=document.createElement('h2');title.textContent='Instructions';help.append(close,title);
    for(const text of ['Check the selected event date before registration. IN is the registration status, not an arrival scan.',
      'Register each player once. SOURCE shows the original Hub, kiosk or mobile route.',
      'Nakka is checked automatically every 30 seconds while the Hub is visible. A red Needs Attention tile means an issue needs review. Click it and choose the named player.',
      'Use Nakka to inspect comparisons and review a single transfer. Close any Nakka editing page before confirming a transfer.',
      'System Status shows the Sheets connection. Nakka health is separate from player attention.',
      'Pool Planner supports 3–101 players, including one pool for 3 or 4 players; arrangements for 5–101 players are unchanged. In TEST, load league statistics, review identities, generate a seeded preview and adjust pools before explicitly approving the Nakka handoff. Missing averages stay Unseeded. OUT and STANDBY are excluded.']){
      const p=document.createElement('p');p.textContent=text;help.append(p);
    }
    help.addEventListener('close',()=>{window.BeautyHubNavigation?.dashboard();instructions.focus();});document.body.append(help);help.showModal();window.BeautyHubNavigation?.activate(instructions);
  });
  document.addEventListener('beauty-hub-locked',()=>{help?.remove();help=null;});
