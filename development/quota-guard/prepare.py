"""Build private candidate from the exact installed TEST v5; never commit full app."""
import pathlib,sys,hashlib,json,re,shutil
root=pathlib.Path(__file__).resolve().parent
base,out=map(pathlib.Path,sys.argv[1:])
expected=json.loads((root/'baseline-sha256.json').read_text())
for name,digest in expected.items():
 assert hashlib.sha256((base/name).read_bytes()).hexdigest()==digest, 'Baseline changed: '+name
assert not out.exists(), 'Output must be a new directory'
shutil.copytree(base,out)
audit=[]
for f in sorted(out.glob('*.gs')):
 s=f.read_text();matches=list(re.finditer(r'UrlFetchApp\.(fetchAll|fetch)\(',s))
 for m in matches:audit.append({'file':f.name,'line':s[:m.start()].count('\n')+1,'method':m[1]})
 s=re.sub(r'UrlFetchApp\.(fetchAll|fetch)\(',lambda m:('beautyQuotaFetchAll_' if m[1]=='fetchAll' else 'beautyQuotaFetch_')+'('+json.dumps(f.stem)+',',s)
 f.write_text(s)
def replace(name,old,new):
 f=out/name;s=f.read_text();assert s.count(old)==1,(name,old);f.write_text(s.replace(old,new))
replace('BeautyBackground.gs',"const config={...existing,state:'ENABLED',triggerUid:String(triggers[0].getUniqueId())};","const config=beautyQuotaBackgroundExpiry_({...existing,state:'ENABLED',triggerUid:String(triggers[0].getUniqueId())});")
replace('BeautyBackground.gs',"const config={version:1,state:'ENABLED',projectId:ScriptApp.getScriptId(),owner:'alessiotampella@gmail.com',triggerUid:String(trigger.getUniqueId())};","const config=beautyQuotaBackgroundExpiry_({version:1,state:'ENABLED',projectId:ScriptApp.getScriptId(),owner:'alessiotampella@gmail.com',triggerUid:String(trigger.getUniqueId())});")
replace('BeautyBackground.gs',"if(!beautyCombinedWorker_||c?.state!=='ENABLED'","if(!beautyCombinedWorker_||!c||!beautyQuotaBackgroundAllowed_(c)||c?.state!=='ENABLED'")
replace('BeautyBackground.gs',"  const old=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_RUN_)||'null');","  if(!beautyQuotaBackgroundAllowed_(config))return;\n  const old=JSON.parse(p.getProperty(BEAUTY_BACKGROUND_RUN_)||'null');")
replace('LiveHubView.html','let beautyDashboardFlight=null;','let beautyDashboardFlight=null;\nlet beautyDashboardRetry={key:null,failures:0,nextAt:0};')
replace('LiveHubView.html','function loadBeautyHubData() {','function loadBeautyHubData(automatic=false) {')
replace('LiveHubView.html',' if(beautyDashboardFlight?.key===key)return beautyDashboardFlight.task;', ''' if(beautyDashboardFlight?.key===key)return beautyDashboardFlight.task;
 if(beautyDashboardRetry.key!==key)beautyDashboardRetry={key,failures:0,nextAt:0};
 if(automatic&&Date.now()<beautyDashboardRetry.nextAt)return Promise.resolve();''')
