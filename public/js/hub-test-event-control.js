/* English Hub Event Control. Offline remains read-only; dedicated TEST may prepare and save. */
(() => {
  let active = null;
  document.addEventListener('beauty-hub-locked',()=>{if(active){active.remove();active=null;}});
  function openPanel(kind) {
    if (active) return;
    const previous = document.activeElement;
    globalThis.BeautyHubNavigation?.activate(document.getElementById('eventControlNavButton'));
    const make = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; };
    const overlay = make('div', undefined, 'message-popup-overlay');
    const panel = make('section', undefined, 'message-popup event-inspection');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', kind === 'details' ? 'Event Control Details' : 'Event Control');
    const close = make('button', '×', 'message-popup-close'); close.type = 'button'; close.setAttribute('aria-label', 'Close');
    const title = make('h2', kind === 'details' ? 'EVENT CONTROL DETAILS — TEST' : 'EVENT CONTROL — TEST');
    const content = make('div', 'Loading event…'); content.setAttribute('role', 'status');
    const nakkaStep=make('section',undefined,'event-nakka-step');
    const nakkaTitle=make('h3','Nakka event');
    const nakkaResult=make('div');nakkaResult.setAttribute('role','status');nakkaResult.setAttribute('aria-live','polite');
    const check=make('button','FIND OR CREATE NAKKA EVENT');check.type='button';check.disabled=true;
    const findNakka=()=>{if(saving||check.disabled)return;globalThis.window?.BeautyNakkaEventCheck?.(nakkaResult);};
    check.addEventListener('click',findNakka);nakkaStep.appendChild(nakkaTitle);nakkaStep.appendChild(check);nakkaStep.appendChild(nakkaResult);
    const edit = make('div');
    const label = make('label', 'New event date');
    const date = make('input'); date.type = 'date'; date.lang = 'en'; date.disabled = true; date.setAttribute('aria-label', 'New event date'); label.appendChild(date);
    const ackLabel = make('label', undefined, 'event-acknowledgement');
    const ack = make('input'); ack.type = 'checkbox'; ack.disabled = true; ack.setAttribute('aria-label', 'I understand that changing the date resets event data');
    ackLabel.appendChild(ack); ackLabel.appendChild(make('span', 'I understand that changing the date resets event data.'));
    const review = make('button', 'REVIEW CHANGE'); review.type = 'button'; review.disabled = true;
    const reviewArea = make('div'); reviewArea.hidden = true;
    const reviewText = make('p');
    const unavailable = make('button', 'CONFIRM DATE CHANGE — NOT ENABLED'); unavailable.type = 'button'; unavailable.disabled = true;
    const back = make('button', 'BACK TO DATE'); back.type = 'button';
    reviewArea.appendChild(reviewText); reviewArea.appendChild(unavailable); reviewArea.appendChild(back);
    const note = make('p', 'Inspection only. Saving is not enabled. Reset details are available from Event Control Details in the sidebar.');
    const reload = make('button', 'RELOAD EVENT'); reload.type = 'button'; reload.disabled = true;
    const cancel = make('button', 'CLOSE'); cancel.type = 'button';
    const switchPanel=make('button',kind==='control'?'EVENT DETAILS':'BACK TO EVENT CONTROL');switchPanel.type='button';
    switchPanel.addEventListener('click',()=>{if(saving)return;dismiss();openPanel(kind==='control'?'details':'control');});
    const state = { loaded: false, blocked: true, currentDate: '', newDate: '', acknowledged: false };
    let generation = 0, saving = false, saveEnabled = false, prepared = null;
    function controls() { review.disabled = !BeautyEventDateGuard.canReview(state); }
    function resetReview() { prepared=null; unavailable.disabled=true; state.acknowledged = false; ack.checked = false; reviewArea.hidden = true; edit.hidden = false; title.textContent = kind === 'details' ? 'EVENT CONTROL DETAILS — TEST' : 'EVENT CONTROL — TEST'; controls(); }
    function dismiss() { if (saving) return; if (active !== overlay) return; generation++; globalThis.window?.BeautyNakkaEventCancel?.(); active = null; overlay.remove(); globalThis.BeautyHubNavigation?.dashboard(); document.removeEventListener('keydown', keys); previous?.focus(); }
    function keys(e) {
      if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
      if (e.key === 'Tab') {
        const list = [close, ...(kind === 'control' ? (reviewArea.hidden ? [date, ack, review] : [unavailable, back]) : []), switchPanel, reload, check, ...(nakkaResult.querySelectorAll?.('button,input,select')||[]), cancel].filter(el => !el.disabled&&!el.hidden);
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function line(label, value) { content.appendChild(make('p', label + ': ' + String(value ?? '—'))); }
    async function load() {
      const token = ++generation; state.loaded = false; state.blocked = true; resetReview(); reload.disabled = true;
      check.disabled=true;globalThis.window?.BeautyNakkaEventCancel?.();nakkaResult.textContent='';
      date.disabled = ack.disabled = true; content.textContent = 'Loading event…';
      try {
        const url = new URL(BeautyHubServices.endpoint); url.searchParams.set('page', 'eventcontrol');
        const result = await (await BeautyHubServices.request(url.toString())).json();
        if (active !== overlay || token !== generation) return;
        if (!result.success || result.inspectionOnly !== true || result.writesEnabled !== false) throw new Error(result.error || 'Unexpected Event Control response.');
        content.textContent = '';
        saveEnabled = result.eventSavingEnabled === true;
        note.textContent = saveEnabled ? 'Close other TEST registration pages before changing dates. A backup is saved first; registration history and name corrections are kept.' : 'Inspection only. Saving is not enabled. Reset details are available from Event Control Details in the sidebar.';
        state.loaded = true; state.currentDate = result.eventDate || ''; state.newDate = state.currentDate;
        state.blocked = Boolean(result.blockers?.length); date.value = state.newDate;
        line('Current event', state.currentDate || 'Unavailable');
        if (kind === 'details') {
          line('Test spreadsheet', result.spreadsheet?.title); line('Time zone', result.spreadsheet?.timeZone); line('Locale', result.spreadsheet?.locale);
          line('Last reset', result.lastResetDisplay);
          if (result.resetPlan) {
            const p = result.resetPlan;
            line('Current players', p.visiblePlayers); line('Last response row', p.responseRows);
            line('Event-status rows deleted by the legacy reset', p.deleteStatusRows);
            line('Name-correction rows retained', p.retainNameCorrectionRows);
            line('Retained event cells cleared (C:E)', p.clearRetainedEventCells);
            if(saveEnabled)line('Hub date save','Backs up sheets, clears old event metadata including source, and restores registrations for the selected calendar date. Legacy counts below are inspection history, not the new save plan.');
            line('Other reset targets', 'Control A2/B2 and Tonight\'s Players C2:C100');
            line('Preserved', 'Permanent master list and registration responses');
          }
          for (const message of result.blockers || []) line('Review required', message);
          for (const message of result.warnings || []) line('Notice', message);
          line('Scope', 'Read-only inspection. A reset plan applies only to a changed event date. Future membership is not predicted.');
        } else {
          if (state.blocked) line('Date change unavailable', 'Review the issues in Event Control Details.');
          date.disabled = ack.disabled = state.blocked;
        }
        controls();if(kind==='control'&&!state.blocked){check.disabled=false;findNakka();}
      } catch (error) { if (active === overlay && token === generation) content.textContent = error.message; }
      finally { if (active === overlay && token === generation) reload.disabled = false; }
    }
    date.addEventListener('input', () => { state.newDate = date.value; globalThis.window?.BeautyNakkaEventCancel?.();nakkaResult.textContent='Save the new date before checking Nakka.';check.disabled=state.newDate!==state.currentDate;resetReview(); });
    ack.addEventListener('change', () => { state.acknowledged = ack.checked; controls(); });
    async function eventRequest(page,input) {
      const url=new URL(BeautyHubServices.endpoint);url.searchParams.set('page',page);
      for(const [k,v] of Object.entries(input))url.searchParams.set(k,v);
      return (await BeautyHubServices.request(url.toString())).json();
    }
    review.addEventListener('click', async () => {
      if (!BeautyEventDateGuard.canReview(state)) return;
      edit.hidden = true; reviewArea.hidden = false; title.textContent = 'CONFIRM DATE CHANGE — TEST';
      unavailable.disabled=true;
      reviewText.textContent = 'Change the event date from ' + state.currentDate + ' to ' + state.newDate + '? This will reset event data. ' + (saveEnabled ? 'Checking selected-date registrations and reset plan…' : 'Confirmation is unavailable until event saving is enabled. Nothing has been saved.');
      back.focus();
      if(!saveEnabled)return;
      const token=++generation;
      try {
        const result=await eventRequest('eventprepare',{date:state.newDate,expectedDate:state.currentDate});
        if(active!==overlay||token!==generation||reviewArea.hidden)return;
        if(!result.success||typeof result.version!=='string')throw Error(result.error||'Event review failed.');
        prepared=result;unavailable.textContent='CONFIRM DATE CHANGE';unavailable.disabled=false;
        reviewText.textContent='Change the event date from '+state.currentDate+' to '+state.newDate+'? '+result.targetPlayers+' registered players belong to the selected date. A backup will be saved first; previous event statuses will reset, name corrections and registration history will be preserved. Close other TEST registration pages before confirming.';
      }catch(error){if(active===overlay&&token===generation){reviewText.textContent=error.message;unavailable.disabled=true;}}
    });
    unavailable.addEventListener('click',async()=>{
      if(!saveEnabled||!prepared||unavailable.disabled||saving)return;
      saving=true;
      globalThis.window?.BeautyNakkaEventCancel?.();nakkaResult.textContent='';
      for(const el of [close,cancel,switchPanel,reload,back,unavailable,date,ack,review,check])el.disabled=true;
      unavailable.textContent='SAVING…';
      try{
        const result=await eventRequest('eventsave',{date:state.newDate,expectedDate:state.currentDate,version:prepared.version,confirmed:'true'});
        if(!result.success||result.readbackVerified!==true||!result.data){
          const backup=result.backup?.prefix;
          throw Error((result.error||'The event change could not be verified. Do not retry; inspect TEST data.')+(backup?' Backup: '+backup:''));
        }
        if(typeof updateHub==='function')updateHub(result.data);
        title.textContent='DATE SAVED';state.currentDate=result.eventDate;state.newDate=result.eventDate;
        content.textContent='Event date: '+result.eventDate+' · Players verified.';
        const backup=make('details');backup.appendChild(make('summary','Backup receipt'));backup.appendChild(make('p',result.backup.prefix));content.appendChild(backup);
        edit.hidden=true;reviewArea.hidden=true;note.textContent='Find or create the Nakka TEST event below.';
        check.disabled=false;saving=false;findNakka();
      }catch(error){
        content.textContent=error.message+' No automatic retry. Reload and inspect the TEST sheets before another save.';
        edit.hidden=true;reviewArea.hidden=true;
        if(typeof loadBeautyHubData==='function')await loadBeautyHubData();
      }finally{saving=false;close.disabled=cancel.disabled=switchPanel.disabled=reload.disabled=false;prepared=null;}
    });
    back.addEventListener('click', () => { generation++; resetReview(); date.focus(); });
    close.addEventListener('click', dismiss); cancel.addEventListener('click', dismiss); reload.addEventListener('click', load);
    overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
    for (const element of [label, ackLabel, review]) edit.appendChild(element);
    for (const element of [close, title, content, ...(kind === 'control' ? [edit, reviewArea, note, nakkaStep] : []), switchPanel, reload, cancel]) panel.appendChild(element);
    overlay.appendChild(panel); document.body.appendChild(overlay); active = overlay; document.addEventListener('keydown', keys); close.focus(); load();
  }
  if(globalThis.window)window.BeautyEventControlDate=()=>openPanel('control');
  for (const button of document.querySelectorAll('.event-button, .sidebar button')) {
    const text = button.textContent.trim().toLocaleLowerCase();
    if (button.classList.contains('event-button') || text === 'event control' || button.id==='eventControlNavButton') button.addEventListener('click', () => button.id==='eventControlNavButton'&&globalThis.window?.BeautyEveningSetup?globalThis.window.BeautyEveningSetup.open():openPanel('control'));
    else if (text === 'event control details') button.addEventListener('click', () => openPanel('details'));
  }
})();

