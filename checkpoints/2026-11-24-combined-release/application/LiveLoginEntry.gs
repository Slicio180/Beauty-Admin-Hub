/* Private LIVE dashboard review. No operational write routes. */
function beautyLiveLoginGuard_() {
  beautyReleaseEnvironment_();
}
function doGet(e) {
  beautyLiveLoginGuard_();
  if(Object.keys(e?.parameter||{}).some(k=>k!=='page'))throw Error('Unsupported page.');
  const page=e?.parameter?.page||'hub';
  if(page==='registration-health')return beautyPublicRegistrationReply_(beautyPublicRegistrationHealth_());
  if(!['hub','login-check','live','kiosk','remote'].includes(page))throw Error('This LIVE installation does not serve that page.');
  const output=HtmlService.createHtmlOutputFromFile(page==='hub'?'LiveHubView':page==='live'?'LiveCastView':page==='kiosk'?'Kiosk':page==='remote'?'RemoteRegistration':'LiveLogin').setTitle(page==='hub'?'Beauty 2.0 — Event Hub':page==='live'?'Beauty — LIVE players':page==='kiosk'?'Beauty — Kiosk':page==='remote'?'Beauty — Registration':'Beauty — LIVE login check').addMetaTag('viewport','width=device-width, initial-scale=1');
  if(beautyReleaseEnvironment_().test){
    output.setTitle('Beauty — Release TEST');
    output.setContent(output.getContent().replace(/<body([^>]*)>/i,'<body$1><div class="environment-banner" style="padding:12px;background:#ffd700;color:#080808;text-align:center;font:700 16px Arial,sans-serif">RELEASE TEST — Combined release checks — synthetic players only</div>'));
  }
  return output;
}