replace('LiveHubView.html','  updateHub(data);setBeautyConnected();','  updateHub(data);setBeautyConnected();beautyDashboardRetry={key,failures:0,nextAt:0};')
replace('LiveHubView.html',"console.error('Hub refresh failed:',error);setBeautyDisconnected(error.message);","beautyDashboardRetry.failures++;beautyDashboardRetry.nextAt=Date.now()+Math.min(300000,15000*Math.pow(2,Math.min(beautyDashboardRetry.failures,5)));console.error('Hub refresh failed:',error);setBeautyDisconnected(error.message);")
replace('LiveHubView.html',"setInterval(()=>{if(!document.hidden)loadBeautyHubData();},15000);","setInterval(()=>{if(!document.hidden)loadBeautyHubData(true);},15000);")
replace('LiveHub.gs',"    const event=beautyLiveEventRead_();\n    if(action==='nakkaevent')return event;\n    return {status:'OK',message:'Public Nakka event and registration date verified. Administrative API access not checked.',timestamp:event.checkedAt};", "    if(action==='nakkaevent')return beautyLiveEventRead_();\n    return beautyQuotaHealthRead_(()=>{const event=beautyLiveEventRead_();return {status:'OK',message:'Public Nakka event and registration date verified. Administrative API access not checked.',timestamp:event.checkedAt};});")
# Session-gated, property-only route remains available during provider outages.
replace('LiveHub.gs',"  if(typeof action==='string'&&action.startsWith('eventCreate:'))", "  if(action==='quota'){try{return beautyQuotaStatus_();}catch(e){return {success:false,code:'QUOTA_STATUS_UNAVAILABLE'};}}\n  if(typeof action==='string'&&action.startsWith('eventCreate:'))")
replace('LiveHubView.html',"return Object.freeze({ endpoint, mode, statusWrites: true, request, registrationSaved, context,", "return Object.freeze({ endpoint, mode, statusWrites: true, request, registrationSaved, context, quota:()=>rpc('quota',{}),")
replace('LiveHubView.html',"['read','nakkaevent','nakkahealth','nakkacompare'].includes(action)","['read','nakkaevent','nakkahealth','nakkacompare','quota'].includes(action)")
replace('LiveHubView.html','    <h2 id="systemPanelTitle">System Status</h2>', '    <h2 id="systemPanelTitle">System Status</h2>\n'+(root/'source/status-card.html').read_text())
replace('LiveHubView.html','/* Navigation only. Detail panels keep their existing read-only health checks. */',(root/'source/status-card.js').read_text()+'\n/* Navigation only. Detail panels keep their existing read-only health checks. */')
replace('LiveLoginAuth.gs',"    if(e.name==='HubAuthError')throw e;", "    if(e.name==='HubAuthError')throw e;\n    if(/Service invoked too many times for one day:\\s*urlfetch/i.test(String(e.message||e))||e.message==='URL_FETCH_COOLDOWN')beautyHubAuthError_('AUTH_QUOTA_PAUSED');\n    if(e.message==='TEST_FETCH_BUDGET_EXHAUSTED')beautyHubAuthError_('AUTH_TEST_BUDGET');")
replace('LiveHubView.html',"const failures={AUTH_SETUP:","const failures={AUTH_QUOTA_PAUSED:'Sign-in is temporarily paused because Google reported its daily request limit. Please try later; there is no need to reset your password.',AUTH_TEST_BUDGET:'TEST has reached its request limit. Please try later; there is no need to reset your password.',AUTH_SETUP:")
replace('LiveHubView.html',"const error=Error(code?'Sign-in verification stopped ('+code+'). Please report this code.':failures[result?.code]||'The account request could not be verified.');", "const error=Error(result?.code==='AUTH_VERIFY_CONNECTION'?'Beauty could not reach the sign-in verification service. Please try later. This does not mean your password is wrong.':code?'Sign-in verification stopped ('+code+'). Please report this code.':failures[result?.code]||'The account request could not be verified.');")
# QG004: reduce scheduled comparison load; manual/action checks stay immediate.
replace('LiveHubView.html','setInterval(check,30000);','setInterval(check,120000);')
for old,new in [
 ('Checks every 30 seconds while signed in and the Hub is visible.','Checks every 2 minutes while signed in and the Hub is visible.'),
 ('Refreshes every 30 seconds while visible.','Refreshes every 2 minutes while visible.')]:
 f=out/'LiveHubView.html';s=f.read_text();assert old in s;f.write_text(s.replace(old,new))
