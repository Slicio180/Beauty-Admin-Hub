from pathlib import Path
import json,hashlib,shutil,zipfile,datetime
root=Path.cwd();w=root/'capture-work/partial-recovery-test-20261114';hand=root/'deliverables/Beauty-Handover';note=(w/'README.md').read_text()
for n in ['START-HERE.txt','HANDOVER.txt','NEW-CHAT-PROMPT.txt']:
 p=hand/n;p.write_text(note+'\n\nHISTORICAL CHECKPOINTS — newest section takes precedence\n\n'+p.read_text())
p=root/'deliverables/Beauty_To_Do.md';p.write_text(note+'\n\n'+p.read_text())
p=hand/'CHANGELOG.txt';p.write_text('2026-11-14 after21:03: Owner native Hub34 healthy-state acceptance recorded:8/8 and Recovery0/0/0. Partial status/consent/removal planner/controller prepared;22 local injected-adapter scenarios PASS;30 Hub34 regressions PASS. Fresh read-only TEST preflight required before native integration. No production changes.\n'+p.read_text())
with (hand/'STATUS.csv').open('a') as f:f.write('\nHub34 native healthy state,PASS,8/8; new controls visible; Recovery saved0 transfer0 import0\nPartial save controller,LOCAL CANDIDATE,22 adapter scenarios PASS; not wired or deployed\nNative recovery TEST,PENDING FRESH PREFLIGHT,Fixed TEST source capture required before runtime binding check and integration\n')
folder=hand/'Updates/2026-11-14-Partial-Recovery-TEST';folder.mkdir(parents=True,exist_ok=True);shutil.copytree(w,folder/'source',dirs_exist_ok=True);shutil.copy2(root/'deliverables/Beauty-TEST-Recovery-Preflight-20261114.cjs',folder/'Beauty-TEST-Recovery-Preflight-20261114.cjs');shutil.copy2(w/'README.md',folder/'README.md')
manifest={str(p.relative_to(hand)):hashlib.sha256(p.read_bytes()).hexdigest() for p in hand.rglob('*') if p.is_file() and p.name!='CONTENTS-SHA256.json'};(hand/'CONTENTS-SHA256.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(hand.rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(hand.parent)))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip') as z:assert z.testzip() is None
print('Saved native Hub34 checkpoint, candidate/evidence and TEST preflight; ZIP integrity verified.')
