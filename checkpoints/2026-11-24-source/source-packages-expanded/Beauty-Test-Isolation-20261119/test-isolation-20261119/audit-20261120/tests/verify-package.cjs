const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),pkg=path.resolve(root,'..');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const installed=JSON.parse(fs.readFileSync(path.join(pkg,'installation-20261119/manifest.json'))),candidate=JSON.parse(fs.readFileSync(path.join(root,'candidate-manifest.json')));
for(const [file,wanted]of Object.entries(installed.files)){assert.equal(hash(path.join(pkg,'installation-20261119/source',file)),wanted,file);assert.equal(hash(path.join(root,'baseline',file)),wanted,file);}
for(const f of candidate.files){assert.equal(hash(path.join(root,'baseline',f.file)),f.expectedInstalledSHA256,f.file);assert.equal(hash(path.join(root,'candidate',f.file)),f.candidateSHA256,f.file);}
console.log(JSON.stringify({savedInstallationHashes:Object.keys(installed.files).length,candidateHashes:candidate.files.length,result:'PASS',nativeSourceRechecked:false}));
