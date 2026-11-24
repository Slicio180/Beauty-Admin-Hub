from pathlib import Path
import hashlib, json, re, shutil

ROOT = Path(__file__).resolve().parent
REF = ROOT.parent / 'beauty-checkpoint-source/reference/beauty'
LIVE = REF / 'RELEASE-CONSENT-20261123/application'
ORIGINAL = REF / 'RELEASE-AUDIT-20261123/original-test-readback'
ALTERNATE = REF / 'RELEASE-AUDIT-20261123/alternate-test-readback'
OUT = ROOT / 'application'
OUT.mkdir(exist_ok=True)

def replace_once(text, before, after):
    assert text.count(before) == 1, (before[:100], text.count(before))
    return text.replace(before, after, 1)

def function_chunk(text, name):
    start = re.search(r'^function ' + re.escape(name) + r'\(', text, re.M)
    assert start, name
    following = re.search(r'^function ', text[start.end():], re.M)
    end = start.end() + following.start() if following else len(text)
    return text[start.start():end]

def script_blocks(text):
    return list(re.finditer(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>', text))

def script_with(text, marker):
    found = [m.group(1) for m in script_blocks(text) if marker in m.group(1)]
    assert len(found) == 1, (marker, len(found))
    return found[0]

def replace_script(text, marker, code):
    return replace_once(text, script_with(text, marker), code)

for file in LIVE.iterdir():
    if file.is_file(): shutil.copy2(file, OUT / file.name)

entry = (LIVE / 'LiveLoginEntry.gs').read_text()
entry = replace_once(entry, 'RELEASE TEST — Consent and formula checks — synthetic players only', 'RELEASE TEST — Combined release checks — synthetic players only')
(OUT / 'LiveLoginEntry.gs').write_text(entry)

# Append into the next data row without inserting sheet rows. In an empty
# response sheet, INSERT_ROWS moves A2-based roster references past the first
# accepted player. RAW encoding and queue no-replay/readback checks remain.
registration = (LIVE / 'LiveRegister.gs').read_text()
registration = replace_once(registration, 'insertDataOption=INSERT_ROWS', 'insertDataOption=OVERWRITE')
(OUT / 'LiveRegister.gs').write_text(registration)

# Retain LIVE identity, sessions, context and revocation behavior. Bring over
# the accepted lock-free insertion and read-only opening paths only.
auth = (LIVE / 'LiveLoginAuth.gs').read_text()
test_auth = (ORIGINAL / 'HubTestAuth.gs').read_text()
login = function_chunk(test_auth, 'beautyHubAuthLogin_')
login = login[:login.index('/* Run manually')].rstrip() + '\n'
auth = replace_once(auth, function_chunk(auth, 'beautyHubAuthLogin_'), login)
auth = replace_once(auth, "if(!['touch','logout'].includes(action)", "if(!['check','touch','logout'].includes(action)")
auth = replace_once(auth, "    return beautyHubAuthLocked_(()=>{\n      if(action==='logout')", "    if(action==='check'){const record=beautyHubAuthSessionRequire_(input.token);return {success:true,expiresAt:record.expires};}\n    return beautyHubAuthLocked_(()=>{\n      if(action==='logout')")
(OUT / 'LiveLoginAuth.gs').write_text(auth)

hub = (LIVE / 'LiveHubView.html').read_text()
original_hub = (ORIGINAL / 'HubTest.html').read_text()
alternate_hub = (ALTERNATE / 'HubTest.html').read_text()
auth_ui = script_with(hub, 'Managed Beauty password login')
auth_ui = replace_once(auth_ui, "await rpc('touch',{token:value});", "await rpc('check',{token:value});")
hub = replace_script(hub, 'Managed Beauty password login', auth_ui)

# Accepted transport timeout/uncertain-write handling, retaining LIVE-only
# service methods and the production context binding.
transport = script_with(hub, 'const BeautyHubServices')
test_transport = script_with(original_hub, 'const BeautyHubServices')
start = test_transport.index('  let uncertainWrite=null;')
end = test_transport.index('  function rpc(action, input)', start)
new_rpc = test_transport[start:end].replace('Google TEST', 'Google').replace('Hub TEST', 'Hub')
new_rpc = new_rpc.replace("'context:draft'", "'context:draft','context:remove','context:recover','consent','queue:recheck','queue:pump','recovery:save','recovery:recheck','eventCreate:confirm','eventCreate:resolve'")
start_old = transport.index('  function rpcNow(')
end_old = transport.index('  function rpc(action, input)', start_old)
transport = transport[:start_old] + new_rpc + transport[end_old:]
transport = transport.replace("pooldraw:['page','bindings','reviewed','sizes']", "pooldraw:['page','bindings','reviewed','sizes','choices','draftTicket'],pooldraftchoices:['page','ticket','choices']")
transport = transport.replace("'poolload','pooldraw'", "'pooldraftchoices','poolload','pooldraw'")
transport = replace_once(transport, "    notice.dataset.state=result.nakka?.entryConfirmed===true?'confirmed':'attention';", "    notice.dataset.state=result.nakka?.entryConfirmed===true?'confirmed':'attention';\n    notice.dataset.player=result.player;notice.dataset.eventDate=result.registrationEventDate;notice.dataset.eventContext=context;")
hub = replace_script(hub, 'const BeautyHubServices', transport)

# Use the accepted alternate-format client, which includes the roster-change
# rejection and saved-draft recovery. Its backend is composed below.
pool_client = script_with(alternate_hub, 'Pure draw planning.')
# Destination is identified by the environment banner. Shared operational
# labels must remain truthful when the identical artifact is promoted.
for old_label, new_label in [
    ('seeded TEST controls', 'seeded pool controls'),
    ('BOARD PLAN · TEST', 'BOARD PLAN'),
    ('Beauty-Board-Plan-TEST-', 'Beauty-Board-Plan-'),
    ('Nakka handoff — TEST', 'Nakka handoff'),
    ('NAKKA HANDOFF — TEST', 'NAKKA HANDOFF'),
    ('these TEST pools', 'these pools'),
    ('Review TEST pools', 'Review pools'),
    ('SEND APPROVED TEST POOLS', 'SEND APPROVED POOLS'),
    ('Starting TEST event', 'Starting event'),
    ('START EVENT — TEST', 'START EVENT'),
    ('this TEST competition', 'this competition'),
    ('CONFIRM START — TEST', 'CONFIRM START'),
    ('TEST EVENT', 'EVENT'),
]:
    assert old_label in pool_client, old_label
    pool_client = pool_client.replace(old_label, new_label)
pool_client = replace_once(pool_client, '.beautyStageLabelsTest(root.BeautyHubAuth.token(),labels)', '.beautyStageLabelsLive(root.BeautyHubAuth.token(),labels)')
hub = replace_script(hub, 'Pure draw planning.', pool_client)
pool_styles = []
for match in re.finditer(r'<style(?:\s[^>]*)?>([\s\S]*?)</style>', alternate_hub):
    css = match.group(1)
    short = re.search(r'@media \(max-height: 600px\) \{[\s\S]*?\n\}', css)
    if short: pool_styles.append(short.group(0))
if pool_styles:
    hub = hub.replace('</head>', '<style>\n' + '\n'.join(pool_styles) + '\n</style>\n</head>', 1)

# The guide is self-contained and has no operational RPCs. Keep its accepted
# fifteen chapters and styles; remove the TEST-only environment banner.
dashboard = script_with(original_hub, 'AIK dashboard presentation')
start = dashboard.index('// Operator chapters derived')
end = dashboard.index('\n  if(window.beautyHubData)update(', start)
guide = dashboard[start:end]
guide = replace_once(guide, 'The foreground recovery flow needs the Hub visible and signed in. The original TEST also has a scheduled worker for eligible registration/removal work while the Hub is closed.', 'Keep the Hub open and signed in for a repair you start there. When background recovery is enabled, its scheduled worker can check eligible registration and removal work while the Hub is closed.')
guide = replace_once(guide, 'Automatic retries are limited. Conflicting identities or later player edits need review. Background recovery has not been promoted to LIVE by this work.', 'Automatic retries stop after three attempts. Conflicting identities or later player edits need review. Open the saved issue, correct the reported cause and use Check after correction when offered.')
guide = replace_once(guide, 'Återställningen i förgrunden kräver en synlig hubb och inloggad personal. Ursprunglig TEST har dessutom en schemalagd arbetare för säkra anmälnings- och borttagningssteg när hubben är stängd.', 'Håll hubben öppen och var inloggad under en reparation som du startar där. När bakgrundsåterställning är aktiverad kan den schemalagda processen kontrollera säkra anmälnings- och borttagningssteg även när hubben är stängd.')
guide = replace_once(guide, 'Automatiska återförsök är begränsade. Motstridiga identiteter eller senare spelarändringar behöver granskas. Bakgrundsåterställningen har inte flyttats till LIVE genom detta arbete.', 'Automatiska återförsök stoppas efter tre försök. Motstridiga identiteter eller senare spelarändringar behöver granskas. Öppna det sparade ärendet, rätta den angivna orsaken och använd Check after correction när det erbjuds.')
guide = guide.replace('TEST: kontrollera alltid tävlingens namn och datum. Funktioner i TEST är inte automatiskt släppta i LIVE.', 'Kontrollera alltid tävlingens namn och datum innan du gör ändringar.')
guide = guide.replace('TEST: always check the event title and date. TEST features are not automatically released in LIVE.', 'Always check the event title and date before making changes.')
hub = hub.replace('</body>', '<script>\n' + guide + '\n</script>\n</body>', 1)

# Retain the existing compact LIVE comparison UI and queue controls, while
# preserving its last confirmed result across transient reads/worker contention.
monitor = script_with(hub, 'Compact LIVE Nakka panel.')
old = "status.textContent='Check unavailable. Select COMPARE LISTS to try again.';clearCompact();compactSummary.textContent='Comparison unavailable. Try again.';connection('problem','Connection not confirmed');result=null;link.hidden=true;tile('—',false);nav('problem');"
new = "status.textContent=result?'Current check unavailable. Last verified comparison retained.':'Check unavailable. Select COMPARE LISTS to try again.';compactSummary.textContent=result?'Last verified comparison — current check unavailable.':'Comparison unavailable. Try again.';connection('problem','Current connection not confirmed',result?.checkedAt);tile();nav('problem');"
monitor = replace_once(monitor, old, new)
monitor = replace_once(monitor, "if(r?.code==='CHECK_IN_PROGRESS'&&r.context===context)", "if(['CHECK_IN_PROGRESS','BUSY'].includes(r?.code)&&r.context===context)")
monitor = replace_once(monitor, "connection('waiting','API checking');", "connection('waiting','API checking',result?.checkedAt);")
monitor = replace_once(monitor, "status.textContent='Registration changed during the check. Refreshing shortly.';", "status.textContent='Another operation is running. Last verified comparison retained; checking again shortly.';")
hub = replace_script(hub, 'Compact LIVE Nakka panel.', monitor)

recovery_ui = script_with(hub, "host=get('beautyLiveRecoveryEventControls'),old=get('beautyLiveRecoverySavedArea')")
recovery_ui = replace_once(recovery_ui, "renderDialog();const p=state?.players.find(p=>p.name===name);if(p?.tone==='red'&&p.code!=='EVENT_REGISTRATION_CLOSED'&&!guidance&&!busy)run('review',{player:name});", 'renderDialog();')
recovery_ui = replace_once(recovery_ui, "const visible=p&&!(providerPaused&&p.tone==='green')&&(['red','orange'].includes(p.tone)||(p.tone==='green'&&p.history?.length));", "const visible=p&&['red','orange'].includes(p.tone);")
recovery_ui = replace_once(recovery_ui, "  else if(p.code==='EVENT_REGISTRATION_CLOSED')", "  else if(p.code==='AUTO_RETRY_LIMIT'){status.textContent='Automatic retries stopped';detail.textContent='Review the original request and correct the reported issue. Do not register the player again.';const button=addButton('Check after correction',()=>run('review',{player:p.name}));button.disabled=busy||providerPaused;}\n  else if(p.code==='EVENT_REGISTRATION_CLOSED')")
old = "  timer=setTimeout(()=>{if(valid()){notice='The reply is taking longer than expected. Beauty is waiting; do not register again.';render();}},60000);\n  try{const r=await new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(()=>reject(Error('Reply unavailable. The saved operation will be checked; do not register again.'))).beautyHubTest('playerRecovery:'+action,{_context:context,...input},token));"
new = "  try{const r=await new Promise((resolve,reject)=>{let settled=false;const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};timer=setTimeout(()=>finish(Error('No reply within 60 seconds. Check the saved result before requesting another repair.')),60000);try{google.script.run.withSuccessHandler(value=>finish(null,value)).withFailureHandler(()=>finish(Error('Reply unavailable. The saved operation will be checked; do not register again.'))).beautyHubTest('playerRecovery:'+action,{_context:context,...input},token);}catch(e){finish(e);}});"
recovery_ui = replace_once(recovery_ui, old, new)
hub = replace_script(hub, "host=get('beautyLiveRecoveryEventControls'),old=get('beautyLiveRecoverySavedArea')", recovery_ui)
(OUT / 'LiveHubView.html').write_text(hub)

# Preserve LIVE's public cast adapter (rankings, event routing and privacy),
# and use the accepted repaired display client through those same endpoints.
display = (ORIGINAL / 'BeautyDisplayRepairView.html').read_text()
display = display.replace('beautyDisplayRepairTestData()', 'beautyLiveCastData()')
display = display.replace('beautyDisplayRepairTestPlan()', 'beautyStagePlanLive()')
(OUT / 'LiveCastView.html').write_text(display)

# Carry the alternate pool server's saved-draft contract into the existing
# LIVE planner. Keep the LIVE audit archive format and evening/event services.
live_pool = (LIVE / 'LivePlanner.gs').read_text()
pool = (ALTERNATE / 'HubTestPools.gs').read_text()
pool = replace_once(pool, function_chunk(pool, 'beautyPoolAudit_'), function_chunk(live_pool, 'beautyPoolAudit_'))
pool = replace_once(pool, function_chunk(pool, 'beautyTournamentReadAudit_'),
                    'function beautyTournamentReadAudit_(name){return beautyPoolAuditRead_(name);}\n')
old = "  const ss=SpreadsheetApp.openById(SHEET_ID);if(ss.getId()!==SHEET_ID)beautyPoolError_('Audit identity mismatch.');\n  const sheet=ss.getSheetByName(journal.audit);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Original approval audit is unavailable.');\n  const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')beautyPoolError_('Original approval audit is invalid.');\n  const before=JSON.parse(rows.slice(1).map(r=>r[1]).join(''));"
pool = replace_once(pool, old, '  const before=beautyPoolAuditRead_(journal.audit);')
old = " const ss=SpreadsheetApp.openById(SHEET_ID);if(ss.getId()!==SHEET_ID)beautyPoolError_('Audit identity mismatch.');\n function read(name){const sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Saved draw audit unavailable.');const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')beautyPoolError_('Saved draw audit invalid.');return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));}"
pool = replace_once(pool, old, ' const read=beautyPoolAuditRead_;')
pool = re.sub(r'\bSHEET_ID\b', 'beautyLiveTarget_().sheetId', pool)
pool = pool.replace('beautyContextRead_()', 'beautyLiveContextRead_()')
# These are product messages; no TEST hooks or diagnostic actions are retained.
pool = pool.replace('Registration TEST singles event', 'selected singles event').replace('TEST event', 'selected event').replace('TEST groups', 'saved groups').replace('TEST knockout', 'knockout').replace('TEST competition', 'competition')
prefix = live_pool[:live_pool.index('/* Generated shared pool core')]
prefix = replace_once(prefix, "function beautyLivePlannerPending_(){\n", "function beautyLivePlannerPending_(){\n  beautyQueueWriteGuard_(null,true);\n")
prefix = prefix.replace("'poolload','pooldraw'", "'poolcontrol','poolqualifyprepare','poolqualifysave','pooldraftchoices','poolload','pooldraw'")
prefix = prefix.replace("'league/schedule/get?tdid='+t.eventId", "'league/schedule/get?tdid='+t.eventId,'tournament/standings?tdid='+t.eventId,'tournament/end_group?tdid='+t.eventId")
prefix = prefix.replace("  const prior=beautyHubRequestToken_;", "  const prior=beautyHubRequestToken_;")
suffix_names = ['beautyPoolAuditRead_', 'beautyHubCreateFormatMatches_', 'beautyHubCreateMatchSettings_', 'beautyHubEveningSnapshot_', 'beautyHubEveningSetup_', 'beautyStagePlanLive', 'beautyStageLabelsLive']
pool = prefix + pool + '\n' + '\n'.join(function_chunk(live_pool, n) for n in suffix_names)
(OUT / 'LivePlanner.gs').write_text(pool)
dispatcher = (LIVE / 'LiveHub.gs').read_text()
dispatcher = dispatcher.replace("'poolload','pooldraw'", "'poolcontrol','poolqualifyprepare','poolqualifysave','pooldraftchoices','poolload','pooldraw'")
(OUT / 'LiveHub.gs').write_text(dispatcher)

remove=(LIVE/'LiveRemove.gs').read_text()
old="    beautyLiveRemoveMeasure_('recovery-record-save',()=>beautyRecoveryRecordSave_(backup,'REMOVE',{recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,state}));"
new="    const backupDocument={recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,state};\n    beautyLiveRemoveMeasure_('recovery-record-save',()=>beautyRecoveryRecordSave_(backup,'REMOVE',backupDocument));"
remove=replace_once(remove,old,new)
old="const record={state:'ATTEMPTED',recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,event:state.event,tpid:state.entry?.tpid||null,identity:state.identity,backup,version:state.version};"
new="const record={state:'ATTEMPTED',recoveryVersion:1,context:beautyBackgroundScope_(),sheetId:beautyLiveTarget_().sheetId,backupHash:beautyLiveRemoveHash_(backupDocument),authority:beautyLiveRemovalAuthority_(input.player),recordedUTC:new Date().toISOString(),uid:account.uid,player:input.player,event:state.event,tpid:state.entry?.tpid||null,identity:state.identity,backup,version:state.version};"
remove=replace_once(remove,old,new)
(ROOT/'parts-fragments').mkdir(exist_ok=True)
reads = (ROOT/'parts-fragments/removal-reads.js').read_text()
remove=replace_once(remove,function_chunk(remove,'beautyLiveRemoveReads_'),reads+'\n')
old="  const publicEvent=beautyLiveEventRead_(),match={status:publicEvent.status,event:publicEvent.event,eventDate:publicEvent.eventDate};\n  if(match.status!=='MATCHED'||match.event?.id!==beautyLiveTarget_().eventId||match.eventDate!==date)throw Error('TARGET');\n"
remove=replace_once(remove,old,'  // Reuse the fresh authenticated event in the provider batch; no duplicate public fetch.\n')
remove=replace_once(remove,"typeof raw.title!=='string'||!raw.title.trim()||![10,20].includes(raw.status)","typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>300||raw.team_games!==0||![10,20].includes(raw.status)")
(OUT/'LiveRemove.gs').write_text(remove)
recovery=(LIVE/'LiveRecovery.gs').read_text()
recovery=replace_once(recovery,'function beautyRecoveryRemoval_(ref,raw,j,actor,ss,snap){',"function beautyRecoveryRemoval_(ref,raw,j,actor,ss,snap){\n if(j.recoveryVersion===1&&j.context?.mode==='league')return beautyLiveRemovalReconcile_(ref,raw,actor,false);")
(OUT/'LiveRecovery.gs').write_text(recovery)
player=(LIVE/'LivePlayerRecovery.gs').read_text()
player=replace_once(player,"  EVENT_REGISTRATION_CLOSED:['Registration is closed.'", "  AUTO_RETRY_LIMIT:['Automatic retries stopped.','Review the original request, correct the reported issue, then use Check after correction. Do not register the player again.'],\n  EVENT_REGISTRATION_CLOSED:['Registration is closed.'")
player=replace_once(player,"  if(jobs.length&&![10,20].includes(snap.provider.status))code='EVENT_REGISTRATION_CLOSED';", "  if(code==='REGISTRATION_REVIEW'&&((jobs[0]?.background?.attempts||0)>=3||(record?.autoAttempts||0)>=3))code='AUTO_RETRY_LIMIT';\n  if(jobs.length&&![10,20].includes(snap.provider.status))code='EVENT_REGISTRATION_CLOSED';")
player=replace_once(player,'j.id,j.state,j.stage,j.steps,j.tpid,j.lpid','j.id,j.state,j.stage,j.steps,j.tpid,j.lpid,j.background||null')
(OUT/'LivePlayerRecovery.gs').write_text(player)

monitor_server=(LIVE/'LiveNakkaMonitor.gs').read_text()
monitor_server=replace_once(monitor_server,"  const jobs=()=>beautyQueueOpen_()", "  if(PropertiesService.getScriptProperties().getProperty(BEAUTY_QUEUE_LEASE_)){outcome='BUSY';return {success:false,code:outcome,context:target.revision,error:'Registration processing; previous comparison retained.'};}\n  const jobs=()=>beautyQueueOpen_()")
(OUT/'LiveNakkaMonitor.gs').write_text(monitor_server)

for name in ['Kiosk.html', 'RemoteRegistration.html']:
    public = (LIVE / name).read_text()
    public = replace_once(public, '    function showSuccess(player,nakka,receipt={}) {', '    let nextPlayerTimer=null;\n    function showSuccess(player,nakka,receipt={}) {\n      clearTimeout(nextPlayerTimer);nextPlayerTimer=null;')
    public = replace_once(public, 'if(nakka?.entryConfirmed===true||receipt.accepted===true)setTimeout(nextPlayer, 5000);', 'if(nakka?.entryConfirmed===true||receipt.accepted===true)nextPlayerTimer=setTimeout(nextPlayer, 5000);')
    public = replace_once(public, '    function nextPlayer() {', '    function nextPlayer() {\n      clearTimeout(nextPlayerTimer);nextPlayerTimer=null;')
    (OUT / name).write_text(public)

# Owner-bound clock management requires its explicit Google scopes. Deployment
# access remains separate environment configuration (private TEST / public LIVE).
manifest = json.loads((LIVE / 'appsscript.json').read_text())
for scope in ['https://www.googleapis.com/auth/script.scriptapp', 'https://www.googleapis.com/auth/userinfo.email']:
    if scope not in manifest['oauthScopes']: manifest['oauthScopes'].append(scope)
(OUT / 'appsscript.json').write_text(json.dumps(manifest, indent=2) + '\n')

# Overlay explicitly reviewed composition parts. No fixtures or fault helpers
# can enter this application directory through the assembly process.
parts = ROOT / 'parts'
if parts.exists():
    for file in sorted(parts.iterdir()):
        if file.suffix in ['.gs', '.html']: shutil.copy2(file, OUT / file.name)

# Older open Hub pages can send an omitted default group label. Resolve only
# that optional presentation label from the verified pool position.
planner_path = OUT / 'LivePlanner.gs'
planner = planner_path.read_text()
planner = replace_once(planner, "const safe=labels.map((p,i)=>{if(!p||Object.keys(p).sort().join(',')!=='board,group,ids'", "const safe=labels.map((p,i)=>{if(p&&p.group==null)p={...p,group:i+1};if(!p||Object.keys(p).sort().join(',')!=='board,group,ids'")
planner_path.write_text(planner)

entries=[]
for file in sorted(OUT.iterdir()):
    if not file.is_file(): continue
    raw=file.read_bytes(); old=LIVE/file.name
    entries.append({'file':file.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
                    'baselineSha256':hashlib.sha256(old.read_bytes()).hexdigest() if old.exists() else None,
                    'changed':not old.exists() or raw!=old.read_bytes()})
(ROOT/'assembly-manifest.json').write_text(json.dumps({'status':'ASSEMBLED_NOT_ACCEPTED','base':'LIVE v43',
    'applicationFiles':len([r for r in entries if r['file']!='appsscript.json']),
    'files':entries},indent=2)+'\n')
print(json.dumps({'status':'ASSEMBLED_NOT_ACCEPTED','files':len(entries),'changed':[r['file'] for r in entries if r['changed']]}))
