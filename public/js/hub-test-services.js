/* Apps Script HTML-service transport, used only by the generated TEST Hub. */
const BeautyHubServices = (() => {
  const endpoint = 'https://beauty.invalid/hub?page=hubdata';
  const mode = 'test';
  const allowed = ['eventDate','selectedName', 'newName', 'consent', 'message', 'identityChoice',
    'identityBase', 'identityDetail', 'identityConfirmedName'];
  const errors = {"READ_FAILED_EVENT":"Event review could not be completed. No event change was requested.","NAME_CONFLICT": "This name is already on the list.", "ALREADY_REGISTERED": "You are already registered for this event.", "INVALID_NAME": "Enter a valid full name.", "AMBIGUOUS_NAME": "Several player records have this name. Please ask the organiser for help.", "UNKNOWN_PLAYER": "Select your name or add a new player.", "INVALID_CHOICE": "Choose who you are.", "STALE_IDENTITY": "The selected name has changed. Start again.", "INVALID_DETAIL": "Enter a valid middle name, nickname or identifying detail.", "DETAIL_IN_USE": "This identifying detail is already in use. Select the existing player or use a different detail.", "CONFIRM_NAME": "Confirm how your name will be displayed.", "BLOCKED": "This TEST operation is not enabled.", "INVALID": "Invalid request. Check the fields and try again.", "BUSY": "Another operation is running. Reload before trying again.", "STALE_EVENT": "The event date has changed. Reload the Hub.", "STALE_STATUS": "The status has changed since the list loaded. Reload before another change.", "PLAYER_AMBIGUOUS_OR_MISSING": "The player is missing or appears more than once. Reload and check the list.", "FORMULA": "The status cell contains a formula. No change was saved.", "LAYOUT": "The TEST spreadsheet layout needs review.", "READ_FAILED": "The TEST data could not be checked. Reload and inspect the result.", "SAVE_UNCERTAIN": "The save could not be verified. Reload and inspect the result before another change."};
  const response = data => ({ ok: true, json: async () => data?.success === false && data.error ? { ...data, error: errors[data.code] || 'The TEST operation could not be completed. Reload and check the result.' } : data });
  let queue = Promise.resolve(),epoch=0;
  const reads=new Set(),inflight=new Map();
  function registrationSaved(result,generation) {
    if(!BeautyHubAuth.isCurrent(generation))return;
    const header=document.getElementById('registerPlayerButton')?.parentElement;
    if(!header)return;
    document.getElementById('hubRegistrationResult')?.remove();
    const notice=document.createElement('p');notice.id='hubRegistrationResult';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    notice.style.cssText='margin:8px 16px;font-size:17px;line-height:1.35';
    notice.dataset.state=result.nakka?.entryConfirmed===true?'confirmed':'attention';
    notice.textContent=result.player+' registered for '+result.registrationEventDate+'. '+(result.nakka?.message||'Check Nakka before registering this player again.');
    header.after(notice);
  }
  function rpcNow(action, input, authorization) {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script?.run) {
        reject(new Error('Open Hub TEST through Google Apps Script.')); return;
      }
      const { token, generation } = authorization;
      if (!BeautyHubAuth.isCurrent(generation)) { reject(new Error('Sign in to continue.')); return; }
      google.script.run.withSuccessHandler(data => {
        if (!BeautyHubAuth.isCurrent(generation)) { reject(new Error('Sign in to continue.')); return; }
        if (data?.code === 'AUTH_REQUIRED') { BeautyHubAuth.expired(); reject(new Error('Sign in to continue.')); return; }
        resolve(data);
      })
        .withFailureHandler(() => reject(new Error('The Google TEST request failed. Reload and check the result before trying to save again.')))
        .beautyHubTest(action, input, token);
    });
  }
  function rpc(action, input) {
    // Bind queued work to the session that requested it. It must never acquire
    // a later user's token when an earlier request finally leaves the queue.
    const authorization = { token: BeautyHubAuth.token(), generation: BeautyHubAuth.generation() };
    // Independent GET-only routes may run together. Mutations and ticket-producing
    // previews keep a barrier: they wait for earlier reads; later reads wait for them.
    const readonly=['read','nakkaevent','nakkahealth','nakkacompare'].includes(action);
    const key=JSON.stringify([authorization.generation,epoch,action,input]);
    if(readonly&&inflight.has(key))return inflight.get(key);
    const barrier=readonly?queue:Promise.allSettled([queue,...reads]);
    const task = barrier.then(() => rpcNow(action, input, authorization));
    if(readonly){
      inflight.set(key,task);reads.add(task);
      const clear=()=>{reads.delete(task);if(inflight.get(key)===task)inflight.delete(key);};task.then(clear,clear);
    }else{epoch++;queue=task.catch(()=>{});}
    return task;
  }
  async function request(raw, options = {}) {
    if (options.signal?.aborted) throw new Error('Aborted');
    const url = new URL(raw);
    const page = url.searchParams.get('page');
    const keys = { cleanuppreview:['page'],cleanupsave:['page','ticket','confirmed'],eveningsetup:['page'],eveningprepare:['page','settings','version'],eveningsave:['page','ticket','confirmed'],nakkacreaterecover:['page'],nakkacreateprepare:['page','title','settings'],nakkacreateconfirm:['page','ticket','confirmed'], poolcontrol:['page'],poolqualifyprepare:['page'],poolqualifysave:['page','ticket','confirmed'],poolload:['page','refresh'],pooldraw:['page','bindings','reviewed','sizes'],pooladjust:['page','ticket','change'],poolprepare:['page','ticket','format','boardPlan'],poolsave:['page','ticket','confirmed'],poolstartprepare:['page'],poolboardplan:['page','boardPlan','boardVersion'],poolstart:['page','ticket','confirmed'], removepreview:['page','player','eventDate'], removesave:['page','player','eventDate','ticket','confirmed'], hubdata: ['page'], attentionrefresh: ['page'], eventcontrol: ['page'], eventprepare: ['page','date','expectedDate'], eventsave: ['page','date','expectedDate','version','confirmed'], nakkahealth: ['page'], nakkaevent: ['page'], nakkacompare: ['page'], nakkatransferpreview:['page','player'], nakkatransfersave:['page','player','ticket','confirmed'], hubregister: ['page', ...allowed], hubstatus: ['page', 'player', 'status', 'expectedStatus', 'eventDate'] }[page];
    if (url.origin !== 'https://beauty.invalid' || url.pathname !== '/hub' ||
        url.username || url.password || url.hash || (options.method && options.method !== 'GET') ||
        !keys || [...url.searchParams.keys()].some(key => !keys.includes(key) || url.searchParams.getAll(key).length !== 1)) {
      throw new Error('Blocked TEST route');
    }
    if (page === 'attentionrefresh') return response(await rpc('attentionrefresh', {}));
    if (page === 'nakkacompare') return response(await rpc('nakkacompare', {}));
    if (page === 'nakkaevent') return response(await rpc('nakkaevent', {}));
    if (page === 'nakkahealth') return response(await rpc('nakkahealth', {}));
    const input = Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'page'));
    if(page==='hubregister'){
      const data=await rpc('register',input);
      if(data?.code==='REGISTRATION_DAY_MISMATCH')return {ok:true,json:async()=>({...data,error:'Set the Hub event date to today before using this weekly TEST registration. No registration was saved.'})};
      return response(data);
    }
    if (['cleanuppreview','cleanupsave','eveningsetup','eveningprepare','eveningsave','nakkacreaterecover','nakkacreateprepare','nakkacreateconfirm','poolcontrol','poolqualifyprepare','poolqualifysave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan','nakkatransferpreview','nakkatransfersave','removepreview','removesave'].includes(page)) {
      // Server messages in this route are fixed strings; raw provider errors
      // never enter the response. Preserve the uncertain-operation guidance.
      const data=await rpc(page,input);
      return {ok:true,json:async()=>data};
    }
    return response(await rpc(page === 'hubdata' ? 'read' : page === 'eventcontrol' ? 'eventload' : page === 'hubstatus' ? 'status' : page === 'eventprepare' ? 'eventprepare' : page === 'eventsave' ? 'eventsave' : 'register', input));
  }
  return Object.freeze({ endpoint, mode, statusWrites: true, request, registrationSaved });
})();

