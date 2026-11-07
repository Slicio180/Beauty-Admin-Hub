/* Shared TEST presentation only. The existing registration/identity RPCs own all writes. */
(() => {
  'use strict';
  const menu = document.getElementById('playerDropdownMenu');
  const trigger = document.getElementById('playerDropdownButton');
  const search = document.getElementById('playerSearch');
  const options = document.getElementById('playerOptions');
  if (!menu || !trigger || !search || !options) return;
  const helpText = 'FÖRSTA GÅNGEN HÄR, ELLER HITTAR DU INTE DITT NAMN? TRYCK PÅ DEN GULA KNAPPEN.';
  function instruction(node) {
    const first = document.createElement('span');
    first.className = 'beauty-instruction-first';
    first.textContent = 'FÖRSTA GÅNGEN HÄR, ELLER HITTAR DU INTE DITT NAMN?';
    const second = document.createElement('span');
    second.className = 'beauty-instruction-second';
    second.textContent = 'TRYCK PÅ DEN GULA KNAPPEN.';
    node.setAttribute('aria-label', helpText);
    node.replaceChildren(first, document.createTextNode(' '), second);
  }
  const overlay = document.createElement('div');
  overlay.className = 'beauty-picker-overlay';
  overlay.hidden = true;
  const header = document.createElement('div');
  header.className = 'beauty-picker-header';
  const title = document.createElement('h2');
  title.id = 'beautyPickerTitle';
  title.textContent = 'VÄLJ DITT NAMN';
  title.tabIndex = -1;
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'beauty-picker-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Stäng namnval');
  const help = document.createElement('p');
  help.className = 'beauty-picker-help';
  instruction(help);
  function newPlayerButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'beauty-new-player';
    button.textContent = 'MITT NAMN FINNS INTE I LISTAN';
    button.addEventListener('click', () => selectPlayer(button.textContent));
    return button;
  }
  search.setAttribute('aria-label', 'Sök ditt namn');
  search.setAttribute('enterkeyhint', 'done');
  search.setAttribute('autocapitalize', 'words');
  header.append(title, closeButton, search, help, newPlayerButton());
  menu.replaceChildren(header, options);
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-labelledby', title.id);
  overlay.append(menu);
  document.body.append(overlay);
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', menu.id);
  trigger.setAttribute('aria-expanded', 'false');
  // Also expose the new-player path without requiring the dropdown to be opened.
  const formHelp = document.querySelector('.new-player-help');
  if (formHelp) {
    instruction(formHelp);
    trigger.closest('.player-dropdown').after(formHelp);
    formHelp.after(newPlayerButton());
  }
  let locked = null;
  let saved = null;
  let inertNodes = [];
  function syncViewport() {
    const viewport = window.visualViewport;
    overlay.style.height = (viewport ? viewport.height : window.innerHeight) + 'px';
    overlay.style.top = (viewport ? viewport.offsetTop : 0) + 'px';
    overlay.style.left = (viewport ? viewport.offsetLeft : 0) + 'px';
    overlay.style.width = (viewport ? viewport.width : window.innerWidth) + 'px';
  }
  function lock(surface) {
    if (locked) return;
    document.activeElement?.blur();
    saved = {x: window.scrollX, y: window.scrollY, style: document.body.getAttribute('style')};
    locked = surface;
    for (const node of document.body.children) {
      if (node === surface || node.contains(surface) || ['SCRIPT', 'STYLE'].includes(node.tagName)) continue;
      inertNodes.push([node, node.inert]);
      node.inert = true;
    }
    Object.assign(document.body.style, {position:'fixed', top:-saved.y+'px', left:'0', width:'100%', overflow:'hidden'});
    syncViewport();
  }
  function unlock() {
    if (!locked) return;
    document.activeElement?.blur();
    for (const [node, previous] of inertNodes) node.inert = previous;
    inertNodes = [];
    if (saved.style === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', saved.style);
    window.scrollTo(saved.x, saved.y);
    locked = null;
    saved = null;
  }
  function open() {
    overlay.hidden = false;
    menu.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    lock(overlay);
    options.scrollTop = 0;
    // Focus a heading, never an editable field: opening does not summon a keyboard.
    title.focus({preventScroll:true});
  }
  function close() {
    if (overlay.hidden) return;
    search.blur();
    menu.classList.remove('open');
    overlay.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    search.value = '';
    renderPlayerList(allPlayers);
    unlock();
    trigger.focus({preventScroll:true});
  }
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); search.blur(); title.focus({preventScroll:true}); }
  });
  search.addEventListener('input', () => { options.scrollTop = 0; });
  document.addEventListener('keydown', event => {
    if (!locked) return;
    if (event.key === 'Escape' && !overlay.hidden) { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...locked.querySelectorAll('button:not(:disabled),input:not([type="hidden"]),textarea,[tabindex="0"]')].filter(n => n.getClientRects().length);
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('input[type="radio"]')) document.activeElement?.blur();
  });
  document.getElementById('submitButton')?.addEventListener('click', () => document.activeElement?.blur());
  window.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  window.BeautyPlayerPicker = Object.freeze({open, close, toggle: () => overlay.hidden ? open() : close(), lock, unlock});
})();
