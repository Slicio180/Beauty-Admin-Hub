/* Private LIVE dashboard review. No operational write routes. */
function beautyLiveLoginGuard_() {
  if (ScriptApp.getScriptId() !== '1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4') throw Error('Wrong LIVE project.');
}
function doGet(e) {
  beautyLiveLoginGuard_();
  if(Object.keys(e?.parameter||{}).some(k=>k!=='page'))throw Error('Unsupported page.');
  const page=e?.parameter?.page||'hub';
  if(!['hub','login-check'].includes(page))throw Error('This LIVE installation serves the dashboard review only.');
  return HtmlService.createHtmlOutputFromFile(page==='hub'?'LiveHubView':'LiveLogin').setTitle(page==='hub'?'Beauty — LIVE Hub review':'Beauty — LIVE login check').addMetaTag('viewport','width=device-width, initial-scale=1');
}