// TEST-only opener: host URL comes from the guarded Apps Script service.
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
 document.addEventListener('beauty-hub-locked',()=>document.getElementById('hubRegistrationResult')?.remove());
 const button=[...document.querySelectorAll('.sidebar button')].find(b=>b.textContent.trim()==='Live');
 if(!button)return;
 button.addEventListener('click',()=>{
  let token,generation;try{token=BeautyHubAuth.token();generation=BeautyHubAuth.generation();}catch{alert('Sign in before opening Live.');return;}
  const tab=window.open('about:blank','_blank');
  if(!tab){alert('Allow pop-ups to open Live.');return;}
  window.BeautyHubNavigation?.activate(button);
  tab.opener=null;tab.document.body.textContent='Opening Live TEST…';
  const fail=()=>{tab.close();if(BeautyHubAuth.isCurrent(generation)){window.BeautyHubNavigation?.dashboard();alert('Could not open Live TEST. Check the selected TEST event and session.');}};
  const current=()=>BeautyHubAuth.isCurrent(generation)&&!tab.closed;
  const open=()=>google.script.run.withSuccessHandler(url=>{
   if(!current()){tab.close();return;}
   try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/(exec|dev)$/.test(u.pathname)||u.search!=='?page=live'||u.hash)throw Error();tab.location.href=url;}catch{fail();}
  }).withFailureHandler(fail).beautyLiveTestUrl(token);
  try{if(window.beautyStagePendingLabels){google.script.run.withSuccessHandler(()=>{if(!current()){tab.close();return;}window.beautyStagePendingLabels=null;open();}).withFailureHandler(fail).beautyStageLabelsTest(token,window.beautyStagePendingLabels);}else open();}catch{fail();}
 });
});
