/* Navigation only. Detail panels keep their existing read-only health checks. */
(() => {
  for(const [buttonId,panelId] of [['nakkaNavButton','nakkaStatusPanel'],['systemStatusNavButton','systemStatusPanel']]) {
    const button=document.getElementById(buttonId),panel=document.getElementById(panelId);
    if(!button||!panel)continue;
    button.addEventListener('click',()=>{if(!panel.open)panel.showModal();globalThis.BeautyHubNavigation?.activate(button);});
    const close=panel.querySelector('[data-close]');
    if(close)close.addEventListener('click',()=>panel.close());
    panel.addEventListener('close',()=>{globalThis.BeautyHubNavigation?.dashboard();button.focus();});
  }
})();
