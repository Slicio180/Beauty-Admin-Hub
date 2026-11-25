from pathlib import Path
import shutil, subprocess, hashlib, json
b=Path(__file__).resolve().parent
r=b.parent.parent
source=r/'checkpoints/2026-11-24-speed-test/application'
names=['LivePlanner.gs','LiveHubView.html','LiveHub.gs','BeautyBackground.gs','BeautyReleaseEnvironment.gs']
if (b/'application').exists(): raise SystemExit('Candidate already exists; use a fresh checkout.')
(b/'application').mkdir()
for name in names: shutil.copyfile(source/name,b/'application'/name)
subprocess.run(['patch','-p0','--input',str(b/'candidate.patch')],cwd=b,check=True)
shutil.copyfile(b/'source/BeautyPlayerRatings.gs',b/'application/BeautyPlayerRatings.gs')
for name,digest in json.loads((b/'PR001-SHA256.json').read_text()).items():
 assert hashlib.sha256((b/name).read_bytes()).hexdigest()==digest,name
print('PR001 reconstructed and verified. Nothing deployed.')
