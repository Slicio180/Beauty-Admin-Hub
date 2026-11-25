from pathlib import Path
import shutil, subprocess, hashlib, json
b=Path(__file__).resolve().parent
r=b.parent.parent
sources={'application':r/'checkpoints/2026-11-24-speed-test/application','aik-internal':r/'checkpoints/2026-11-24-source/source-packages-expanded/AIK-Internal-Development-20261115/AIK-Internal'}
files={'application':['LivePlanner.gs','LiveHubView.html'],'aik-internal':['PoolPlanner.js','AIKInternal.html']}
for directory,names in files.items():
 (b/directory).mkdir(exist_ok=True)
 for name in names:
  target=b/directory/name
  if target.exists(): raise SystemExit('Candidate already exists; use a fresh checkout to prepare.')
for directory,names in files.items():
 for name in names: shutil.copyfile(sources[directory]/name,b/directory/name)
subprocess.run(['patch','-p0','--input',str(b/'candidate.patch')],cwd=b,check=True)
expected=json.loads((b/'PD001-SHA256.json').read_text())
for directory,names in files.items():
 for name in names:
  rel=directory+'/'+name
  assert hashlib.sha256((b/rel).read_bytes()).hexdigest()==expected[rel],rel
print('Candidate reconstructed and hashes verified. Nothing deployed.')
