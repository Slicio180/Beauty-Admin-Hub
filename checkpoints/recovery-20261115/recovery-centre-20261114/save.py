from pathlib import Path
import json,hashlib,shutil,zipfile,datetime
root=Path.cwd();w=root/'capture-work/recovery-centre-20261114';hand=root/'deliverables/Beauty-Handover';note=(w/'README.md').read_text()
(w/'validation.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'state':'PREPARED_NOT_DEPLOYED','baselineHub':33,'mobile':34,'kiosk':61,'nativeBaseline':'owner screenshots Hub8/Nakka8 no differences/no jobs/no alerts','localChecks':'PASS','candidateNative':'PENDING','fullRecoveryWorkstream':'OPEN: see explicit remaining cases in README.md','changed':['LiveHub','LiveHubView','LiveNakkaMonitor','LiveRegistrationQueue'],'added':['LiveRecovery']},indent=2))
for n in ['START-HERE.txt','HANDOVER.txt','NEW-CHAT-PROMPT.txt']:
 p=hand/n;p.write_text(note+'\n\nHISTORICAL CHECKPOINTS — newest section takes precedence\n\n'+p.read_text())
p=root/'deliverables/Beauty_To_Do.md';p.write_text(note+'\n\n'+p.read_text())
p=hand/'CHANGELOG.txt';p.write_text('2026-11-14: Hub33 deployment verified by owner; native8/8 healthy screenshot recorded. Recovery Centre candidate prepared/tested: visible transfer/import, saved-result recovery, processing/attention distinction. Full recovery audit stays OPEN; partial/ambiguous cases explicitly listed. No runtime data executed.\n'+p.read_text())
with (hand/'STATUS.csv').open('a') as f:f.write('\nHub33 baseline,NATIVE HEALTHY,8 matched; no pending jobs or player alerts at09:07\nRecovery Centre,PREPARED NOT DEPLOYED,Hub4 changed+1 added; local tests PASS; native pending\nComplete recovery audit,OPEN,Partial legacy/removal and competition/cross-event guided repair still require work\n')
folder=hand/'Updates/2026-11-14-Recovery-Centre';folder.mkdir(parents=True,exist_ok=True);shutil.copytree(w,folder/'source',dirs_exist_ok=True);shutil.copy2(root/'deliverables/Beauty-Recovery-Centre-20261114.cjs',folder/'Beauty-Recovery-Centre-20261114.cjs');shutil.copy2(w/'README.md',folder/'README.md')
manifest={str(p.relative_to(hand)):hashlib.sha256(p.read_bytes()).hexdigest() for p in hand.rglob('*') if p.is_file() and p.name!='CONTENTS-SHA256.json'};(hand/'CONTENTS-SHA256.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(hand.rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(hand.parent)))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip') as z:assert z.testzip() is None
print('Updated handover and checklist; ZIP integrity verified.')
