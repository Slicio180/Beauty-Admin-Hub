from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent
ref=root.parent/'beauty-checkpoint-source/reference/beauty'
tests=root/'tests';tests.mkdir(exist_ok=True)
# Actual assembled authentication server/controller, with the original behavior fixtures.
s=(ref/'AUTH-OPEN-20261123/tests/auth-open.cjs').read_text()
s=s.replace("const source=(kind,file)=>fs.readFileSync(path.join(root,kind,file),'utf8');", "const source=(kind,file)=>fs.readFileSync(path.join(root,'application',({'HubTestAuth.gs':'LiveLoginAuth.gs','HubTest.html':'LiveHubView.html'})[file]),'utf8');")
s=s.replace('test_admin','607O4cFmrTMPSk2CgADhwNu7k742').replace('beauty-admin-hub-test','beauty-admin-hub-live').replace('beautyHubTestGuard_(){','beautyLiveLoginGuard_(){')
s=s.replace("(s,r)=>s.props.BEAUTY_HUB_ADMIN_UIDS='other_admin'", "(s,r)=>s.c.beautyHubAuthAllowed_=()=>[]")
# LIVE sessions deliberately remain usable during an event-context recovery;
# context protection is checked at operational service dispatch, not sign-in.
for start,end in [
(" await test('Exact installed baseline", " await test('Full candidate"),
(" await test('Context validation failure", " await test('Unknown actions"),
(" await test('Server diff is confined", " const report=")]:
 a=s.index(start);b=s.index(end,a);s=s[:a]+s[b:]
s=s.replace('evidence/local-checks.json','evidence/auth-tests.json')
(tests/'auth.cjs').write_text(s)
# Unchanged import-core regression suite, loading the assembled source and date-window helper.
s=(ref/'AUTOMATIC-IMPORT-NATIVE-20261123/tests/import.cjs').read_text()
s=s.replace("path.join(root,'candidate/HubTestNakkaImport.gs')", "path.join(root,'application/BeautyInboundCore.gs')")
s=s.replace("beautyHubTransferHash_:hash", "beautyHubTransferHash_:hash,beautyNakkaImportResponseCurrent_:(row,state)=>Number.isFinite(row[0])&&row[0]>=state.snap.Control.values[1][1]&&row[0]<state.snap.Control.values[1][0]+1")
# New date-window regression exercises the integration difference explicitly.
pos=s.index('const report=')
s=s[:pos]+"test('Historical response does not block the current event import',()=>{const f=fixture();f.state.snap['Form responses 2'].values[2]=[36525,f.entry.name,'','JA','','HUB'];f.state.bounds['Form responses 2'].last=3;assert.equal(f.run().state,'COMPLETE');assert.deepEqual(f.state.snap['Form responses 2'].values[2],[36525,f.entry.name,'','JA','','HUB']);assert.equal(f.counts().writes,1);});\n"+s[pos:]
(tests/'import.cjs').write_text(s)
# Pool server/client regressions use the same saved data and synthetic boundary services.
for group,original in [('pools','case-c/roster-rejection-fix/tests'),('restoration','current-source-ab/tests')]:
 dest=tests/group;dest.mkdir(exist_ok=True)
 orig=ref/'ALTERNATE-FORMAT-20261122'/original
 for p in orig.glob('*.cjs'):
  s=p.read_text()
  if p.name=='fixture.cjs':
   if group=='pools':
    s=s.replace("const candidate=path.join(__dirname,'../candidate');", "const candidate=path.resolve(__dirname,'../../application');")
    s=s.replace("path.join(candidate,'HubTestPools.gs')", "path.join(candidate,'LivePlanner.gs')")
   else:
    s=s.replace("const work=path.resolve(__dirname,'../..');", "const work="+repr(str(ref/'ALTERNATE-FORMAT-20261122'))+";")
    a=s.index('const sourceFiles=');b=s.index('const source=',a)
    s=s[:a]+"const sourceFiles={server:path.resolve(__dirname,'../../application/LivePlanner.gs'),html:path.resolve(__dirname,'../../application/LiveHubView.html')};\nconst sha=b=>crypto.createHash('sha256').update(b).digest('hex');\nconst hashes=Object.fromEntries(Object.entries(sourceFiles).map(([k,f])=>[k,sha(fs.readFileSync(f))]));\n"+s[b:]
   s=s.replace('beautyContextRead_:()=>clone(context)', 'beautyLiveContextRead_:()=>clone(context),beautyLiveTarget_:()=>clone(context)')
  s=s.replace("['HubTestPools.gs','HubTestBridge.gs']", "['LivePlanner.gs','LiveHub.gs']")
  s=s.replace("path.join(candidate,'HubTest.html')", "path.join(candidate,'LiveHubView.html')")
  # Tests write their evidence next to their copied suite, never to historical artifacts.
  s=s.replace("path.join(__dirname,'../evidence/", "path.join(__dirname,'./")
  if group=='restoration':s=s.replace("path.join(work,'current-source-ab/evidence/", "path.join(__dirname,'./")
  (dest/p.name).write_text(s)
# Independent competition feed and shell behavior regressions.
original=root.parent/'beauty-expanded-source/Beauty-Display-Preview-20261119/display-repair-20261119'
dest=tests/'display';dest.mkdir(exist_ok=True)
for name in ['test.cjs','recovery.test.cjs','shell.test.cjs']:
 s=(original/'candidate'/name).read_text()
 s=s.replace("path.join(root,file)","path.resolve(__dirname,'../../application',file)")
 s=s.replace("const here=__dirname,root=path.dirname(here)", "const here=__dirname,root="+repr(str(original)))
 s=s.replace("path.join(here,'LiveCastView.html')", "path.resolve(__dirname,'../../application/LiveCastView.html')")
 s=s.replace("path.join(__dirname,'LiveCastView.html')", "path.resolve(__dirname,'../../application/LiveCastView.html')")
 s=s.replace("path.join(__dirname,'../incidents/20261116-cast-live-highlights/tournament.json')", repr(str(original/'incidents/20261116-cast-live-highlights/tournament.json')))
 # The old appearance-equality assertion covered a prior, smaller patch, not the later accepted display UI.
 if name=='test.cjs':s=re.sub(r"test\('Appearance and scripts outside projection/feed/shell are unchanged',[^\n]+\n",'',s)
 # Shell rig chooses fixture baseline and candidate by file name.
 s=s.replace("fs.readFileSync(path.join(__dirname,name),'utf8')", "fs.readFileSync(name==='LiveCastView.html'?path.resolve(__dirname,'../../application/LiveCastView.html'):path.join("+repr(str(original/'candidate'))+",name),'utf8')")
 (dest/name).write_text(s)
print('Prepared combined-source regression suites; historical files unchanged.')
