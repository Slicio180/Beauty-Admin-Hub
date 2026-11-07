/* Owner-only Identity TEST. Never deploy this bridge into a live project. */
function beautyHubTestGuard_() {
  if(typeof beautyContextAssert_==='function')beautyContextAssert_();
  if (ScriptApp.getScriptId() !== '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N' ||
      BEAUTY_IDENTITY_APPROVED_SCRIPT_ !== '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N' ||
      (typeof beautyContextRead_==='function' ? SHEET_ID !== (beautyContextRead_()?.sheetId||beautyHubBaseSheet_()) : SHEET_ID !== '1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU')) {
    throw new Error('Hub TEST identity mismatch.');
  }
}
function beautyHubTest(action, input, token) {
  beautyHubTestGuard_();
  try { beautyHubAuthRequire_(token); } catch(e) { return {success:false,code:'AUTH_REQUIRED',error:'Sign in to continue.'}; }
  beautyHubRequestToken_ = token;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid TEST input.');
  if(action.startsWith('context:'))return beautyContextService_(action.slice(8),input);
  if(typeof beautyContextBind_==='function'){try{input=beautyContextBind_(action==='read'?Object.fromEntries(Object.entries(input).filter(([k])=>k!=='_context')):input,!['read','nakkahealth','nakkaevent','nakkacompare','eventload','eveningsetup'].includes(action));}catch(e){return {success:false,code:'STALE_EVENT',error:e.message};}}
  const allowed = ['eventDate','selectedName', 'newName', 'consent', 'message', 'identityChoice',
    'identityBase', 'identityDetail', 'identityConfirmedName'];
  if(['eveningsetup','eveningprepare','eveningsave'].includes(action))return beautyHubEveningSetup_(({eveningsetup:'read',eveningprepare:'prepare',eveningsave:'confirm'})[action],input);
  if(action==='nakkacreaterecover')return beautyHubReviewCreatedEvent_(input);
  if(action==='nakkacreateprepare'||action==='nakkacreateconfirm')return beautyHubCreateEvent_(action==='nakkacreateprepare'?'prepare':'confirm',input);
  if((action==='eventprepare'||action==='eventsave')&&typeof beautyContextRead_==='function'&&beautyContextRead_())return {success:false,error:'Use League / Tournament to select the event for another date.'};
  if (action === 'eventprepare' || action === 'eventsave') return beautyHubTestEventTransition_(action === 'eventprepare' ? 'prepare' : 'save', input);
  if (action === 'eventload') return Object.assign({}, beautyHubTestEventPreview_(input), {
    eventSavingEnabled: typeof BEAUTY_HUB_EVENT_WRITES_ENABLED_ !== 'undefined' && BEAUTY_HUB_EVENT_WRITES_ENABLED_ === true
  });
  if (action === 'removepreview' || action === 'removesave') return beautyHubRemove_(action === 'removepreview' ? 'preview' : 'save', input);
  if (['poolcontrol','poolqualifyprepare','poolqualifysave','poolload','pooldraw','pooladjust','poolprepare','poolsave','poolstartprepare','poolstart','poolboardplan'].includes(action)) return beautyHubPool_(action,input);
  if (action === 'attentionrefresh') return beautyHubAttentionRefresh_(input);
  if (action === 'nakkacompare') return beautyHubNakkaCompare_(input);
  if (action === 'nakkaleaguepreview' || action === 'nakkaleaguesave') return beautyHubLeagueRecovery_(action === 'nakkaleaguepreview' ? 'preview' : 'save', input);
  if (action === 'nakkatransferpreview' || action === 'nakkatransfersave') return beautyHubNakkaTransfer_(action === 'nakkatransferpreview' ? 'preview' : 'save', input);
  if (action === 'nakkaevent') return beautyHubNakkaEvent_(input);
  if (action === 'nakkahealth') {
    if (Object.keys(input).length) throw new Error('Unexpected health input.');
    return getNakkaHealth_();
  }
  if (action === 'status') return beautyHubTestStatus_(input);
  if (action === 'read') {
    if (Object.keys(input).length) throw new Error('Unexpected read input.');
    const data=getBeautyHubData_();
    return Object.assign({}, data, { mode: 'test', eventContext:typeof beautyContextToken_==='function'?beautyContextToken_():'legacy', activeEvent:typeof beautyContextRead_==='function'?beautyContextRead_():null, attention:typeof beautyHubAttentionRead_==='function'?beautyHubAttentionRead_(data):{available:false,eventDate:data.eventDate,items:[],complete:false} });
  }
  if (action !== 'register' || Object.keys(input).some(key => !allowed.includes(key) || typeof input[key] !== 'string')) {
    throw new Error('Unsupported TEST action or input.');
  }
  // submitRegistration owns the existing Remote TEST write gate and script lock.
  // The source cannot be chosen by the browser.
  if(typeof input.eventDate!=='string'||!/^20\d\d-\d\d-\d\d$/.test(input.eventDate))throw Error('Missing selected Hub event date.');
  return beautyHubAutoRegistration_(input);
}

