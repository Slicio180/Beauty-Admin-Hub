/* Private LIVE dashboard review. No operational write routes. */
function beautyLiveLoginGuard_() {
  if (ScriptApp.getScriptId() !== '1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4') throw Error('Wrong LIVE project.');
}
function doGet(e) {
  beautyLiveLoginGuard_();
  if(Object.keys(e?.parameter||{}).some(k=>k!=='page'))throw Error('Unsupported page.');
  const page=e?.parameter?.page||'hub';
  if(page==='registration-health')return beautyPublicRegistrationReply_(beautyPublicRegistrationHealth_());
  if(!['hub','login-check','live','kiosk','remote'].includes(page))throw Error('This LIVE installation does not serve that page.');
  return HtmlService.createHtmlOutputFromFile(page==='hub'?'LiveHubView':page==='live'?'LiveCastView':page==='kiosk'?'Kiosk':page==='remote'?'RemoteRegistration':'LiveLogin').setTitle(page==='hub'?'Beauty 2.0 — Event Hub':page==='live'?'Beauty — LIVE players':page==='kiosk'?'Beauty — Kiosk':page==='remote'?'Beauty — Registration':'Beauty — LIVE login check').addMetaTag('viewport','width=device-width, initial-scale=1');
}
