const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const {fixture,candidate,clone}=require('./fixture.cjs');const checks=[];
function test(name,fn){fn();checks.push(name);}
function ok(r){assert.equal(r.success,true,JSON.stringify(r));return r;}
function reject(r,text){assert.equal(r.success,false);if(text)assert.match(r.error,text);}
function pending(f){return JSON.stringify(f.p);}
test('Actual three-player draw, settings save and reload retain membership and seed',()=>{
 const f=fixture(3),r=ok(f.draw()),choices=clone(r.draftChoices);choices.boards='9';choices.plannedBoards=[9];choices.boardChoices[0]={count:1,boards:[9]};choices.cardLabels[0]={board:9,group:7,manualGroup:true};
 const saved=ok(f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(choices)}));assert.notEqual(saved.ticket,r.ticket);
 const restored=ok(f.load()).restoredDraft;assert.deepEqual(restored.draw,r.draw);assert.deepEqual(restored.draftChoices,choices);assert.notEqual(restored.ticket,saved.ticket);assert.equal(f.saved().ready,false);
});
test('Real six-player swap survives same-owner re-login; prior ticket is rejected',()=>{
 const f=fixture(),r=ok(f.draw()),a=r.draw.pools[0].players[0],b=r.draw.pools[1].players[0];
 const adjusted=ok(f.run('pooladjust',{ticket:r.ticket,change:JSON.stringify({playerId:a.id,targetPool:1,swapWith:b.id})}));
 f.account({...f.account(),sessionBinding:'session-two'});const restored=ok(f.load()).restoredDraft;
 assert.deepEqual(restored.draw,adjusted.draw);assert.equal(restored.draw.pools[1].players[0].id,a.id);
 reject(f.run('pooldraftchoices',{ticket:adjusted.ticket,choices:JSON.stringify(adjusted.draftChoices)}),/replaced/);
});
test('Restoration strips send approval and version',()=>{
 const f=fixture(3),r=ok(f.draw());ok(f.run('poolprepare',{ticket:r.ticket,format:'preserve',boardPlan:JSON.stringify({available:[5,6],choices:[{poolId:0,boards:[5]}]})}));assert.equal(f.saved().ready,true);assert.ok(f.saved().version);
 const restored=ok(f.load()).restoredDraft;assert.equal(f.saved().ready,false);assert.equal(f.saved().version,undefined);assert.equal(f.saved().boardPlan,undefined);
 reject(f.run('poolsave',{ticket:restored.ticket,confirmed:'true'}),/missing or stale/);assert.equal(f.calls.some(c=>c.write),false);
});
for(const [name,change] of [
 ['different event revision',f=>f.context.revision='b'.repeat(32)],['changed workbook',f=>{f.context.sheetId='other-test-workbook';f.c.SHEET_ID=f.context.sheetId;}],
 ['changed IN roster',f=>f.data.players[0].status='OUT'],['changed name',f=>f.data.players[0].player='Later legitimate edit'],
 ['changed provider event',f=>f.event.updateTime++],['changed LPID',f=>f.profiles[0].lpid='L999'],['changed TPID',f=>f.event.entry_list[0].tpid='T999'],
 ['legacy draft without context',f=>{const r=f.saved();delete r.schema;delete r.context;f.overwrite(r);}]
])test(name+' refuses restore and preserves the saved pointer and shards',()=>{
 const f=fixture();ok(f.draw());change(f);const before=pending(f),r=f.load();assert.ok(!r.success||r.draftIssue);if(r.success)assert.equal(r.restoredDraft,null);assert.equal(pending(f),before);
});
test('Reordered roster and mapping arrays restore the identical membership',()=>{
 const f=fixture(),r=ok(f.draw());f.data.players.reverse();f.profiles.reverse();const saved=f.saved();saved.mappings.reverse();f.overwrite(saved);assert.deepEqual(ok(f.load()).restoredDraft.draw,r.draw);
});
test('New statistics never redraw frozen membership; sending requires review',()=>{
 const f=fixture(3),r=ok(f.draw());f.profiles[0].average=90;const restored=ok(f.load()).restoredDraft;assert.deepEqual(restored.draw,r.draw);
 reject(f.run('poolprepare',{ticket:restored.ticket,format:'preserve'}),/Statistics changed/);
});
test('Another owner cannot read or overwrite this owner draft',()=>{
 const f=fixture(),r=ok(f.draw()),before=pending(f);f.account({uid:'different-owner',sessionBinding:'different-session'});assert.equal(ok(f.load()).restoredDraft,null);
 reject(f.run('pooladjust',{ticket:r.ticket,change:'{}'}));assert.equal(pending(f),before);
});
for(const [name,breakIt]of[
 ['missing shard',f=>delete f.p[f.key()+'_'+f.pointer().ticket+'_0']],
 ['corrupt hash',f=>{const ptr=f.pointer();ptr.hash='bad';f.p[f.key()]=JSON.stringify(ptr);}],
 ['invalid pointer',f=>f.p[f.key()]='{'],
 ['invalid stored JSON with matching hash',f=>{const ptr=f.pointer(),text='{';f.p[f.key()+'_'+ptr.ticket+'_0']=text;f.p[f.key()]=JSON.stringify({...ptr,n:1,hash:f.c.beautyPoolHash_(text)});}]
])test(name+' preserves all surviving evidence on load',()=>{const f=fixture();ok(f.draw());breakIt(f);const before=pending(f),r=ok(f.load());assert.ok(r.draftIssue);assert.equal(r.restoredDraft,null);assert.equal(pending(f),before);});
test('Shard write failure during restoration keeps previous draw',()=>{
 const f=fixture(),r=ok(f.draw()),before=pending(f);f.faults.push(k=>k.startsWith(f.key()+'_')&&k.endsWith('_1'));
 const loaded=ok(f.load());assert.ok(loaded.draftIssue);assert.equal(pending(f),before);assert.deepEqual(f.saved().draw,r.draw);
});
test('Pointer publication failure keeps previous draw and choices',()=>{
 const f=fixture(),r=ok(f.draw()),before=pending(f);f.faults.push(k=>k===f.key());reject(f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(r.draftChoices)}));assert.equal(pending(f),before);
});
test('A stale tab cannot replace a newer draw through Generate',()=>{
 const f=fixture(),r=ok(f.draw());ok(f.load());const before=pending(f);reject(f.run('pooldraw',{bindings:JSON.stringify(r.mappings.map(({id,lpid,tpid})=>({id,lpid,tpid}))),reviewed:'true',sizes:'[3,3]',draftTicket:r.ticket,choices:JSON.stringify({...r.draftChoices,boardChoices:{},cardLabels:{}})}),/Another tab/);assert.equal(pending(f),before);
});
test('Draw preferences persist without silently changing group membership',()=>{
 const f=fixture(),r=ok(f.draw()),choices={...r.draftChoices,preferredSize:4};const next=ok(f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(choices)}));assert.equal(next.requiresRedraw,true);assert.deepEqual(next.draw,r.draw);
 const restored=ok(f.load()).restoredDraft;assert.equal(restored.requiresRedraw,true);assert.equal(restored.draftChoices.preferredSize,4);reject(f.run('poolprepare',{ticket:restored.ticket,format:'preserve'}),/Draw settings changed/);
});
test('Changed board choices clear approval but keep group membership',()=>{
 const f=fixture(4),r=ok(f.draw());const approved=ok(f.run('poolprepare',{ticket:r.ticket,format:'preserve'}));const choices=clone(r.draftChoices);choices.boardChoices[0]={count:1,boards:[6]};choices.cardLabels[0]={board:6,group:3,manualGroup:true};
 const saved=ok(f.run('pooldraftchoices',{ticket:approved.ticket,choices:JSON.stringify(choices)}));assert.deepEqual(saved.draw,r.draw);assert.equal(f.saved().ready,false);assert.equal(f.saved().version,undefined);assert.deepEqual(ok(f.load()).restoredDraft.draftChoices,choices);
});
for(const [name,edit] of[
 ['unknown field',c=>c.injected=true],['unknown pool',c=>c.boardChoices.evil={count:1,boards:[5]}],['unknown board',c=>c.boardChoices[0].boards=[999]],
 ['two boards on a three-player pool',c=>c.boardChoices[0]={count:2,boards:[5,6]}],['unrecognised format',c=>c.format='arbitrary'],['oversize label',c=>c.cardLabels[0].group=1001],
 ['unexpected label field',c=>c.cardLabels[0].approval=true],['changed available/planned mismatch',c=>c.plannedBoards=[9]]
])test(name+' is rejected without mutation',()=>{const f=fixture(3),r=ok(f.draw()),choices=clone(r.draftChoices);edit(choices);const before=pending(f);reject(f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(choices)}));assert.equal(pending(f),before);});
for(const state of ['ATTEMPTED','VERIFIED'])test(state+' send journal blocks every draft mutation and never resends',()=>{
 const f=fixture(3),r=ok(f.draw());f.p['BEAUTY_POOL_SEND_'+f.context.eventId]=JSON.stringify({state});const before=pending(f);
 for(const [action,input]of[['pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(r.draftChoices)}],['pooladjust',{ticket:r.ticket,change:'{}'}],['poolsave',{ticket:r.ticket,confirmed:'true'}]])reject(f.run(action,input));
 // Existing sent-workflow validation rejects this deliberately incomplete journal.
 reject(f.load());assert.equal(pending(f),before);assert.equal(f.calls.some(c=>c.write),false);
});
test('Stale ticket exposes a definitive rejection code before any stored or provider mutation',()=>{
 const f=fixture(),r=ok(f.draw());ok(f.load());const before=pending(f),result=f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(r.draftChoices)});
 reject(result,/replaced/);assert.equal(result.code,'POOL_DRAFT_REPLACED');assert.equal(result.uncertain,false);assert.equal(pending(f),before);assert.equal(f.calls.some(c=>c.write),false);
});
test('Invalid current-draft settings are not mislabeled as a replaced ticket',()=>{
 const f=fixture(),r=ok(f.draw());const result=f.run('pooldraftchoices',{ticket:r.ticket,choices:'{}'});reject(result);assert.equal(result.code,undefined);
});
test('Current server and all embedded HTML scripts parse',()=>{
 for(const name of ['HubTestPools.gs','HubTestBridge.gs'])new vm.Script(fs.readFileSync(path.join(candidate,name),'utf8'),{filename:name});
 for(const m of fs.readFileSync(path.join(candidate,'HubTest.html'),'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
fs.writeFileSync(path.join(__dirname,'server-results.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Actual current handler, seeding, board, mapping and storage logic; simulated Apps Script services/provider. Not native TEST acceptance.'},null,2));
console.log('PASS:',checks.length,'server checks');
