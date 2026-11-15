from pathlib import Path
import json,hashlib,shutil,zipfile,datetime
root=Path.cwd();w=root/'capture-work/native-partial-test-20261114';hand=root/'deliverables/Beauty-Handover';note=(w/'README.txt').read_text()
for n in ['START-HERE.txt','HANDOVER.txt','NEW-CHAT-PROMPT.txt']:
 p=hand/n;p.write_text(note+'\n\nHISTORICAL CHECKPOINTS — newest section takes precedence\n\n'+p.read_text())
p=root/'deliverables/Beauty_To_Do.md';p.write_text(note+'\n\n'+p.read_text())
p=hand/'CHANGELOG.txt';p.write_text('2026-11-14 after owner21:30 binding PASS: Prepared isolated native Sheets recovery fixture adapter and authenticated API. Nine native scenarios pending owner execution;11 adapter and8 installer local tests PASS;22 planner regressions PASS. Production untouched.\n'+p.read_text())
with (hand/'STATUS.csv').open('a') as f:f.write('\nTEST runtime binding,PASS,Owner evidence2026-11-14T20:30:12.916Z fixed TEST workbook andevent\nNative Sheets recovery fixture adapter,PREPARED,11 adapter and8 installer local tests PASS;9 native scenarios pending owner run\n')
folder=hand/'Updates/2026-11-14-Native-Partial-Recovery-TEST';folder.mkdir(parents=True,exist_ok=True);shutil.copytree(w,folder/'source',dirs_exist_ok=True);shutil.copy2(root/'deliverables/Beauty-TEST-Partial-Recovery-Lab-20261114.cjs',folder/'Beauty-TEST-Partial-Recovery-Lab-20261114.cjs');shutil.copy2(w/'README.txt',folder/'README.md')
manifest={str(p.relative_to(hand)):hashlib.sha256(p.read_bytes()).hexdigest() for p in hand.rglob('*') if p.is_file() and p.name!='CONTENTS-SHA256.json'};(hand/'CONTENTS-SHA256.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(hand.rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(hand.parent)))
with zipfile.ZipFile(root/'deliverables/Beauty-Handover.zip') as z:assert z.testzip() is None
print('Checkpoint updated; ZIP integrity verified.')