# QG005: busy comparisons use the existing schedule, never a rapid retry loop.
replace('LiveHubView.html','retryCheck=setTimeout(check,3000);','retryCheck=null;')
replace('LiveHubView.html','Another operation is running. Last verified comparison retained; checking again shortly.','The comparison is waiting for a stable event. Retrying on the normal schedule; you can also select COMPARE LISTS.')
# QG006: expose the existing failed readback check without changing recovery state.
replace('LivePlayerRecovery.gs','function beautyLivePlayerRecoveryPolicy_(code){',(root/'source/recovery-detail.gs').read_text()+'\nfunction beautyLivePlayerRecoveryPolicy_(code){')
replace('LivePlayerRecovery.gs',"  players.push({name,status,tone,code,problem:","  const detail=['REGISTRATION_REVIEW','AUTO_RETRY_LIMIT'].includes(code)&&jobs.length===1?beautyLivePlayerRecoveryRegistrationDetail_(jobs[0]):null;\n  players.push({name,status,tone,code,failedCheck:detail?.failedCheck||null,problem:")
replace('LivePlayerRecovery.gs',"tone==='green'?'Nakka entry verified.':policy.problem,next:policy.next,autoEligible", "tone==='green'?'Nakka entry verified.':detail?.problem||policy.problem,next:detail?(code==='AUTO_RETRY_LIMIT'?policy.next+' '+detail.problem:detail.next):policy.next,autoEligible")
# QG007: one cast roster request/timer, bounded failure backoff.
replace('LiveCastView.html','let disposed=false,refreshTimer,refreshDeadline;let latest=null,', 'let disposed=false,refreshTimer,refreshDeadline,refreshBusy=false,refreshFailures=0;let latest=null,')
replace('LiveCastView.html','function refresh(){if(disposed)return;const ticket=++sequence;let finished=false;', 'function refresh(){if(disposed||refreshBusy)return;clearTimeout(refreshTimer);refreshBusy=true;const ticket=++sequence;let finished=false;')
replace('LiveCastView.html','finished=true;clearTimeout(timeout);\n      try{if(error)throw Error();apply(data);}', 'finished=true;clearTimeout(timeout);refreshBusy=false;\n      try{if(error)throw Error();apply(data);refreshFailures=0;}')
replace('LiveCastView.html',"catch(e){window.BeautyCastShell?.playersUnavailable?.();status.textContent=latest?", "catch(e){refreshFailures++;window.BeautyCastShell?.playersUnavailable?.();status.textContent=latest?")
replace('LiveCastView.html','refreshTimer=setTimeout(refresh,15000);};', 'refreshTimer=setTimeout(refresh,Math.min(300000,15000*Math.pow(2,Math.min(refreshFailures,5))));};')
replace('LiveCastView.html','    google.script.run.withSuccessHandler(d=>done(d,false)).withFailureHandler(()=>done(null,true)).beautyLiveCastData();', '    try{google.script.run.withSuccessHandler(d=>done(d,false)).withFailureHandler(()=>done(null,true)).beautyLiveCastData();}catch{done(null,true);}')
# QG008: keep the embedded, searchable operator handbook aligned with TEST.
f=out/'LiveHubView.html';s=f.read_text();match=re.search(r'  const GUIDE = (.*);',s);assert match
handbook=json.loads(match[1]);update=json.loads((root/'source/handbook-update.json').read_text())
assert not any(c['id']==update['chapter']['id'] for c in handbook['chapters'])
handbook['chapters'].insert(2,update['chapter'])
for chapter_id,note in update['notes'].items():
 chapters=[c for c in handbook['chapters'] if c['id']==chapter_id];assert len(chapters)==1
 chapters[0]['en'].setdefault('notes',[]).append(note)
# Retain original handbook provenance; explicitly label this local supplement.
handbook['localUpdate']='2026-11-25 QG008'
f.write_text(s[:match.start(1)]+json.dumps(handbook,ensure_ascii=False,separators=(',',':'))+s[match.end(1):])
shutil.copyfile(root/'source/BeautyQuota.gs',out/'BeautyQuota.gs')
# QG009: the implemented handbook must not be caught by the old placeholder guard.
replace('LiveHubView.html', "button.matches('.sidebar>button')&&['Instructions'].includes(button.textContent.trim())||", '')
# QG011: reserve the spinner for an active bounded request, not a saved pending state.
for old,new in json.loads((root/'source/recovery-pending.json').read_text()):
 replace('LiveHubView.html',old,new)
# QG012: reject new stale-event submissions; existing receipts retain recovery.
for old,new in json.loads((root/'source/registration-date.json').read_text()):
 replace('LiveRegistrationQueue.gs',old,new)
(out.parent/'request-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
(out.parent/'candidate-sha256.json').write_text(json.dumps({f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(out.iterdir())},indent=2)+'\n')
print('Prepared',len(audit),'fetch call sites;',len(list(out.iterdir())),'files')
