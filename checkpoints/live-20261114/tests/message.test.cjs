const {harness}=require('./test.cjs');const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/LiveRegistrationQueue.js','utf8');
const run=source.slice(source.indexOf('function beautyQueueRun_(j)'),source.indexOf('function beautyQueueService_'));
function setup(){const h=harness(),read=h.c.beautyLiveDashboardRead_;h.c.beautyLiveDashboardRead_=()=>{const d=read();d.players.forEach(p=>p.message=String(p.message??'').trim());return d};return h;}
const h=setup();vm.runInContext(run.replace('found[0].message!==String(expected[4]).trim()','found[0].message!==expected[4]'),h.c);
const result=h.c.beautyLiveRegister_({...h.input('Alice'),message:'Rtff. '},'staff');assert.equal(result.queueState,'REVIEW');assert.equal(h.rows.responses.length,1);assert.equal(h.entries.length,1);
h.recheck(result.queueId);assert.equal(h.c.beautyQueueOpen_()[0].stage,'readback');
vm.runInContext(run,h.c);const before=[h.rows.responses.length,h.rows.store.length,h.members.length,h.entries.length];h.recheck(result.queueId);
assert.equal(h.c.beautyQueueOpen_().length,0);assert.deepEqual([h.rows.responses.length,h.rows.store.length,h.members.length,h.entries.length],before);
assert.equal(h.rows.responses[0][4],'Rtff. ');assert.equal(h.rows.store[0][4],'Rtff. ');
for(const message of ['Rtff. ','  leading','\nline one\nline two\n','   ','','inside  spaces','Åäö 🎯\t']){const f=setup(),r=f.c.beautyLiveRegister_({...f.input('Bob'),message},'staff');assert.equal(r.readbackVerified,true,message);assert.equal(f.rows.responses[0][4],message);assert.equal(f.rows.store[0][4],message);}
const bad=setup(),read=bad.c.beautyLiveDashboardRead_;bad.c.beautyLiveDashboardRead_=()=>{const d=read();d.players.forEach(p=>p.message='different content');return d;};assert.equal(bad.c.beautyLiveRegister_({...bad.input('Alice'),message:'Rtff. '},'staff').queueState,'REVIEW');
const changed=setup();changed.setFail('display');const pending=changed.c.beautyLiveRegister_({...changed.input('Alice'),message:'Rtff. '},'staff');changed.setFail('');changed.rows.store[0][4]='Rtff.';changed.recheck(pending.queueId);assert.equal(changed.c.beautyQueueOpen_()[0].state,'REVIEW');assert.equal(changed.rows.store[0][4],'Rtff.');
console.log('PASS old repeated readback failure reproduced; new recovery completes without duplicate response/status/member/event; raw trailing whitespace preserved; 7 formatting cases pass; actual display changes and raw status changes still require review.');
