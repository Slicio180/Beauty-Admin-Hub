const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture,uiFixture,sourceFiles,hashes,sha,clone,work}=require('./fixture.cjs');
const checks=[],fixtures=[];
const ok=r=>{assert.equal(r.success,true,JSON.stringify(r));return r;};
async function test(name,fn){await fn();checks.push(name);}
function build(kind){const f=fixture(kind);fixtures.push(f);return f;}
function compare(f,restored){assert.deepEqual(restored.draw,f.backup.draw);assert.deepEqual(restored.draftChoices,f.backup.choices);assert.equal(restored.requiresRedraw,false);assert.equal(f.saved().ready,false);assert.equal(f.saved().version,undefined);assert.equal(f.saved().boardPlan,undefined);}
async function main(){
 for(const kind of ['A','B']){
  await test(kind+': recorded swapped draft and exact saved choices restore after same-owner session change',()=>{
   const f=build(kind),old=f.pointer().ticket;f.account({...f.account(),sessionBinding:'session-two'});const r=ok(f.load());compare(f,r.restoredDraft);assert.notEqual(r.restoredDraft.ticket,old);assert.equal(r.stages.stage2,kind==='B');
  });
  await test(kind+': restored draft cannot reuse approval or stale ticket to send',()=>{
   const f=build(kind),old=f.pointer().ticket,r=ok(f.load()),before=JSON.stringify(f.p);
   let refused=f.run('poolsave',{ticket:r.restoredDraft.ticket,confirmed:'true'});assert.equal(refused.success,false);assert.match(refused.error,/missing or stale/);assert.equal(JSON.stringify(f.p),before);
   refused=f.run('pooldraftchoices',{ticket:old,choices:JSON.stringify(f.backup.choices)});assert.equal(refused.code,'POOL_DRAFT_REPLACED');assert.equal(refused.uncertain,false);assert.equal(JSON.stringify(f.p),before);
  });
  await test(kind+': fresh review keeps recorded stage capacity, shared board and six pairings',()=>{
   const f=build(kind),r=ok(f.load()),before=JSON.stringify(f.event),review=ok(f.run('poolprepare',{ticket:r.restoredDraft.ticket,format:'top2-rest',boardPlan:JSON.stringify(f.boardInput())}));
   assert.deepEqual(review.format.stage1,{qualifiers:4,slots:4,byes:0});
   assert.deepEqual(review.format.stage2,kind==='B'?{qualifiers:2,slots:2,byes:0}:{enabled:false,qualifiers:0,slots:0,byes:0});
   assert.equal(review.expectedCards,6);assert.equal(review.groupMode,'rr');assert.equal(review.unassignedEntries.length,0);
   assert(review.boardPlan.assignments.every(a=>a.boards.length===1&&a.boards[0]===2));
   for(const key of kind==='B'?['t_setting','s2_setting']:['t_setting']){const s=review.format.set[key];assert.equal(s.t3,0);assert.equal(s.startScore,501);assert.equal(s.limit_leg_count,2);}
   assert.equal(JSON.stringify(f.event),before);compare(f,ok(f.load()).restoredDraft);
  });
  await test(kind+': preserve and top2-rest choices survive reopening without changing membership',()=>{
   const f=build(kind);let r=ok(f.load()).restoredDraft;
   for(const format of ['preserve','top2-rest']){const choices={...r.draftChoices,format};ok(f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify(choices)}));r=ok(f.load()).restoredDraft;assert.equal(r.draftChoices.format,format);assert.deepEqual(r.draw,f.backup.draw);assert.equal(f.saved().ready,false);}
  });
  await test(kind+': definitive changed-roster rejection retains all saved properties',()=>{
   const f=build(kind),r=ok(f.load()).restoredDraft;f.data.players[0].status='OUT';const before=JSON.stringify(f.p);
   const refused=f.run('pooldraftchoices',{ticket:r.ticket,choices:JSON.stringify({...r.draftChoices,preferredSize:4})});assert.equal(refused.success,false);assert.equal(refused.code,'POOL_DRAFT_ROSTER_CHANGED');assert.equal(refused.uncertain,false);assert.equal(JSON.stringify(f.p),before);
  });
  await test(kind+': a provider-format change refuses restore without erasing historical draft',()=>{
   const f=build(kind);f.event.updateTime++;const before=JSON.stringify(f.p),r=ok(f.load());assert.match(r.draftIssue,/Nakka event changed/);assert.equal(r.restoredDraft,null);assert.equal(JSON.stringify(f.p),before);
  });
  await test(kind+': current HTML restores names, shared-board labels and format without an automatic save',async()=>{
   const f=build(kind),u=uiFixture(f);u.rotate();assert.equal(await u.load(),true);assert.deepEqual(u.calls,['poolload']);assert.equal(u.c.approval,null);assert.equal(u.c.startReview,null);assert.equal(u.c.pendingChoices,null);
   assert.equal(u.controls.boards.value,'1, 2, 3');assert.equal(u.controls.size.value,'3');assert.equal(u.controls['draw-scheme'].value,'preferredPlan');assert.equal(u.c.root.beautyPoolFormatChoice,'top2-rest');
   for(const group of f.expected.groups){const card=u.panel.querySelectorAll('.pool-card').find(n=>String(n.dataset.poolId)===group.id);assert(card);assert.deepEqual(card.querySelectorAll('.pool-player-name').map(n=>n.children[0].textContent),group.players.map(p=>p.name));assert.match(card.querySelector('.pool-card-heading').textContent,new RegExp('Board 2.*Group '+(group.id==='0'?7:2)));}
   assert.equal(u.panel.querySelector('[data-event-format]').value,'top2-rest');assert.equal(u.panel.querySelector('.pool-approval'),null);compare(f,clone(u.c.frozen));
  });
  await test(kind+': checked old review is cleared and fresh current-HTML review starts unchecked',async()=>{
   const f=build(kind),u=uiFixture(f);assert.equal(await u.load(),true);assert.equal(await u.review(),true);
   let review=u.panel.querySelector('.pool-approval');assert(review);let check=review.querySelectorAll('input').find(n=>n.type==='checkbox');assert.equal(check.checked,false);check.checked=true;
   await check.events.change();assert.equal(review.querySelectorAll('button').find(n=>n.textContent==='SEND APPROVED TEST POOLS').disabled,false);
   assert.equal(await u.load(),true);assert.equal(u.panel.querySelector('.pool-approval'),null);assert.equal(u.c.approval,null);assert.equal(await u.review(),true);
   review=u.panel.querySelector('.pool-approval');check=review.querySelectorAll('input').find(n=>n.type==='checkbox');assert.equal(check.checked,false);assert.equal(review.querySelectorAll('button').find(n=>n.textContent==='SEND APPROVED TEST POOLS').disabled,true);
   assert.match(review.textContent,/Slutspel 1: top 2 per group · 4 players · 4 slots · 0 byes/);
   if(kind==='B')assert.match(review.textContent,/Slutspel 2: remaining players · 2 players · 2 slots · 0 byes/);else assert.doesNotMatch(review.textContent,/Slutspel 2:/);
   assert.deepEqual(clone(u.c.frozen.draw),f.backup.draw);assert(!u.calls.includes('poolsave'));
  });
  await test(kind+': failed provider read retains the displayed draft and removes active approval',async()=>{
   const f=build(kind),u=uiFixture(f);assert.equal(await u.load(),true);assert.equal(await u.review(),true);const before=clone(u.c.frozen.draw),stored=JSON.stringify(f.p);f.outage(true);assert.equal(await u.load(),false);
   assert.deepEqual(clone(u.c.frozen.draw),before);assert.equal(u.c.approval,null);assert.equal(u.c.state.stats.fresh,false);assert.equal(u.c.sourceLoadFailed,true);assert.equal(JSON.stringify(f.p),stored);assert.equal(u.panel.querySelector('.pool-approval'),null);
  });
 }
 const records=fixtures.flatMap(f=>f.calls);assert.equal(records.filter(c=>c.write).length,0);assert(!fixtures.some(f=>f.actions.includes('pooldraw')));
 const result={status:'PASS_LOCAL_CURRENT_SOURCE_AB',recordedAtUTC:new Date().toISOString(),checks:checks.length,details:checks,
  sources:Object.fromEntries(Object.entries(sourceFiles).map(([k,f])=>[k,{path:path.relative(work,f),sha256:hashes[k]}])),
  cases:['A: two groups of three, one knockout','B: two groups of three, two knockouts'],
  remoteCalls:0,simulatedProviderReadCalls:records.length,simulatedProviderWrites:0,generatedDraws:0,
  applicationSourceChanged:false,nativeAcceptanceRerun:false,actualDeviceAcceptance:false,
  scope:'Pinned saved source; real historical draw/choices replayed in isolated memory. Apps Script services, provider event/identity responses, authentication and DOM are simulated. Actual production handler and extracted current HTML lifecycle/renderDraw/disable functions execute. Board-controls, match-plan and game-settings subrenderers are stubbed; no geometry or device conclusion.',
  protectedInputs:Object.fromEntries([...new Set(fixtures.flatMap(f=>[f.backupPath,f.expectedPath]))].map(f=>[path.relative(work,f),sha(fs.readFileSync(f))]))};
 fs.mkdirSync(path.join(__dirname,'../evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../evidence/results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
