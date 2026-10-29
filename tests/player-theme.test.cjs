const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const base='apps-script/registration-identity-test/remote-app/';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
test('Shared player theme build is deterministic and leaves registration scripts unchanged',()=>{
 const files=['RemoteRegistration.html','KioskTest.html'],scripts=f=>[...fs.readFileSync(base+f,'utf8').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 const before=files.map(f=>({hash:sha(base+f),scripts:scripts(f)}));cp.execFileSync(process.execPath,['scripts/build-player-test.cjs']);
 files.forEach((f,i)=>{assert.equal(sha(base+f),before[i].hash);assert.deepEqual(scripts(f),before[i].scripts);});
});
test('Hub remote and kiosk use the supplied original sponsor-free logo and embedded AIK font assets',()=>{
 const logo=fs.readFileSync('public/assets/logo/aik-mandagsdartarna-clean.png').toString('base64'),crest=fs.readFileSync('public/assets/logo/aik-crest.svg').toString('base64');
 for(const file of ['HubTest.html','RemoteRegistration.html','KioskTest.html']){
  const h=fs.readFileSync(base+file,'utf8');assert(h.includes('data:image/png;base64,'+logo));assert(h.includes('data:image/svg+xml;base64,'+crest));assert(h.includes('data:font/woff2;base64,'));
 }
 for(const file of ['RemoteRegistration.html','KioskTest.html']){const h=fs.readFileSync(base+file,'utf8');assert.equal((h.match(/id="beauty-player-theme"/g)||[]).length,1);assert.doesNotMatch(h,/workers\.dev/);}
});
test('Remote tonight list has a matching named close tile without removing the existing close action',()=>{
 const h=fs.readFileSync(base+'RemoteRegistration.html','utf8');assert.match(h,/id="tonightPlayersClose"[^>]*aria-label="Stäng spelarlistan"[^>]*onclick="closeTonightsPlayers\(\)"/);assert.match(h,/class="tonight-close-button"/);assert.match(h,/aria-modal="true" aria-label="Kvällens spelare"/);
});

test('Kiosk retains its original sizing and omits player list while remote keeps independent list and sizing',()=>{
 const kiosk=fs.readFileSync(base+'KioskTest.html','utf8'),remote=fs.readFileSync(base+'RemoteRegistration.html','utf8');
 const theme=h=>h.match(/<style id="beauty-player-theme">([\s\S]*?)<\/style>/)[1];
 assert.equal(theme(kiosk).trim(),fs.readFileSync('public/css/beauty-kiosk.css','utf8').trim());assert.equal(theme(remote).trim(),fs.readFileSync('public/css/beauty-player.css','utf8').trim());
 assert.doesNotMatch(theme(kiosk),/\b(?:font(?:-size|-family|-weight)?|line-height|min-height|padding)\s*:/);assert.doesNotMatch(kiosk,/<(?:button|div)[^>]*(?:tonight-players-button|tonightPlayersModal)|function\s+openTonightsPlayers|\.getTonightsPlayerNames\(/);
 assert.match(remote,/openTonightsPlayers\(/);assert.match(remote,/id="tonightPlayersModal"/);assert.match(theme(remote),/body \.submit-button,body \.next-button \{ font-size:24px/);
});
